"use client";

import {
  AlertTriangle,
  Building2,
  CreditCard,
  Receipt,
  ShieldAlert,
  TrendingUp,
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

export default function OverviewSection({
  data,
  onNavigate,
}: {
  data: OverviewResponse | null;
  onNavigate: (tab: "tenants" | "subscriptions" | "audit") => void;
}) {
  if (!data) {
    return (
      <div className="kpis">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  const { kpis } = data;

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
            PRO: {kpis.planBreakdown.PRO} · FREE: {kpis.planBreakdown.FREE} · ENT: {kpis.planBreakdown.ENTERPRISE}
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
