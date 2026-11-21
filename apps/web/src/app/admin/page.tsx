"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, Receipt, Store, TrendingUp, UtensilsCrossed } from "lucide-react";
import { formatIDR } from "@pos/shared";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";

interface DashboardRes {
  kpis: {
    todaySales: number;
    todayCount: number;
    avgBill: number;
    todayTax: number;
    todayService: number;
    occupiedTables: number;
    totalTables: number;
    lowStockCount: number;
  };
  hourly: Array<{ hour: string; total: number }>;
  paymentBreakdown: Record<string, number>;
  topProducts: Array<{ name: string; qty: number; revenue: number; cost: number }>;
  lowStock: Array<{ id: number; sku: string; name: string; currentStock: number; minStock: number; unit: string }>;
  recentOrders: Array<{ id: number; orderNo: string; orderType: string; grandTotal: number; createdAt: string; status: string }>;
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardRes>("/reports/dashboard"),
  });

  const maxHourly = Math.max(1, ...(data?.hourly.map((h) => h.total) ?? [1]));

  return (
    <CadraShell
      title="Dashboard Owner"
      crumb="Ringkasan"
      mode="admin"
      rightSlot={
        <Link href="/pos" className="btn-cadra btn-cadra--primary">
          <Store className="h-4 w-4" />
          Buka Kasir POS
        </Link>
      }
    >
      {isLoading || !data ? (
        <div className="cadra-card py-14 text-center text-sm text-[var(--muted)]">Memuat data dashboard...</div>
      ) : (
        <div className="space-y-4">
          {/* Cadra Signature KPI Grid (1st Ink, 2nd Accent, 3rd+4th Glass) */}
          <dl className="cadra-kpis">
            <div className="cadra-stat">
              <dt className="flex items-center gap-2 text-xs font-semibold opacity-80">
                <TrendingUp className="h-4 w-4" />
                Penjualan Hari Ini
              </dt>
              <dd className="text-2xl font-bold tracking-tight">{formatIDR(data.kpis.todaySales)}</dd>
              <span className="text-xs opacity-75">
                PB1 {formatIDR(data.kpis.todayTax)} · Service {formatIDR(data.kpis.todayService)}
              </span>
            </div>

            <div className="cadra-stat">
              <dt className="flex items-center gap-2 text-xs font-semibold opacity-80">
                <Receipt className="h-4 w-4" />
                Transaksi &amp; Rata-rata Bill
              </dt>
              <dd className="text-2xl font-bold tracking-tight">{data.kpis.todayCount} order</dd>
              <span className="text-xs opacity-80">Avg bill {formatIDR(data.kpis.avgBill)}</span>
            </div>

            <div className="cadra-stat">
              <dt className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                <UtensilsCrossed className="h-4 w-4" />
                Okupansi Meja
              </dt>
              <dd className="text-2xl font-bold tracking-tight">
                {data.kpis.occupiedTables} / {data.kpis.totalTables}
              </dd>
              <span className="text-xs text-[var(--muted)]">Meja sedang terisi</span>
            </div>

            <div className="cadra-stat">
              <dt className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                <AlertTriangle className="h-4 w-4 text-[var(--warn)]" />
                Stok Kritis
              </dt>
              <dd className="text-2xl font-bold tracking-tight">{data.kpis.lowStockCount} bahan</dd>
              <span className="text-xs text-[var(--muted)]">Di bawah batas minimum</span>
            </div>
          </dl>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Hourly Sales Chart */}
            <section className="cadra-card lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <BarChart3 className="h-4 w-4" />
                  Jam Ramai Penjualan Hari Ini
                </h2>
                <span className="text-xs text-[var(--muted)]">08:00 – 22:00 WIB</span>
              </div>
              <div className="overflow-x-auto pb-1">
                <div className="flex h-44 min-w-[440px] items-end gap-1.5 pt-4">
                  {data.hourly.map((h) => {
                    const pct = Math.max(4, Math.round((h.total / maxHourly) * 100));
                    return (
                      <div key={h.hour} className="group flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                        <div
                          title={`${h.hour}: ${formatIDR(h.total)}`}
                          style={{ height: `${pct}%` }}
                          className="w-full rounded-t-lg bg-[var(--iris)] opacity-80 transition group-hover:opacity-100"
                        />
                        <span className="text-[10px] text-[var(--muted)]">{h.hour.slice(0, 2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Payment Breakdown & Low Stock */}
            <section className="cadra-card space-y-4">
              <h2 className="text-sm font-bold">Metode Pembayaran Hari Ini</h2>
              {Object.keys(data.paymentBreakdown).length === 0 ? (
                <p className="text-xs text-[var(--muted)]">Belum ada transaksi lunas hari ini.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.paymentBreakdown).map(([method, amt]) => (
                    <div key={method} className="flex items-center justify-between rounded-2xl bg-[var(--surface)] px-3 py-2 text-xs">
                      <span className="font-semibold">{method}</span>
                      <b>{formatIDR(amt)}</b>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-[var(--line)] pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--muted)]">Peringatan Stok Minimum</h3>
                  <Link href="/admin/stock" className="text-xs font-bold text-[var(--primary-ink)]">Kelola →</Link>
                </div>
                {data.lowStock.length === 0 ? (
                  <p className="text-xs text-[var(--good)] font-semibold">Semua bahan baku aman.</p>
                ) : (
                  <div className="space-y-1.5">
                    {data.lowStock.map((i) => (
                      <div key={i.id} className="flex items-center justify-between text-xs">
                        <span>{i.name}</span>
                        <span className="spill spill--warn">
                          {i.currentStock} / {i.minStock} {i.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Top Products */}
          <section className="cadra-card space-y-3">
            <h2 className="text-sm font-bold">Menu Terlaris &amp; Estimasi Margin</h2>
            <div className="overflow-x-auto">
              <table className="cadra-table">
                <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                  <tr>
                    <th className="py-2">Menu</th>
                    <th className="py-2 text-right">Terjual</th>
                    <th className="py-2 text-right">Omzet</th>
                    <th className="py-2 text-right">Est. HPP</th>
                    <th className="py-2 text-right">Laba Kotor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {data.topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[var(--muted)]">
                        Belum ada data penjualan. Coba buat transaksi pertama di Kasir POS!
                      </td>
                    </tr>
                  ) : (
                    data.topProducts.map((p) => (
                      <tr key={p.name}>
                        <td className="py-2.5 font-semibold">{p.name}</td>
                        <td className="py-2.5 text-right">{p.qty}</td>
                        <td className="py-2.5 text-right font-bold">{formatIDR(p.revenue)}</td>
                        <td className="py-2.5 text-right text-[var(--muted)]">{formatIDR(p.cost)}</td>
                        <td className="py-2.5 text-right font-bold text-[var(--good)]">{formatIDR(p.revenue - p.cost)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </CadraShell>
  );
}
