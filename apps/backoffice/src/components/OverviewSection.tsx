"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CreditCard,
  Filter,
  PieChart,
  Receipt,
  ShieldAlert,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { formatDate, formatDateTime, formatRupiah, type AuditLogItem } from "@/lib/api";

export interface OverviewResponse {
  kpis: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    totalOutlets: number;
    totalUsers: number;
    planBreakdown: { FREE: number; PRO: number; ENTERPRISE: number };
    estimatedMrr: number;
    expiringSoonCount: number;
    pendingInvoicesCount: number;
    paidRevenue30d: number;
    paidInvoices30dCount: number;
  };
  charts?: {
    dailyGmv14d: Array<{ date: string; label: string; gmv: number; orders: number }>;
    monthlyGrowth6m: Array<{
      month: string;
      label: string;
      revenue: number;
      newTenants: number;
      paidInvoices: number;
    }>;
    topTenants30d: Array<{
      id: number;
      name: string;
      plan: string;
      gmv: number;
      orders: number;
    }>;
    leadFunnel: Array<{ status: string; label: string; count: number }>;
  };
  recentTenants: Array<{
    id: number;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
    planExpiresAt: string | null;
    createdAt: string;
    _count: { outlets: number; users: number };
  }>;
  expiringTenants: Array<{
    id: number;
    name: string;
    slug: string;
    plan: string;
    planExpiresAt: string | null;
  }>;
  recentAuditLogs: AuditLogItem[];
}

function formatCompactRupiah(val: number): string {
  if (val >= 1_000_000_000) return `Rp${(val / 1_000_000_000).toFixed(1)}M`;
  if (val >= 1_000_000) return `Rp${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `Rp${Math.round(val / 1_000)}rb`;
  return `Rp${val}`;
}

export default function OverviewSection({
  data,
  onNavigate,
}: {
  data: OverviewResponse | null;
  onNavigate: (tab: "tenants" | "subscriptions" | "audit" | "leads") => void;
}) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [gmvMetric, setGmvMetric] = useState<"gmv" | "orders">("gmv");

  if (!data) {
    return (
      <div className="space-y-5">
        <div className="kpis">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card h-64 animate-pulse lg:col-span-2" />
          <div className="card h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  const { kpis } = data;
  const dailyGmv14d = data.charts?.dailyGmv14d ?? [];
  const monthlyGrowth6m = data.charts?.monthlyGrowth6m ?? [];
  const topTenants30d = data.charts?.topTenants30d ?? [];
  const leadFunnel = data.charts?.leadFunnel ?? [];

  // 1. Daily GMV / Orders 14d chart calculations
  const totalGmv14d = dailyGmv14d.reduce((acc, d) => acc + d.gmv, 0);
  const totalOrders14d = dailyGmv14d.reduce((acc, d) => acc + d.orders, 0);
  const maxDailyVal = Math.max(
    1,
    ...dailyGmv14d.map((d) => (gmvMetric === "gmv" ? d.gmv : d.orders)),
  );
  const activeDay = hoveredDay !== null ? dailyGmv14d[hoveredDay] : null;

  // 2. Plan Distribution Donut calculations
  const totalPlanCount = Math.max(
    1,
    kpis.planBreakdown.FREE + kpis.planBreakdown.PRO + kpis.planBreakdown.ENTERPRISE,
  );
  const planSegments = [
    {
      key: "PRO",
      label: "Tumpu Pro",
      count: kpis.planBreakdown.PRO,
      color: "var(--teal)",
    },
    {
      key: "ENTERPRISE",
      label: "Enterprise",
      count: kpis.planBreakdown.ENTERPRISE,
      color: "var(--amber)",
    },
    {
      key: "FREE",
      label: "Free Tier",
      count: kpis.planBreakdown.FREE,
      color: "var(--slate)",
    },
  ];
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let donutOffset = 0;

  // 3. Monthly Revenue & Tenant Growth (6m) calculations
  const maxMonthlyRev = Math.max(1, ...monthlyGrowth6m.map((m) => m.revenue));
  const maxMonthlyTenants = Math.max(1, ...monthlyGrowth6m.map((m) => m.newTenants));
  const totalRev6m = monthlyGrowth6m.reduce((acc, m) => acc + m.revenue, 0);
  const totalNewTenants6m = monthlyGrowth6m.reduce((acc, m) => acc + m.newTenants, 0);
  const activeMonth = hoveredMonth !== null ? monthlyGrowth6m[hoveredMonth] : null;

  // 4. Top Tenants & Lead Funnel calculations
  const maxTenantGmv = Math.max(1, ...topTenants30d.map((t) => t.gmv));
  const totalLeads = leadFunnel.reduce((acc, l) => acc + l.count, 0);
  const maxLeadCount = Math.max(1, ...leadFunnel.map((l) => l.count));
  const funnelColors: Record<string, string> = {
    new: "var(--sky)",
    contacted: "var(--amber)",
    demo: "var(--plum)",
    won: "var(--good)",
    lost: "var(--bad)",
  };

  return (
    <div className="space-y-5">
      {/* Manufactur/Cadra Signature KPI Strip (#1 Ink, #2 Accent, #3-4 Glass) */}
      <div className="kpis">
        <div className="stat">
          <div className="stat__label">
            <span className="stat__ico">
              <Building2 className="h-4 w-4" />
            </span>
            Total Tenant
          </div>
          <div className="stat__value font-mono-num">{kpis.totalTenants}</div>
          <div className="stat__sub font-mono-num">
            {kpis.activeTenants} aktif · {kpis.suspendedTenants} suspend
          </div>
        </div>

        <div className="stat">
          <div className="stat__label">
            <span className="stat__ico">
              <TrendingUp className="h-4 w-4" />
            </span>
            Estimasi MRR Aktif
          </div>
          <div className="stat__value font-mono-num">{formatRupiah(kpis.estimatedMrr)}</div>
          <div className="stat__sub font-mono-num">
            PRO: {kpis.planBreakdown.PRO} · FREE: {kpis.planBreakdown.FREE} · ENT:{" "}
            {kpis.planBreakdown.ENTERPRISE}
          </div>
        </div>

        <div className="stat">
          <div className="stat__label">
            <span className="stat__ico">
              <CreditCard className="h-4 w-4" />
            </span>
            Pendapatan 30 Hari
          </div>
          <div className="stat__value font-mono-num">{formatRupiah(kpis.paidRevenue30d)}</div>
          <div className="stat__sub font-mono-num">
            {kpis.paidInvoices30dCount} invoice lunas ·{" "}
            <button
              onClick={() => onNavigate("subscriptions")}
              className="font-bold text-[var(--warn)] underline-offset-2 hover:underline"
            >
              {kpis.pendingInvoicesCount} pending
            </button>
          </div>
        </div>

        <div className="stat">
          <div className="stat__label">
            <span className="stat__ico">
              <Users className="h-4 w-4" />
            </span>
            Outlet &amp; Pengguna POS
          </div>
          <div className="stat__value font-mono-num">{kpis.totalOutlets}</div>
          <div className="stat__sub font-mono-num">
            {kpis.totalUsers} akun kasir / owner terdaftar
          </div>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {data.expiringTenants.length > 0 && (
        <div className="card border-[var(--amber)]/40 bg-[var(--amber)]/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--warn)]">
              <AlertTriangle className="h-4 w-4" />
              {data.expiringTenants.length} Tenant Berbayar Akan Expired Dalam 7 Hari
            </div>
            <button
              onClick={() => onNavigate("tenants")}
              className="text-xs font-bold text-[var(--warn)] underline"
            >
              Kelola di Tenants →
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {data.expiringTenants.map((t) => (
              <span
                key={t.id}
                className="rounded-full border border-[var(--amber)]/35 bg-[var(--glass-3)] px-3 py-1 font-mono-num text-xs font-semibold"
              >
                {t.name} ({t.plan}) · exp {formatDate(t.planExpiresAt)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row 1: 14-Day GMV & Order Trend + Plan Distribution Donut */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Chart 1: 14-Day GMV & Order POS Trend */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-bold">
                <BarChart3 className="h-4 w-4 text-[var(--teal)]" />
                Tren GMV &amp; Transaksi POS (14 Hari)
              </h3>
              <p className="mt-0.5 font-mono-num text-[11px] text-[var(--muted)]">
                {activeDay ? (
                  <>
                    <strong className="text-[var(--text)]">{activeDay.label}</strong> · GMV{" "}
                    <strong className="text-[var(--teal)]">{formatRupiah(activeDay.gmv)}</strong> ·{" "}
                    <strong className="text-[var(--text)]">{activeDay.orders}</strong> order lunas
                  </>
                ) : (
                  <>
                    Total 14h:{" "}
                    <strong className="text-[var(--text)]">{formatRupiah(totalGmv14d)}</strong> ·{" "}
                    <strong className="text-[var(--text)]">{totalOrders14d}</strong> order lunas
                  </>
                )}
              </p>
            </div>
            <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--well)] p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setGmvMetric("gmv")}
                className={`rounded-full px-3 py-1 transition ${
                  gmvMetric === "gmv"
                    ? "bg-[var(--ink)] text-[var(--on-ink)]"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                GMV (Rp)
              </button>
              <button
                type="button"
                onClick={() => setGmvMetric("orders")}
                className={`rounded-full px-3 py-1 transition ${
                  gmvMetric === "orders"
                    ? "bg-[var(--ink)] text-[var(--on-ink)]"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Order
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox="0 0 640 205" className="h-52 w-full min-w-[460px]">
              {/* Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = 165 - ratio * 140;
                const val = maxDailyVal * ratio;
                return (
                  <g key={idx}>
                    <line
                      x1="54"
                      x2="628"
                      y1={y}
                      y2={y}
                      stroke="var(--line)"
                      strokeDasharray={ratio === 0 ? undefined : "3 3"}
                    />
                    <text
                      x="48"
                      y={y + 3}
                      textAnchor="end"
                      fill="var(--faint)"
                      fontSize="9.5"
                      className="font-mono-num"
                    >
                      {gmvMetric === "gmv" ? formatCompactRupiah(val) : Math.round(val)}
                    </text>
                  </g>
                );
              })}

              {/* Area + Line Path */}
              {dailyGmv14d.length > 1 &&
                (() => {
                  const pts = dailyGmv14d.map((d, i) => {
                    const val = gmvMetric === "gmv" ? d.gmv : d.orders;
                    const x = 68 + (i / (dailyGmv14d.length - 1)) * 546;
                    const y = 165 - (val / maxDailyVal) * 140;
                    return { x, y };
                  });
                  const linePath = pts
                    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                    .join(" ");
                  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},165 L${pts[0].x.toFixed(1)},165 Z`;
                  return (
                    <>
                      <defs>
                        <linearGradient id="boGmvGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="var(--teal)" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path d={areaPath} fill="url(#boGmvGrad)" />
                      <path
                        d={linePath}
                        fill="none"
                        stroke="var(--teal)"
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </>
                  );
                })()}

              {/* Bars & Hover Targets */}
              {dailyGmv14d.map((d, i) => {
                const val = gmvMetric === "gmv" ? d.gmv : d.orders;
                const x =
                  dailyGmv14d.length > 1
                    ? 68 + (i / (dailyGmv14d.length - 1)) * 546
                    : 340;
                const barH = Math.max(val > 0 ? 4 : 0, (val / maxDailyVal) * 140);
                const y = 165 - barH;
                const isHovered = hoveredDay === i;
                return (
                  <g
                    key={d.date}
                    onMouseEnter={() => setHoveredDay(i)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="cursor-pointer"
                  >
                    <rect x={x - 16} y="20" width="32" height="150" fill="transparent" />
                    <rect
                      x={x - 7}
                      y={y}
                      width="14"
                      height={barH}
                      rx="4"
                      fill={isHovered ? "var(--ink)" : "var(--teal)"}
                      opacity={isHovered ? 0.9 : 0.35}
                    />
                    <circle
                      cx={x}
                      cy={165 - (val / maxDailyVal) * 140}
                      r={isHovered ? 4.5 : 3}
                      fill={isHovered ? "var(--ink)" : "var(--teal)"}
                      stroke="var(--raised)"
                      strokeWidth="1.5"
                    />
                    {i % 2 === 0 && (
                      <text
                        x={x}
                        y="186"
                        textAnchor="middle"
                        fill={isHovered ? "var(--text)" : "var(--faint)"}
                        fontSize="9.5"
                        fontWeight={isHovered ? "700" : "500"}
                        className="font-mono-num"
                      >
                        {d.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Chart 2: Plan Distribution Donut */}
        <div className="card flex flex-col justify-between p-5">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <PieChart className="h-4 w-4 text-[var(--amber)]" />
              Distribusi Paket Tenant
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--muted)]">
              Komposisi tier aktif seluruh platform
            </p>
          </div>

          <div className="my-3 flex items-center justify-center">
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke="var(--well)"
                  strokeWidth="18"
                />
                {planSegments.map((seg) => {
                  const pct = seg.count / totalPlanCount;
                  const dash = pct * circumference;
                  const gap = circumference - dash;
                  const strokeDashoffset = -donutOffset;
                  donutOffset += dash;
                  if (seg.count === 0) return null;
                  return (
                    <circle
                      key={seg.key}
                      cx="75"
                      cy="75"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="18"
                      strokeDasharray={`${dash} ${gap}`}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="butt"
                    />
                  );
                })}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono-num text-2xl font-bold text-[var(--text)]">
                  {kpis.totalTenants}
                </span>
                <span className="text-[10.5px] font-semibold text-[var(--muted)]">Tenant</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {planSegments.map((seg) => {
              const pct = Math.round((seg.count / totalPlanCount) * 100);
              return (
                <div key={seg.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: seg.color }}
                    />
                    <span className="font-semibold text-[var(--text)]">{seg.label}</span>
                  </div>
                  <span className="font-mono-num text-[11px] text-[var(--muted)]">
                    <strong className="text-[var(--text)]">{seg.count}</strong> ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2: 6-Month Subscription Revenue & Tenant Growth + Top Tenants + Lead Funnel */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Chart 3: 6-Month Subscription Revenue & New Tenants */}
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <TrendingUp className="h-4 w-4 text-[var(--sky)]" />
              Billing &amp; Tenant Baru (6 Bulan)
            </h3>
            <p className="mt-0.5 font-mono-num text-[11px] text-[var(--muted)]">
              {activeMonth ? (
                <>
                  <strong className="text-[var(--text)]">{activeMonth.label}</strong> ·{" "}
                  {formatRupiah(activeMonth.revenue)} · +{activeMonth.newTenants} tenant
                </>
              ) : (
                <>
                  Total: <strong className="text-[var(--text)]">{formatRupiah(totalRev6m)}</strong>{" "}
                  · +{totalNewTenants6m} tenant
                </>
              )}
            </p>
          </div>

          <svg viewBox="0 0 320 175" className="h-44 w-full">
            {[0, 0.5, 1].map((ratio, idx) => {
              const y = 138 - ratio * 110;
              return (
                <line
                  key={idx}
                  x1="12"
                  x2="308"
                  y1={y}
                  y2={y}
                  stroke="var(--line)"
                  strokeDasharray={ratio === 0 ? undefined : "3 3"}
                />
              );
            })}
            {monthlyGrowth6m.map((m, i) => {
              const groupX = 24 + i * 48;
              const revH = Math.max(m.revenue > 0 ? 6 : 2, (m.revenue / maxMonthlyRev) * 108);
              const tenantH = Math.max(
                m.newTenants > 0 ? 6 : 2,
                (m.newTenants / maxMonthlyTenants) * 108,
              );
              const isHovered = hoveredMonth === i;
              return (
                <g
                  key={m.month}
                  onMouseEnter={() => setHoveredMonth(i)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className="cursor-pointer"
                >
                  <rect x={groupX - 4} y="20" width="40" height="130" fill="transparent" />
                  <rect
                    x={groupX}
                    y={138 - revH}
                    width="13"
                    height={revH}
                    rx="4"
                    fill="var(--ink)"
                    opacity={isHovered ? 1 : 0.85}
                  />
                  <rect
                    x={groupX + 16}
                    y={138 - tenantH}
                    width="13"
                    height={tenantH}
                    rx="4"
                    fill="var(--sky)"
                    opacity={isHovered ? 1 : 0.78}
                  />
                  <text
                    x={groupX + 14}
                    y="158"
                    textAnchor="middle"
                    fill={isHovered ? "var(--text)" : "var(--faint)"}
                    fontSize="9.5"
                    fontWeight={isHovered ? "700" : "500"}
                    className="font-mono-num"
                  >
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-2 flex items-center justify-between border-t border-[var(--line)] pt-2.5 text-[11px] text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm bg-[var(--ink)]" /> Revenue Billing
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm bg-[var(--sky)]" /> Tenant Baru
            </span>
          </div>
        </div>

        {/* Chart 4: Top Tenants by 30d GMV */}
        <div className="card flex flex-col justify-between p-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-bold">
                <Trophy className="h-4 w-4 text-[var(--amber)]" />
                Top Tenant (GMV 30 Hari)
              </h3>
              <button
                onClick={() => onNavigate("tenants")}
                className="font-mono-num text-[11px] font-semibold text-[var(--primary-ink)] hover:underline"
              >
                Tenants →
              </button>
            </div>
            <div className="space-y-3">
              {topTenants30d.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--muted)]">
                  Belum ada data tenant.
                </div>
              ) : (
                topTenants30d.map((t, idx) => {
                  const pct = Math.max(t.gmv > 0 ? 8 : 2, Math.round((t.gmv / maxTenantGmv) * 100));
                  return (
                    <div key={t.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate font-semibold text-[var(--text)]">
                          {idx + 1}. {t.name}
                        </span>
                        <span className="shrink-0 font-mono-num text-[11px] font-bold text-[var(--text)]">
                          {formatCompactRupiah(t.gmv)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--well)]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: idx === 0 ? "var(--ink)" : "var(--teal)",
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between font-mono-num text-[10px] text-[var(--muted)]">
                        <span>{t.plan}</span>
                        <span>{t.orders} order</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Chart 5: Landing Lead Funnel */}
        <div className="card flex flex-col justify-between p-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-bold">
                <Filter className="h-4 w-4 text-[var(--plum)]" />
                Funnel Leads Landing
              </h3>
              <button
                onClick={() => onNavigate("leads")}
                className="font-mono-num text-[11px] font-semibold text-[var(--primary-ink)] hover:underline"
              >
                Leads →
              </button>
            </div>
            <div className="space-y-3">
              {leadFunnel.map((item) => {
                const pct = Math.max(
                  item.count > 0 ? 10 : 3,
                  Math.round((item.count / maxLeadCount) * 100),
                );
                const share = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0;
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text)]">{item.label}</span>
                      <span className="font-mono-num text-[11px] text-[var(--muted)]">
                        <strong className="text-[var(--text)]">{item.count}</strong> ({share}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--well)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: funnelColors[item.status] ?? "var(--slate)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-2.5 font-mono-num text-[11px] text-[var(--muted)]">
            <span>Total Leads</span>
            <strong className="text-[var(--text)]">{totalLeads} prospek</strong>
          </div>
        </div>
      </div>

      {/* Recent Tenants & Recent Audit */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold">Tenant Terbaru</h3>
            <button
              onClick={() => onNavigate("tenants")}
              className="font-mono-num text-xs font-semibold text-[var(--primary-ink)] hover:underline"
            >
              Lihat semua →
            </button>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {data.recentTenants.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-xs">
                <div>
                  <div className="font-bold text-[var(--text)]">{t.name}</div>
                  <div className="font-mono-num text-[11px] text-[var(--muted)]">
                    {t.slug} · {t._count.outlets} outlet · {t._count.users} akun
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono-num text-[10.5px] font-bold ${
                      t.plan === "PRO"
                        ? "bg-[var(--accent)] text-[var(--on-accent)]"
                        : t.plan === "ENTERPRISE"
                          ? "bg-[var(--ink)] text-[var(--on-ink)]"
                          : "bg-[var(--well)] text-[var(--muted)]"
                    }`}
                  >
                    {t.plan}
                  </span>
                  {!t.isActive && (
                    <span className="rounded-full bg-[var(--bad)]/15 px-2.5 py-0.5 font-mono-num text-[10px] font-bold text-[var(--bad)]">
                      SUSPEND
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <ShieldAlert className="h-4 w-4 text-[var(--primary-ink)]" />
              Aktivitas Back Office Terbaru
            </h3>
            <button
              onClick={() => onNavigate("audit")}
              className="font-mono-num text-xs font-semibold text-[var(--primary-ink)] hover:underline"
            >
              Audit log →
            </button>
          </div>
          {data.recentAuditLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line-2)] py-8 text-center text-xs text-[var(--muted)]">
              <Receipt className="mx-auto mb-2 h-5 w-5 opacity-40" />
              Belum ada aktivitas perubahan tercatat.
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {data.recentAuditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="py-2.5 text-xs">
                  <div className="font-semibold text-[var(--text)]">{log.summary}</div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono-num text-[10.5px] text-[var(--muted)]">
                    <span>{log.admin?.name || "System"}</span>
                    <span>·</span>
                    <span>{log.action}</span>
                    <span>·</span>
                    <span>{formatDateTime(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
