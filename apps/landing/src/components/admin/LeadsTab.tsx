"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUS_META: Record<
  LeadStatus,
  { label: string; className: string }
> = {
  new: {
    label: "Baru",
    className: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  contacted: {
    label: "Dihubungi",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  demo: {
    label: "Demo",
    className: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  },
  won: {
    label: "Closing",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  lost: {
    label: "Batal",
    className: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
  },
};

function normalizeWaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

interface LeadsTabProps {
  onNotify: (msg: string, tone?: "ok" | "err") => void;
}

export default function LeadsTab({ onNotify }: LeadsTabProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Add lead modal
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBiz, setNewBiz] = useState("");
  const [newWa, setNewWa] = useState("");
  const [newOutlet, setNewOutlet] = useState("1 outlet");
  const [newPlan, setNewPlan] = useState("Pro");
  const [newMsg, setNewMsg] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { leads: Lead[] };
      setLeads(json.leads);
    } catch {
      onNotify("Gagal memuat daftar leads.", "err");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { lead: Lead };
      setLeads((prev) => prev.map((l) => (l.id === id ? json.lead : l)));
      if (selectedLead?.id === id) setSelectedLead(json.lead);
      onNotify(`Status diperbarui ke "${STATUS_META[status].label}".`);
    } catch {
      onNotify("Gagal memperbarui status.", "err");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { lead: Lead };
      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? json.lead : l))
      );
      setSelectedLead(json.lead);
      onNotify("Catatan lead disimpan.");
    } catch {
      onNotify("Gagal menyimpan catatan.", "err");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus lead ini secara permanen?")) return;
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setLeads((prev) => prev.filter((l) => l.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
      onNotify("Lead berhasil dihapus.");
    } catch {
      onNotify("Gagal menghapus lead.", "err");
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          businessName: newBiz,
          whatsapp: newWa,
          outletCount: newOutlet,
          planInterest: newPlan,
          message: newMsg,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { lead: Lead };
      setLeads((prev) => [json.lead, ...prev]);
      setAddOpen(false);
      setNewName("");
      setNewBiz("");
      setNewWa("");
      setNewMsg("");
      onNotify("Lead baru ditambahkan.");
    } catch {
      onNotify("Gagal menambahkan lead.", "err");
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Tanggal",
      "Nama",
      "Usaha",
      "WhatsApp",
      "Outlet",
      "Paket",
      "Status",
      "Sumber",
      "Pesan",
      "Catatan",
    ];
    const rows = filtered.map((l) => [
      new Date(l.createdAt).toLocaleString("id-ID"),
      l.name,
      l.businessName,
      l.whatsapp,
      l.outletCount,
      l.planInterest,
      STATUS_META[l.status].label,
      l.source,
      l.message,
      l.notes,
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tumpu-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = leads.filter((l) => {
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.businessName.toLowerCase().includes(q) ||
      l.whatsapp.toLowerCase().includes(q) ||
      l.planInterest.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const counts = {
    all: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    demo: leads.filter((l) => l.status === "demo").length,
    won: leads.filter((l) => l.status === "won").length,
    lost: leads.filter((l) => l.status === "lost").length,
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">
            Manajemen Leads
          </h2>
          <p className="text-[13.5px] text-[var(--ink-secondary)]">
            Kelola prospek yang masuk dari form demo/konsultasi di landing page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadLeads}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-medium hover:bg-[var(--surface-subtle)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-medium hover:bg-[var(--surface-subtle)] disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[var(--accent-hover)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Lead
          </button>
        </div>
      </div>

      {/* Pipeline Filter Pills + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "Semua"],
              ["new", "Baru"],
              ["contacted", "Dihubungi"],
              ["demo", "Demo"],
              ["won", "Closing"],
              ["lost", "Batal"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                statusFilter === key
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "bg-[var(--bg)] text-[var(--ink-secondary)] hover:text-[var(--ink)]"
              }`}
            >
              {label}
              <span className="font-mono-num text-[11px] opacity-75">
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, usaha, WA..."
            className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] py-2 pl-8 pr-3 text-[13px] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Leads List + Detail Split */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div
          className={`overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] ${
            selectedLead ? "lg:col-span-7" : "lg:col-span-12"
          }`}
        >
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[14px] font-medium">Belum ada leads yang cocok.</p>
              <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
                Prospek yang mengisi form &quot;Minta Demo Outlet&quot; di landing page akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg)]/60 font-mono-num text-[11px] uppercase tracking-wider text-[var(--ink-muted)]">
                    <th className="px-4 py-3">Kontak &amp; Usaha</th>
                    <th className="px-4 py-3">Paket</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Masuk</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtered.map((lead) => {
                    const active = selectedLead?.id === lead.id;
                    const waLink = `https://wa.me/${normalizeWaPhone(
                      lead.whatsapp
                    )}?text=${encodeURIComponent(
                      `Halo kak ${lead.name} dari ${lead.businessName}, terima kasih sudah menghubungi Tumpu POS. Kapan sempat kami bantu demo singkat?`
                    )}`;
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => {
                          setSelectedLead(lead);
                          setNotesDraft(lead.notes || "");
                        }}
                        className={`cursor-pointer transition-colors hover:bg-[var(--surface-subtle)]/60 ${
                          active ? "bg-[var(--accent)]/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[var(--ink)]">
                            {lead.name}
                          </div>
                          <div className="text-[12px] text-[var(--ink-secondary)]">
                            {lead.businessName} ·{" "}
                            <span className="font-mono-num">{lead.whatsapp}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium">{lead.planInterest}</div>
                          <div className="text-[11.5px] text-[var(--ink-muted)]">
                            {lead.outletCount}
                          </div>
                        </td>
                        <td
                          className="px-4 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              handleStatusChange(
                                lead.id,
                                e.target.value as LeadStatus
                              )
                            }
                            className={`rounded-md border-0 px-2.5 py-1 text-[12px] font-medium outline-none ${
                              STATUS_META[lead.status].className
                            }`}
                          >
                            {Object.entries(STATUS_META).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="font-mono-num whitespace-nowrap px-4 py-3.5 text-[11.5px] text-[var(--ink-muted)]">
                          {new Date(lead.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td
                          className="px-4 py-3.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat via WhatsApp"
                              className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDelete(lead.id)}
                              title="Hapus Lead"
                              className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:border-red-500/40 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Drawer */}
        {selectedLead && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 lg:col-span-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    STATUS_META[selectedLead.status].className
                  }`}
                >
                  {STATUS_META[selectedLead.status].label}
                </span>
                <h3 className="mt-2 text-[17px] font-semibold">
                  {selectedLead.name}
                </h3>
                <p className="text-[13px] text-[var(--ink-secondary)]">
                  {selectedLead.businessName} · {selectedLead.outletCount}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">WhatsApp</span>
                <span className="font-mono-num font-medium">
                  {selectedLead.whatsapp}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">Paket Diminati</span>
                <span className="font-medium">{selectedLead.planInterest}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">Sumber</span>
                <span className="font-mono-num text-[12px]">
                  {selectedLead.source}
                </span>
              </div>
            </div>

            {selectedLead.message && (
              <div className="mt-4">
                <label className="text-[11.5px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                  Pesan dari Prospek
                </label>
                <p className="mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3.5 text-[13px] leading-relaxed text-[var(--ink-secondary)]">
                  {selectedLead.message}
                </p>
              </div>
            )}

            <div className="mt-4">
              <label className="text-[11.5px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                Catatan Internal Tim Sales
              </label>
              <textarea
                rows={4}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Tulis hasil follow-up, jadwal demo, atau kebutuhan khusus..."
                className="mt-1.5 w-full resize-none rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] p-3 text-[13px] outline-none focus:border-[var(--accent)]"
              />
              <div className="mt-3 flex items-center justify-between gap-2">
                <a
                  href={`https://wa.me/${normalizeWaPhone(
                    selectedLead.whatsapp
                  )}?text=${encodeURIComponent(
                    `Halo kak ${selectedLead.name} dari ${selectedLead.businessName}, saya dari tim Tumpu POS.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12.5px] font-medium text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Follow-up WA
                </a>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
                >
                  {savingNotes ? "Menyimpan..." : "Simpan Catatan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-semibold">Tambah Lead Manual</h3>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[var(--ink-secondary)]">
                  Nama *
                </label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[var(--ink-secondary)]">
                  No. WhatsApp *
                </label>
                <input
                  required
                  value={newWa}
                  onChange={(e) => setNewWa(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-[var(--ink-secondary)]">
                    Nama Usaha
                  </label>
                  <input
                    value={newBiz}
                    onChange={(e) => setNewBiz(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-[var(--ink-secondary)]">
                    Paket
                  </label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[var(--ink-secondary)]">
                  Jumlah Outlet
                </label>
                <input
                  value={newOutlet}
                  onChange={(e) => setNewOutlet(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-[var(--ink-secondary)]">
                  Catatan / Pesan
                </label>
                <textarea
                  rows={2}
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded-lg border border-[var(--border-strong)] px-3.5 py-2 text-[13px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)]"
                >
                  Simpan Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
