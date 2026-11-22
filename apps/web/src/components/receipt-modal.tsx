"use client";

import { Printer, X } from "lucide-react";
import { formatIDR } from "@pos/shared";

export interface ReceiptData {
  receiptNo: string;
  orderNo: string;
  createdAt: string;
  orderType: string;
  tableName?: string | null;
  customerName?: string | null;
  cashierName?: string | null;
  items: Array<{
    productName: string;
    variantName?: string | null;
    quantity: number;
    lineTotal: number;
    modifiers?: Array<{ modifierName: string; price: number }>;
  }>;
  subtotal: number;
  discountAmount: number;
  serviceChargeAmount: number;
  taxAmount: number;
  roundingAmount: number;
  grandTotal: number;
  paidAmount?: number;
  changeAmt?: number;
  paymentMethod?: string;
}

export function ReceiptModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptData | null;
  onClose: () => void;
}) {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Struk Pembayaran</h3>
            <p className="text-xs text-[var(--muted)]">Siap cetak thermal 58mm / 80mm</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="pr-slot" />
        <div className="pr-paper printable-receipt max-h-[60vh] overflow-y-auto">
          <div className="text-center font-bold tracking-widest text-sm">KOPI &amp; DAPUR SENJA</div>
          <div className="text-center text-[11px] text-[var(--muted)]">Jl. Kemang Raya No. 48, Jakarta Selatan</div>
          <hr />
          <div className="flex justify-between">
            <span>Struk</span>
            <b>{receipt.receiptNo}</b>
          </div>
          <div className="flex justify-between">
            <span>Order</span>
            <span>{receipt.orderNo} ({receipt.orderType})</span>
          </div>
          {receipt.tableName && (
            <div className="flex justify-between">
              <span>Meja</span>
              <span>{receipt.tableName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Waktu</span>
            <span>{new Date(receipt.createdAt).toLocaleString("id-ID")}</span>
          </div>
          <hr />
          <div className="space-y-1.5">
            {receipt.items.map((it, idx) => (
              <div key={idx} className="flex justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    {it.quantity}× {it.productName} {it.variantName ? `(${it.variantName})` : ""}
                  </div>
                  {it.modifiers?.length ? (
                    <div className="text-[10px] text-[var(--muted)]">
                      + {it.modifiers.map((m) => m.modifierName).join(", ")}
                    </div>
                  ) : null}
                </div>
                <b className="whitespace-nowrap">{formatIDR(it.lineTotal)}</b>
              </div>
            ))}
          </div>
          <hr />
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatIDR(receipt.subtotal)}</span>
            </div>
            {receipt.discountAmount > 0 && (
              <div className="flex justify-between text-[var(--good)]">
                <span>Diskon</span>
                <span>-{formatIDR(receipt.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Service Charge (5%)</span>
              <span>{formatIDR(receipt.serviceChargeAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>PB1 (10%)</span>
              <span>{formatIDR(receipt.taxAmount)}</span>
            </div>
            {receipt.roundingAmount !== 0 && (
              <div className="flex justify-between">
                <span>Pembulatan</span>
                <span>{formatIDR(receipt.roundingAmount)}</span>
              </div>
            )}
          </div>
          <hr />
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span>{formatIDR(receipt.grandTotal)}</span>
          </div>
          {receipt.paymentMethod && (
            <div className="mt-1 flex justify-between text-[11px]">
              <span>Bayar ({receipt.paymentMethod})</span>
              <span>{formatIDR(receipt.paidAmount ?? receipt.grandTotal)}</span>
            </div>
          )}
          {(receipt.changeAmt ?? 0) > 0 && (
            <div className="flex justify-between text-[11px]">
              <span>Kembalian</span>
              <span>{formatIDR(receipt.changeAmt!)}</span>
            </div>
          )}
          <hr />
          <div className="text-center text-[11px] text-[var(--muted)]">
            Terima kasih telah berkunjung!
            <br />
            Wi-Fi: SenjaGuest / kopi2026
          </div>
          <div className="mt-3 flex flex-col items-center gap-1 border-t border-dashed border-[var(--line-2)] pt-2.5">
            <img
              src="/branding/kassa-monochrome-thermal.svg"
              alt="Powered by Kassa POS"
              className="h-14 w-14 object-contain"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="btn-cadra btn-cadra--ghost">
            Tutup
          </button>
          <button onClick={() => window.print()} className="btn-cadra btn-cadra--primary">
            <Printer className="h-4 w-4" />
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
}
