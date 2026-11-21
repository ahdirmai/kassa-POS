"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChefHat,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Store,
  Sun,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuthStore, type UserSession } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { apiFetch } from "@/lib/api";
import { ADMIN_ROUTES, canAccessPath, getDefaultHomePath, getFirstAdminPath, isRouteAllowed } from "@/lib/rbac";

export function CadraShell({
  title,
  crumb,
  mode = "admin",
  rightSlot,
  children,
}: {
  title: string;
  crumb?: string;
  mode?: "pos" | "kds" | "admin";
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, setSession, hasPermission, hasFeature } = useAuthStore();
  const { theme, toggleTheme, isOnline, pendingOffline, setFinderOpen, pushToast } = useUiStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const plan = user?.plan ?? "PRO";
  const isFree = plan === "FREE";

  // Strict dynamic RBAC + Plan Route Guard
  const allowed = !mounted || (Boolean(user) && canAccessPath(pathname, hasPermission, plan));

  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccessPath(pathname, hasPermission, plan)) {
      const target = getDefaultHomePath(hasPermission, plan);
      pushToast(
        isFree
          ? "Fitur ini khusus Kassa Pro (Rp49rb/bln). Paket Free hanya mendukung Kasir POS."
          : "Akses ditolak: role Anda tidak memiliki izin untuk halaman ini",
        "warn",
      );
      router.replace(target);
    }
  }, [mounted, user, pathname, hasPermission, plan, isFree, router, pushToast]);

  const canPos = mounted && hasPermission("pos.access");
  const canKds = mounted && hasPermission("kds.view") && hasFeature("kds");
  const firstAdminHref = mounted ? getFirstAdminPath(hasPermission, plan) : null;
  const canAdmin = Boolean(firstAdminHref);
  const canSettings = mounted && hasPermission("settings.manage");
  const visibleAdminTabs = mounted ? ADMIN_ROUTES.filter((t) => isRouteAllowed(t, hasPermission, plan)) : [];
  const brandHref = mounted ? getDefaultHomePath(hasPermission, plan) : "/pos";

  const handleSwitchOutlet = async (nextOutletId: number) => {
    try {
      const res = await apiFetch<{ accessToken: string; user: UserSession }>("/outlets/switch", {
        method: "POST",
        body: JSON.stringify({ outletId: nextOutletId }),
      });
      setSession(res.user, res.accessToken);
      pushToast(`Beralih ke outlet ${res.user.outletName ?? ""}`, "good");
      window.location.reload();
    } catch (e) {
      pushToast(e instanceof Error ? e.message : "Gagal pindah outlet", "bad");
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {}
    logout();
    router.push("/login");
  };

  if (mounted && (!user || !allowed)) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-sm text-[var(--muted)]">
        Memeriksa hak akses...
      </div>
    );
  }

  return (
    <>
      {/* Floating Left Dock (Desktop & Landscape Tablet) — Dinamis sesuai RBAC */}
      <nav className="cadra-dock" aria-label="Navigasi Cepat">
        <button className="dock-btn" onClick={() => setFinderOpen(true)} title="Cari (⌘K)" aria-label="Cari">
          <Search className="h-5 w-5" />
        </button>
        {canPos && (
          <Link href="/pos" className="dock-btn" data-active={pathname.startsWith("/pos")} title="Kasir POS" aria-label="Kasir POS">
            <Store className="h-5 w-5" />
          </Link>
        )}
        {canKds && (
          <Link href="/kds" className="dock-btn" data-active={pathname.startsWith("/kds")} title="Layar Dapur (KDS)" aria-label="KDS">
            <ChefHat className="h-5 w-5" />
          </Link>
        )}
        {canAdmin && firstAdminHref && (
          <Link href={firstAdminHref} className="dock-btn" data-active={pathname.startsWith("/admin")} title="Back-office Admin" aria-label="Admin">
            <LayoutDashboard className="h-5 w-5" />
          </Link>
        )}
        <span className="dock-sep" />
        <button className="dock-btn" onClick={toggleTheme} title="Ganti Tema" aria-label="Ganti Tema">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        {canSettings && (
          <Link href="/admin/settings" className="dock-btn" data-active={pathname === "/admin/settings"} title="Pengaturan" aria-label="Pengaturan">
            <Settings className="h-5 w-5" />
          </Link>
        )}
        <button className="dock-btn" onClick={handleLogout} title="Keluar" aria-label="Keluar">
          <LogOut className="h-5 w-5" />
        </button>
      </nav>

      {/* Mobile & Portrait Tablet Bottom Navigation Bar — Dinamis sesuai RBAC */}
      <nav className="cadra-mobile-nav" aria-label="Navigasi Mobile">
        {canPos && (
          <Link href="/pos" className="dock-btn" data-active={pathname.startsWith("/pos")} aria-label="Kasir POS">
            <Store className="h-5 w-5" />
          </Link>
        )}
        {canKds && (
          <Link href="/kds" className="dock-btn" data-active={pathname.startsWith("/kds")} aria-label="KDS">
            <ChefHat className="h-5 w-5" />
          </Link>
        )}
        {canAdmin && firstAdminHref && (
          <Link href={firstAdminHref} className="dock-btn" data-active={pathname.startsWith("/admin")} aria-label="Admin">
            <LayoutDashboard className="h-5 w-5" />
          </Link>
        )}
        <button className="dock-btn" onClick={() => setFinderOpen(true)} aria-label="Cari">
          <Search className="h-5 w-5" />
        </button>
        <button className="dock-btn" onClick={toggleTheme} aria-label="Ganti Tema">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button className="dock-btn" onClick={handleLogout} aria-label="Keluar">
          <LogOut className="h-5 w-5" />
        </button>
      </nav>

      <div className="cadra-app">
        {/* Top Bar */}
        <header className="cadra-top">
          <Link href={brandHref} className="cadra-brand">
            <span className="cadra-brand__mark">K</span>
            <span className="cadra-brand__text">
              <b>Kassa</b>
              <small>{mounted && user?.outletName ? user.outletName : "Kassa POS"}</small>
            </span>
          </Link>

          <div className="cadra-top__nav">
            <nav className="ttabs-track" aria-label="Menu Utama">
              {mode === "admin" ? (
                visibleAdminTabs.map((t) => {
                  const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
                  return (
                    <Link key={t.href} href={t.href} className="ttab" data-active={active}>
                      {t.label}
                    </Link>
                  );
                })
              ) : (
                <>
                  {canPos && (
                    <Link href="/pos" className="ttab" data-active={pathname.startsWith("/pos")}>
                      Kasir POS
                    </Link>
                  )}
                  {canKds && (
                    <Link href="/kds" className="ttab" data-active={pathname.startsWith("/kds")}>
                      Layar Dapur (KDS)
                    </Link>
                  )}
                  {canAdmin && firstAdminHref && (
                    <Link href={firstAdminHref} className="ttab" data-active={pathname.startsWith("/admin")}>
                      Back-Office
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center justify-end gap-2">
            {mounted && user && user.roleCode === "OWNER" && (user.outlets?.length ?? 0) > 1 && (
              <select
                aria-label="Pilih Outlet Aktif"
                value={user.outletId}
                onChange={(e) => handleSwitchOutlet(Number(e.target.value))}
                className="hidden md:block rounded-full border border-[var(--rim)] bg-[var(--glass-2)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
              >
                {user.outlets?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.code} · {o.name}
                  </option>
                ))}
              </select>
            )}

            {mounted && user && isFree && (
              <Link
                href="/admin/outlets"
                className="hidden sm:inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300"
              >
                FREE · Upgrade Pro
              </Link>
            )}

            <span className={`spill ${isOnline ? "spill--good" : "spill--bad"}`}>
              {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isOnline ? "Online" : "Offline"}
              {pendingOffline > 0 ? ` · ${pendingOffline}` : ""}
            </span>

            {mounted && user && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--rim)] bg-[var(--glass-2)] px-3 py-1.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-[var(--on-ink)]">
                  {user.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div className="leading-tight">
                  <div className="text-xs font-bold">{user.name}</div>
                  <div className="text-[10px] text-[var(--muted)]">{user.roleName}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Head */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 text-xs font-semibold text-[var(--muted)]">
              {mounted && user?.outletName ? user.outletName : "Kassa"} › <span className="text-[var(--primary-ink)]">{crumb ?? title}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
          </div>
          {rightSlot && <div className="flex flex-wrap items-center gap-2">{rightSlot}</div>}
        </div>

        <main>{children}</main>
      </div>
    </>
  );
}
