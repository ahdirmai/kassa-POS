"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Crown, Lock, MessageCircle, Plus, Users } from "lucide-react";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";
import { useAuthStore, type UserSession } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

interface OutletItem {
  id: number;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  staffCount: number;
  orderCount: number;
}

interface OutletsResponse {
  tenant: {
    id: number;
    name: string;
    slug: string;
    plan: "FREE" | "PRO" | "ENTERPRISE";
    maxOutlets: number;
    maxUsers: number;
    usedOutlets: number;
    usedUsers: number;
  };
  activeOutletId: number;
  outlets: OutletItem[];
}

const TUMPU_SUPPORT_WA =
  (process.env.NEXT_PUBLIC_SUPPORT_WA || "62895388220777").replace(/\D/g, "") || "62895388220777";

export default function OutletsAndPlanPage() {
  const qc = useQueryClient();
  const { user, setSession } = useAuthStore();
  const pushToast = useUiStore((s) => s.pushToast);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["outlets-summary"],
    queryFn: () => apiFetch<OutletsResponse>("/outlets"),
  });

  const handleCreateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch("/outlets", {
        method: "POST",
        body: JSON.stringify({ name, address: address || undefined, phone: phone || undefined }),
      });
      setName("");
      setAddress("");
      setPhone("");
      pushToast("Outlet baru berhasil dibuat!", "good");
      qc.invalidateQueries({ queryKey: ["outlets-summary"] });
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal menambah outlet", "bad");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitch = async (outletId: number) => {
    try {
      const res = await apiFetch<{ accessToken: string; user: UserSession }>("/outlets/switch", {
        method: "POST",
        body: JSON.stringify({ outletId }),
      });
      setSession(res.user, res.accessToken);
      pushToast(`Aktif di ${res.user.outletName ?? "outlet baru"}`, "good");
      window.location.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal berpindah outlet", "bad");
    }
  };

  const tenant = data?.tenant;
  const isFree = tenant?.plan === "FREE";

  const upgradeWaUrl = tenant
    ? `https://wa.me/${TUMPU_SUPPORT_WA}?text=${encodeURIComponent(
        `Halo Tim Tumpu, saya ingin mengaktifkan paket Tumpu Pro (Rp49.000/bulan).\n\nNama Bisnis: ${tenant.name}\nSlug Tenant: ${tenant.slug}\nEmail Owner: ${user?.email ?? "-"}\nJumlah Outlet: ${tenant.usedOutlets}`,
      )}`
    : `https://wa.me/${TUMPU_SUPPORT_WA}`;

  const supportWaUrl = tenant
    ? `https://wa.me/${TUMPU_SUPPORT_WA}?text=${encodeURIComponent(
        `Halo Tim Tumpu, saya butuh bantuan terkait langganan Tumpu Pro.\n\nNama Bisnis: ${tenant.name}\nSlug Tenant: ${tenant.slug}\nEmail Owner: ${user?.email ?? "-"}`,
      )}`
    : `https://wa.me/${TUMPU_SUPPORT_WA}`;

  return (
    <CadraShell title="Outlet & Paket Langganan" crumb="Multi-Tenant">
      {isLoading || !tenant ? (
        <div className="cadra-card p-6 text-sm text-[var(--muted)]">Memuat data tenant &amp; outlet...</div>
      ) : (
        <div className="space-y-6">
          {/* Plan & Quota Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="cadra-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Paket Aktif</span>
                <Crown className={`h-4 w-4 ${isFree ? "text-[var(--muted)]" : "text-amber-500"}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{isFree ? "Starter (FREE)" : "Tumpu PRO"}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {isFree
                  ? "Khusus Kasir POS · 1 Outlet · Total 3 Akun"
                  : "All-In: Multi-Outlet (20 cabang), KDS, Stok/HPP, Laporan & Menu Digital SEO"}
              </p>
              <div className="mt-4">
                {isFree ? (
                  <a
                    href={upgradeWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cadra btn-cadra--primary w-full justify-center text-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Upgrade ke Pro via WhatsApp · Rp49rb/bln
                  </a>
                ) : (
                  <a
                    href={supportWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cadra w-full justify-center text-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Paket Pro Aktif · Hubungi CS via WA
                  </a>
                )}
              </div>
            </div>

            <div className="cadra-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Kuota Outlet</span>
                <Building2 className="h-4 w-4 text-[var(--muted)]" />
              </div>
              <div className="mt-2 font-mono text-2xl font-bold">
                {tenant.usedOutlets} / {tenant.maxOutlets}
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {isFree ? "Upgrade ke Pro untuk membuka multi-outlet." : "Anda dapat menambah cabang baru kapan saja."}
              </p>
            </div>

            <div className="cadra-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Kuota Akun (Owner + Staf)</span>
                <Users className="h-4 w-4 text-[var(--muted)]" />
              </div>
              <div className="mt-2 font-mono text-2xl font-bold">
                {tenant.usedUsers} / {tenant.maxUsers}
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {isFree ? "Maksimal 1 Owner + 2 Staf (total 3 akun)." : "Kuota staf luas untuk semua shift & cabang."}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Outlet List */}
            <div className="glass-card p-5 lg:col-span-7">
              <h2 className="mb-4 text-base font-bold">Daftar Outlet ({tenant.name})</h2>
              <div className="space-y-3">
                {data.outlets.map((o) => {
                  const active = o.id === data.activeOutletId;
                  return (
                    <div
                      key={o.id}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
                        active ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--rim)] bg-[var(--glass-2)]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-[var(--ink)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--on-ink)]">
                            {o.code}
                          </span>
                          <span className="font-bold">{o.name}</span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          {o.address || "Alamat belum diatur"} · {o.staffCount} staf · {o.orderCount} order
                        </div>
                      </div>
                      {active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          <Check className="h-3.5 w-3.5" />
                          Aktif
                        </span>
                      ) : (
                        <button onClick={() => handleSwitch(o.id)} className="btn-cadra text-xs">
                          Pindah ke Outlet Ini
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Outlet Form */}
            <div className="glass-card p-5 lg:col-span-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold">Tambah Cabang / Outlet</h2>
                {isFree && <Lock className="h-4 w-4 text-amber-500" />}
              </div>

              {isFree ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed">
                  <p className="font-bold text-amber-800 dark:text-amber-300">Multi-Outlet terkunci di Paket Free</p>
                  <p className="mt-1 text-[var(--muted)]">
                    Paket Free dibatasi 1 Outlet, total 3 akun (1 Owner + 2 Staf), dan khusus layar Kasir POS.
                    Upgrade ke <b>Tumpu Pro (Rp49.000/bulan)</b> untuk menambah outlet serta membuka KDS, Stok/HPP, Laporan, dan Landing Page Menu Digital (SEO Google).
                  </p>
                  <a
                    href={upgradeWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cadra btn-cadra--primary mt-3 w-full justify-center text-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Aktifkan Tumpu Pro via WhatsApp
                  </a>
                </div>
              ) : (
                <form onSubmit={handleCreateOutlet} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Outlet Baru</label>
                    <input
                      type="text"
                      className="cadra-input"
                      placeholder="Contoh: Cabang Senopati"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Alamat</label>
                    <input
                      type="text"
                      className="cadra-input"
                      placeholder="Jl. Senopati No. 10"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Telepon</label>
                    <input
                      type="text"
                      className="cadra-input"
                      placeholder="(021) 555-0199"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-cadra btn-cadra--primary w-full text-xs">
                    <Plus className="h-4 w-4" />
                    {submitting ? "Menyimpan..." : "Buat Outlet Baru"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </CadraShell>
  );
}
