"use client";

import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { formatIDR } from "@pos/shared";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";

interface SalesReport {
  summary: {
    totalTransactions: number;
    voidCount: number;
    grossSales: number;
    totalDiscount: number;
    totalService: number;
    totalTax: number;
    netSales: number;
    totalCogs: number;
  };
  orders: Array<{
    id: number;
    orderNo: string;
    receiptNo: string | null;
    orderType: string;
    status: string;
    grandTotal: number;
    taxAmount: number;
    serviceChargeAmount: number;
    createdAt: string;
    cashier?: { name: string } | null;
  }>;
}

export default function AdminReportsPage() {
  const { data } = useQuery({
    queryKey: ["sales-report"],
    queryFn: () => apiFetch<SalesReport>("/reports/sales"),
  });

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["OrderNo", "ReceiptNo", "Type", "Status", "Cashier", "Service", "PB1", "GrandTotal", "CreatedAt"],
      ...data.orders.map((o) => [
        o.orderNo,
        o.receiptNo ?? "",
        o.orderType,
        o.status,
        o.cashier?.name ?? "",
        o.serviceChargeAmount,
        o.taxAmount,
        o.grandTotal,
        o.createdAt,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-penjualan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CadraShell
      title="Laporan Penjualan & HPP"
      crumb="Laporan"
      rightSlot={
        <button onClick={exportCsv} className="btn-cadra btn-cadra--primary">
          <Download className="h-4 w-4" />
          Ekspor CSV
        </button>
      }
    >
      {data && (
        <div className="space-y-4">
          <dl className="cadra-kpis">
            <div className="cadra-stat">
              <dt className="text-xs font-semibold opacity-80">Total Penjualan Bersih</dt>
              <dd className="text-2xl font-bold">{formatIDR(data.summary.netSales)}</dd>
              <span className="text-xs opacity-75">{data.summary.totalTransactions} transaksi · {data.summary.voidCount} void</span>
            </div>
            <div className="cadra-stat">
              <dt className="text-xs font-semibold opacity-80">Estimasi Laba Kotor</dt>
              <dd className="text-2xl font-bold">{formatIDR(data.summary.grossSales - data.summary.totalDiscount - data.summary.totalCogs)}</dd>
              <span className="text-xs opacity-80">Total HPP: {formatIDR(data.summary.totalCogs)}</span>
            </div>
            <div className="cadra-stat">
              <dt className="text-xs font-semibold text-[var(--muted)]">Total PB1 (10%)</dt>
              <dd className="text-2xl font-bold">{formatIDR(data.summary.totalTax)}</dd>
              <span className="text-xs text-[var(--muted)]">Pajak daerah terkumpul</span>
            </div>
            <div className="cadra-stat">
              <dt className="text-xs font-semibold text-[var(--muted)]">Service Charge (5%)</dt>
              <dd className="text-2xl font-bold">{formatIDR(data.summary.totalService)}</dd>
              <span className="text-xs text-[var(--muted)]">Diskon: {formatIDR(data.summary.totalDiscount)}</span>
            </div>
          </dl>

          <div className="cadra-card overflow-x-auto">
            <table className="cadra-table">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="py-2">Order / Struk</th>
                  <th className="py-2">Tipe</th>
                  <th className="py-2">Kasir</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {data.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5 font-semibold">{o.orderNo} {o.receiptNo ? `(${o.receiptNo})` : ""}</td>
                    <td className="py-2.5">{o.orderType}</td>
                    <td className="py-2.5">{o.cashier?.name ?? "-"}</td>
                    <td className="py-2.5">
                      <span className={`spill ${o.status === "VOID" ? "spill--bad" : "spill--good"}`}>{o.status}</span>
                    </td>
                    <td className="py-2.5 text-right font-bold">{formatIDR(o.grandTotal)}</td>
                    <td className="py-2.5 text-right text-[var(--muted)]">{new Date(o.createdAt).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </CadraShell>
  );
}
