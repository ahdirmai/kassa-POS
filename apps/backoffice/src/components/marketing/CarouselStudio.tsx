"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Grid, Layers, Printer } from "lucide-react";
import { PHOTOS } from "@/data/marketing-data";

type DeckKey = "d2" | "d4" | "d5" | "d7";

interface SlideItem {
  id: string;
  render: () => React.ReactNode;
}

interface DeckDef {
  title: string;
  sub: string;
  meta: string;
  slides: SlideItem[];
}

function SlideShell({
  theme,
  eyebrow,
  rightTag,
  page,
  bgPhoto,
  children,
}: {
  theme: "light" | "dark";
  eyebrow: string;
  rightTag: string;
  page: string;
  bgPhoto?: string;
  children: React.ReactNode;
}) {
  const isDark = theme === "dark";
  return (
    <div
      className={`relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden p-[8.5%] ${
        isDark ? "bg-[#0b1013] text-[#f4f2ec]" : "bg-[#f6f4ef] text-[#121517]"
      }`}
      style={
        isDark
          ? {
              backgroundImage:
                "radial-gradient(ellipse 75% 55% at 15% 0%, rgba(15, 82, 87, 0.42), transparent 65%), radial-gradient(ellipse 65% 50% at 90% 15%, rgba(201, 150, 76, 0.22), transparent 60%)",
            }
          : undefined
      }
    >
      {bgPhoto && isDark && (
        <>
          <img
            src={bgPhoto}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 saturate-75"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b1013]/70 via-[#0b1013]/85 to-[#0b1013]/95" />
        </>
      )}

      <div className="relative z-10 flex items-center justify-between font-mono-num text-[10px] uppercase tracking-[0.12em]">
        <span className={isDark ? "font-semibold text-[#e5ba78]" : "font-semibold text-[#0f5257]"}>
          {eyebrow}
        </span>
        <span className="opacity-65">{rightTag}</span>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center gap-3 py-3">
        {children}
      </div>

      <div
        className={`relative z-10 flex items-center justify-between border-t pt-2.5 font-mono-num text-[10px] ${
          isDark
            ? "border-white/15 text-white/55"
            : "border-[#121517]/10 text-[#787e86]"
        }`}
      >
        <span className="flex items-center gap-1.5 font-semibold">
          <span
            className={`grid h-[18px] w-[18px] place-items-center rounded text-[10px] font-extrabold ${
              isDark ? "bg-[#f4f2ec] text-[#0b1013]" : "bg-[#121517] text-[#f6f4ef]"
            }`}
          >
            K
          </span>
          kassa.biz.id
        </span>
        <span>{page}</span>
      </div>
    </div>
  );
}

const DECKS: Record<DeckKey, DeckDef> = {
  d2: {
    title: "Hari 2 (Selasa) — Omzet 3 Juta Sehari Tapi Kas Tipis?",
    sub: "Carousel Edukasi HPP & Stok · Light Editorial (#F6F4EF) + Foto Kopi + Dark CTA",
    meta: "6 Slide · 1080×1350 (4:5)",
    slides: [
      {
        id: "d2-1",
        render: () => (
          <SlideShell theme="light" eyebrow="Edukasi Bisnis F&B" rightTag="SWIPE →" page="01 / 06">
            <h3 className="text-[26px] font-bold leading-[1.08] tracking-tight">
              Omzet 3 juta sehari, tapi akhir bulan{" "}
              <span className="font-editorial text-[30px] font-normal italic text-[#0f5257]">
                uangnya tipis?
              </span>
            </h3>
            <img src={PHOTOS.icedCoffee} alt="Es Kopi Susu" className="h-[112px] w-full rounded-xl border border-[#e2dfd7] object-cover" />
            <div className="flex items-center justify-between rounded-xl border border-[#e2dfd7] bg-white px-3.5 py-2.5">
              <div>
                <div className="font-mono-num text-[9.5px] text-[#787e86]">MARGIN DI KERTAS</div>
                <div className="font-mono-num text-lg font-bold text-emerald-600">73%</div>
              </div>
              <div className="text-right">
                <div className="font-mono-num text-[9.5px] text-[#787e86]">SELISIH STOK NYATA</div>
                <div className="font-mono-num text-lg font-bold text-red-600">-12%</div>
              </div>
            </div>
          </SlideShell>
        ),
      },
      {
        id: "d2-2",
        render: () => (
          <SlideShell theme="light" eyebrow="Kebocoran Pertama" rightTag="HPP" page="02 / 06">
            <div className="flex items-center justify-between">
              <span className="font-editorial text-5xl italic leading-none text-[#0f5257]">01</span>
              <img src={PHOTOS.espresso} alt="Espresso" className="h-[68px] w-[112px] rounded-xl border border-[#e2dfd7] object-cover" />
            </div>
            <h3 className="text-[22px] font-bold leading-tight tracking-tight">
              Beli kiloan, tapi takaran dikira-kira.
            </h3>
            <p className="text-[12.5px] leading-relaxed text-[#4c5259]">
              Beli biji kopi 1 kg dan susu 1 liter, tapi pas jualan tidak pernah tahu modal pasti per 1 cup.
            </p>
            <div className="flex items-center justify-between rounded-xl border border-[#e2dfd7] bg-white px-3.5 py-2.5 font-mono-num text-xs">
              <span>1 kg Espresso</span>
              <span className="text-[#0f5257]">──▶</span>
              <span>??? cup terjual</span>
            </div>
          </SlideShell>
        ),
      },
      {
        id: "d2-3",
        render: () => (
          <SlideShell theme="light" eyebrow="Contoh Hitungan Nyata" rightTag="ES KOPI SUSU" page="03 / 06">
            <h3 className="text-[21px] font-bold leading-tight tracking-tight">
              Es Kopi Susu Aren{" "}
              <span className="font-editorial text-[24px] font-normal italic text-[#0f5257]">
                (Jual Rp28.000)
              </span>
            </h3>
            <div className="rounded-xl border border-[#e2dfd7] bg-white p-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <img src={PHOTOS.icedCoffee} alt="" className="h-9 w-9 rounded-lg border border-[#e2dfd7] object-cover" />
                  <strong className="text-[12.5px]">Komposisi 1 Cup</strong>
                </div>
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono-num text-[10px] font-semibold text-emerald-700">
                  Margin 73%
                </span>
              </div>
              <div className="divide-y divide-[#e2dfd7] font-mono-num text-[11.5px]">
                <div className="flex justify-between py-1.5"><span>Espresso · 18 gr</span><span>Rp3.600</span></div>
                <div className="flex justify-between py-1.5"><span>Fresh Milk · 150 ml</span><span>Rp2.700</span></div>
                <div className="flex justify-between py-1.5"><span>Gula Aren · 25 ml</span><span>Rp1.150</span></div>
                <div className="flex justify-between pt-2 font-bold"><span>Total HPP / porsi</span><span>Rp7.450</span></div>
              </div>
            </div>
          </SlideShell>
        ),
      },
      {
        id: "d2-4",
        render: () => (
          <SlideShell theme="light" eyebrow="Kebocoran Kedua" rightTag="STOK" page="04 / 06">
            <span className="font-editorial text-5xl italic leading-none text-[#0f5257]">02</span>
            <h3 className="text-[22px] font-bold leading-tight tracking-tight">
              Stok tidak terpotong otomatis.
            </h3>
            <p className="text-[12.5px] leading-relaxed text-[#4c5259]">
              Kalau stock opname cuma seminggu sekali di Excel, bahan tumpah atau dipakai berlebih tidak akan ketahuan.
            </p>
            <div className="rounded-xl border border-[#e2dfd7] bg-white p-3 text-[12px] text-[#4c5259]">
              <strong className="text-[#121517]">Dampaknya:</strong> Omzet harian terlihat ramai, tapi uang belanja bahan terus membengkak.
            </div>
          </SlideShell>
        ),
      },
      {
        id: "d2-5",
        render: () => (
          <SlideShell theme="light" eyebrow="Solusi di Kassa" rightTag="AUTO HPP" page="05 / 06">
            <h3 className="text-[21px] font-bold leading-tight tracking-tight">
              Order lunas, stok{" "}
              <span className="font-editorial text-[24px] font-normal italic text-[#0f5257]">
                terpotong otomatis.
              </span>
            </h3>
            <p className="text-[12px] text-[#4c5259]">
              Input beli kg/botol, resep pakai gram/ml. Margin bersih langsung terbaca.
            </p>
            <img src="/screenshots/07-stock.png" alt="Stok Kassa" className="max-h-[175px] w-full rounded-xl border border-[#e2dfd7] object-cover object-top shadow-md" />
          </SlideShell>
        ),
      },
      {
        id: "d2-6",
        render: () => (
          <SlideShell theme="dark" eyebrow="Mulai Minggu Ini" rightTag="KASSA PRO" page="06 / 06" bgPhoto={PHOTOS.cappuccino}>
            <h3 className="text-[26px] font-bold leading-[1.08] tracking-tight text-white">
              Rapikan stok &amp; HPP{" "}
              <span className="font-editorial text-[30px] font-normal italic text-[#e5ba78]">
                tanpa ribet Excel.
              </span>
            </h3>
            <p className="text-[12.5px] text-white/75">
              Sudah termasuk kasir offline, layar dapur, multi-outlet, dan potong stok resep otomatis.
            </p>
            <div className="inline-flex w-fit items-center rounded-lg bg-[#d9a962] px-4 py-2.5 text-[12.5px] font-bold text-[#0b1013]">
              Pro Rp49.000/bln · Trial Gratis 14 Hari
            </div>
            <div className="font-mono-num text-[10.5px] text-white/60">Komen &quot;HPP&quot; atau klik kassa.biz.id di bio</div>
          </SlideShell>
        ),
      },
    ],
  },

  d4: {
    title: "Hari 4 (Kamis) — 3 Celah Kebocoran Kasir & Kontrol Staf",
    sub: "Carousel Anti-Bocor · Light Editorial (#F6F4EF) + Foto Bar + Dark CTA",
    meta: "5 Slide · 1080×1350 (4:5)",
    slides: [
      {
        id: "d4-1",
        render: () => (
          <SlideShell theme="light" eyebrow="Kontrol Outlet" rightTag="SWIPE →" page="01 / 05">
            <h3 className="text-[25px] font-bold leading-[1.08] tracking-tight">
              3 celah kebocoran kasir{" "}
              <span className="font-editorial text-[29px] font-normal italic text-[#0f5257]">
                yang sering luput.
              </span>
            </h3>
            <img src={PHOTOS.cappuccino} alt="Barista" className="h-[100px] w-full rounded-xl border border-[#e2dfd7] object-cover" />
            <div className="grid gap-1 rounded-xl border border-[#e2dfd7] bg-white p-3 text-[11.5px] font-semibold">
              <div>🔒 Void tanpa izin Manager</div>
              <div>🔒 1 akun dipakai ramai-ramai</div>
              <div>🔒 Kasir bisa intip omzet &amp; stok</div>
            </div>
          </SlideShell>
        ),
      },
      {
        id: "d4-2",
        render: () => (
          <SlideShell theme="light" eyebrow="Celah Pertama" rightTag="ANTI-VOID" page="02 / 05">
            <span className="w-fit rounded bg-red-500/15 px-2 py-0.5 font-mono-num text-[10px] font-semibold text-red-700">CELAH 01</span>
            <h3 className="text-[22px] font-bold leading-tight tracking-tight">Void / hapus pesanan tanpa izin owner.</h3>
            <div className="rounded-xl border border-[#0f5257] bg-white p-3.5 text-[12px]">
              <div className="mb-1 font-mono-num text-[10px] font-bold text-[#0f5257]">SOLUSI DI KASSA</div>
              Setiap pembatalan order wajib <strong>PIN Manager/Owner</strong> dan tercatat permanen di log aktivitas.
            </div>
          </SlideShell>
        ),
      },
      {
        id: "d4-3",
        render: () => (
          <SlideShell theme="light" eyebrow="Celah Kedua" rightTag="SHIFT PIN" page="03 / 05">
            <span className="w-fit rounded bg-red-500/15 px-2 py-0.5 font-mono-num text-[10px] font-semibold text-red-700">CELAH 02</span>
            <h3 className="text-[22px] font-bold leading-tight tracking-tight">Semua staf pakai 1 akun yang sama.</h3>
            <div className="rounded-xl border border-[#0f5257] bg-white p-3.5 text-[12px]">
              <div className="mb-1 font-mono-num text-[10px] font-bold text-[#0f5257]">SOLUSI DI KASSA</div>
              Tiap kasir punya <strong>PIN 4–6 digit</strong> sendiri. Z-Report Shift Pagi &amp; Shift Sore terpisah jelas.
            </div>
          </SlideShell>
        ),
      },
      {
        id: "d4-4",
        render: () => (
          <SlideShell theme="light" eyebrow="Celah Ketiga" rightTag="AKSES PERAN" page="04 / 05">
            <span className="w-fit rounded bg-red-500/15 px-2 py-0.5 font-mono-num text-[10px] font-semibold text-red-700">CELAH 03</span>
            <h3 className="text-[20px] font-bold leading-tight tracking-tight">Kasir bisa intip omzet &amp; ubah stok.</h3>
            <div className="divide-y divide-[#e2dfd7] rounded-xl border border-[#e2dfd7] bg-white px-3 py-1.5 text-[11.5px]">
              <div className="flex items-center justify-between py-1.5"><strong>Kasir POS</strong><span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono-num text-[10px] font-semibold text-emerald-700">Terbuka</span></div>
              <div className="flex items-center justify-between py-1.5"><span>Layar Dapur &amp; Omzet</span><span className="rounded bg-red-500/15 px-2 py-0.5 font-mono-num text-[10px] font-semibold text-red-700">Terkunci</span></div>
            </div>
            <img src="/screenshots/08-rbac.png" alt="RBAC" className="max-h-[112px] w-full rounded-xl border border-[#e2dfd7] object-cover object-top" />
          </SlideShell>
        ),
      },
      {
        id: "d4-5",
        render: () => (
          <SlideShell theme="dark" eyebrow="Tenang Tinggalkan Outlet" rightTag="KASSA" page="05 / 05" bgPhoto={PHOTOS.americano}>
            <h3 className="text-[26px] font-bold leading-[1.08] tracking-tight text-white">
              Sistem rapi bikin staf nyaman,{" "}
              <span className="font-editorial text-[30px] font-normal italic text-[#e5ba78]">
                owner tenang.
              </span>
            </h3>
            <p className="text-[12.5px] text-white/75">Atur akses Owner, Manager, Kasir, dan Dapur dalam 1 menit.</p>
            <div className="inline-flex w-fit items-center rounded-lg bg-[#d9a962] px-4 py-2.5 text-[12.5px] font-bold text-[#0b1013]">
              Coba Gratis di kassa.biz.id
            </div>
          </SlideShell>
        ),
      },
    ],
  },

  d5: {
    title: "Hari 5 (Jumat) — Offer Anchor: All-In Cuma Rp49.000/Bulan",
    sub: "Full Dark Luxury (#0B1013) + Foto Kopi Atmosferik + Warm Brass (#D9A962)",
    meta: "3 Slide · 1080×1350 (4:5)",
    slides: [
      {
        id: "d5-1",
        render: () => (
          <SlideShell theme="dark" eyebrow="Tanpa Komisi Transaksi" rightTag="SWIPE →" page="01 / 03" bgPhoto={PHOTOS.icedCoffee}>
            <div className="font-mono-num text-[50px] font-bold leading-none tracking-tight text-white">Rp49rb</div>
            <div className="font-mono-num text-[11px] text-white/65">/ OUTLET / BULAN · ~Rp1.600 / HARI</div>
            <h3 className="mt-1 text-[22px] font-bold leading-tight text-white">
              Aplikasi kasir all-in,{" "}
              <span className="font-editorial text-[26px] font-normal italic text-[#e5ba78]">
                seharga 2 gelas kopi.
              </span>
            </h3>
            <p className="text-[12.5px] text-white/70">Tanpa biaya tambahan untuk layar dapur, stok HPP, maupun multi-outlet.</p>
          </SlideShell>
        ),
      },
      {
        id: "d5-2",
        render: () => (
          <SlideShell theme="dark" eyebrow="Semua Sudah Termasuk" rightTag="ALL-IN" page="02 / 03">
            <h3 className="text-[22px] font-bold leading-tight text-white">
              Tanpa biaya add-on{" "}
              <span className="font-editorial text-[26px] font-normal italic text-[#e5ba78]">tersembunyi.</span>
            </h3>
            <ul className="grid gap-1.5 text-[11.5px]">
              {[
                "Kasir POS + Mode Offline Tunai",
                "Layar Dapur (KDS) Realtime",
                "Stok Bahan Baku, Resep & HPP Otomatis",
                "Multi-Outlet & Kontrol Akses Staf",
                "Struk Thermal 58/80mm (USB & Bluetooth)",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2">
                  <span className="font-bold text-[#e5ba78]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SlideShell>
        ),
      },
      {
        id: "d5-3",
        render: () => (
          <SlideShell theme="dark" eyebrow="Pilih Sesuai Skala" rightTag="HARGA" page="03 / 03" bgPhoto={PHOTOS.espresso}>
            <h3 className="text-[22px] font-bold leading-tight text-white">
              Mulai gratis,{" "}
              <span className="font-editorial text-[26px] font-normal italic text-[#e5ba78]">upgrade kapan saja.</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-white/15 bg-white/[0.05] p-3">
                <div className="font-mono-num text-[10px] text-white/55">STARTER</div>
                <div className="my-1 font-mono-num text-xl font-bold">Rp0</div>
                <div className="text-[10.5px] leading-snug text-white/70">1 Outlet · Total 3 Akun · Khusus Kasir POS</div>
              </div>
              <div className="rounded-xl border border-[#d9a962] bg-white/[0.06] p-3">
                <div className="font-mono-num text-[10px] text-[#e5ba78]">PRO</div>
                <div className="my-1 font-mono-num text-xl font-bold text-[#e5ba78]">Rp49rb</div>
                <div className="text-[10.5px] leading-snug text-white/85">Multi-Outlet · All-in KDS, Stok &amp; HPP</div>
              </div>
            </div>
            <div className="inline-flex w-fit items-center rounded-lg bg-[#d9a962] px-4 py-2.5 text-[12.5px] font-bold text-[#0b1013]">
              Coba Gratis di kassa.biz.id
            </div>
          </SlideShell>
        ),
      },
    ],
  },

  d7: {
    title: "Hari 7 (Minggu) — Rapikan Outlet Mulai Senin Besok",
    sub: "Carousel Recap 4 Langkah · Foto F&B Strip + Screenshot Produk + Dark CTA",
    meta: "5 Slide · 1080×1350 (4:5)",
    slides: [
      {
        id: "d7-1",
        render: () => (
          <SlideShell theme="light" eyebrow="4 Langkah Operasional" rightTag="SWIPE →" page="01 / 05">
            <h3 className="text-[25px] font-bold leading-[1.08] tracking-tight">
              Rapikan outlet kamu{" "}
              <span className="font-editorial text-[29px] font-normal italic text-[#0f5257]">mulai Senin besok.</span>
            </h3>
            <p className="text-[12.5px] text-[#4c5259]">Satu alur kerja dari meja tamu sampai laporan tutup shift.</p>
            <div className="grid grid-cols-3 gap-1.5">
              <img src={PHOTOS.icedCoffee} alt="Kopi" className="h-[72px] w-full rounded-lg border border-[#e2dfd7] object-cover" />
              <img src={PHOTOS.nasiGoreng} alt="Makanan" className="h-[72px] w-full rounded-lg border border-[#e2dfd7] object-cover" />
              <img src={PHOTOS.riceBowl} alt="Rice Bowl" className="h-[72px] w-full rounded-lg border border-[#e2dfd7] object-cover" />
            </div>
            <div className="flex justify-between rounded-xl border border-[#e2dfd7] bg-white px-3 py-2 font-mono-num text-[10.5px] font-semibold text-[#0f5257]">
              <span>01 Kasir</span><span>→</span><span>02 Dapur</span><span>→</span><span>03 Stok</span><span>→</span><span>04 Shift</span>
            </div>
          </SlideShell>
        ),
      },
      {
        id: "d7-2",
        render: () => (
          <SlideShell theme="light" eyebrow="Langkah 01 & 02" rightTag="DEPAN → DAPUR" page="02 / 05">
            <div className="rounded-xl border border-[#e2dfd7] bg-white p-2.5">
              <div className="mb-1.5 font-mono-num text-[9.5px] font-bold text-[#0f5257]">01 · KASIR POS (OFFLINE-READY)</div>
              <img src="/screenshots/02-pos.png" alt="POS" className="max-h-[108px] w-full rounded-lg border border-[#e2dfd7] object-cover object-top" />
            </div>
            <div className="rounded-xl border border-[#e2dfd7] bg-white p-2.5">
              <div className="mb-1.5 font-mono-num text-[9.5px] font-bold text-[#0f5257]">02 · LAYAR DAPUR (KDS KANBAN)</div>
              <img src="/screenshots/03-kds.png" alt="KDS" className="max-h-[108px] w-full rounded-lg border border-[#e2dfd7] object-cover object-top" />
            </div>
          </SlideShell>
        ),
      },
      {
        id: "d7-3",
        render: () => (
          <SlideShell theme="light" eyebrow="Langkah 03 & 04" rightTag="STOK → LAPORAN" page="03 / 05">
            <div className="rounded-xl border border-[#e2dfd7] bg-white p-2.5">
              <div className="mb-1.5 font-mono-num text-[9.5px] font-bold text-[#0f5257]">03 · STOK &amp; HPP TERPOTONG OTOMATIS</div>
              <img src="/screenshots/07-stock.png" alt="Stok" className="max-h-[108px] w-full rounded-lg border border-[#e2dfd7] object-cover object-top" />
            </div>
            <div className="rounded-xl border border-[#e2dfd7] bg-white p-2.5">
              <div className="mb-1.5 font-mono-num text-[9.5px] font-bold text-[#0f5257]">04 · DASHBOARD OWNER &amp; Z-REPORT</div>
              <img src="/screenshots/04-dashboard.png" alt="Dashboard" className="max-h-[108px] w-full rounded-lg border border-[#e2dfd7] object-cover object-top" />
            </div>
          </SlideShell>
        ),
      },
      {
        id: "d7-4",
        render: () => (
          <SlideShell theme="light" eyebrow="Setup Cepat" rightTag="5 MENIT" page="04 / 05">
            <h3 className="text-[21px] font-bold leading-tight tracking-tight">
              Cuma butuh 5 menit{" "}
              <span className="font-editorial text-[24px] font-normal italic text-[#0f5257]">buat mulai:</span>
            </h3>
            <div className="grid grid-cols-12 items-center gap-2.5">
              <div className="col-span-7 grid gap-2 rounded-xl border border-[#e2dfd7] bg-white p-3 text-[11px]">
                <div><strong className="font-mono-num text-[#0f5257]">01</strong> Buka <strong>kassa.biz.id</strong> dari HP/tablet</div>
                <div><strong className="font-mono-num text-[#0f5257]">02</strong> Input 5 menu terlaris dulu</div>
                <div><strong className="font-mono-num text-[#0f5257]">03</strong> Sambung printer Bluetooth</div>
              </div>
              <img src="/screenshots/10-pos-mobile.png" alt="Mobile POS" className="col-span-5 h-[170px] w-full rounded-xl border border-[#e2dfd7] object-cover object-top" />
            </div>
          </SlideShell>
        ),
      },
      {
        id: "d7-5",
        render: () => (
          <SlideShell theme="dark" eyebrow="Siap Untuk Senin?" rightTag="KASSA" page="05 / 05" bgPhoto={PHOTOS.riceBowl}>
            <h3 className="text-[26px] font-bold leading-[1.08] tracking-tight text-white">
              Mulai gratis hari ini.{" "}
              <span className="font-editorial text-[30px] font-normal italic text-[#e5ba78]">Tanpa kartu kredit.</span>
            </h3>
            <p className="text-[12.5px] text-white/75">Starter Rp0 (1 Outlet, 3 Akun) atau Pro Rp49.000/bulan (Multi-Outlet &amp; All-In).</p>
            <div className="inline-flex w-fit items-center rounded-lg bg-[#d9a962] px-4 py-2.5 text-[12.5px] font-bold text-[#0b1013]">
              Buka kassa.biz.id
            </div>
          </SlideShell>
        ),
      },
    ],
  },
};

export default function CarouselStudio() {
  const [deckKey, setDeckKey] = useState<DeckKey>("d2");
  const [mode, setMode] = useState<"swipe" | "grid">("swipe");
  const [idx, setIdx] = useState(0);

  const deck = DECKS[deckKey];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== "swipe") return;
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, deck.slides.length - 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, deck.slides.length]);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["d2", "Hari 2 · HPP Kopi (6)"],
              ["d4", "Hari 4 · Anti-Bocor (5)"],
              ["d5", "Hari 5 · Harga Rp49rb (3)"],
              ["d7", "Hari 7 · Alur 4 Langkah (5)"],
            ] as [DeckKey, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => {
                setDeckKey(k);
                setIdx(0);
              }}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                deckKey === k
                  ? "bg-[#121517] text-white"
                  : "border border-[#ccc8bd] bg-white text-[#4c5259] hover:border-[#121517]"
              }`}
            >
              {label}
            </button>
          ))}
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

      <div className="no-print flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{deck.title}</h2>
          <p className="text-xs text-[#4c5259]">{deck.sub}</p>
        </div>
        <span className="font-mono-num text-xs text-[#787e86]">{deck.meta}</span>
      </div>

      {mode === "swipe" ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-[#d5d2c9] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e2dfd7] px-4 py-2.5 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0b1013] text-[10px] font-bold text-[#f4f2ec]">
                  K
                </span>
                <span>kassa.biz.id</span>
              </div>
              <span className="font-mono-num text-[11px] text-[#787e86]">
                {idx + 1} / {deck.slides.length}
              </span>
            </div>

            <div>{deck.slides[idx]?.render()}</div>

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
                {deck.slides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setIdx(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      i === idx ? "w-5 bg-[#0f5257]" : "w-2 bg-[#d2cfc6]"
                    }`}
                  />
                ))}
              </div>
              <button
                disabled={idx === deck.slides.length - 1}
                onClick={() => setIdx((i) => Math.min(deck.slides.length - 1, i + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-[#e2dfd7] bg-[#f6f4ef] px-3 py-1.5 text-xs font-semibold disabled:opacity-35"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="font-mono-num text-[11px] text-[#787e86]">
            Gunakan panah keyboard ← / → untuk berpindah slide
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {deck.slides.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-2xl border border-black/10 shadow-lg">
              {s.render()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
