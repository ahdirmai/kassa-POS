"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Printer, Wifi } from "lucide-react";
import ThermalReceiptWidget from "@/components/ThermalReceiptWidget";

type ConceptId = "hardware" | "monochrome" | "hospitality";

const CONCEPTS: {
  id: ConceptId;
  code: string;
  name: string;
  ref: string;
  desc: string;
}[] = [
  {
    id: "hardware",
    code: "01",
    name: "Swiss Editorial × Tactile Hardware",
    ref: "Teenage Engineering · Braun · Square",
    desc: "Grid 1px tajam, matte off-white, tombol taktil vermilion, simulator struk thermal interaktif. (Aktif di /)",
  },
  {
    id: "monochrome",
    code: "02",
    name: "Swiss Monochrome Press",
    ref: "Stripe Press · Awwwards SOTD · Dieter Rams",
    desc: "Ultra-bersih putih murni & tinta hitam pekat, tipografi display masif, aksen Cobalt Blue tajam.",
  },
  {
    id: "hospitality",
    code: "03",
    name: "Warm Hospitality Editorial",
    ref: "Toast · Sunday · Specialty Coffee Brands",
    desc: "Palet warm bone, deep forest green, & terracotta yang tenang, membumi, dan terasa dekat dengan kafe/resto.",
  },
];

export default function DesignPreviewPage() {
  const [active, setActive] = useState<ConceptId>("hardware");
  const current = CONCEPTS.find((c) => c.id === active) ?? CONCEPTS[0];

  return (
    <div className="min-h-screen bg-[#111214] text-white">
      {/* Floating Concept Switcher Bar */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#111214]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 border border-white/15 px-2.5 py-1.5 font-mono-num text-[11px] text-white/75 hover:border-white/40 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              LANDING
            </a>
            <div>
              <div className="font-mono-num text-[10px] uppercase tracking-[0.16em] text-[#f05a28]">
                DESIGN DIRECTION PREVIEW
              </div>
              <div className="text-[13.5px] font-semibold">
                Pilih Konsep Visual Tumpu POS (Tanpa Serif Italic / AI Slop)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CONCEPTS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                className={`border px-3 py-2 text-left transition-colors ${
                  active === c.id
                    ? "border-white bg-white text-[#111214]"
                    : "border-white/15 bg-white/5 text-white/75 hover:border-white/40 hover:text-white"
                }`}
              >
                <div className="font-mono-num text-[10px] font-bold uppercase tracking-wider opacity-70">
                  OPSI {c.code}
                </div>
                <div className="text-[12.5px] font-semibold">{c.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Concept Notes */}
        <div className="border-t border-white/10 bg-[#181a1d] px-5 py-2 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-[12px]">
            <span className="text-white/75">{current.desc}</span>
            <span className="font-mono-num text-[11px] text-white/45">
              REF: {current.ref}
            </span>
          </div>
        </div>
      </div>

      {/* Live Preview Canvas */}
      <div>
        {/* OPSI 1: SWISS EDITORIAL × TACTILE HARDWARE */}
        {active === "hardware" && (
          <div className="min-h-[calc(100vh-110px)] bg-[#f2f0ea] text-[#111214]">
            <div className="mx-auto grid max-w-7xl border-x border-[#d5d2c9] lg:grid-cols-12">
              <div className="flex flex-col justify-between border-b border-[#d5d2c9] p-8 lg:col-span-7 lg:border-b-0 lg:border-r lg:p-14">
                <div>
                  <div className="font-mono-num text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e8491d]">
                    OPSI 01 / SWISS EDITORIAL × TACTILE HARDWARE
                  </div>
                  <h1 className="font-display mt-5 text-[2.8rem] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[4.2rem]">
                    Kasir, dapur, dan stok{" "}
                    <span className="text-[#e8491d]">dalam satu ritme.</span>
                  </h1>
                  <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-[#4a4c52]">
                    Tetap jualan saat Wi-Fi mati. Layar dapur tanpa bon kertas,
                    stok &amp; HPP terhitung otomatis, dan akses staf terkunci.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      href="/"
                      className="btn-hardware inline-flex items-center gap-2 border border-[#111214] bg-[#e8491d] px-6 py-3.5 text-[14px] font-semibold text-white"
                    >
                      Lihat Versi Penuh di /
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <span className="inline-flex items-center border border-[#111214] bg-[#faf9f6] px-5 py-3.5 text-[14px] font-semibold">
                      Minta Demo Outlet
                    </span>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-3 border-t border-[#d5d2c9] pt-6 font-mono-num">
                  <div>
                    <div className="text-[22px] font-bold">Rp0</div>
                    <div className="text-[11px] text-[#4a4c52]">KOMISI / ORDER</div>
                  </div>
                  <div>
                    <div className="text-[22px] font-bold">Rp49rb</div>
                    <div className="text-[11px] text-[#4a4c52]">FLAT / BULAN</div>
                  </div>
                  <div>
                    <div className="text-[22px] font-bold">58/80mm</div>
                    <div className="text-[11px] text-[#4a4c52]">THERMAL BT/USB</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5">
                <ThermalReceiptWidget />
              </div>
            </div>
          </div>
        )}

        {/* OPSI 2: SWISS MONOCHROME PRESS */}
        {active === "monochrome" && (
          <div className="min-h-[calc(100vh-110px)] bg-white text-[#0a0a0a]">
            <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#0a0a0a] pb-4 font-mono-num text-[11px] uppercase tracking-[0.14em]">
                <span>TUMPU SYSTEMS — ISSUE 2026</span>
                <span className="text-[#1d4ed8] font-semibold">
                  POS · KDS · INVENTORI · RBAC
                </span>
              </div>

              <div className="mt-10 grid items-end gap-10 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <h1 className="font-display text-[3rem] font-bold leading-[0.95] tracking-[-0.05em] sm:text-[5rem]">
                    Sistem kasir yang
                    <br />
                    tidak berhenti saat
                    <br />
                    <span className="text-[#1d4ed8]">internet padam.</span>
                  </h1>
                </div>
                <div className="space-y-5 lg:col-span-4">
                  <p className="text-[15.5px] leading-relaxed text-[#454545]">
                    Dirancang untuk cafe dan rumah makan dengan ritme cepat.
                    Tanpa potongan per transaksi, jalan langsung di browser HP,
                    tablet, atau laptop Anda.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 bg-[#0a0a0a] px-6 py-3.5 text-[14px] font-semibold text-white hover:bg-[#1d4ed8]"
                    >
                      Mulai Gratis
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="border border-[#0a0a0a] px-5 py-3.5 text-[14px] font-semibold hover:bg-[#f4f4f5]"
                    >
                      Jadwalkan Demo
                    </button>
                  </div>
                </div>
              </div>

              {/* Crisp Editorial 2-Column Showcase */}
              <div className="mt-14 grid border-t border-[#e4e4e7] pt-10 lg:grid-cols-12 lg:gap-10">
                <div className="space-y-6 lg:col-span-4">
                  {[
                    ["01", "Offline-First Cash", "Antrean lokal otomatis sinkron saat Wi-Fi pulih."],
                    ["02", "Zero Paper KDS", "Pesanan terbagi ke Bar & Dapur lengkap timer."],
                    ["03", "Auto HPP Ledger", "Stok terpotong gramasi sesuai resep tiap porsi."],
                  ].map(([num, title, desc]) => (
                    <div key={num} className="border-b border-[#e4e4e7] pb-5">
                      <div className="font-mono-num text-[11px] font-bold text-[#1d4ed8]">
                        {num}
                      </div>
                      <div className="font-display mt-1 text-[18px] font-bold">
                        {title}
                      </div>
                      <p className="mt-1 text-[13.5px] text-[#52525b]">{desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 border border-[#0a0a0a] bg-[#fafafa] p-3 lg:col-span-8 lg:mt-0">
                  <img
                    src="/screenshots/02-pos.png"
                    alt="Tumpu POS Monochrome Frame"
                    className="aspect-[16/10] w-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OPSI 3: WARM HOSPITALITY EDITORIAL */}
        {active === "hospitality" && (
          <div className="min-h-[calc(100vh-110px)] bg-[#f7f3ec] text-[#1c1917]">
            <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10">
              <div className="grid items-center gap-12 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#1b3a2d] px-3.5 py-1.5 text-[11.5px] font-semibold tracking-wide text-[#f7f3ec]">
                    <Wifi className="h-3.5 w-3.5 text-[#e9b872]" />
                    Dibuat khusus untuk Cafe &amp; Rumah Makan
                  </div>

                  <h1 className="font-display mt-6 text-[2.8rem] font-bold leading-[1.04] tracking-[-0.035em] text-[#1b3a2d] sm:text-[3.9rem]">
                    Fokus melayani tamu, biar Tumpu yang rapikan kasir &amp; dapur.
                  </h1>

                  <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-[#57534e]">
                    Dari meja tamu sampai laporan tutup shift. Tetap melayani
                    saat Wi-Fi padam, stok bahan terukur otomatis, dan tanpa
                    komisi per transaksi.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#c4552d] px-6 py-3.5 text-[14.5px] font-semibold text-white shadow-sm hover:bg-[#ad4823]"
                    >
                      Coba Gratis untuk 1 Outlet
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-[#1b3a2d]/25 bg-white px-5 py-3.5 text-[14.5px] font-semibold text-[#1b3a2d] hover:border-[#1b3a2d]"
                    >
                      Diskusi dengan Tim
                    </button>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-[13.5px] font-medium text-[#44403c]">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-[#1b3a2d]" />
                      Rp0 komisi transaksi
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Printer className="h-4 w-4 text-[#1b3a2d]" />
                      Printer Bluetooth 58/80mm
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-[#1b3a2d]" />
                      Pro cuma Rp49rb/bln
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="overflow-hidden rounded-3xl border border-[#1b3a2d]/15 bg-[#1b3a2d] p-4 shadow-xl">
                    <div className="overflow-hidden rounded-2xl bg-white">
                      <img
                        src="/screenshots/02-pos.png"
                        alt="Tumpu Hospitality Preview"
                        className="aspect-[16/10] w-full object-cover object-top"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between px-2 text-[#f7f3ec]">
                      <div>
                        <div className="text-[13.5px] font-semibold">
                          Layar Kasir &amp; Kitchen Display
                        </div>
                        <div className="text-[12px] text-[#f7f3ec]/65">
                          Jalan di iPad, Android tablet, HP, maupun laptop kasir
                        </div>
                      </div>
                      <span className="rounded-lg bg-[#f7f3ec]/15 px-3 py-1 font-mono-num text-[11.5px] font-semibold">
                        Rp49.000/bln
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
