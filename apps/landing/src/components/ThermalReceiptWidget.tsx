"use client";

import { useState } from "react";
import { Check, Minus, Plus, Printer, Wifi, WifiOff } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  hpp: number;
  station: "BAR" | "PASTRY";
}

const MENU_ITEMS: MenuItem[] = [
  { id: "kopi", name: "Es Kopi Susu Aren", price: 24000, hpp: 7450, station: "BAR" },
  { id: "croissant", name: "Butter Croissant", price: 28000, hpp: 9800, station: "PASTRY" },
  { id: "matcha", name: "Iced Matcha Oat", price: 32000, hpp: 11200, station: "BAR" },
];

export default function ThermalReceiptWidget() {
  const [qty, setQty] = useState<Record<string, number>>({
    kopi: 2,
    croissant: 1,
    matcha: 0,
  });
  const [offline, setOffline] = useState(false);
  const [payment, setPayment] = useState<"TUNAI" | "QRIS">("TUNAI");
  const [printedOrder, setPrintedOrder] = useState<number | null>(null);
  const [orderSeq, setOrderSeq] = useState(108);

  const adjust = (id: string, delta: number) => {
    setPrintedOrder(null);
    setQty((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(9, (prev[id] || 0) + delta)),
    }));
  };

  const lines = MENU_ITEMS.filter((m) => (qty[m.id] || 0) > 0).map((m) => ({
    ...m,
    count: qty[m.id] || 0,
    subtotal: (qty[m.id] || 0) * m.price,
    totalHpp: (qty[m.id] || 0) * m.hpp,
  }));

  const subtotal = lines.reduce((acc, l) => acc + l.subtotal, 0);
  const pb1 = Math.round(subtotal * 0.1);
  const grandTotal = subtotal + pb1;
  const totalHpp = lines.reduce((acc, l) => acc + l.totalHpp, 0);
  const estMargin = subtotal > 0 ? Math.round(((subtotal - totalHpp) / subtotal) * 100) : 0;

  const handlePrint = () => {
    if (lines.length === 0) return;
    setPrintedOrder(orderSeq);
    setOrderSeq((n) => n + 1);
  };

  return (
    <div className="hardware-recess flex h-full flex-col justify-between p-5 sm:p-7">
      {/* Top Hardware Console Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              offline ? "bg-[var(--accent)]" : "bg-[var(--signal)]"
            }`}
          />
          <span className="font-mono-num text-[11px] font-semibold uppercase tracking-wider text-[var(--ink)]">
            SIMULATOR KASIR · MEJA 04
          </span>
        </div>

        <button
          type="button"
          onClick={() => setOffline((v) => !v)}
          className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono-num text-[10.5px] font-semibold uppercase tracking-wider transition-colors ${
            offline
              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
              : "border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--ink)]"
          }`}
        >
          {offline ? (
            <>
              <WifiOff className="h-3 w-3" />
              WI-FI: MATI
            </>
          ) : (
            <>
              <Wifi className="h-3 w-3 text-[var(--signal)]" />
              WI-FI: ONLINE
            </>
          )}
        </button>
      </div>

      {/* Quick Tap Menu Pad */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MENU_ITEMS.map((item) => {
          const count = qty[item.id] || 0;
          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between border bg-[var(--surface)] p-2.5 transition-colors ${
                count > 0 ? "border-[var(--ink)]" : "border-[var(--border)]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono-num text-[9.5px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                    {item.station}
                  </span>
                  <span className="font-mono-num text-[10.5px] font-semibold text-[var(--ink)]">
                    {(item.price / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="mt-1 text-[12px] font-semibold leading-snug text-[var(--ink)]">
                  {item.name}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border)] pt-2">
                <button
                  type="button"
                  onClick={() => adjust(item.id, -1)}
                  aria-label={`Kurangi ${item.name}`}
                  className="grid h-6 w-6 place-items-center border border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--ink)]"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-mono-num text-[12px] font-bold">
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => adjust(item.id, 1)}
                  aria-label={`Tambah ${item.name}`}
                  className="grid h-6 w-6 place-items-center border border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)] hover:opacity-85"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tactile Thermal Receipt Paper */}
      <div className="mt-5">
        {/* Printer Slot */}
        <div className="mx-auto h-2.5 w-[92%] border-x border-t border-[#2c2e33] bg-[#181a1d]" />

        <div className="receipt-serrated mx-auto w-[88%] border-x border-t border-[#d8d5cd] bg-white px-5 pb-5 pt-4 text-[#111214] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between border-b border-dashed border-[#c4c1b8] pb-2.5 font-mono-num text-[10.5px]">
            <div className="flex items-center gap-2">
              <img
                src="/branding/kassa-monochrome-thermal.svg"
                alt="Kassa Thermal Mark"
                className="h-8 w-8 shrink-0 object-contain"
              />
              <div>
                <div className="font-bold tracking-wider">KASSA · KOPI SENJA</div>
                <div className="text-[#666970]">ORDER #{orderSeq} · 58MM</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {offline ? "QUEUE LOKAL" : "SYNC LIVE"}
              </div>
              <div className="text-[#666970]">{payment}</div>
            </div>
          </div>

          <div className="my-3 min-h-[76px] space-y-1.5 font-mono-num text-[11.5px]">
            {lines.length === 0 ? (
              <div className="py-5 text-center text-[#767880]">
                Pilih menu di atas untuk simulasi struk
              </div>
            ) : (
              lines.map((line) => (
                <div key={line.id} className="flex items-baseline justify-between gap-2">
                  <span className="truncate">
                    {line.count}× {line.name}
                  </span>
                  <span className="shrink-0 font-semibold">
                    {line.subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="space-y-1 border-t border-dashed border-[#c4c1b8] pt-2.5 font-mono-num text-[11px]">
            <div className="flex justify-between text-[#555860]">
              <span>SUBTOTAL</span>
              <span>Rp{subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-[#555860]">
              <span>PB1 (10%)</span>
              <span>Rp{pb1.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between pt-1 text-[13px] font-bold text-[#111214]">
              <span>TOTAL</span>
              <span>Rp{grandTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#e5e3dc] pt-2 font-mono-num text-[10px] text-[#555860]">
            <span>HPP AUTO: Rp{totalHpp.toLocaleString("id-ID")}</span>
            <span className="font-semibold text-[#15803d]">
              MARGIN {estMargin}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex border border-[var(--border)] bg-[var(--surface)]">
          {(["TUNAI", "QRIS"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPayment(m)}
              className={`px-3 py-2 font-mono-num text-[11px] font-semibold transition-colors ${
                payment === m
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handlePrint}
          disabled={lines.length === 0}
          className="btn-hardware inline-flex flex-1 items-center justify-center gap-2 border border-[#111214] bg-[var(--accent)] px-4 py-2 font-mono-num text-[11.5px] font-semibold uppercase tracking-wider text-white hover:bg-[var(--accent-hover)] disabled:opacity-40"
        >
          {printedOrder ? (
            <>
              <Check className="h-3.5 w-3.5" />
              TERCETAK #{printedOrder} → KDS
            </>
          ) : (
            <>
              <Printer className="h-3.5 w-3.5" />
              CETAK STRUK &amp; KIRIM KDS
            </>
          )}
        </button>
      </div>
    </div>
  );
}
