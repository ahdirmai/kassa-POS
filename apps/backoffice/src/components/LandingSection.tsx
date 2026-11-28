"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileEdit,
  MessageCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  boFetch,
  formatDateTime,
  LANDING_ADMIN_URL,
} from "@/lib/api";
import { DEFAULT_LANDING_CONTENT } from "@/lib/landing-defaults";
import type { LandingContent, LeadStatus } from "@/lib/landing-types";

interface LandingOverviewResponse {
  days: number;
  kpis: {
    pageviews: number;
    uniqueVisitors: number;
    clicks: number;
    leadsPeriod: number;
    totalLeadsAll: number;
    wonLeadsAll: number;
    conversionRate: number;
  };
  topCtas: Array<{ label: string; count: number }>;
  topSources: Array<{ source: string; count: number }>;
  devices: Array<{ device: string; count: number }>;
  daily: Array<{ date: string; pageviews: number; clicks: number; leads: number }>;
}

interface LeadItem {
  id: number;
  leadCode: string;
  name: string;
  businessName: string;
  whatsapp: string;
  email: string | null;
  outletCount: string;
  planInterest: string;
  message: string | null;
  status: LeadStatus;
  notes: string | null;
  source: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  convertedTenantId: number | null;
  convertedTenant?: {
    id: number;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
  } | null;
  createdAt: string;
}

type LandingSubTab = "analytics" | "leads" | "cms";

function mergeLandingContent(raw: Partial<LandingContent> | null): LandingContent {
  if (!raw) return { ...DEFAULT_LANDING_CONTENT };
  return {
    ...DEFAULT_LANDING_CONTENT,
    ...raw,
    general: { ...DEFAULT_LANDING_CONTENT.general, ...(raw.general ?? {}) },
    hero: { ...DEFAULT_LANDING_CONTENT.hero, ...(raw.hero ?? {}) },
    mobileCard: { ...DEFAULT_LANDING_CONTENT.mobileCard, ...(raw.mobileCard ?? {}) },
    footerCta: { ...DEFAULT_LANDING_CONTENT.footerCta, ...(raw.footerCta ?? {}) },
    metrics: Array.isArray(raw.metrics) && raw.metrics.length ? raw.metrics : DEFAULT_LANDING_CONTENT.metrics,
    showcaseTabs: Array.isArray(raw.showcaseTabs) && raw.showcaseTabs.length ? raw.showcaseTabs : DEFAULT_LANDING_CONTENT.showcaseTabs,
    pricing: Array.isArray(raw.pricing) && raw.pricing.length ? raw.pricing : DEFAULT_LANDING_CONTENT.pricing,
    faqs: Array.isArray(raw.faqs) ? raw.faqs : DEFAULT_LANDING_CONTENT.faqs,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export default function LandingSection({
  onNotify,
  onTenantCreated,
  initialSubTab = "leads",
}: {
  onNotify: (msg: string, tone?: "ok" | "err") => void;
  onTenantCreated: () => void;
  initialSubTab?: LandingSubTab;
}) {
  const [subTab, setSubTab] = useState<LandingSubTab>(initialSubTab);
  const [overview, setOverview] = useState<LandingOverviewResponse | null>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [leadQ, setLeadQ] = useState("");
  const [leadStatus, setLeadStatus] = useState("all");

  // CMS state
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);
  const [savingCms, setSavingCms] = useState(false);

  // Add lead modal
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    businessName: "",
    whatsapp: "",
    email: "",
    outletCount: "1 outlet",
    planInterest: "Pro",
    message: "",
  });

  // 1-Click Convert Lead → Tenant modal
  const [convertTarget, setConvertTarget] = useState<LeadItem | null>(null);
  const [convEmail, setConvEmail] = useState("");
  const [convPassword, setConvPassword] = useState("Tumpu2026!");
  const [convPlan, setConvPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("PRO");
  const [convDays, setConvDays] = useState(14);
  const [converting, setConverting] = useState(false);
  const [convertedResult, setConvertedResult] = useState<{
    tenantName: string;
    ownerEmail: string;
    password: string;
    defaultPin: string;
    plan: string;
  } | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      const res = await boFetch<LandingOverviewResponse>("/landing/overview?days=30");
      setOverview(res);
    } catch {}
  }, []);

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const params = new URLSearchParams();
      if (leadQ.trim()) params.set("q", leadQ.trim());
      if (leadStatus !== "all") params.set("status", leadStatus);
      const res = await boFetch<{ items: LeadItem[] }>(`/landing/leads?${params.toString()}`);
      setLeads(res.items);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal memuat leads", "err");
    } finally {
      setLoadingLeads(false);
    }
  }, [leadQ, leadStatus, onNotify]);

  const loadContent = useCallback(async () => {
    try {
      const res = await boFetch<{ data: Partial<LandingContent> | null }>("/landing/content");
      setContent(mergeLandingContent(res.data));
    } catch {}
  }, []);

  useEffect(() => {
    loadOverview();
    loadContent();
  }, [loadOverview, loadContent]);

  useEffect(() => {
    const t = setTimeout(loadLeads, 200);
    return () => clearTimeout(t);
  }, [loadLeads]);

  async function handleUpdateLead(id: number, patch: { status?: LeadStatus; notes?: string }) {
    try {
      await boFetch(`/landing/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      onNotify("Data lead diperbarui.");
      loadLeads();
      loadOverview();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal update lead", "err");
    }
  }

  async function handleDeleteLead(lead: LeadItem) {
    if (!window.confirm(`Hapus lead "${lead.businessName}" (${lead.name})?`)) return;
    try {
      await boFetch(`/landing/leads/${lead.id}`, { method: "DELETE" });
      onNotify("Lead dihapus.");
      loadLeads();
      loadOverview();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal menghapus lead", "err");
    }
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    try {
      await boFetch("/landing/leads", {
        method: "POST",
        body: JSON.stringify(newLead),
      });
      setShowAddLead(false);
      setNewLead({
        name: "",
        businessName: "",
        whatsapp: "",
        email: "",
        outletCount: "1 outlet",
        planInterest: "Pro",
        message: "",
      });
      onNotify("Lead baru berhasil ditambahkan.");
      loadLeads();
      loadOverview();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal menambah lead", "err");
    }
  }

  function openConvertModal(lead: LeadItem) {
    setConvertTarget(lead);
    setConvertedResult(null);
    setConvEmail(
      lead.email ||
        `owner@${lead.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "") || "bisnis"}.id`,
    );
    setConvPassword("Tumpu2026!");
    setConvPlan(lead.planInterest.toLowerCase().includes("free") ? "FREE" : "PRO");
    setConvDays(14);
  }

  async function handleConvertToTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!convertTarget) return;
    setConverting(true);
    try {
      const res = await boFetch<{
        tenant: { name: string; plan: string };
        owner: { email: string };
        defaultPin: string;
      }>(`/landing/leads/${convertTarget.id}/convert-to-tenant`, {
        method: "POST",
        body: JSON.stringify({
          ownerEmail: convEmail,
          ownerPassword: convPassword,
          plan: convPlan,
          durationDays: convDays,
        }),
      });
      setConvertedResult({
        tenantName: res.tenant.name,
        ownerEmail: res.owner.email,
        password: convPassword,
        defaultPin: res.defaultPin,
        plan: res.tenant.plan,
      });
      onNotify(`Tenant ${res.tenant.name} berhasil dibuat dari Lead!`);
      loadLeads();
      loadOverview();
      onTenantCreated();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal konversi lead", "err");
    } finally {
      setConverting(false);
    }
  }

  async function handleSaveCms() {
    setSavingCms(true);
    try {
      await boFetch("/landing/content", {
        method: "PUT",
        body: JSON.stringify(content),
      });
      onNotify("Konten Landing berhasil disimpan ke MySQL & langsung live di tumpu.biz.id!");
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal menyimpan konten", "err");
    } finally {
      setSavingCms(false);
    }
  }

  async function handleResetCms() {
    if (!window.confirm("Reset seluruh teks, harga, dan FAQ landing ke bawaan default?")) return;
    try {
      await boFetch("/landing/content/reset", { method: "POST" });
      setContent({ ...DEFAULT_LANDING_CONTENT });
      onNotify("Konten Landing dikembalikan ke default.");
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal reset konten", "err");
    }
  }

  const maxDailyPv = Math.max(1, ...(overview?.daily.map((d) => d.pageviews) ?? [1]));

  return (
    <div className="space-y-5">
      {/* Sub-navigation bar */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-3.5">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["leads", `Leads CRM (${leads.length})`, Users],
              ["analytics", "Analytics & UTM", BarChart3],
              ["cms", "CMS Konten Landing", FileEdit],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                subTab === id
                  ? "bg-[var(--ink)] text-[var(--on-ink)]"
                  : "border border-[var(--line)] bg-[var(--glass-2)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <a
          href={LANDING_ADMIN_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-2)] bg-[var(--glass-2)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--glass-3)]"
        >
          Buka tumpu.biz.id
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* TAB 1: LEADS CRM + 1-CLICK TENANT */}
      {subTab === "leads" && (
        <div className="space-y-4">
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--faint)]" />
              <input
                type="text"
                value={leadQ}
                onChange={(e) => setLeadQ(e.target.value)}
                placeholder="Cari nama, bisnis, WhatsApp, atau email..."
                className="w-full rounded-full border border-[var(--line-2)] bg-[var(--glass-2)] py-2 pl-10 pr-4 text-xs focus:border-[var(--iris)] focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={leadStatus}
                onChange={(e) => setLeadStatus(e.target.value)}
                className="rounded-full border border-[var(--line-2)] bg-[var(--glass-2)] px-3.5 py-2 text-xs font-semibold"
              >
                <option value="all">Semua Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="demo">Demo</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
              <button
                onClick={loadLeads}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-2)] bg-[var(--glass-2)] px-3.5 py-2 text-xs font-semibold"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingLeads ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowAddLead(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-[var(--on-ink)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Lead
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--line)] bg-[var(--well)] text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">Prospek &amp; Bisnis</th>
                    <th className="px-4 py-3">Kontak &amp; Paket</th>
                    <th className="px-4 py-3">Status Pipeline</th>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {leads.map((l) => {
                    const waDigits = l.whatsapp.replace(/[^0-9]/g, "");
                    const waLink = waDigits.startsWith("0")
                      ? `https://wa.me/62${waDigits.slice(1)}`
                      : `https://wa.me/${waDigits}`;
                    return (
                      <tr key={l.id} className="hover:bg-[var(--well)]/60">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[var(--text)]">{l.businessName}</div>
                          <div className="text-[11px] text-[var(--muted)]">
                            {l.name} · {l.outletCount}
                          </div>
                          {l.utmCampaign && (
                            <div className="mt-0.5 font-mono-num text-[10px] text-[var(--primary-ink)]">
                              UTM: {l.utmSource}/{l.utmCampaign}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono-num text-[11px]">{l.whatsapp}</div>
                          <div className="text-[11px] text-[var(--muted)]">
                            Minat: <strong>{l.planInterest}</strong> · {formatDateTime(l.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={l.status}
                            onChange={(e) =>
                              handleUpdateLead(l.id, { status: e.target.value as LeadStatus })
                            }
                            className="rounded-full border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-1 text-[11px] font-bold uppercase"
                          >
                            <option value="new">NEW</option>
                            <option value="contacted">CONTACTED</option>
                            <option value="demo">DEMO</option>
                            <option value="won">WON</option>
                            <option value="lost">LOST</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {l.convertedTenant ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--good)]/15 px-2.5 py-1 text-[11px] font-bold text-[var(--good)]">
                              <CheckCircle2 className="h-3 w-3" />
                              {l.convertedTenant.name} ({l.convertedTenant.plan})
                            </span>
                          ) : (
                            <button
                              onClick={() => openConvertModal(l)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-bold text-[var(--on-accent)] hover:opacity-90"
                            >
                              <Sparkles className="h-3 w-3" />
                              Buat Akun Tenant
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat WhatsApp"
                              className="inline-flex items-center gap-1 rounded-full border border-[var(--line-2)] bg-[var(--glass-2)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--good)]"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WA
                            </a>
                            <button
                              onClick={() => handleDeleteLead(l)}
                              title="Hapus Lead"
                              className="rounded-full border border-[var(--line)] p-1.5 text-[var(--bad)] hover:bg-[var(--bad)]/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loadingLeads && leads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-[var(--muted)]">
                        Belum ada lead masuk dari Landing Page. Klik &ldquo;Tambah Lead&rdquo; untuk simulasi atau isi form di tumpu.biz.id.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS & UTM */}
      {subTab === "analytics" && overview && (
        <div className="space-y-5">
          <div className="kpis">
            <div className="stat">
              <div className="stat__label">
                <span className="stat__ico"><BarChart3 className="h-4 w-4" /></span>
                Pageviews (30h)
              </div>
              <div className="stat__value font-mono-num">{overview.kpis.pageviews}</div>
              <div className="stat__sub">
                {overview.kpis.uniqueVisitors} pengunjung unik
              </div>
            </div>
            <div className="stat">
              <div className="stat__label">
                <span className="stat__ico"><Sparkles className="h-4 w-4" /></span>
                Klik CTA (30h)
              </div>
              <div className="stat__value font-mono-num">{overview.kpis.clicks}</div>
              <div className="stat__sub">Tombol daftar / WA / demo</div>
            </div>
            <div className="stat">
              <div className="stat__label">
                <span className="stat__ico"><Users className="h-4 w-4" /></span>
                Leads Masuk (30h)
              </div>
              <div className="stat__value font-mono-num">{overview.kpis.leadsPeriod}</div>
              <div className="stat__sub">
                Total: {overview.kpis.totalLeadsAll} ({overview.kpis.wonLeadsAll} won)
              </div>
            </div>
            <div className="stat">
              <div className="stat__label">
                <span className="stat__ico"><CheckCircle2 className="h-4 w-4" /></span>
                Conversion Rate
              </div>
              <div className="stat__value font-mono-num">{overview.kpis.conversionRate}%</div>
              <div className="stat__sub">Leads / Pengunjung Unik</div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold">Tren 7 Hari Terakhir (Pageviews &amp; Leads)</h3>
              <div className="grid grid-cols-7 items-end gap-2 pt-2">
                {overview.daily.map((d) => (
                  <div key={d.date} className="flex flex-col items-center gap-1.5">
                    <div className="font-mono-num text-[10px] font-bold text-[var(--primary-ink)]">
                      {d.pageviews}
                    </div>
                    <div className="flex h-28 w-full items-end justify-center rounded-xl bg-[var(--well)] p-1">
                      <div
                        className="w-full rounded-lg bg-[var(--iris)] transition-all"
                        style={{ height: `${Math.max(8, Math.round((d.pageviews / maxDailyPv) * 100))}%` }}
                      />
                    </div>
                    <div className="font-mono-num text-[10px] text-[var(--muted)]">
                      {d.date.slice(5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-4 p-5">
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Top Sumber / UTM Campaign
                </h3>
                <div className="space-y-1.5 text-xs">
                  {overview.topSources.length === 0 ? (
                    <div className="text-[var(--muted)]">Belum ada traffic terekam.</div>
                  ) : (
                    overview.topSources.map((s) => (
                      <div key={s.source} className="flex justify-between rounded-xl bg-[var(--well)] px-3 py-1.5">
                        <span className="truncate font-medium">{s.source}</span>
                        <strong className="font-mono-num">{s.count}</strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Top CTA Diklik
                </h3>
                <div className="space-y-1.5 text-xs">
                  {overview.topCtas.length === 0 ? (
                    <div className="text-[var(--muted)]">Belum ada klik CTA.</div>
                  ) : (
                    overview.topCtas.map((c) => (
                      <div key={c.label} className="flex justify-between rounded-xl bg-[var(--well)] px-3 py-1.5">
                        <span className="truncate font-medium">{c.label}</span>
                        <strong className="font-mono-num">{c.count}</strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CMS KONTEN LANDING */}
      {subTab === "cms" && (
        <div className="space-y-5">
          <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="text-xs text-[var(--muted)]">
              Perubahan disimpan langsung ke <strong>MySQL</strong> dan otomatis tampil di{" "}
              <span className="font-mono-num font-semibold text-[var(--text)]">tumpu.biz.id</span>.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetCms}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-2)] bg-[var(--glass-2)] px-4 py-2 text-xs font-semibold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Default
              </button>
              <button
                onClick={handleSaveCms}
                disabled={savingCms}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-5 py-2 text-xs font-semibold text-[var(--on-ink)] disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                {savingCms ? "Menyimpan..." : "Simpan & Publish"}
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* General & WhatsApp */}
            <div className="card space-y-3 p-5 text-xs">
              <h3 className="text-sm font-bold">Identitas &amp; WhatsApp CTA</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Nama Brand</label>
                  <input
                    type="text"
                    value={content.general.brandName}
                    onChange={(e) =>
                      setContent({ ...content, general: { ...content.general, brandName: e.target.value } })
                    }
                    className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Nomor WhatsApp (62...)</label>
                  <input
                    type="text"
                    value={content.general.waNumber}
                    onChange={(e) =>
                      setContent({ ...content, general: { ...content.general, waNumber: e.target.value } })
                    }
                    className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2 font-mono-num"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-[var(--muted)]">URL Aplikasi POS</label>
                <input
                  type="text"
                  value={content.general.appUrl}
                  onChange={(e) =>
                    setContent({ ...content, general: { ...content.general, appUrl: e.target.value } })
                  }
                  className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-[var(--muted)]">Pesan Default WhatsApp</label>
                <textarea
                  rows={2}
                  value={content.general.waMessage}
                  onChange={(e) =>
                    setContent({ ...content, general: { ...content.general, waMessage: e.target.value } })
                  }
                  className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
                />
              </div>
            </div>

            {/* Hero Section */}
            <div className="card space-y-3 p-5 text-xs">
              <h3 className="text-sm font-bold">Hero Section</h3>
              <div>
                <label className="mb-1 block font-semibold text-[var(--muted)]">Badge</label>
                <input
                  type="text"
                  value={content.hero.badge}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, badge: e.target.value } })
                  }
                  className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Headline Baris 1</label>
                  <input
                    type="text"
                    value={content.hero.titleLine1}
                    onChange={(e) =>
                      setContent({ ...content, hero: { ...content.hero, titleLine1: e.target.value } })
                    }
                    className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Headline Baris 2</label>
                  <input
                    type="text"
                    value={content.hero.titleLine2}
                    onChange={(e) =>
                      setContent({ ...content, hero: { ...content.hero, titleLine2: e.target.value } })
                    }
                    className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-[var(--muted)]">Subtitle</label>
                <textarea
                  rows={2}
                  value={content.hero.subtitle}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, subtitle: e.target.value } })
                  }
                  className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="card space-y-3 p-5 text-xs">
            <h3 className="text-sm font-bold">Paket Harga (Landing Pricing)</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {content.pricing.map((plan, idx) => (
                <div key={plan.id} className="space-y-2.5 rounded-2xl border border-[var(--line)] bg-[var(--well)] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) => {
                        const next = [...content.pricing];
                        next[idx] = { ...plan, name: e.target.value };
                        setContent({ ...content, pricing: next });
                      }}
                      className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--glass-3)] px-2.5 py-1.5 font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={plan.price}
                      onChange={(e) => {
                        const next = [...content.pricing];
                        next[idx] = { ...plan, price: e.target.value };
                        setContent({ ...content, pricing: next });
                      }}
                      className="rounded-lg border border-[var(--line-2)] bg-[var(--glass-3)] px-2.5 py-1.5 font-mono-num font-bold"
                    />
                    <input
                      type="text"
                      value={plan.period}
                      onChange={(e) => {
                        const next = [...content.pricing];
                        next[idx] = { ...plan, period: e.target.value };
                        setContent({ ...content, pricing: next });
                      }}
                      className="rounded-lg border border-[var(--line-2)] bg-[var(--glass-3)] px-2.5 py-1.5"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={plan.desc}
                    onChange={(e) => {
                      const next = [...content.pricing];
                      next[idx] = { ...plan, desc: e.target.value };
                      setContent({ ...content, pricing: next });
                    }}
                    className="w-full rounded-lg border border-[var(--line-2)] bg-[var(--glass-3)] px-2.5 py-1.5"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Lead Manual */}
      {showAddLead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleAddLead}
            className="card w-full max-w-md space-y-3 border-[var(--line-2)] bg-[var(--raised)] p-6 text-xs text-[var(--text)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="text-sm font-bold">Tambah Lead Manual</h3>
              <button type="button" onClick={() => setShowAddLead(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              required
              placeholder="Nama PIC / Owner"
              value={newLead.name}
              onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
            />
            <input
              required
              placeholder="Nama Bisnis / Cafe / Resto"
              value={newLead.businessName}
              onChange={(e) => setNewLead({ ...newLead, businessName: e.target.value })}
              className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                placeholder="No. WhatsApp"
                value={newLead.whatsapp}
                onChange={(e) => setNewLead({ ...newLead, whatsapp: e.target.value })}
                className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
              />
              <input
                type="email"
                placeholder="Email (opsional)"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddLead(false)}
                className="rounded-full border border-[var(--line-2)] px-4 py-2 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-full bg-[var(--ink)] px-5 py-2 font-semibold text-[var(--on-ink)]"
              >
                Simpan Lead
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: 1-Click Convert Lead → Tenant */}
      {convertTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-lg space-y-4 border-[var(--line-2)] bg-[var(--raised)] p-6 text-xs text-[var(--text)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[var(--primary-ink)]" />
                <h3 className="text-sm font-bold">
                  1-Click Provisioning Tenant — {convertTarget.businessName}
                </h3>
              </div>
              <button onClick={() => setConvertTarget(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {convertedResult ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--good)]/30 bg-[var(--good)]/10 p-4">
                  <div className="font-bold text-[var(--good)]">
                    Akun Tenant &amp; Owner Berhasil Dibuat!
                  </div>
                  <div className="mt-2 space-y-1 font-mono-num text-[11.5px]">
                    <div>Tenant: <strong>{convertedResult.tenantName}</strong> ({convertedResult.plan})</div>
                    <div>Email Owner: <strong>{convertedResult.ownerEmail}</strong></div>
                    <div>Password: <strong>{convertedResult.password}</strong></div>
                    <div>PIN Manager Default: <strong>{convertedResult.defaultPin}</strong></div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setConvertTarget(null)}
                    className="rounded-full bg-[var(--ink)] px-5 py-2 font-semibold text-[var(--on-ink)]"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConvertToTenant} className="space-y-3">
                <p className="text-[var(--muted)]">
                  Otomatis membuat <strong>Tenant</strong>, <strong>Outlet Pusat</strong>, pengaturan pajak default, dan akun <strong>Owner</strong> di `pos.tumpu.biz.id`, lalu mengubah status lead menjadi <strong>WON</strong>.
                </p>
                <div>
                  <label className="mb-1 block font-semibold">Email Login Owner</label>
                  <input
                    type="email"
                    required
                    value={convEmail}
                    onChange={(e) => setConvEmail(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Password Awal Owner (min. 8 karakter)</label>
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={convPassword}
                    onChange={(e) => setConvPassword(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2 font-mono-num"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-semibold">Paket Awal</label>
                    <select
                      value={convPlan}
                      onChange={(e) => setConvPlan(e.target.value as "FREE" | "PRO" | "ENTERPRISE")}
                      className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2"
                    >
                      <option value="PRO">Tumpu Pro (Trial / Aktif)</option>
                      <option value="FREE">Starter (Gratis)</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold">Durasi Aktif (Hari)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      disabled={convPlan === "FREE"}
                      value={convDays}
                      onChange={(e) => setConvDays(Number(e.target.value))}
                      className="w-full rounded-xl border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-2 font-mono-num disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConvertTarget(null)}
                    className="rounded-full border border-[var(--line-2)] px-4 py-2 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={converting}
                    className="rounded-full bg-[var(--ink)] px-5 py-2 font-semibold text-[var(--on-ink)] disabled:opacity-60"
                  >
                    {converting ? "Membuat Tenant..." : "Buat Akun Tenant Sekarang"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
