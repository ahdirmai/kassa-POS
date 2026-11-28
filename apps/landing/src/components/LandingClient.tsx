"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChefHat,
  Lock,
  Moon,
  Package,
  Printer,
  ShieldCheck,
  Smartphone,
  Store,
  Sun,
  Unlock,
  Wifi,
  WifiOff,
} from "lucide-react";
import ScrollExpandShowcase from "@/components/ScrollExpandShowcase";
import { buildWhatsAppUrl } from "@/lib/default-content";
import type { LandingContent } from "@/lib/types";

const LeadModal = dynamic(() => import("@/components/LeadModal"), {
  ssr: false,
});

const FEATURE_PILLS_ROW_1 = [
  "Kasir 1-Tap",
  "Mode Offline",
  "Hold & Split Bill",
  "Struk Bluetooth 58/80mm",
  "Layar Dapur KDS",
  "Timer Masak",
  "Manajemen Meja",
  "Cepat & Ringan",
];

const FEATURE_PILLS_ROW_2 = [
  "Stok Bahan Baku",
  "Auto HPP per Porsi",
  "Stock Opname",
  "Catat Waste",
  "Kontrol Akses Staf",
  "Anti-Void",
  "Laporan Tutup Shift",
  "Tanpa Komisi",
];

const RBAC_DEMO: Record<
  "Owner" | "Kasir" | "Dapur",
  { modules: { name: string; allowed: boolean }[] }
> = {
  Owner: {
    modules: [
      { name: "Kasir POS", allowed: true },
      { name: "Layar Dapur", allowed: true },
      { name: "Omzet & Laporan", allowed: true },
      { name: "Stok & Pengaturan", allowed: true },
    ],
  },
  Kasir: {
    modules: [
      { name: "Kasir POS", allowed: true },
      { name: "Layar Dapur", allowed: false },
      { name: "Omzet & Laporan", allowed: false },
      { name: "Stok & Pengaturan", allowed: false },
    ],
  },
  Dapur: {
    modules: [
      { name: "Kasir POS", allowed: false },
      { name: "Layar Dapur", allowed: true },
      { name: "Omzet & Laporan", allowed: false },
      { name: "Stok & Pengaturan", allowed: false },
    ],
  },
};

function getOrCreateVisitorId(): string {
  try {
    const key = "tumpu_vid";
    let id = localStorage.getItem(key);
    if (!id) {
      id = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "v_anon";
  }
}

interface LandingClientProps {
  content: LandingContent;
}

export default function LandingClient({ content }: LandingClientProps) {
  const [dark, setDark] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadDefaultPlan, setLeadDefaultPlan] = useState("Pro");
  const [leadSource, setLeadSource] = useState("landing-modal");

  // Interactive demo widget states
  const [simOffline, setSimOffline] = useState(true);
  const [kdsStage, setKdsStage] = useState<0 | 1 | 2>(1);
  const [rbacRole, setRbacRole] = useState<"Owner" | "Kasir" | "Dapur">("Kasir");

  const appUrl = content.general.appUrl;
  const waUrl = buildWhatsAppUrl(
    content.general.waNumber,
    content.general.waMessage
  );

  const trackEvent = useCallback(
    (type: "pageview" | "click", label?: string, target?: string) => {
      try {
        const visitorId = getOrCreateVisitorId();
        const params = new URLSearchParams(window.location.search);
        const payload = JSON.stringify({
          type,
          visitorId,
          path: window.location.pathname,
          referrer: document.referrer || "",
          label,
          target,
          utmSource: params.get("utm_source") || undefined,
          utmMedium: params.get("utm_medium") || undefined,
          utmCampaign: params.get("utm_campaign") || undefined,
        });

        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/track", blob);
        } else {
          fetch("/api/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Ignore analytics failure
      }
    },
    []
  );

  useEffect(() => {
    const saved = localStorage.getItem("tumpu-landing-theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    const sessionKey = "tumpu_pv_tracked";
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");
    const timer = window.setTimeout(() => {
      trackEvent("pageview");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [trackEvent]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tumpu-landing-theme", next ? "dark" : "light");
  };

  const openLeadModal = (plan = "Pro", source = "landing-modal") => {
    setLeadDefaultPlan(plan);
    setLeadSource(source);
    setLeadModalOpen(true);
    trackEvent("click", `Buka Form Demo (${plan})`, source);
  };

  const kdsStages = ["Masuk", "Dimasak", "Siap Saji"] as const;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] transition-colors duration-200">
      {/* Clean Airy Navbar (trackInc reference) */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)]/70 bg-[var(--bg)]/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#" className="flex items-center gap-2.5">
            <img
              src="/branding/tumpu-icon-dark.svg"
              alt={content.general.brandName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg shadow-sm"
            />
            <span className="text-[17px] font-bold tracking-tight text-[var(--ink)]">
              {content.general.brandName}
              <span className="text-[var(--tumpu-brass,#D9A962)]">.</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-[13.5px] font-medium text-[var(--ink-secondary)] md:flex">
            <a href="#produk" className="transition-colors hover:text-[var(--ink)]">
              Produk
            </a>
            <a href="#fitur" className="transition-colors hover:text-[var(--ink)]">
              Fitur
            </a>
            <a href="#harga" className="transition-colors hover:text-[var(--ink)]">
              Harga
            </a>
            <a href="#faq" className="transition-colors hover:text-[var(--ink)]">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Ubah tema tampilan"
              className="grid h-9 w-9 place-items-center rounded-lg text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <a
              href={`${appUrl}/login`}
              onClick={() => trackEvent("click", "Navbar: Masuk", `${appUrl}/login`)}
              className="hidden rounded-lg bg-[var(--mint-soft)] px-4 py-2 text-[13px] font-semibold text-[#067a57] transition-colors hover:opacity-85 dark:text-[#34d399] sm:inline-flex"
            >
              Masuk
            </a>
            <a
              href={`${appUrl}/register`}
              onClick={() => trackEvent("click", "Navbar: Coba Gratis", `${appUrl}/register`)}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--mint-btn)] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[var(--mint-btn-hover)]"
            >
              Coba Gratis
            </a>
          </div>
        </div>
      </header>

      <main>
      {/* Hero Section with Soft Pastel Aura & Overlapping KPI Dashboard */}
      <section className="pastel-aura-hero relative overflow-hidden pb-16 pt-14 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.1] tracking-[-0.035em] text-[var(--ink)] sm:text-[3.5rem] lg:text-[4rem]">
            {content.hero.titleLine1}
            <br />
            <span>{content.hero.titleLine2}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-[var(--ink-secondary)] sm:text-[16.5px]">
            {content.hero.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={`${appUrl}/register`}
              onClick={() => trackEvent("click", "Hero: Coba Gratis", `${appUrl}/register`)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-[14px] font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-[var(--accent-hover)]"
            >
              {content.hero.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={() => openLeadModal("Pro", "hero-demo-cta")}
              className="text-[13.5px] font-medium text-[var(--ink-secondary)] underline-offset-4 transition-colors hover:text-[var(--ink)] hover:underline"
            >
              Jadwalkan Demo Outlet · Gratis
            </button>
          </div>

          <p className="mt-3 text-[12px] text-[var(--ink-muted)]">
            {content.hero.footnote}
          </p>
        </div>

        {/* Centered Framed Dashboard Showcase with Floating KPI Cards */}
        <div className="mt-12 sm:mt-16">
          <ScrollExpandShowcase
            tabs={content.showcaseTabs}
            appUrl={appUrl}
            onTabChange={(tab) =>
              trackEvent("click", `Showcase Tab: ${tab.label}`, tab.route)
            }
            onModuleOpen={(tab) =>
              trackEvent("click", `Buka Modul: ${tab.label}`, `${appUrl}${tab.route}`)
            }
          />
        </div>
      </section>

      {/* Clean Trust & Metrics Strip */}
      <section className="border-y border-[var(--border)]/70 bg-[var(--surface)] py-10">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="text-center text-[13px] font-medium text-[var(--ink-muted)]">
            Dirancang untuk ritme cepat kedai kopi, rumah makan, dan bakery modern
          </p>
          <div className="mt-7 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {content.metrics.map((m) => (
              <div key={m.id}>
                <div className="font-mono-num text-[26px] font-bold tracking-tight text-[var(--ink)] sm:text-[30px]">
                  {m.prefix}
                  {m.value}
                  {typeof m.secondaryValue === "number"
                    ? `${m.separator || "/"}${m.secondaryValue}`
                    : ""}
                  <span className="text-[16px] font-medium text-[var(--ink-muted)]">
                    {m.suffix}
                  </span>
                </div>
                <div className="mt-1 text-[12.5px] text-[var(--ink-secondary)]">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2-Row Checkmark Feature Pill Marquee (trackInc signature section) */}
      <section className="overflow-hidden py-20 lg:py-24">
        <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
          <h2 className="font-display text-[2rem] font-extrabold leading-[1.15] tracking-[-0.03em] text-[var(--ink)] sm:text-[2.65rem]">
            Optimalkan waktu &amp; operasional
            <br />
            outlet Anda dalam satu layar
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
            Tanpa sistem rumit dan tanpa biaya potongan per transaksi—cukup satu
            aplikasi ringan untuk kasir, dapur, dan stok bahan baku.
          </p>
        </div>

        <div className="marquee-wrap relative mt-12 space-y-4">
          {/* Soft side fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--bg)] to-transparent sm:w-32" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--bg)] to-transparent sm:w-32" />

          {/* Row 1 */}
          <div className="flex w-max gap-3.5 animate-marquee-left">
            {[...FEATURE_PILLS_ROW_1, ...FEATURE_PILLS_ROW_1].map((label, i) => (
              <div
                key={`r1-${i}`}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3.5 text-[14px] font-semibold text-[var(--ink)] shadow-[0_6px_20px_-10px_rgba(19,26,46,0.12)] transition-all hover:border-[var(--ink)]"
              >
                <span className="grid h-5 w-5 place-items-center rounded-md bg-[var(--mint-soft)] text-[var(--mint)]">
                  <Check className="h-3.5 w-3.5 stroke-[2.6]" />
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex w-max gap-3.5 animate-marquee-right">
            {[...FEATURE_PILLS_ROW_2, ...FEATURE_PILLS_ROW_2].map((label, i) => (
              <div
                key={`r2-${i}`}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3.5 text-[14px] font-semibold text-[var(--ink)] shadow-[0_6px_20px_-10px_rgba(19,26,46,0.12)] transition-all hover:border-[var(--ink)]"
              >
                <span className="grid h-5 w-5 place-items-center rounded-md bg-[var(--mint-soft)] text-[var(--mint)]">
                  <Check className="h-3.5 w-3.5 stroke-[2.6]" />
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alternating Feature Split Showcases (trackInc bottom layout) */}
      <section id="fitur" className="scroll-mt-20 space-y-20 pb-24 lg:space-y-28">
        {/* Split 1: Kasir POS & Mode Offline */}
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <span className="inline-block rounded-md bg-[var(--indigo-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--accent)]">
              Kasir &amp; Offline Mode
            </span>
            <h3 className="font-display mt-4 text-[2rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[var(--ink)] sm:text-[2.45rem]">
              Wi-Fi mati, kasir tetap melayani
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
              Menu tersimpan lokal di perangkat sehingga transaksi tunai tetap
              berjalan mulus saat internet padam. Begitu sinyal pulih, seluruh
              antrean tersinkron otomatis tanpa duplikat.
            </p>

            {/* Compact Interactive Offline Simulator */}
            <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
                  {simOffline ? (
                    <WifiOff className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Wifi className="h-4 w-4 text-[var(--mint)]" />
                  )}
                  {simOffline ? "2 transaksi di antrean lokal" : "Semua transaksi tersinkron"}
                </span>
                <button
                  type="button"
                  onClick={() => setSimOffline(!simOffline)}
                  className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--ink)] hover:border-[var(--ink)]"
                >
                  {simOffline ? "Pulihkan Sinyal" : "Tes Offline"}
                </button>
              </div>
              <div className="mt-3 space-y-1.5 font-mono-num text-[12px]">
                <div className="flex justify-between rounded-lg bg-[var(--surface)] px-3 py-2">
                  <span>OFF-042 · Tunai · 2 Item</span>
                  <span className="font-semibold">Rp64.000</span>
                </div>
                <div className="flex justify-between rounded-lg bg-[var(--surface)] px-3 py-2">
                  <span>OFF-043 · Tunai · 3 Item</span>
                  <span className="font-semibold">Rp98.500</span>
                </div>
              </div>
            </div>

            <a
              href={`${appUrl}/pos`}
              onClick={() => trackEvent("click", "Feature: Eksplor Kasir", `${appUrl}/pos`)}
              className="mt-7 inline-flex items-center gap-1.5 border-b border-[var(--border-strong)] pb-1 text-[13.5px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Eksplor Layar Kasir
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="lg:col-span-7">
            <div className="feature-backdrop-mint overflow-hidden rounded-3xl p-5 pb-0 pr-0 sm:p-8 sm:pb-0 sm:pr-0">
              <div className="relative overflow-hidden rounded-tl-2xl border-l border-t border-white/70 bg-white shadow-2xl">
                <Image
                  src={content.showcaseTabs[0]?.img || "/screenshots/02-pos.png"}
                  alt="Tampilan Kasir POS Tumpu"
                  width={1440}
                  height={900}
                  loading="lazy"
                  sizes="(max-width: 1024px) calc(100vw - 40px), 640px"
                  quality={75}
                  className="aspect-[16/10] w-full object-cover object-top"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 left-0 z-10 h-[12%] w-[6.5%] bg-[#f4f3ef]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Split 2: Layar Dapur KDS & Resep HPP (Reversed) */}
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-14">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <div className="feature-backdrop-indigo rounded-3xl p-6 sm:p-8">
              <div className="space-y-4">
                {/* Interactive KDS Mini-Board */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-[12.5px] font-bold text-[var(--ink)]">
                      <ChefHat className="h-4 w-4 text-[var(--accent)]" />
                      Layar Dapur KDS (Klik untuk geser)
                    </span>
                    <button
                      type="button"
                      onClick={() => setKdsStage(((kdsStage + 1) % 3) as 0 | 1 | 2)}
                      className="rounded-lg bg-[var(--indigo-soft)] px-3 py-1 text-[11.5px] font-semibold text-[var(--accent)] hover:opacity-85"
                    >
                      Geser Tiket →
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2.5">
                    {kdsStages.map((stage, i) => {
                      const active = kdsStage === i;
                      return (
                        <div
                          key={stage}
                          className={`rounded-xl border p-3 transition-all ${
                            active
                              ? "border-[var(--accent)] bg-[var(--surface-subtle)] shadow-sm"
                              : "border-[var(--border)] bg-[var(--surface)]"
                          }`}
                        >
                          <div className="font-mono-num text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                            {stage}
                          </div>
                          {active ? (
                            <div className="mt-2">
                              <div className="flex items-center justify-between font-mono-num text-[11.5px] font-bold">
                                <span>#108</span>
                                <span className="text-[var(--accent)]">03:42</span>
                              </div>
                              <div className="mt-1 text-[11.5px] text-[var(--ink-secondary)]">
                                2× Kopi Susu
                                <br />
                                1× Croissant
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 h-9 rounded-lg border border-dashed border-[var(--border-strong)]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* HPP Breakdown Card */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <span className="inline-flex items-center gap-2 text-[13.5px] font-bold">
                      <Package className="h-4 w-4 text-[var(--mint)]" />
                      Resep: Es Kopi Susu Aren
                    </span>
                    <span className="rounded-full bg-[var(--mint-soft)] px-2.5 py-0.5 font-mono-num text-[11px] font-bold text-[#067a57] dark:text-[#34d399]">
                      Margin 73%
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 font-mono-num text-[11.5px] text-[var(--ink-secondary)]">
                    <div>
                      <div className="text-[10px] text-[var(--ink-muted)]">BEANS 18g</div>
                      <div className="font-semibold text-[var(--ink)]">Rp3.600</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--ink-muted)]">MILK 150ml</div>
                      <div className="font-semibold text-[var(--ink)]">Rp2.700</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--ink-muted)]">AREN 25ml</div>
                      <div className="font-semibold text-[var(--ink)]">Rp1.150</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5">
            <span className="inline-block rounded-md bg-[var(--mint-soft)] px-3 py-1 text-[12px] font-semibold text-[#067a57] dark:text-[#34d399]">
              Dapur KDS &amp; Auto HPP
            </span>
            <h3 className="font-display mt-4 text-[2rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[var(--ink)] sm:text-[2.45rem]">
              Hapus bon kertas, pantau margin tiap porsi
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
              Order otomatis terpisah ke layar Bar, Dapur, dan Pastry lengkap
              timer masak. Setiap porsi terjual langsung memotong stok bahan
              baku sesuai gramasi resep.
            </p>
            <a
              href={`${appUrl}/kds`}
              onClick={() => trackEvent("click", "Feature: Eksplor KDS", `${appUrl}/kds`)}
              className="mt-7 inline-flex items-center gap-1.5 border-b border-[var(--border-strong)] pb-1 text-[13.5px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Eksplor Layar Dapur
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Split 3: Kontrol Staf RBAC & Mobile POS */}
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <span className="inline-block rounded-md bg-[var(--indigo-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--accent)]">
              Kontrol Staf &amp; Multi-Perangkat
            </span>
            <h3 className="font-display mt-4 text-[2rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[var(--ink)] sm:text-[2.45rem]">
              Akses staf terkunci, jalan di HP &amp; tablet
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
              Kasir hanya melihat layar kasir, dapur hanya melihat KDS—omzet dan
              pembatalan transaksi aman terkunci untuk Owner. Cukup pakai HP,
              tablet, atau laptop yang sudah ada.
            </p>

            {/* Interactive RBAC Switcher */}
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold">
                  <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                  Simulasi Peran:
                </span>
                <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
                  {(["Owner", "Kasir", "Dapur"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRbacRole(r)}
                      className={`rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                        rbacRole === r
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "text-[var(--ink-secondary)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
                {RBAC_DEMO[rbacRole].modules.map((m) => (
                  <div
                    key={m.name}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-[12.5px] ${
                      m.allowed
                        ? "border-[var(--mint)]/40 bg-[var(--surface)] font-semibold text-[var(--ink)]"
                        : "border-[var(--border)] bg-transparent text-[var(--ink-muted)]"
                    }`}
                  >
                    <span>{m.name}</span>
                    {m.allowed ? (
                      <Unlock className="h-3.5 w-3.5 text-[var(--mint)]" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-5 text-[13px] font-medium text-[var(--ink-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-[var(--mint)]" />
                HP, Tablet &amp; Laptop
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Printer className="h-4 w-4 text-[var(--mint)]" />
                Struk Bluetooth 58/80mm
              </span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="feature-backdrop-mint flex justify-center rounded-3xl px-6 py-10">
              <div className="relative w-[248px] overflow-hidden rounded-[32px] border-[7px] border-[#131a2e] bg-[#131a2e] shadow-[0_28px_60px_-20px_rgba(19,26,46,0.35)]">
                <Image
                  src={content.mobileCard.screenshot}
                  alt="Tampilan Tumpu Mobile POS"
                  width={248}
                  height={537}
                  loading="lazy"
                  sizes="248px"
                  quality={75}
                  className="block h-auto w-full"
                />
                {/* Clean production storefront icon over bottom-left dev badge */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-[2.1%] left-[4.4%] z-10 grid h-[5.7%] w-[13.6%] place-items-center rounded-full bg-[#242629] ring-1 ring-white/10"
                >
                  <Store className="h-3.5 w-3.5 text-white" />
                  <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-sky-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean 3-Column Pricing Section */}
      <section id="harga" className="scroll-mt-20 border-t border-[var(--border)] bg-[var(--surface-subtle)] py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-md bg-[var(--mint-soft)] px-3 py-1 text-[12px] font-semibold text-[#067a57] dark:text-[#34d399]">
              Harga Transparan
            </span>
            <h2 className="font-display mt-3 text-[2rem] font-extrabold tracking-[-0.03em] sm:text-[2.6rem]">
              Tanpa komisi per transaksi
            </h2>
            <p className="mt-3 text-[15px] text-[var(--ink-secondary)]">
              Mulai gratis di 1 outlet. Upgrade ke Pro cuma Rp49.000/bulan untuk
              kasir, layar dapur, dan stok HPP lengkap.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {content.pricing.map((plan) => {
              const resolvedHref = plan.href === "#wa" ? waUrl : plan.href;
              const isExternalWa = resolvedHref.startsWith("https://wa.me");
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-2xl border p-7 transition-shadow ${
                    plan.featured
                      ? "border-[var(--accent)] bg-[var(--surface)] shadow-[0_20px_50px_-20px_rgba(79,70,229,0.22)] ring-1 ring-[var(--accent)]/20"
                      : "border-[var(--border)] bg-[var(--surface)] shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[18px] font-bold text-[var(--ink)]">
                      {plan.name}
                    </h3>
                    <span
                      className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${
                        plan.featured
                          ? "bg-[var(--indigo-soft)] text-[var(--accent)]"
                          : "bg-[var(--surface-subtle)] text-[var(--ink-muted)]"
                      }`}
                    >
                      {plan.tag}
                    </span>
                  </div>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="font-mono-num text-[32px] font-bold tracking-tight text-[var(--ink)]">
                      {plan.price}
                    </span>
                    <span className="text-[12px] text-[var(--ink-muted)]">
                      {plan.period}
                    </span>
                  </div>

                  <p className="mt-2 text-[13.5px] text-[var(--ink-secondary)]">
                    {plan.desc}
                  </p>

                  <ul className="mt-6 flex-1 space-y-2.5 border-t border-[var(--border)] pt-6 text-[13.5px]">
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded bg-[var(--mint-soft)] text-[var(--mint)]">
                          <Check className="h-3 w-3 stroke-[2.8]" />
                        </span>
                        <span className="text-[var(--ink-secondary)]">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 space-y-2">
                    <a
                      href={resolvedHref}
                      target={isExternalWa ? "_blank" : undefined}
                      rel={isExternalWa ? "noreferrer" : undefined}
                      onClick={() =>
                        trackEvent("click", `Pricing: ${plan.name}`, resolvedHref)
                      }
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13.5px] font-semibold transition-colors ${
                        plan.featured
                          ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                          : "border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-[var(--ink)] hover:border-[var(--ink)]"
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => openLeadModal(plan.name, `pricing-${plan.id}`)}
                      className="w-full py-1.5 text-[12px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    >
                      atau jadwalkan demo paket {plan.name}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Clean FAQ Section */}
      <section id="faq" className="scroll-mt-20 border-t border-[var(--border)] py-20 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span className="inline-block rounded-md bg-[var(--indigo-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--accent)]">
              FAQ
            </span>
            <h2 className="font-display mt-3 text-[1.9rem] font-extrabold leading-tight tracking-[-0.03em]">
              Pertanyaan sebelum mulai
            </h2>
            <p className="mt-3 text-[14px] text-[var(--ink-secondary)]">
              Masih ragu soal printer atau migrasi menu?{" "}
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent("click", "FAQ: Tanya WhatsApp", waUrl)}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                Tanya via WhatsApp
              </a>{" "}
              atau{" "}
              <button
                type="button"
                onClick={() => openLeadModal("Pro", "faq-form")}
                className="font-semibold text-[var(--accent)] hover:underline"
              >
                isi form konsultasi
              </button>
              .
            </p>
          </div>

          <div className="divide-y divide-[var(--border)] border-y border-[var(--border)] lg:col-span-8">
            {content.faqs.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.id} className="py-5">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <span className="text-[15px] font-semibold text-[var(--ink)]">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[var(--ink-muted)] transition-transform duration-200 ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open && (
                    <p className="mt-3 pr-8 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </main>

      {/* Airy Final CTA Banner & Minimal Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface-subtle)] pt-16 pb-12">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="pastel-aura-hero overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center shadow-sm sm:px-12 sm:py-16">
            <span className="inline-block rounded-md bg-[var(--mint-soft)] px-3 py-1 text-[12px] font-semibold text-[#067a57] dark:text-[#34d399]">
              {content.footerCta.eyebrow}
            </span>
            <h2 className="font-display mx-auto mt-4 max-w-2xl text-[2rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[var(--ink)] sm:text-[2.7rem]">
              {content.footerCta.titleLine1} {content.footerCta.titleLine2}
            </h2>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`${appUrl}/register`}
                onClick={() => trackEvent("click", "Footer: Mulai Gratis", `${appUrl}/register`)}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3.5 text-[14px] font-semibold text-white shadow-md shadow-indigo-500/20 hover:bg-[var(--accent-hover)]"
              >
                {content.footerCta.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => openLeadModal("Enterprise", "footer-demo")}
                className="rounded-xl bg-[var(--mint-btn)] px-5 py-3.5 text-[14px] font-semibold text-white hover:bg-[var(--mint-btn-hover)]"
              >
                Konsultasi &amp; Demo
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent("click", "Footer: WhatsApp", waUrl)}
                className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3.5 text-[14px] font-semibold text-[var(--ink)] hover:border-[var(--ink)]"
              >
                {content.footerCta.secondaryCta}
              </a>
            </div>
          </div>

          <div className="mt-10 flex flex-col justify-between gap-4 text-[13px] text-[var(--ink-muted)] sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <img
                src="/branding/tumpu-icon-dark.svg"
                alt={content.general.brandName}
                width={26}
                height={26}
                className="h-6.5 w-6.5 rounded-md"
              />
              <span className="font-bold text-[var(--ink)]">
                {content.general.brandName}
              </span>
              <span>·</span>
              <span className="font-mono-num text-[12px]">
                {content.general.domain}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-6 font-medium">
              <a href="#produk" className="hover:text-[var(--ink)]">
                Produk
              </a>
              <a href="#fitur" className="hover:text-[var(--ink)]">
                Fitur
              </a>
              <a href="#harga" className="hover:text-[var(--ink)]">
                Harga
              </a>
              <a href={appUrl} className="font-mono-num text-[var(--accent)] hover:underline">
                {appUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {leadModalOpen && (
        <LeadModal
          open={leadModalOpen}
          onClose={() => setLeadModalOpen(false)}
          defaultPlan={leadDefaultPlan}
          source={leadSource}
          waUrl={waUrl}
          onSubmitted={() =>
            trackEvent("click", `Lead Submitted (${leadDefaultPlan})`, leadSource)
          }
        />
      )}
    </div>
  );
}
