"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useUiStore, type AccentMode, type BeforeInstallPromptEvent, type ThemeMode } from "@/stores/ui-store";
import { useAuthStore, type UserSession } from "@/stores/auth-store";
import { getOfflineQueueCounts } from "@/lib/offline-db";
import { checkServerReachable, syncPendingTransactions } from "@/lib/sync-engine";
import { apiFetch } from "@/lib/api";
import { APP_ROUTES, hasAnyPerm } from "@/lib/rbac";
import { OfflineQueueModal } from "@/components/offline-queue-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
      }),
  );

  const router = useRouter();
  const {
    setTheme,
    setAccent,
    setOnline,
    setSyncing,
    setPendingOffline,
    setFailedOffline,
    setDeferredInstallPrompt,
    toasts,
    dismissToast,
    finderOpen,
    setFinderOpen,
    pushToast,
  } = useUiStore();
  const { accessToken, user, setSession, hasPermission } = useAuthStore();
  const [finderQuery, setFinderQuery] = useState("");

  // Sinkronkan permission terbaru dari DB (/auth/me) agar perubahan RBAC dinamis langsung terasa di UI
  useEffect(() => {
    if (!accessToken || (typeof navigator !== "undefined" && !navigator.onLine)) return;
    apiFetch<{ user: UserSession }>("/auth/me")
      .then((res) => {
        if (res.user) setSession(res.user, useAuthStore.getState().accessToken ?? accessToken);
      })
      .catch(() => {});
  }, [accessToken, setSession]);

  // Registrasi Service Worker & tangkap event beforeinstallprompt (PWA Install)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredInstallPrompt(null);
      pushToast("Tumpu POS berhasil di-install ke perangkat Anda", "good");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          if (navigator.onLine) {
            reg.active?.postMessage({ type: "WARM_POS_CACHE" });
          }
        })
        .catch(() => {
          // Ignore SW registration failure on unsupported / non-secure origins
        });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [setDeferredInstallPrompt, pushToast]);

  // Core Auto-Sync runner (concurrency-locked via sync-engine)
  const runAutoSync = useCallback(
    async (opts: { verifyHealth?: boolean; includeFailed?: boolean } = {}) => {
      const activeOutletId = useAuthStore.getState().user?.outletId;
      const counts = await getOfflineQueueCounts(activeOutletId);
      setPendingOffline(counts.pending);
      setFailedOffline(counts.failed);

      if (!navigator.onLine) {
        setOnline(false);
        return;
      }

      if (opts.verifyHealth) {
        const reachable = await checkServerReachable();
        setOnline(reachable);
        if (!reachable) return;
      } else {
        setOnline(true);
      }

      const retryableCount = opts.includeFailed ? counts.pending : counts.pending - counts.failed;
      if (!activeOutletId || retryableCount <= 0) return;

      setSyncing(true);
      try {
        const summary = await syncPendingTransactions(activeOutletId, { includeFailed: opts.includeFailed });
        if (summary.skippedLocked) return;

        if (summary.networkFailed) {
          setOnline(false);
          return;
        }

        const updated = await getOfflineQueueCounts(activeOutletId);
        setPendingOffline(updated.pending);
        setFailedOffline(updated.failed);

        const totalSynced = summary.syncedCount + summary.duplicateCount;
        if (totalSynced > 0) {
          pushToast(`${totalSynced} transaksi offline berhasil disinkronkan`, "good");
          queryClient.invalidateQueries({ queryKey: ["active-shift"] });
          queryClient.invalidateQueries({ queryKey: ["tables"] });
          queryClient.invalidateQueries({ queryKey: ["open-orders"] });
          queryClient.invalidateQueries({ queryKey: ["pos-catalog"] });
        }
        if (summary.failedCount > 0) {
          pushToast(
            `${summary.failedCount} transaksi offline perlu dicek (klik indikator status di atas)`,
            "warn",
          );
        }
      } finally {
        setSyncing(false);
      }
    },
    [queryClient, setOnline, setSyncing, setPendingOffline, setFailedOffline, pushToast],
  );

  // Theme, Online/Offline listeners, SW Background Sync listener, Periodic Retry & ⌘K shortcut
  useEffect(() => {
    const savedTheme = (localStorage.getItem("cadra_theme") as ThemeMode) || "light";
    const savedAccent = (localStorage.getItem("cadra_accent") as AccentMode) || "ocean";
    setTheme(savedTheme);
    setAccent(savedAccent);

    runAutoSync({ verifyHealth: true });

    const onOnline = () => {
      setOnline(true);
      // Delay sedikit agar WiFi yang baru connect sempat stabil sebelum push
      setTimeout(() => {
        runAutoSync({ verifyHealth: true });
      }, 1500);
    };
    const onOffline = () => {
      setOnline(false);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runAutoSync({ verifyHealth: true });
      }
    };
    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "TRIGGER_SYNC") {
        runAutoSync({ verifyHealth: true });
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibilityChange);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onSwMessage);
    }

    // Periodic auto-sync retry setiap 30 detik jika masih ada antrean pending
    const retryInterval = setInterval(() => {
      if (navigator.onLine && useUiStore.getState().pendingOffline > 0) {
        runAutoSync({ verifyHealth: true });
      }
    }, 30_000);

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
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onSwMessage);
      }
      clearInterval(retryInterval);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setTheme, setAccent, setOnline, setFinderOpen, runAutoSync, user?.outletId]);

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

      <OfflineQueueModal />

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
              <button
                onClick={() => setFinderOpen(false)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--well)] hover:text-[var(--text)]"
                aria-label="Tutup"
              >
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
