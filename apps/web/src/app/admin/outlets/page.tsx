"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Crown, Lock, Plus, Users } from "lucide-react";
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

export default function OutletsAndPlanPage() {
  const qc = useQueryClient();
  const { setSession } = useAuthStore();
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

  const handleChangePlan = async (plan: "FREE" | "PRO") => {
    try {
      const res = await apiFetch<{ accessToken: string; user: UserSession }>("/outlets/plan", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      setSession(res.user, res.accessToken);
      pushToast(
        plan === "PRO"
          ? "Berhasil upgrade ke Kassa Pro! Multi-outlet, KDS, Stok & Laporan kini terbuka."
          : "Paket diubah ke Free (1 Outlet, maks 3 akun, khusus POS).",
        "good",
      );
      window.location.reload();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal mengubah paket", "bad");
    }
  };

  const tenant = data?.tenant;
  const isFree = tenant?.plan === "FREE";

  return (
    <CadraShell title="Outlet & Paket Langganan" crumb="Multi-Tenant">
      {isLoading || !tenant ? (
        <div className="glass-card p-6 text-sm text-[var(--muted)]">Memuat data tenant &amp; outlet...</div>
      ) : (
        <div className="space-y-6">
          {/* Plan & Quota Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Paket Aktif</span>
                <Crown className={`h-4 w-4 ${isFree ? "text-[var(--muted)]" : "text-amber-500"}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{isFree ? "Starter (FREE)" : "Kassa PRO"}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {isFree ? "Khusus Kasir POS · 1 Outlet · Total 3 Akun" : "All-In: Multi-Outlet, KDS, Stok/HPP & Laporan"}
              </p>
              <div className="mt-4">
                {isFree ? (
                  <button onClick={() => handleChangePlan("PRO")} className="btn-cadra btn-cadra--primary w-full text-xs">
                    Upgrade ke Pro · Rp49.000/bln
                  </button>
                ) : (
                  <button onClick={() => handleChangePlan("FREE")} className="btn-cadra w-full text-xs">
                    Simulasikan Mode Free
                  </button>
                )}
              </div>
            </div>

            <div className="glass-card p-5">
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

            <div className="glass-card p-5">
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
                    Upgrade ke <b>Kassa Pro (Rp49.000/bulan)</b> untuk menambah outlet serta membuka KDS, Stok/HPP, dan Laporan.
                  </p>
                  <button
                    onClick={() => handleChangePlan("PRO")}
                    className="btn-cadra btn-cadra--primary mt-3 w-full text-xs"
                  >
                    Aktifkan Kassa Pro Sekarang
                  </button>
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
