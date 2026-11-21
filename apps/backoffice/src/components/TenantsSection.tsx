"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Eye,
  KeyRound,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  boFetch,
  formatDate,
  formatRupiah,
  type SubscriptionInvoiceItem,
  type TenantListItem,
} from "@/lib/api";

interface TenantDetailResponse {
  tenant: {
    id: number;
    name: string;
    slug: string;
    plan: "FREE" | "PRO" | "ENTERPRISE";
    planExpiresAt: string | null;
    maxOutlets: number;
    maxUsers: number;
    isActive: boolean;
    createdAt: string;
    outlets: Array<{
      id: number;
      code: string;
      name: string;
      isActive: boolean;
      _count: { orders: number; users: number };
    }>;
    users: Array<{
      id: number;
      name: string;
      email: string;
      isActive: boolean;
      role: { code: string; name: string };
    }>;
    subscriptionInvoices: SubscriptionInvoiceItem[];
  };
  stats30d: { paidOrders: number; gmv: number };
}

export default function TenantsSection({
  onNotify,
  onMutated,
}: {
  onNotify: (msg: string, tone?: "ok" | "err") => void;
  onMutated: () => void;
}) {
  const [items, setItems] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("all");

  // Detail modal state
  const [detail, setDetail] = useState<TenantDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Plan edit form state
  const [editPlan, setEditPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("FREE");
  const [editExpiry, setEditExpiry] = useState("");
  const [editMaxOutlets, setEditMaxOutlets] = useState(1);
  const [editMaxUsers, setEditMaxUsers] = useState(3);
  const [savingSub, setSavingSub] = useState(false);

  // Reset password state
  const [newOwnerPwd, setNewOwnerPwd] = useState("");
  const [resettingPwd, setResettingPwd] = useState(false);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (planFilter !== "ALL") params.set("plan", planFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await boFetch<{ items: TenantListItem[] }>(`/tenants?${params.toString()}`);
      setItems(res.items);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal memuat daftar tenant", "err");
    } finally {
      setLoading(false);
    }
  }, [q, planFilter, statusFilter, onNotify]);

  useEffect(() => {
    const t = setTimeout(loadTenants, 200);
    return () => clearTimeout(t);
  }, [loadTenants]);

  async function openDetail(id: number) {
    setLoadingDetail(true);
    try {
      const res = await boFetch<TenantDetailResponse>(`/tenants/${id}`);
      setDetail(res);
      setEditPlan(res.tenant.plan);
      setEditExpiry(
        res.tenant.planExpiresAt ? res.tenant.planExpiresAt.slice(0, 10) : "",
      );
      setEditMaxOutlets(res.tenant.maxOutlets);
      setEditMaxUsers(res.tenant.maxUsers);
      setNewOwnerPwd("");
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal memuat detail tenant", "err");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleToggleStatus(tenant: { id: number; name: string; isActive: boolean }) {
    const nextActive = !tenant.isActive;
    const confirmed = window.confirm(
      nextActive
        ? `Aktifkan kembali tenant "${tenant.name}"?`
        : `Tangguhkan (suspend) tenant "${tenant.name}"? Semua pengguna POS tenant ini akan langsung terblokir.`,
    );
    if (!confirmed) return;

    try {
      await boFetch(`/tenants/${tenant.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextActive }),
      });
      onNotify(
        nextActive
          ? `Tenant ${tenant.name} diaktifkan kembali.`
          : `Tenant ${tenant.name} berhasil di-suspend.`,
      );
      loadTenants();
      onMutated();
      if (detail?.tenant.id === tenant.id) openDetail(tenant.id);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal mengubah status tenant", "err");
    }
  }

  async function handleSaveSubscription(e: React.FormEvent) {
    e.preventDefault();
    if (!detail) return;
    setSavingSub(true);
    try {
      const planExpiresAt =
        editPlan === "FREE"
          ? null
          : editExpiry
            ? new Date(`${editExpiry}T23:59:59.000Z`).toISOString()
            : null;

      await boFetch(`/tenants/${detail.tenant.id}/subscription`, {
        method: "PATCH",
        body: JSON.stringify({
          plan: editPlan,
          planExpiresAt,
          maxOutlets: Number(editMaxOutlets),
          maxUsers: Number(editMaxUsers),
        }),
      });
      onNotify(`Paket & kuota ${detail.tenant.name} berhasil diperbarui.`);
      loadTenants();
      onMutated();
      openDetail(detail.tenant.id);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal menyimpan langganan", "err");
    } finally {
      setSavingSub(false);
    }
  }

  async function handleResetOwnerPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || newOwnerPwd.length < 8) return;
    setResettingPwd(true);
    try {
      const res = await boFetch<{ ownerEmail: string }>(
        `/tenants/${detail.tenant.id}/reset-owner-password`,
        {
          method: "POST",
          body: JSON.stringify({ newPassword: newOwnerPwd }),
        },
      );
      setNewOwnerPwd("");
      onNotify(`Password Owner (${res.ownerEmail}) berhasil direset.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal reset password", "err");
    } finally {
      setResettingPwd(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 card p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama tenant, slug, atau email owner..."
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] py-2 pl-9 pr-3 text-xs focus:border-[#0f5257] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-[var(--glass-2)] px-3 py-2 text-xs font-medium"
          >
            <option value="ALL">Semua Paket</option>
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-[var(--glass-2)] px-3 py-2 text-xs font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            onClick={loadTenants}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-medium hover:bg-[var(--well)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tenant Table */}
      <div className="overflow-hidden card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--line)] bg-[var(--bg)] font-mono-num text-[10.5px] uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Tenant &amp; Owner</th>
                <th className="px-4 py-3">Paket</th>
                <th className="px-4 py-3">Masa Aktif</th>
                <th className="px-4 py-3">Kuota</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {items.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--bg)]/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--ink)]">{t.name}</div>
                    <div className="font-mono-num text-[11px] text-[var(--muted)]">
                      {t.slug} · {t.owner?.email || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 font-mono-num text-[11px] font-semibold ${
                        t.effectivePlan === "PRO"
                          ? "bg-[#0f5257]/12 text-[#0f5257]"
                          : t.effectivePlan === "ENTERPRISE"
                            ? "bg-[#d9a962]/25 text-[#8a5d14]"
                            : "bg-black/6 text-[#5a6068]"
                      }`}
                    >
                      {t.plan}
                    </span>
                    {t.isPlanExpired && (
                      <div className="mt-0.5 font-mono-num text-[10px] font-semibold text-red-600">
                        EXPIRED (fallback FREE)
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono-num text-[11px]">
                    {t.plan === "FREE" ? "Selamanya" : formatDate(t.planExpiresAt)}
                  </td>
                  <td className="px-4 py-3 font-mono-num text-[11px]">
                    <div>
                      Outlet: <strong>{t.counts.outlets}</strong>/{t.maxOutlets}
                    </div>
                    <div>
                      Akun: <strong>{t.counts.users}</strong>/{t.maxUsers}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-0.5 font-mono-num text-[10.5px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/12 px-2.5 py-0.5 font-mono-num text-[10.5px] font-semibold text-red-700">
                        <Ban className="h-3 w-3" /> Suspend
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => openDetail(t.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#0b1013] px-2.5 py-1.5 font-medium text-white hover:opacity-90"
                      >
                        <Eye className="h-3.5 w-3.5" /> Detail
                      </button>
                      <button
                        onClick={() => handleToggleStatus(t)}
                        className={`rounded-lg border px-2.5 py-1.5 font-medium ${
                          t.isActive
                            ? "border-red-300 text-red-700 hover:bg-red-50"
                            : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {t.isActive ? "Suspend" : "Aktifkan"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--muted)]">
                    Tidak ada tenant yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Detail Modal */}
      {(detail || loadingDetail) && (
        <div
          onClick={() => {
            if (!savingSub && !resettingPwd) setDetail(null);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto border-[var(--line-2)] bg-[var(--raised)] p-6 text-[var(--text)] shadow-2xl"
          >
            {loadingDetail || !detail ? (
              <div className="py-12 text-center text-xs text-[var(--muted)]">
                Memuat detail tenant...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{detail.tenant.name}</h2>
                      <span className="rounded-md bg-[#0f5257]/12 px-2 py-0.5 font-mono-num text-xs font-semibold text-[#0f5257]">
                        {detail.tenant.plan}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono-num text-xs text-[var(--muted)]">
                      slug: {detail.tenant.slug} · terdaftar {formatDate(detail.tenant.createdAt)} ·
                      GMV 30h: <strong>{formatRupiah(detail.stats30d.gmv)}</strong> (
                      {detail.stats30d.paidOrders} order)
                    </p>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="rounded-lg border border-[var(--line)] p-1.5 hover:bg-[var(--well)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Edit Subscription & Quota */}
                <form
                  onSubmit={handleSaveSubscription}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4"
                >
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0f5257]">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Kontrol Paket Langganan &amp; Kuota
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium">Paket</label>
                      <select
                        value={editPlan}
                        onChange={(e) => {
                          const p = e.target.value as "FREE" | "PRO" | "ENTERPRISE";
                          setEditPlan(p);
                          if (p === "FREE") {
                            setEditMaxOutlets(1);
                            setEditMaxUsers(3);
                          } else if (p === "PRO") {
                            setEditMaxOutlets(20);
                            setEditMaxUsers(200);
                          } else {
                            setEditMaxOutlets(999);
                            setEditMaxUsers(9999);
                          }
                        }}
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--glass-2)] px-2.5 py-2 text-xs"
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium">Berlaku s/d</label>
                      <input
                        type="date"
                        disabled={editPlan === "FREE"}
                        value={editExpiry}
                        onChange={(e) => setEditExpiry(e.target.value)}
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--glass-2)] px-2.5 py-2 text-xs disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium">Max Outlet</label>
                      <input
                        type="number"
                        min={1}
                        value={editMaxOutlets}
                        onChange={(e) => setEditMaxOutlets(Number(e.target.value))}
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--glass-2)] px-2.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium">Max Akun</label>
                      <input
                        type="number"
                        min={1}
                        value={editMaxUsers}
                        onChange={(e) => setEditMaxUsers(Number(e.target.value))}
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--glass-2)] px-2.5 py-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingSub}
                      className="rounded-lg bg-[#0f5257] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b3e42] disabled:opacity-60"
                    >
                      {savingSub ? "Menyimpan..." : "Simpan Paket & Kuota"}
                    </button>
                  </div>
                </form>

                {/* Outlets & Users */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--line)] p-4">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Outlets ({detail.tenant.outlets.length})
                    </h4>
                    <div className="space-y-2 text-xs">
                      {detail.tenant.outlets.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-center justify-between rounded-lg bg-[var(--bg)] px-3 py-2"
                        >
                          <div>
                            <div className="font-semibold">{o.name}</div>
                            <div className="font-mono-num text-[10.5px] text-[var(--muted)]">
                              {o.code} · {o._count.orders} order
                            </div>
                          </div>
                          <span className="font-mono-num text-[10.5px] text-emerald-700">
                            {o.isActive ? "AKTIF" : "NONAKTIF"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--line)] p-4">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Akun Pengguna ({detail.tenant.users.length})
                    </h4>
                    <div className="max-h-44 space-y-1.5 overflow-y-auto text-xs">
                      {detail.tenant.users.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between rounded-lg bg-[var(--bg)] px-3 py-1.5"
                        >
                          <div>
                            <div className="font-semibold">{u.name}</div>
                            <div className="font-mono-num text-[10.5px] text-[var(--muted)]">
                              {u.email}
                            </div>
                          </div>
                          <span className="rounded bg-[var(--glass-2)] px-2 py-0.5 font-mono-num text-[10px] font-semibold">
                            {u.role.code}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reset Owner Password */}
                <form
                  onSubmit={handleResetOwnerPassword}
                  className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-50/60 p-4"
                >
                  <div className="min-w-[220px] flex-1">
                    <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-950">
                      <KeyRound className="h-3.5 w-3.5" />
                      Reset Password Owner (Support)
                    </label>
                    <input
                      type="text"
                      minLength={8}
                      value={newOwnerPwd}
                      onChange={(e) => setNewOwnerPwd(e.target.value)}
                      placeholder="Password baru min. 8 karakter..."
                      className="w-full rounded-lg border border-amber-300 bg-[var(--glass-2)] px-3 py-2 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resettingPwd || newOwnerPwd.length < 8}
                    className="rounded-lg bg-[#0b1013] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {resettingPwd ? "Mereset..." : "Reset Password"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
