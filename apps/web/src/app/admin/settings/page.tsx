"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";
import { useUiStore, type AccentMode } from "@/stores/ui-store";

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
  const { theme, setTheme, accent, setAccent, pushToast } = useUiStore();
  const [form, setForm] = useState<SettingsData | null>(null);

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<SettingsData>("/settings"),
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
            <h3 className="text-sm font-bold">Tampilan Cadra UI</h3>
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
