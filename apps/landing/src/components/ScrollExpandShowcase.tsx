"use client";

import { useState } from "react";
import { ArrowUpRight, TrendingUp } from "lucide-react";

export interface ShowcaseTab {
  id: string;
  label: string;
  route: string;
  tag: string;
  title: string;
  img: string;
}

interface ScrollExpandShowcaseProps {
  tabs: ShowcaseTab[];
  appUrl: string;
  onTabChange?: (tab: ShowcaseTab) => void;
  onModuleOpen?: (tab: ShowcaseTab) => void;
}

/**
 * Reference-inspired crisp SaaS dashboard stage:
 * - Soft indigo & emerald accent shapes peeking behind left/right edges
 * - Floating white KPI callout cards overlapping the frame
 * - Clean pill module switcher below the screen
 */
export default function ScrollExpandShowcase({
  tabs,
  appUrl,
  onTabChange,
  onModuleOpen,
}: ScrollExpandShowcaseProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "pos");
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div id="produk" className="relative mx-auto max-w-5xl scroll-mt-24 px-4 sm:px-8">
      <div className="relative mx-auto max-w-4xl">
        {/* Decorative Accent Shapes Peeking Behind Mockup (trackInc reference) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-6 bottom-10 hidden h-44 w-20 rounded-2xl bg-gradient-to-b from-[#6366f1] to-[#818cf8]/30 opacity-85 blur-[1px] sm:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 top-10 hidden h-48 w-20 rounded-2xl bg-gradient-to-b from-[#12b886] to-[#34d399]/25 opacity-90 blur-[1px] sm:block"
        />

        {/* Floating Left KPI Callout Card */}
        <div className="pointer-events-none absolute -left-10 top-1/3 z-20 hidden w-48 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-3.5 shadow-[0_18px_40px_-14px_rgba(19,26,46,0.16)] backdrop-blur-md lg:block">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono-num text-[14px] font-bold text-[var(--ink)]">
              Rp4.820.000
            </span>
            <span className="font-mono-num text-[10.5px] font-semibold text-[#12b886]">
              +18.4%
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11.5px] text-[var(--ink-muted)]">
              Omzet Hari Ini
            </span>
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--indigo-soft)] text-[var(--accent)]">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Floating Right KPI Callout Card */}
        <div className="pointer-events-none absolute -right-10 bottom-1/4 z-20 hidden w-48 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-3.5 shadow-[0_18px_40px_-14px_rgba(19,26,46,0.16)] backdrop-blur-md lg:block">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono-num text-[14px] font-bold text-[var(--ink)]">
              Margin 73%
            </span>
            <span className="font-mono-num text-[10.5px] font-semibold text-[#f59e0b]">
              Auto HPP
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11.5px] text-[var(--ink-muted)]">
              Laba Bersih / Porsi
            </span>
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--mint-soft)] text-[var(--mint)]">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Main Clean Dashboard Window */}
        <div className="relative z-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_28px_70px_-24px_rgba(19,26,46,0.18)] ring-1 ring-black/[0.03]">
          {/* Subtle Top Bar */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-0.5 font-mono-num text-[11px] text-[var(--ink-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#12b886]" />
              <span>app.kassa.biz.id{currentTab.route}</span>
            </div>

            <a
              href={`${appUrl}${currentTab.route}`}
              onClick={() => onModuleOpen?.(currentTab)}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--accent)] hover:underline"
            >
              <span className="hidden sm:inline">Buka</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Stacked Preloaded 16:10 Screenshots */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f7f8fc]">
            {tabs.map((tab) => {
              const isActive = tab.id === currentTab.id;
              return (
                <img
                  key={tab.id}
                  src={tab.img}
                  alt={tab.title}
                  loading="eager"
                  decoding="async"
                  aria-hidden={!isActive}
                  className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300 ${
                    isActive
                      ? "z-10 opacity-100"
                      : "pointer-events-none z-0 opacity-0"
                  }`}
                />
              );
            })}
            {/* Clean production mask over bottom-left Next.js dev indicator */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 z-20 h-[12%] w-[6.5%] bg-[#f4f3ef]"
            />
          </div>
        </div>
      </div>

      {/* Clean Pill Module Switcher Under Dashboard */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                onTabChange?.(tab);
              }}
              className={`rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold transition-all ${
                active
                  ? "border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] shadow-sm"
                  : "border-[var(--border)] bg-[var(--surface)]/80 text-[var(--ink-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
