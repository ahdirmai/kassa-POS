"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Sparkles } from "lucide-react";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore, type AccentMode } from "@/stores/ui-store";

interface OnboardingStatus {
  completed: boolean;
  hasPin: boolean;
  sampleDataActive: boolean;
  businessType: string | null;
  foodTypes: string[];
  serviceMode: string | null;
}

interface SettingsData {
  businessName: string;
  outletName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  taxRatePercent: number;
  serviceChargePercent: number;
  taxInclusive: boolean;
  taxAfterService: boolean;
  roundingUnit: number;
}

const ACCENTS: AccentMode[] = ["ocean", "sage", "coral", "amber", "mono"];

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme, accent, setAccent, pushToast } = useUiStore();
  const [form, setForm] = useState<SettingsData | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<SettingsData>("/settings"),
  });

  const { data: onboarding } = useQuery({
    queryKey: ["onboarding-status", user?.outletId],
    queryFn: () => apiFetch<OnboardingStatus>("/onboarding/status"),
    enabled: user?.roleCode === "OWNER",
  });

  const resetSampleMut = useMutation({
    mutationFn: () => apiFetch<{ ok: boolean; message: string }>("/onboarding/reset-sample", { method: "POST" }),
    onSuccess: (res) => {
      setConfirmReset(false);
      queryClient.invalidateQueries();
      pushToast(res.message || "Data contoh berhasil direset!", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () =>
      apiFetch<Array<{ id: number; action: string; entityType: string; reason: string | null; createdAt: string; user?: { name: string } | null }>>(
        "/settings/audit-logs",
      ),
  });

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  const saveMut = useMutation({
    mutationFn: () => apiFetch("/settings", { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: () => pushToast("Pengaturan bisnis & pajak disimpan", "good"),
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  return (
    <CadraShell title="Pengaturan & Audit Log" crumb="Pengaturan">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tax & Business Settings */}
        <section className="cadra-card space-y-4">
          <h2 className="text-sm font-bold">Profil Bisnis, Pajak (PB1) &amp; Service Charge</h2>
          {form && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-[var(--muted)]">Nama Bisnis</label>
                <input className="cadra-input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">PB1 (%)</label>
                  <input type="number" className="cadra-input" value={form.taxRatePercent} onChange={(e) => setForm({ ...form, taxRatePercent: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Service (%)</label>
                  <input type="number" className="cadra-input" value={form.serviceChargePercent} onChange={(e) => setForm({ ...form, serviceChargePercent: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Pembulatan (Rp)</label>
                  <input type="number" className="cadra-input" value={form.roundingUnit} onChange={(e) => setForm({ ...form, roundingUnit: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-[var(--muted)]">Footer Struk</label>
                <input className="cadra-input" value={form.receiptFooter} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} />
              </div>
              <button onClick={() => saveMut.mutate()} className="btn-cadra btn-cadra--primary">
                Simpan Pengaturan
              </button>
            </div>
          )}

          {/* Cadra Theme & Accent Controls */}
          <div className="border-t border-[var(--line)] pt-4 space-y-3">
            <h3 className="text-sm font-bold">Tampilan &amp; Tema Tumpu</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setTheme("light")} className="chip" data-active={theme === "light"}>Light Mode</button>
              <button onClick={() => setTheme("dark")} className="chip" data-active={theme === "dark"}>Dark Mode</button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENTS.map((a) => (
                <button key={a} onClick={() => setAccent(a)} className="chip capitalize" data-active={accent === a}>
                  Accent: {a}
                </button>
              ))}
            </div>
          </div>

          {/* Onboarding & Reset Data Contoh (Owner only) */}
          {user?.roleCode === "OWNER" && (
            <div className="border-t border-[var(--line)] pt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold">Data Contoh (Seeder) &amp; Onboarding</h3>
                {onboarding?.sampleDataActive && (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    Data Contoh Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted)]">
                Reset data contoh akan menghapus semua menu, kategori, add-on, meja, stok, dan transaksi uji coba di{" "}
                <strong>outlet aktif ini saja</strong> agar siap dipakai berjualan. Akun staf &amp; pengaturan tetap aman.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Link href="/onboarding" className="btn-cadra">
                  <Sparkles className="h-3.5 w-3.5" />
                  Jalankan Ulang Onboarding / Ganti Template
                </Link>

                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="btn-cadra border border-red-500/40 text-red-600 dark:text-red-400"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Data Contoh
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-2 text-xs">
                    <span className="font-semibold text-red-700 dark:text-red-300">Yakin hapus semua data outlet ini?</span>
                    <button
                      type="button"
                      disabled={resetSampleMut.isPending}
                      onClick={() => resetSampleMut.mutate()}
                      className="rounded-lg bg-red-600 px-3 py-1 font-bold text-white hover:bg-red-700"
                    >
                      {resetSampleMut.isPending ? "Mereset..." : "Ya, Reset Sekarang"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="rounded-lg px-2 py-1 font-semibold text-[var(--muted)]"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Audit Logs */}
        <section className="cadra-card space-y-3">
          <h2 className="text-sm font-bold">Audit Log Terbaru (Immutable)</h2>
          <div className="max-h-[460px] overflow-y-auto divide-y divide-[var(--line)] text-xs">
            {logs.map((l) => (
              <div key={l.id} className="py-2.5 flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{l.action} · <span className="text-[var(--muted)]">{l.entityType}</span></div>
                  <div className="text-[var(--muted)]">
                    {l.user?.name ?? "System"} {l.reason ? `— ${l.reason}` : ""}
                  </div>
                </div>
                <span className="whitespace-nowrap text-[11px] text-[var(--muted)]">
                  {new Date(l.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CadraShell>
  );
}
