"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Check,
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Moon,
  ShieldCheck,
  Sun,
  Wifi,
} from "lucide-react";
import { boFetch, setStoredToken, type PlatformAdmin } from "@/lib/api";
import type { OverviewResponse } from "@/components/OverviewSection";

export interface NavItem {
  id: string;
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  match: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    href: "/",
    label: "Overview",
    shortLabel: "Overview",
    icon: LayoutDashboard,
    match: (p) => p === "/",
  },
  {
    id: "tenants",
    href: "/tenants",
    label: "Accounts & Tenants",
    shortLabel: "Tenants",
    icon: Building2,
    match: (p) => p.startsWith("/tenants"),
  },
  {
    id: "subscriptions",
    href: "/subscriptions",
    label: "Subscriptions",
    shortLabel: "Billing",
    icon: CreditCard,
    match: (p) => p.startsWith("/subscriptions"),
  },
  {
    id: "landing",
    href: "/leads",
    label: "Landing & Leads",
    shortLabel: "Leads",
    icon: Globe,
    match: (p) => p.startsWith("/leads") || p.startsWith("/landing"),
  },
  {
    id: "marketing",
    href: "/marketing",
    label: "Marketing Hub",
    shortLabel: "Marketing",
    icon: Megaphone,
    match: (p) => p.startsWith("/marketing"),
  },
  {
    id: "audit",
    href: "/audit",
    label: "Audit Logs",
    shortLabel: "Audit",
    icon: ShieldCheck,
    match: (p) => p.startsWith("/audit"),
  },
];

interface BackOfficeContextValue {
  admin: PlatformAdmin;
  overview: OverviewResponse | null;
  loadOverview: () => Promise<void>;
  notify: (msg: string, tone?: "ok" | "err") => void;
}

const BackOfficeContext = createContext<BackOfficeContextValue | null>(null);

export function useBackOffice() {
  const ctx = useContext(BackOfficeContext);
  if (!ctx) {
    throw new Error("useBackOffice must be used within BackOfficeShell");
  }
  return ctx;
}

export default function BackOfficeShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);

  const notify = useCallback((msg: string, tone: "ok" | "err" = "ok") => {
    setToast({ msg, tone });
    setTimeout(() => {
      setToast((curr) => (curr?.msg === msg ? null : curr));
    }, 3400);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("kassa-bo-theme") as "light" | "dark" | null;
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("kassa-bo-theme", next);
  };

  const loadOverview = useCallback(async () => {
    try {
      const data = await boFetch<OverviewResponse>("/overview");
      setOverview(data);
    } catch {
      // ignore if redirected
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await boFetch<{ admin: PlatformAdmin }>("/auth/me");
        setAdmin(res.admin);
        await loadOverview();
      } catch {
        setStoredToken(null);
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, [router, loadOverview]);

  async function handleLogout() {
    try {
      await boFetch("/auth/logout", { method: "POST" });
    } catch {}
    setStoredToken(null);
    router.replace("/login");
  }

  const contextValue = useMemo(
    () => (admin ? { admin, overview, loadOverview, notify } : null),
    [admin, overview, loadOverview, notify],
  );

  if (checkingAuth || !admin || !contextValue) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-sm text-[var(--muted)]">
        Memuat Kassa Back Office...
      </div>
    );
  }

  const activeNav = NAV_ITEMS.find((n) => n.match(pathname)) ?? NAV_ITEMS[0];
  const initials = admin.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <BackOfficeContext.Provider value={contextValue}>
      {/* Ambient Blurred Mesh — Template yang sama dengan apps/web */}
      <div className="mesh" aria-hidden="true">
        <i className="mesh__a" />
        <i className="mesh__b" />
        <i className="mesh__c" />
      </div>

      {/* Floating Left Dock (Desktop & Tablet Landscape) */}
      <nav className="cadra-dock" aria-label="Navigasi Back Office">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.id}
              href={item.href}
              className="dock-btn"
              data-active={active}
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="dock__tip">{item.label}</span>
            </Link>
          );
        })}
        <span className="dock-sep" />
        <button
          className="dock-btn"
          onClick={toggleTheme}
          title="Ganti Tema"
          aria-label="Ganti Tema"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button className="dock-btn" onClick={handleLogout} title="Keluar" aria-label="Keluar">
          <LogOut className="h-5 w-5" />
        </button>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="cadra-mobile-nav" aria-label="Navigasi Mobile">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <Link
              key={item.id}
              href={item.href}
              className="dock-btn"
              data-active={active}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
        <button className="dock-btn" onClick={toggleTheme} aria-label="Ganti Tema">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </nav>

      {/* Main App Container (Cadra Shell) */}
      <div className="cadra-app">
        <header className="cadra-top">
          <Link href="/" className="cadra-brand text-left">
            <span className="cadra-brand__mark">K</span>
            <span className="cadra-brand__text">
              <b>Kassa Admin</b>
              <small>admin.kassa.biz.id</small>
            </span>
          </Link>

          <div className="cadra-top__nav">
            <nav className="ttabs-track" aria-label="Menu Utama Back Office">
              {NAV_ITEMS.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="ttab"
                    data-active={active}
                  >
                    {item.shortLabel}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center justify-end gap-2">
            <span className="spill spill--good hidden md:inline-flex">
              <Wifi className="h-3.5 w-3.5" />
              admin-api
            </span>

            <div className="hidden items-center gap-2 rounded-full border border-[var(--rim)] bg-[var(--glass-2)] px-3 py-1.5 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-[var(--on-ink)]">
                {initials}
              </span>
              <div className="leading-tight">
                <div className="text-xs font-bold text-[var(--text)]">{admin.name}</div>
                <div className="text-[10.5px] font-medium text-[var(--muted)]">{admin.role}</div>
              </div>
            </div>
          </div>
        </header>

        <section className="phead">
          <div className="phead__lead">
            <nav className="crumbs" aria-label="Breadcrumb">
              <span>Kassa Platform</span>
              <span>/</span>
              <span aria-current="page">{activeNav.label}</span>
            </nav>
            <h1 className="top__title">{activeNav.label}</h1>
          </div>

          <div className="shift">
            <span className="shift__clock">
              <i />
              admin-api
            </span>
            <span className="shift__txt">
              <b>{overview ? `${overview.kpis.activeTenants} Tenant Aktif` : "Memuat..."}</b>
              <small>admin.kassa.biz.id</small>
            </span>
          </div>
        </section>

        <main>{children}</main>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[70] inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold shadow-2xl ${
            toast.tone === "err"
              ? "border-[var(--bad)]/40 bg-[var(--bad)] text-white"
              : "border-[var(--rim)] bg-[var(--ink)] text-[var(--on-ink)]"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          {toast.msg}
        </div>
      )}
    </BackOfficeContext.Provider>
  );
}
