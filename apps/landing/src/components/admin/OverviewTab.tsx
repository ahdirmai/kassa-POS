"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Eye,
  Monitor,
  MousePointerClick,
  RefreshCw,
  Smartphone,
  Tablet,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import type { AnalyticsEvent } from "@/lib/types";

interface AnalyticsResponse {
  summary: {
    totalViews: number;
    uniqueVisitors: number;
    todayViews: number;
    todayUnique: number;
    totalClicks: number;
    totalLeads: number;
    newLeads: number;
    conversionRate: number;
  };
  daily: {
    date: string;
    views: number;
    uniqueVisitors: number;
    clicks: number;
    leads: number;
  }[];
  devices: { device: string; count: number }[];
  topSources: { source: string; count: number }[];
  topCtas: { label: string; count: number }[];
  recentEvents: AnalyticsEvent[];
}

interface OverviewTabProps {
  onNotify: (msg: string, tone?: "ok" | "err") => void;
  onJumpToLeads: () => void;
}

export default function OverviewTab({
  onNotify,
  onJumpToLeads,
}: OverviewTabProps) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as AnalyticsResponse;
      setData(json);
    } catch {
      onNotify("Gagal memuat data analytics.", "err");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClearAnalytics = async () => {
    if (
      !window.confirm(
        "Hapus semua log pengunjung dan klik CTA? Data leads tetap aman."
      )
    ) {
      return;
    }
    setClearing(true);
    try {
      const res = await fetch("/api/admin/analytics", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      onNotify("Log analytics berhasil direset.");
      await loadData();
    } catch {
      onNotify("Gagal mereset analytics.", "err");
    } finally {
      setClearing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
          />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const maxDailyViews = Math.max(...data.daily.map((d) => d.views), 1);
  const totalDeviceViews = Math.max(
    data.devices.reduce((acc, d) => acc + d.count, 0),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">
            Ringkasan Pengunjung &amp; Konversi
          </h2>
          <p className="text-[13.5px] text-[var(--ink-secondary)]">
            Pantau trafik landing page, sumber kunjungan, klik CTA, dan performa leads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-medium text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleClearAnalytics}
            disabled={clearing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[12.5px] font-medium text-red-600 hover:bg-red-500/15 dark:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset Log
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between text-[var(--ink-muted)]">
            <span className="font-mono-num text-[11px] uppercase tracking-wider">
              Total Page Views
            </span>
            <Eye className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="font-mono-num mt-3 text-3xl font-semibold">
            {data.summary.totalViews.toLocaleString("id-ID")}
          </div>
          <p className="mt-1.5 text-[12px] text-[var(--ink-secondary)]">
            Hari ini:{" "}
            <span className="font-mono-num font-semibold text-[var(--ink)]">
              {data.summary.todayViews}
            </span>{" "}
            kunjungan
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between text-[var(--ink-muted)]">
            <span className="font-mono-num text-[11px] uppercase tracking-wider">
              Pengunjung Unik
            </span>
            <Users className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div className="font-mono-num mt-3 text-3xl font-semibold">
            {data.summary.uniqueVisitors.toLocaleString("id-ID")}
          </div>
          <p className="mt-1.5 text-[12px] text-[var(--ink-secondary)]">
            Hari ini:{" "}
            <span className="font-mono-num font-semibold text-[var(--ink)]">
              {data.summary.todayUnique}
            </span>{" "}
            pengunjung
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between text-[var(--ink-muted)]">
            <span className="font-mono-num text-[11px] uppercase tracking-wider">
              Klik CTA &amp; WA
            </span>
            <MousePointerClick className="h-4 w-4 text-[var(--brass)]" />
          </div>
          <div className="font-mono-num mt-3 text-3xl font-semibold">
            {data.summary.totalClicks.toLocaleString("id-ID")}
          </div>
          <p className="mt-1.5 text-[12px] text-[var(--ink-secondary)]">
            Interaksi tombol, harga &amp; showcase
          </p>
        </div>

        <button
          type="button"
          onClick={onJumpToLeads}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-colors hover:border-[var(--accent)]"
        >
          <div className="flex items-center justify-between text-[var(--ink-muted)]">
            <span className="font-mono-num text-[11px] uppercase tracking-wider">
              Total Leads
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="font-mono-num mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold">
              {data.summary.totalLeads}
            </span>
            {data.summary.newLeads > 0 && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                {data.summary.newLeads} baru
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[12px] text-[var(--ink-secondary)]">
            Konversi:{" "}
            <span className="font-mono-num font-semibold text-[var(--ink)]">
              {data.summary.conversionRate}%
            </span>{" "}
            dari pengunjung unik
          </p>
        </button>
      </div>

      {/* 14-Day Traffic Chart + Device Breakdown */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 lg:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15.5px] font-semibold">
                Trafik 14 Hari Terakhir
              </h3>
              <p className="text-[12.5px] text-[var(--ink-muted)]">
                Page views harian beserta klik CTA
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11.5px] text-[var(--ink-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)]" />
                Views
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--brass)]" />
                Clicks
              </span>
            </div>
          </div>

          <div className="mt-6 flex h-48 items-end gap-2">
            {data.daily.map((day) => {
              const viewPct = Math.max((day.views / maxDailyViews) * 100, day.views > 0 ? 8 : 2);
              const clickPct = Math.min((day.clicks / maxDailyViews) * 100, 100);
              const label = day.date.slice(5); // MM-DD
              return (
                <div
                  key={day.date}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <div className="pointer-events-none absolute -top-11 z-10 hidden whitespace-nowrap rounded-lg border border-[var(--border-strong)] bg-[var(--ink)] px-2.5 py-1 font-mono-num text-[10.5px] text-[var(--bg)] shadow-lg group-hover:block">
                    {day.date}: {day.views}v · {day.clicks}c · {day.leads}L
                  </div>
                  <div className="flex h-full w-full items-end justify-center gap-0.5">
                    <div
                      style={{ height: `${viewPct}%` }}
                      className="w-full max-w-[16px] rounded-t bg-[var(--accent)]/85 transition-all group-hover:bg-[var(--accent)]"
                    />
                    {day.clicks > 0 && (
                      <div
                        style={{ height: `${Math.max(clickPct, 6)}%` }}
                        className="w-full max-w-[8px] rounded-t bg-[var(--brass)]"
                      />
                    )}
                  </div>
                  <span className="font-mono-num text-[10px] text-[var(--ink-muted)]">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 lg:col-span-4">
          <h3 className="text-[15.5px] font-semibold">Perangkat Pengunjung</h3>
          <p className="text-[12.5px] text-[var(--ink-muted)]">
            Distribusi berdasarkan page views
          </p>

          <div className="mt-6 space-y-4">
            {data.devices.map((d) => {
              const pct = Math.round((d.count / totalDeviceViews) * 100);
              const Icon =
                d.device === "Mobile"
                  ? Smartphone
                  : d.device === "Tablet"
                  ? Tablet
                  : Monitor;
              return (
                <div key={d.device}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Icon className="h-4 w-4 text-[var(--accent)]" />
                      {d.device}
                    </span>
                    <span className="font-mono-num text-[12px] text-[var(--ink-secondary)]">
                      {d.count} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full rounded-full bg-[var(--accent)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Sources & Top CTAs */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h3 className="text-[15.5px] font-semibold">Sumber Trafik / Referrer</h3>
          <p className="text-[12.5px] text-[var(--ink-muted)]">
            Berdasarkan referrer atau parameter <code>utm_source</code>
          </p>
          {data.topSources.length === 0 ? (
            <p className="mt-6 text-[13px] text-[var(--ink-muted)]">
              Belum ada data kunjungan. Buka landing page untuk mulai mencatat trafik.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[var(--border)]">
              {data.topSources.map((s) => (
                <div
                  key={s.source}
                  className="flex items-center justify-between py-2.5 text-[13.5px]"
                >
                  <span className="font-medium">{s.source}</span>
                  <span className="font-mono-num rounded bg-[var(--surface-subtle)] px-2 py-0.5 text-[12px] text-[var(--ink-secondary)]">
                    {s.count} views
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h3 className="text-[15.5px] font-semibold">Tombol &amp; CTA Terpopuler</h3>
          <p className="text-[12.5px] text-[var(--ink-muted)]">
            Aksi yang paling sering diklik pengunjung di landing page
          </p>
          {data.topCtas.length === 0 ? (
            <p className="mt-6 text-[13px] text-[var(--ink-muted)]">
              Belum ada data klik CTA.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[var(--border)]">
              {data.topCtas.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]"
                >
                  <span className="truncate font-medium">{c.label}</span>
                  <span className="font-mono-num shrink-0 rounded bg-[var(--brass)]/15 px-2 py-0.5 text-[12px] font-medium text-[var(--ink)]">
                    {c.count}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="text-[15.5px] font-semibold">Aktivitas Pengunjung Terbaru</h3>
        </div>
        {data.recentEvents.length === 0 ? (
          <p className="mt-4 text-[13px] text-[var(--ink-muted)]">
            Belum ada aktivitas terekam.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] font-mono-num text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
                  <th className="pb-2.5 pr-4">Waktu</th>
                  <th className="pb-2.5 pr-4">Tipe</th>
                  <th className="pb-2.5 pr-4">Detail / Label</th>
                  <th className="pb-2.5 pr-4">Sumber</th>
                  <th className="pb-2.5">Perangkat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.recentEvents.map((ev) => (
                  <tr key={ev.id}>
                    <td className="font-mono-num whitespace-nowrap py-2.5 pr-4 text-[12px] text-[var(--ink-muted)]">
                      {new Date(ev.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded px-2 py-0.5 font-mono-num text-[10.5px] font-medium uppercase ${
                          ev.type === "click"
                            ? "bg-[var(--brass)]/15 text-[var(--ink)]"
                            : "bg-[var(--accent)]/15 text-[var(--accent)]"
                        }`}
                      >
                        {ev.type}
                      </span>
                    </td>
                    <td className="max-w-[260px] truncate py-2.5 pr-4 font-medium">
                      {ev.label || ev.path}
                    </td>
                    <td className="py-2.5 pr-4 text-[var(--ink-secondary)]">
                      {ev.source}
                    </td>
                    <td className="py-2.5 text-[var(--ink-secondary)]">
                      {ev.device}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
