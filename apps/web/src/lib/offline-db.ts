import Dexie, { type Table } from "dexie";
import { DEFAULT_TAX_CONFIG, type TaxConfig } from "@pos/shared";

export interface CachedCatalog {
  key: string; // "catalog:<outletId>"
  syncedAt: string;
  categories: unknown[];
  products: unknown[];
  areas: unknown[];
  settings: Record<string, string>;
}

export type OfflineSyncStatus = "PENDING" | "SYNCED" | "FAILED";

export interface OfflineTransaction {
  clientUuid: string;
  outletId?: number;
  offlineReceiptNo: string;
  createdAt: string;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableId?: number | null;
  tableName?: string | null;
  customerName?: string;
  discountType?: "PERCENT" | "FIXED" | null;
  discountValue?: number;
  items: Array<{
    productId: number;
    variantId?: number | null;
    quantity: number;
    notes?: string;
    modifierIds?: number[];
  }>;
  paidAmount: number;
  grandTotal: number;
  synced: number; // 0 = pending/retryable, 1 = synced
  syncStatus?: OfflineSyncStatus;
  lastError?: string | null;
  retryCount?: number;
  lastAttemptAt?: string | null;
  syncedOrderNo?: string | null;
  syncedReceiptNo?: string | null;
}

class CadraOfflineDB extends Dexie {
  catalog!: Table<CachedCatalog, string>;
  offlineOrders!: Table<OfflineTransaction, string>;

  constructor() {
    super("cadra_pos_offline_v1");
    this.version(1).stores({
      catalog: "key",
      offlineOrders: "clientUuid, synced, createdAt",
    });
    this.version(2).stores({
      catalog: "key",
      offlineOrders: "clientUuid, synced, syncStatus, outletId, createdAt",
    });
  }
}

export const offlineDb = new CadraOfflineDB();

export function catalogKey(outletId?: number): string {
  return `catalog:${outletId ?? "default"}`;
}

/**
 * Generate RFC4122 v4 UUID safely even outside Secure Context (e.g. LAN HTTP testing).
 */
export function generateClientUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Parse outlet tax & service charge config from cached settings map
 * (mirrors apps/api/src/lib/settings.ts).
 */
export function parseTaxConfigFromSettings(settings?: Record<string, string> | null): TaxConfig {
  const map = settings ?? {};
  return {
    taxRatePercent:
      map.taxRatePercent !== undefined && map.taxRatePercent !== ""
        ? Number(map.taxRatePercent)
        : DEFAULT_TAX_CONFIG.taxRatePercent,
    serviceChargePercent:
      map.serviceChargePercent !== undefined && map.serviceChargePercent !== ""
        ? Number(map.serviceChargePercent)
        : DEFAULT_TAX_CONFIG.serviceChargePercent,
    taxInclusive:
      map.taxInclusive !== undefined ? map.taxInclusive === "true" : DEFAULT_TAX_CONFIG.taxInclusive,
    taxAfterService:
      map.taxAfterService !== undefined ? map.taxAfterService === "true" : DEFAULT_TAX_CONFIG.taxAfterService,
    roundingUnit:
      map.roundingUnit !== undefined && map.roundingUnit !== ""
        ? Number(map.roundingUnit)
        : DEFAULT_TAX_CONFIG.roundingUnit,
  };
}

function matchesOutlet(tx: OfflineTransaction, outletId?: number): boolean {
  if (outletId === undefined) return true;
  return tx.outletId === undefined || tx.outletId === outletId;
}

export async function getPendingOfflineCount(outletId?: number): Promise<number> {
  const unsynced = await offlineDb.offlineOrders.where("synced").equals(0).toArray();
  return unsynced.filter((p) => matchesOutlet(p, outletId)).length;
}

export async function getOfflineQueueCounts(outletId?: number): Promise<{ pending: number; failed: number }> {
  const unsynced = await offlineDb.offlineOrders.where("synced").equals(0).toArray();
  const scoped = unsynced.filter((p) => matchesOutlet(p, outletId));
  const failed = scoped.filter((p) => p.syncStatus === "FAILED").length;
  return { pending: scoped.length, failed };
}

export async function getOfflineTransactions(outletId?: number, limit = 50): Promise<OfflineTransaction[]> {
  const all = await offlineDb.offlineOrders.orderBy("createdAt").reverse().limit(limit).toArray();
  return all.filter((p) => matchesOutlet(p, outletId));
}
