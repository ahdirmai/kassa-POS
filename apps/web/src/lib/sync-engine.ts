import { API_URL, ApiError, apiFetch } from "@/lib/api";
import {
  catalogKey,
  getOfflineQueueCounts,
  offlineDb,
  type CachedCatalog,
  type OfflineTransaction,
} from "@/lib/offline-db";

export interface SyncPushResultItem {
  clientUuid: string;
  status: string;
  orderNo?: string;
  receiptNo?: string;
}

export interface SyncRunSummary {
  syncedCount: number;
  duplicateCount: number;
  failedCount: number;
  networkFailed: boolean;
  skippedLocked?: boolean;
}

let syncInFlight: Promise<SyncRunSummary> | null = null;

/**
 * Returns true if the error is caused by lost connectivity / timeout rather than an API HTTP response.
 */
export function isNetworkError(err: unknown): boolean {
  if (err instanceof ApiError) return false;
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof TypeError) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("failed to fetch") ||
      msg.includes("networkerror") ||
      msg.includes("network request failed") ||
      msg.includes("load failed") ||
      msg.includes("err_internet_disconnected")
    );
  }
  return false;
}

/**
 * Ping API /health endpoint with a short timeout to detect "WiFi connected, no internet" scenarios.
 */
export async function checkServerReachable(timeoutMs = 3500): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  const healthUrl = API_URL.replace(/\/api\/v1\/?$/, "") + "/health";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(healthUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Register Chromium Background Sync tag when available.
 */
export async function registerBackgroundSync(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const syncMgr = (reg as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } }).sync;
    if (syncMgr) {
      await syncMgr.register("kassa-offline-sync");
    }
  } catch {
    // Background Sync is optional / Chromium-only
  }
}

function toPushPayload(p: OfflineTransaction) {
  return {
    clientUuid: p.clientUuid,
    offlineReceiptNo: p.offlineReceiptNo,
    createdAt: p.createdAt,
    orderType: p.orderType,
    tableId: p.tableId ?? null,
    customerName: p.customerName,
    discountType: p.discountType ?? null,
    discountValue: p.discountValue ?? 0,
    items: p.items,
    paidAmount: p.paidAmount,
  };
}

async function markResultsFromServer(results: SyncPushResultItem[]): Promise<{ synced: number; duplicates: number }> {
  let synced = 0;
  let duplicates = 0;
  const now = new Date().toISOString();

  for (const r of results) {
    if (r.status === "SYNCED" || r.status === "DUPLICATE_SKIPPED") {
      await offlineDb.offlineOrders.update(r.clientUuid, {
        synced: 1,
        syncStatus: "SYNCED",
        lastError: null,
        lastAttemptAt: now,
        syncedOrderNo: r.orderNo ?? null,
        syncedReceiptNo: r.receiptNo ?? null,
      });
      if (r.status === "SYNCED") synced += 1;
      else duplicates += 1;
    }
  }

  return { synced, duplicates };
}

/**
 * Flush pending offline transactions for the active outlet.
 * Uses a concurrency lock + automatic per-item fallback to prevent poison-pill batch deadlocks.
 */
export async function syncPendingTransactions(
  outletId?: number,
  options: { includeFailed?: boolean } = {},
): Promise<SyncRunSummary> {
  if (!outletId) {
    return { syncedCount: 0, duplicateCount: 0, failedCount: 0, networkFailed: false };
  }

  if (syncInFlight) {
    return { syncedCount: 0, duplicateCount: 0, failedCount: 0, networkFailed: false, skippedLocked: true };
  }

  const run = async (): Promise<SyncRunSummary> => {
    const unsynced = await offlineDb.offlineOrders.where("synced").equals(0).toArray();
    const candidates = unsynced
      .filter((p) => p.outletId === undefined || p.outletId === outletId)
      .filter((p) => options.includeFailed || p.syncStatus !== "FAILED")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    if (candidates.length === 0) {
      return { syncedCount: 0, duplicateCount: 0, failedCount: 0, networkFailed: false };
    }

    // 1. Fast path: batch push
    try {
      const res = await apiFetch<{ results?: SyncPushResultItem[] }>("/sync/push", {
        method: "POST",
        body: JSON.stringify({ transactions: candidates.map(toPushPayload) }),
      });

      if (Array.isArray(res?.results) && res.results.length > 0) {
        const { synced, duplicates } = await markResultsFromServer(res.results);
        return { syncedCount: synced, duplicateCount: duplicates, failedCount: 0, networkFailed: false };
      }

      // Defensive fallback if response has no results array
      const now = new Date().toISOString();
      for (const p of candidates) {
        await offlineDb.offlineOrders.update(p.clientUuid, {
          synced: 1,
          syncStatus: "SYNCED",
          lastError: null,
          lastAttemptAt: now,
        });
      }
      return { syncedCount: candidates.length, duplicateCount: 0, failedCount: 0, networkFailed: false };
    } catch (err) {
      if (isNetworkError(err)) {
        return { syncedCount: 0, duplicateCount: 0, failedCount: 0, networkFailed: true };
      }

      // Auth errors should not mark transactions as permanently failed
      if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status >= 500)) {
        return { syncedCount: 0, duplicateCount: 0, failedCount: 0, networkFailed: false };
      }

      // 2. Poison-pill recovery: push one-by-one so 1 invalid transaction never blocks the queue
      let syncedCount = 0;
      let duplicateCount = 0;
      let failedCount = 0;
      const now = new Date().toISOString();

      for (const tx of candidates) {
        try {
          const singleRes = await apiFetch<{ results?: SyncPushResultItem[] }>("/sync/push", {
            method: "POST",
            body: JSON.stringify({ transactions: [toPushPayload(tx)] }),
          });
          if (Array.isArray(singleRes?.results) && singleRes.results.length > 0) {
            const { synced, duplicates } = await markResultsFromServer(singleRes.results);
            syncedCount += synced;
            duplicateCount += duplicates;
          } else {
            await offlineDb.offlineOrders.update(tx.clientUuid, {
              synced: 1,
              syncStatus: "SYNCED",
              lastError: null,
              lastAttemptAt: now,
            });
            syncedCount += 1;
          }
        } catch (singleErr) {
          if (isNetworkError(singleErr)) {
            return { syncedCount, duplicateCount, failedCount, networkFailed: true };
          }
          const message = singleErr instanceof Error ? singleErr.message : "Gagal sinkronisasi transaksi";
          await offlineDb.offlineOrders.update(tx.clientUuid, {
            synced: 0,
            syncStatus: "FAILED",
            lastError: message,
            retryCount: (tx.retryCount ?? 0) + 1,
            lastAttemptAt: now,
          });
          failedCount += 1;
        }
      }

      return { syncedCount, duplicateCount, failedCount, networkFailed: false };
    }
  };

  syncInFlight = run().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

/**
 * Pull full catalog snapshot (products, categories, areas/tables, settings) from /sync/pull
 * and normalize into IndexedDB for full offline POS support.
 */
interface RawPullResponse {
  syncedAt: string;
  categories: Array<{ id: number; name: string }>;
  products: Array<Record<string, unknown> & { categoryId?: number; category?: { id: number; name: string } }>;
  areas: Array<Record<string, unknown> & { tables?: Array<Record<string, unknown>> }>;
  settings: Record<string, string>;
}

export async function pullCatalogToCache(outletId?: number): Promise<CachedCatalog> {
  const key = catalogKey(outletId);
  const raw = await apiFetch<RawPullResponse>("/sync/pull");

  const catMap = new Map<number, { id: number; name: string }>();
  for (const c of raw.categories ?? []) {
    catMap.set(c.id, { id: c.id, name: c.name });
  }

  const normalizedProducts = (raw.products ?? []).map((p) => ({
    ...p,
    category:
      p.category ??
      (p.categoryId !== undefined ? catMap.get(p.categoryId) : undefined) ?? {
        id: p.categoryId ?? 0,
        name: "Menu",
      },
  }));

  const normalizedAreas = (raw.areas ?? []).map((a) => ({
    ...a,
    tables: (a.tables ?? []).map((t) => ({
      ...t,
      orders: Array.isArray(t.orders) ? t.orders : [],
    })),
  }));

  const snapshot: CachedCatalog = {
    key,
    syncedAt: raw.syncedAt ?? new Date().toISOString(),
    categories: raw.categories ?? [],
    products: normalizedProducts,
    areas: normalizedAreas,
    settings: raw.settings ?? {},
  };

  await offlineDb.catalog.put(snapshot);
  return snapshot;
}

export async function refreshOfflineCounts(outletId?: number) {
  return getOfflineQueueCounts(outletId);
}
