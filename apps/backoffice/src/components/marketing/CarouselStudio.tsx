"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Grid, Layers, Printer } from "lucide-react";

interface DeckDef {
  id: string;
  day: number;
  dayLabel: string;
  shortLabel: string;
  title: string;
  sub: string;
  folder: string;
  slideCount: number;
  dmKeyword: string;
}

const DECKS: DeckDef[] = [
  {
    id: "ig-d2",
    day: 2,
    dayLabel: "Selasa",
    shortLabel: "H2 · HPP Kopi (6)",
    title: "Hari 2 (Selasa) — Omzet 3 Juta Sehari Tapi Kas Tipis?",
    sub: "Carousel Edukasi HPP & Stok · Light Editorial (#F6F4EF) + Dark CTA · Keyword: HPP",
    folder: "H02-hpp-kopi-susu",
    slideCount: 6,
    dmKeyword: "HPP",
  },
  {
    id: "ig-d4",
    day: 4,
    dayLabel: "Kamis",
    shortLabel: "H4 · Anti-Bocor (5)",
    title: "Hari 4 (Kamis) — 3 Celah Kebocoran Kasir & Kontrol Staf",
    sub: "Carousel Anti-Bocor & RBAC · Light Editorial (#F6F4EF) + Dark CTA · Keyword: AMAN",
    folder: "H04-anti-bocor-kasir",
    slideCount: 5,
    dmKeyword: "AMAN",
  },
  {
    id: "ig-d5",
    day: 5,
    dayLabel: "Jumat",
    shortLabel: "H5 · Harga 49rb (3)",
    title: "Hari 5 (Jumat) — Offer Anchor: All-In Cuma Rp49.000/Bulan",
    sub: "Full Dark Luxury (#0B1013 + Warm Brass #D9A962) · Keyword: PRO",
    folder: "H05-harga-pro-49rb",
    slideCount: 3,
    dmKeyword: "PRO",
  },
  {
    id: "ig-d7",
    day: 7,
    dayLabel: "Minggu",
    shortLabel: "H7 · 4 Langkah (5)",
    title: "Hari 7 (Minggu) — Recap 4 Langkah: Rapikan Outlet Mulai Senin Besok",
    sub: "Carousel Product Tour · Screenshot POS, KDS, Stok & Mobile · Keyword: TUMPU",
    folder: "H07-recap-4-langkah",
    slideCount: 5,
    dmKeyword: "TUMPU",
  },
  {
    id: "ig-d9",
    day: 9,
    dayLabel: "Selasa",
    shortLabel: "H9 · Setup 250rb (5)",
    title: "Hari 9 (Selasa) — Setup Kasir Modal Rp250rb: HP Lama + Printer Bluetooth",
    sub: "Carousel Tips Modal Awal · Light Editorial + Dark CTA · Keyword: PRINTER",
    folder: "H09-setup-kasir-250rb",
    slideCount: 5,
    dmKeyword: "PRINTER",
  },
  {
    id: "ig-d11",
    day: 11,
    dayLabel: "Kamis",
    shortLabel: "H11 · PB1 & Service (5)",
    title: "Hari 11 (Kamis) — Cara Hitung PB1 10% & Service Charge Otomatis",
    sub: "Carousel Edukasi Pajak Resto · Contoh Struk Rapi + Mode Inklusif/Eksklusif · Keyword: PB1",
    folder: "H11-pb1-service-charge",
    slideCount: 5,
    dmKeyword: "PB1",
  },
  {
    id: "ig-d13",
    day: 13,
    dayLabel: "Sabtu",
    shortLabel: "H13 · 5 Kesalahan POS (6)",
    title: "Hari 13 (Sabtu) — 5 Kesalahan Fatal Owner Baru Saat Pilih Aplikasi Kasir",
    sub: "Carousel Edukasi Buyer · Light Editorial + Dark CTA · Keyword: DEMO",
    folder: "H13-5-kesalahan-pilih-pos",
    slideCount: 6,
    dmKeyword: "DEMO",
  },
  {
    id: "ig-d16",
    day: 16,
    dayLabel: "Selasa",
    shortLabel: "H16 · Studi Kasus RM (5)",
    title: "Hari 16 (Selasa) — Studi Kasus Rumah Makan: Hemat 40 Menit/Hari Tanpa Bon Kertas",
    sub: "Carousel Studi Kasus KDS · Light Editorial + Screenshot KDS · Keyword: KDS",
    folder: "H16-studi-kasus-rumah-makan",
    slideCount: 5,
    dmKeyword: "KDS",
  },
  {
    id: "ig-d18",
    day: 18,
    dayLabel: "Kamis",
    shortLabel: "H18 · Multi-Outlet (5)",
    title: "Hari 18 (Kamis) — Punya 2–3 Cabang? Kelola Semua Outlet dalam 1 Dashboard",
    sub: "Carousel Scale-Up Multi-Outlet · Light Editorial + Dashboard Screenshot · Keyword: CABANG",
    folder: "H18-multi-outlet-dashboard",
    slideCount: 5,
    dmKeyword: "CABANG",
  },
  {
    id: "ig-d20",
    day: 20,
    dayLabel: "Sabtu",
    shortLabel: "H20 · SOP Opening (5)",
    title: "Hari 20 (Sabtu) — Checklist SOP Opening & Closing Cafe (Siap Simpan!)",
    sub: "Carousel Checklist Shareable · Light Editorial + Dark CTA · Keyword: SOP",
    folder: "H20-sop-opening-closing",
    slideCount: 5,
    dmKeyword: "SOP",
  },
  {
    id: "ig-d23",
    day: 23,
    dayLabel: "Selasa",
    shortLabel: "H23 · Starter vs Pro (4)",
    title: "Hari 23 (Selasa) — Starter Gratis Rp0 vs Pro Rp49rb — Pilih Mana?",
    sub: "Carousel Perbandingan Paket Transparan · Light Editorial + Dark CTA · Keyword: STARTER",
    folder: "H23-starter-vs-pro",
    slideCount: 4,
    dmKeyword: "STARTER",
  },
  {
    id: "ig-d25",
    day: 25,
    dayLabel: "Kamis",
    shortLabel: "H25 · 4 Data Margin (5)",
    title: "Hari 25 (Kamis) — 4 Data Wajib Cek Sebelum Akhir Bulan Biar Margin Naik 15%",
    sub: "Carousel Evaluasi Bulanan · Menu Engineering, HPP & Jam Puncak · Keyword: MARGIN",
    folder: "H25-4-data-akhir-bulan",
    slideCount: 5,
    dmKeyword: "MARGIN",
  },
  {
    id: "ig-d27",
    day: 27,
    dayLabel: "Sabtu",
    shortLabel: "H27 · Dine-In & Ojol (5)",
    title: "Hari 27 (Sabtu) — Alur Lengkap Dine-In, Takeaway & Delivery Tanpa Antre",
    sub: "Carousel Operasional Weekend · Denah Meja & Badge KDS · Keyword: RESTO",
    folder: "H27-dinein-takeaway-delivery",
    slideCount: 5,
    dmKeyword: "RESTO",
  },
  {
    id: "ig-d29",
    day: 29,
    dayLabel: "Senin",
    shortLabel: "H29 · FAQ Tumpu (5)",
    title: "Hari 29 (Senin) — FAQ Lengkap Tumpu: Offline, Printer, Harga & Keamanan",
    sub: "Carousel Objection Handling · Light Editorial + Dark CTA · Keyword: TUMPU",
    folder: "H29-faq-lengkap-tumpu",
    slideCount: 5,
    dmKeyword: "TUMPU",
  },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getSlidePaths(deck: DeckDef) {
  return Array.from({ length: deck.slideCount }, (_, i) => {
    const num = pad2(i + 1);
    return {
      index: i,
      fileName: `${deck.folder}-slide-${num}.png`,
      src: `/carousels/${deck.folder}/slide-${num}.png`,
      label: `Slide ${num} / ${pad2(deck.slideCount)}`,
    };
  });
}

export default function CarouselStudio() {
  const [deckId, setDeckId] = useState<string>(DECKS[0].id);
  const [mode, setMode] = useState<"swipe" | "grid">("swipe");
  const [idx, setIdx] = useState(0);

  const deck = DECKS.find((d) => d.id === deckId) ?? DECKS[0];
  const slides = getSlidePaths(deck);
  const currentSlide = slides[idx] ?? slides[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== "swipe") return;
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, slides.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, slides.length]);

  return (
    <div className="space-y-5">
      {/* Deck Selector (All 14 Ready-to-Post Carousels) */}
      <div className="no-print space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[#0f5257]">
            14 Carousel Siap Post · 69 Slide PNG (1080×1350)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("swipe")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono-num text-xs ${
                mode === "swipe"
                  ? "bg-[#0f5257] font-semibold text-white"
                  : "border border-[#ccc8bd] bg-white text-[#4c5259]"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Swipe IG
            </button>
            <button
              onClick={() => setMode("grid")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono-num text-xs ${
                mode === "grid"
                  ? "bg-[#0f5257] font-semibold text-white"
                  : "border border-[#ccc8bd] bg-white text-[#4c5259]"
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              Semua Slide
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#ccc8bd] bg-white px-3 py-1.5 font-mono-num text-xs text-[#121517] hover:border-[#121517]"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {DECKS.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setDeckId(d.id);
                setIdx(0);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                deckId === d.id
                  ? "bg-[#121517] text-[#e5ba78]"
                  : "border border-[#ccc8bd] bg-white text-[#4c5259] hover:border-[#121517]"
              }`}
            >
              {d.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Deck Header */}
      <div className="no-print flex flex-wrap items-end justify-between gap-2 border-b border-[var(--line)] pb-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[var(--ink)]">{deck.title}</h2>
          <p className="text-xs text-[#4c5259]">{deck.sub}</p>
        </div>
        <div className="flex items-center gap-2 font-mono-num text-xs text-[#787e86]">
          <span className="rounded-md bg-[#0f5257]/10 px-2 py-0.5 font-semibold text-[#0f5257]">
            docs/marketing/carousels/{deck.folder}
          </span>
          <span>
            {deck.slideCount} Slide · 1080×1350 PNG
          </span>
        </div>
      </div>

      {mode === "swipe" ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-[#d5d2c9] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e2dfd7] px-4 py-2.5 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <img
                  src="/branding/tumpu-icon-dark.svg"
                  alt="Tumpu"
                  className="h-6 w-6 rounded-md"
                />
                <span>tumpu.biz.id</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-num text-[11px] text-[#787e86]">
                  {idx + 1} / {slides.length}
                </span>
                <a
                  href={currentSlide.src}
                  download={currentSlide.fileName}
                  className="inline-flex items-center gap-1 rounded-md bg-[#0b1013] px-2.5 py-1 font-mono-num text-[10.5px] font-semibold text-[#e5ba78] hover:opacity-90"
                >
                  <Download className="h-3 w-3" />
                  Download PNG
                </a>
              </div>
            </div>

            <div className="aspect-[4/5] w-full bg-[#f6f4ef]">
              <img
                src={currentSlide.src}
                alt={`${deck.title} — ${currentSlide.label}`}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between border-t border-[#e2dfd7] px-4 py-3">
              <button
                disabled={idx === 0}
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#e2dfd7] bg-[#f6f4ef] px-3 py-1.5 text-xs font-semibold disabled:opacity-35"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <div className="flex items-center gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.fileName}
                    onClick={() => setIdx(i)}
                    aria-label={s.label}
                    className={`h-2 rounded-full transition-all ${
                      i === idx ? "w-5 bg-[#0f5257]" : "w-2 bg-[#d2cfc6]"
                    }`}
                  />
                ))}
              </div>
              <button
                disabled={idx === slides.length - 1}
                onClick={() => setIdx((i) => Math.min(slides.length - 1, i + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#e2dfd7] bg-[#f6f4ef] px-3 py-1.5 text-xs font-semibold disabled:opacity-35"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="font-mono-num text-[11px] text-[#787e86]">
            Gunakan panah keyboard ← / → untuk berpindah slide · Klik Download PNG untuk unduh resolusi penuh 1080×1350
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((s) => (
            <div
              key={s.fileName}
              className="overflow-hidden rounded-2xl border border-[#d5d2c9] bg-white shadow-lg"
            >
              <div className="aspect-[4/5] w-full bg-[#f6f4ef]">
                <img
                  src={s.src}
                  alt={`${deck.title} — ${s.label}`}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="no-print flex items-center justify-between border-t border-[#e2dfd7] px-3.5 py-2.5">
                <span className="font-mono-num text-[11px] font-semibold text-[#4c5259]">
                  {s.label}
                </span>
                <a
                  href={s.src}
                  download={s.fileName}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0b1013] px-2.5 py-1 font-mono-num text-[11px] font-semibold text-[#e5ba78] hover:opacity-90"
                >
                  <Download className="h-3 w-3" />
                  Download PNG
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
