"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useUiStore, type AccentMode, type ThemeMode } from "@/stores/ui-store";
import { useAuthStore, type UserSession } from "@/stores/auth-store";
import { getPendingOfflineCount, offlineDb } from "@/lib/offline-db";
import { apiFetch } from "@/lib/api";
import { APP_ROUTES, hasAnyPerm } from "@/lib/rbac";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
      }),
  );

  const router = useRouter();
  const { setTheme, setAccent, setOnline, setPendingOffline, toasts, dismissToast, finderOpen, setFinderOpen, pushToast } =
    useUiStore();
  const { accessToken, setSession, hasPermission } = useAuthStore();
  const [finderQuery, setFinderQuery] = useState("");

  // Sinkronkan permission terbaru dari DB (/auth/me) agar perubahan RBAC dinamis langsung terasa di UI
  useEffect(() => {
    if (!accessToken) return;
    apiFetch<{ user: UserSession }>("/auth/me")
      .then((res) => {
        if (res.user) setSession(res.user, useAuthStore.getState().accessToken ?? accessToken);
      })
      .catch(() => {});
  }, [accessToken, setSession]);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("cadra_theme") as ThemeMode) || "light";
    const savedAccent = (localStorage.getItem("cadra_accent") as AccentMode) || "ocean";
    setTheme(savedTheme);
    setAccent(savedAccent);

    const updateStatus = async () => {
      const online = navigator.onLine;
      setOnline(online);
      const activeOutletId = useAuthStore.getState().user?.outletId;
      const count = await getPendingOfflineCount(activeOutletId);
      setPendingOffline(count);

      if (online && count > 0 && activeOutletId) {
        try {
          const allPending = await offlineDb.offlineOrders.where("synced").equals(0).toArray();
          const pending = allPending.filter((p) => p.outletId === undefined || p.outletId === activeOutletId);
          if (pending.length) {
            await apiFetch("/sync/push", {
              method: "POST",
              body: JSON.stringify({
                transactions: pending.map((p) => ({
                  clientUuid: p.clientUuid,
                  offlineReceiptNo: p.offlineReceiptNo,
                  createdAt: p.createdAt,
                  orderType: p.orderType,
                  tableId: p.tableId,
                  customerName: p.customerName,
                  discountType: p.discountType,
                  discountValue: p.discountValue,
                  items: p.items,
                  paidAmount: p.paidAmount,
                })),
              }),
            });
            for (const p of pending) {
              await offlineDb.offlineOrders.update(p.clientUuid, { synced: 1 });
            }
            const remaining = await getPendingOfflineCount(activeOutletId);
            setPendingOffline(remaining);
            pushToast(`${pending.length} transaksi offline berhasil disinkronkan`, "good");
          }
        } catch {
          // Will retry on next reconnect
        }
      }
    };

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFinderOpen(!useUiStore.getState().finderOpen);
      }
      if (e.key === "Escape") {
        setFinderOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setTheme, setAccent, setOnline, setPendingOffline, setFinderOpen, pushToast]);

  const filteredLinks = APP_ROUTES.filter((l) => hasAnyPerm(hasPermission, l.anyPermissions)).filter(
    (l) =>
      !finderQuery.trim() ||
      l.label.toLowerCase().includes(finderQuery.toLowerCase()) ||
      l.sub.toLowerCase().includes(finderQuery.toLowerCase()),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mesh" aria-hidden="true">
        <i className="mesh__a" />
        <i className="mesh__b" />
        <i className="mesh__c" />
      </div>

      {children}

      {/* ⌘K Finder Modal */}
      {finderOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-6 sm:pt-24 px-4 backdrop-blur-sm"
          onClick={() => setFinderOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[var(--rim)] bg-[var(--raised)] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
              <input
                autoFocus
                value={finderQuery}
                onChange={(e) => setFinderQuery(e.target.value)}
                placeholder="Cari halaman POS, KDS, menu, laporan..."
                className="w-full bg-transparent text-base sm:text-sm outline-none"
              />
              <button onClick={() => setFinderOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--well)] hover:text-[var(--text)]" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {filteredLinks.map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => {
                      router.push(item.href);
                      setFinderOpen(false);
                      setFinderQuery("");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left hover:bg-[var(--well)]"
                  >
                    <div>
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="text-xs text-[var(--muted)]">{item.sub}</div>
                    </div>
                    <span className="rounded-full bg-[var(--well)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--muted)]">
                      {item.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Cadra Toast Stack */}
      <div className="fixed top-4 left-4 right-4 sm:top-auto sm:left-auto sm:bottom-5 sm:right-5 z-50 flex flex-col items-center sm:items-end gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className="pointer-events-auto cursor-pointer max-w-sm rounded-2xl sm:rounded-full bg-[var(--ink)] px-4 py-2.5 text-xs font-semibold text-[var(--on-ink)] shadow-xl flex items-center gap-2"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                t.tone === "bad" ? "bg-rose-400" : t.tone === "warn" ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </QueryClientProvider>
  );
}
