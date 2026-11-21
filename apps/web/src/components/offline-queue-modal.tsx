"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw, Wifi, WifiOff, X } from "lucide-react";
import { formatIDR } from "@pos/shared";
import {
  catalogKey,
  getOfflineQueueCounts,
  getOfflineTransactions,
  offlineDb,
  type OfflineTransaction,
} from "@/lib/offline-db";
import { checkServerReachable, syncPendingTransactions } from "@/lib/sync-engine";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

export function OfflineQueueModal() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const {
    isOnline,
    isSyncing,
    offlineDrawerOpen,
    setOfflineDrawerOpen,
    setOnline,
    setSyncing,
    setPendingOffline,
    setFailedOffline,
    pushToast,
  } = useUiStore();

  const [rows, setRows] = useState<OfflineTransaction[]>([]);
  const [catalogSyncedAt, setCatalogSyncedAt] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [txs, cat, counts] = await Promise.all([
      getOfflineTransactions(user?.outletId, 50),
      offlineDb.catalog.get(catalogKey(user?.outletId)),
      getOfflineQueueCounts(user?.outletId),
    ]);
    setRows(txs);
    setCatalogSyncedAt(cat?.syncedAt ?? null);
    setPendingOffline(counts.pending);
    setFailedOffline(counts.failed);
  }, [user?.outletId, setPendingOffline, setFailedOffline]);

  useEffect(() => {
    if (offlineDrawerOpen) {
      loadData();
    }
  }, [offlineDrawerOpen, loadData]);

  if (!offlineDrawerOpen) return null;

  const handleManualSync = async (includeFailed = true) => {
    if (!user?.outletId || isSyncing) return;
    setSyncing(true);
    try {
      const reachable = await checkServerReachable();
      setOnline(reachable);
      if (!reachable) {
        pushToast("Server belum dapat dijangkau. Periksa koneksi internet Anda.", "warn");
        return;
      }

      const summary = await syncPendingTransactions(user.outletId, { includeFailed });
      if (summary.networkFailed) {
        setOnline(false);
        pushToast("Koneksi terputus saat sinkronisasi. Akan dicoba ulang otomatis.", "warn");
      } else if (summary.syncedCount > 0 || summary.duplicateCount > 0) {
        const totalOk = summary.syncedCount + summary.duplicateCount;
        pushToast(`${totalOk} transaksi offline berhasil disinkronkan`, "good");
        qc.invalidateQueries({ queryKey: ["active-shift"] });
        qc.invalidateQueries({ queryKey: ["tables"] });
        qc.invalidateQueries({ queryKey: ["open-orders"] });
        qc.invalidateQueries({ queryKey: ["pos-catalog"] });
      } else if (summary.failedCount > 0) {
        pushToast(`${summary.failedCount} transaksi gagal disinkronkan. Cek detail error.`, "bad");
      } else {
        pushToast("Semua transaksi sudah tersinkronisasi", "good");
      }
    } finally {
      setSyncing(false);
      await loadData();
    }
  };

  const pendingRows = rows.filter((r) => r.synced === 0);
  const syncedRows = rows.filter((r) => r.synced === 1).slice(0, 10);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={() => setOfflineDrawerOpen(false)}
    >
      <div
        className="max-h-[86dvh] w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--rim)] bg-[var(--raised)] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4 text-[var(--good)]" /> : <WifiOff className="h-4 w-4 text-[var(--bad)]" />}
              Status Offline &amp; Auto Sync
            </h3>
            <p className="text-xs text-[var(--muted)]">
              {isOnline ? "Terhubung ke server" : "Mode Offline — transaksi tunai disimpan di perangkat"}
              {catalogSyncedAt
                ? ` · Katalog: ${new Date(catalogSyncedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </p>
          </div>
          <button
            onClick={() => setOfflineDrawerOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-3">
          <div className="text-xs">
            <span className="font-bold">{pendingRows.length}</span> menunggu sinkronisasi
          </div>
          <button
            disabled={isSyncing || pendingRows.length === 0}
            onClick={() => handleManualSync(true)}
            className="btn-cadra btn-cadra--primary !min-h-[36px] !px-3.5 !text-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {pendingRows.length === 0 && syncedRows.length === 0 ? (
            <div className="py-10 text-center text-xs text-[var(--muted)]">
              Belum ada riwayat transaksi offline di perangkat ini.
            </div>
          ) : (
            <>
              {pendingRows.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Antrean Belum Tersinkron ({pendingRows.length})
                  </div>
                  {pendingRows.map((tx) => {
                    const isFailed = tx.syncStatus === "FAILED";
                    return (
                      <div
                        key={tx.clientUuid}
                        className={`rounded-2xl border p-3 text-xs space-y-1 ${
                          isFailed
                            ? "border-rose-500/40 bg-rose-500/5"
                            : "border-amber-500/35 bg-amber-500/5"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold flex items-center gap-1.5">
                            {isFailed ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-amber-600" />
                            )}
                            {tx.offlineReceiptNo}
                          </span>
                          <b className="text-sm">{formatIDR(tx.grandTotal)}</b>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                          <span>
                            {new Date(tx.createdAt).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {tx.tableName ? ` · ${tx.tableName}` : ` · ${tx.orderType}`}
                          </span>
                          <span>{tx.items.reduce((s, i) => s + i.quantity, 0)} item</span>
                        </div>
                        {tx.lastError && (
                          <div className="pt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                            Error: {tx.lastError}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {syncedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Riwayat Tersinkron Terbaru
                  </div>
                  {syncedRows.map((tx) => (
                    <div
                      key={tx.clientUuid}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--good)]" />
                          <span className="truncate">
                            {tx.offlineReceiptNo}
                            {tx.syncedReceiptNo ? ` → ${tx.syncedReceiptNo}` : ""}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          {new Date(tx.createdAt).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <b className="shrink-0">{formatIDR(tx.grandTotal)}</b>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
