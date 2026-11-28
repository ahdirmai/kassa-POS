"use client";

import { useEffect, useState } from "react";
import { Columns3, Copy, Download, Layers, MessageSquare, Palette } from "lucide-react";
import {
  BRAND_COLORS,
  DM_SCRIPTS,
  INITIAL_POSTS,
  type ContentPost,
  type PostStatus,
} from "@/data/marketing-data";
import CarouselStudio from "@/components/marketing/CarouselStudio";
import ContentKanban from "@/components/marketing/ContentKanban";

const STORAGE_KEY = "tumpu_marketing_manager_v1";

type SubTab = "kanban" | "carousel" | "brand" | "scripts";

export default function MarketingSection({
  onNotify,
}: {
  onNotify: (msg: string, tone?: "ok" | "err") => void;
}) {
  const [subTab, setSubTab] = useState<SubTab>("kanban");
  const [platform, setPlatform] = useState<"all" | "Instagram" | "Threads">("all");
  const [week, setWeek] = useState<"all" | 1 | 2 | 3 | 4>("all");
  const [statuses, setStatuses] = useState<Record<string, PostStatus>>({});
  const [customCaptions, setCustomCaptions] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          statuses?: Record<string, PostStatus>;
          customCaptions?: Record<string, string>;
        };
        if (parsed.statuses) setStatuses(parsed.statuses);
        if (parsed.customCaptions) setCustomCaptions(parsed.customCaptions);
      }
    } catch {}
  }, []);

  const persist = (nextStatuses: Record<string, PostStatus>, nextCaptions: Record<string, string>) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ statuses: nextStatuses, customCaptions: nextCaptions }),
    );
  };

  const defaultStatusMap = new Map<string, PostStatus>(
    INITIAL_POSTS.filter((p) => p.defaultStatus).map((p) => [p.id, p.defaultStatus!]),
  );
  const getStatus = (id: string): PostStatus =>
    statuses[id] ?? defaultStatusMap.get(id) ?? "draft";
  const getCaption = (p: ContentPost) => customCaptions[p.id] ?? p.caption;

  const updateStatus = (id: string, val: PostStatus) => {
    const next = { ...statuses, [id]: val };
    setStatuses(next);
    persist(next, customCaptions);
    onNotify(`Status konten diperbarui: ${val.toUpperCase()}`);
  };

  const updateCaption = (id: string, val: string) => {
    const next = { ...customCaptions, [id]: val };
    setCustomCaptions(next);
    persist(statuses, next);
  };

  const copyText = (text: string, label = "Tersalin ke clipboard!") => {
    navigator.clipboard.writeText(text).then(() => onNotify(label));
  };

  const weekRanges: Record<1 | 2 | 3 | 4, [number, number]> = {
    1: [1, 7],
    2: [8, 14],
    3: [15, 21],
    4: [22, 30],
  };

  const filteredPosts = INITIAL_POSTS.filter((p) => {
    if (platform !== "all" && p.platform !== platform) return false;
    if (week !== "all") {
      const [start, end] = weekRanges[week];
      if (p.day < start || p.day > end) return false;
    }
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 card p-2.5">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["kanban", "Kanban Konten", Columns3],
              ["carousel", "Carousel Studio", Layers],
              ["brand", "Brand & Warna", Palette],
              ["scripts", "Script DM", MessageSquare],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                subTab === id
                  ? "bg-[#0b1013] text-[#e5ba78]"
                  : "border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {subTab === "kanban" && (
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "Instagram", "Threads"] as const).map((pf) => (
              <button
                key={pf}
                onClick={() => setPlatform(pf)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  platform === pf
                    ? "bg-[#0f5257] text-white"
                    : "border border-[var(--line)] text-[var(--muted)]"
                }`}
              >
                {pf === "all" ? "Semua" : pf}
              </button>
            ))}
            <span className="mx-0.5 text-[var(--line-2)]">|</span>
            {(
              [
                ["all", "30H"],
                [1, "M1"],
                [2, "M2"],
                [3, "M3"],
                [4, "M4"],
              ] as const
            ).map(([w, label]) => (
              <button
                key={String(w)}
                onClick={() => setWeek(w)}
                className={`rounded-full px-2.5 py-1 font-mono-num text-xs font-semibold ${
                  week === w
                    ? "bg-[var(--ink)] text-[var(--on-ink)]"
                    : "border border-[var(--line)] text-[var(--muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {subTab === "kanban" && (
        <ContentKanban
          posts={filteredPosts}
          getStatus={getStatus}
          getCaption={getCaption}
          onUpdateStatus={updateStatus}
          onUpdateCaption={updateCaption}
          onCopy={copyText}
        />
      )}

      {subTab === "carousel" && <CarouselStudio />}

      {subTab === "brand" && (
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--ink)]">Official Brand Logo Kit (SVG)</h3>
                <p className="text-xs text-[var(--muted)]">
                  Aset resmi dari <code className="font-mono-num">assets/branding/</code> — Monogram K + Warm Brass Chevron.
                </p>
              </div>
              <a
                href="/branding/brand-tokens.css"
                download="tumpu-brand-tokens.css"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 font-mono-num text-[11px] font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--on-ink)]"
              >
                <Download className="h-3.5 w-3.5" />
                brand-tokens.css
              </a>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "App Icon (Dark)", file: "tumpu-icon-dark.svg", desc: "Icon utama 512×512 · PWA & dark header", bg: "#0B1013" },
                { name: "App Icon (Light)", file: "tumpu-icon-light.svg", desc: "Icon terang 512×512 · dokumen cetak", bg: "#F6F4EF" },
                { name: "Horizontal Lockup (Dark)", file: "tumpu-lockup-dark.svg", desc: "Logo lengkap mode gelap · 760×220", bg: "#0B1013" },
                { name: "Horizontal Lockup (Light)", file: "tumpu-lockup-light.svg", desc: "Logo lengkap mode terang · 760×220", bg: "#F6F4EF" },
                { name: "Mark Transparent", file: "tumpu-mark-transparent.svg", desc: "Monogram K murni · watermark & end-card", bg: "#141B1F" },
                { name: "Monochrome Thermal", file: "tumpu-monochrome-thermal.svg", desc: "1-bit hitam-putih · struk 58/80mm", bg: "#FFFFFF" },
                { name: "Browser Favicon", file: "favicon.svg", desc: "Dioptimalkan untuk 16–32px · 64×64", bg: "#0B1013" },
              ].map((asset) => (
                <div key={asset.file} className="overflow-hidden card">
                  <div
                    className="grid h-28 place-items-center border-b border-[var(--line)] p-4"
                    style={{ background: asset.bg }}
                  >
                    <img
                      src={`/branding/${asset.file}`}
                      alt={asset.name}
                      className="max-h-20 max-w-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3.5">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-[var(--ink)]">{asset.name}</div>
                      <div className="truncate text-[11px] text-[var(--muted)]">{asset.desc}</div>
                    </div>
                    <a
                      href={`/branding/${asset.file}`}
                      download={asset.file}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--line)] px-2.5 py-1 font-mono-num text-[11px] font-semibold hover:bg-[#0b1013] hover:text-white"
                    >
                      <Download className="h-3 w-3" />
                      SVG
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-[var(--ink)]">Palet Warna Resmi (Klik untuk salin HEX)</h3>
            <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => copyText(c.hex, `HEX ${c.hex} tersalin!`)}
                  className="overflow-hidden card text-left transition hover:-translate-y-0.5 hover:border-[#121517]"
                >
                  <div className="h-16 w-full border-b border-[var(--line)]" style={{ background: c.hex }} />
                  <div className="p-3.5">
                    <div className="text-xs font-bold">{c.name}</div>
                    <div className="mt-0.5 font-mono-num text-xs font-semibold text-[#0f5257]">
                      {c.hex}
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--muted)]">{c.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === "scripts" && (
        <div className="grid gap-4 md:grid-cols-2">
          {DM_SCRIPTS.map((s) => (
            <div key={s.title} className="card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[#0f5257]">
                  {s.title}
                </span>
                <button
                  onClick={() => copyText(s.text, `"${s.title}" tersalin!`)}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-2.5 py-1 font-mono-num text-[11px] font-medium hover:bg-[#0b1013] hover:text-white"
                >
                  <Copy className="h-3 w-3" />
                  Salin
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--ink)]">
                {s.text}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
