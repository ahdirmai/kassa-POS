"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Plus, RefreshCw, Search, X, XCircle } from "lucide-react";
import {
  boFetch,
  formatDateTime,
  formatRupiah,
  type SubscriptionInvoiceItem,
  type TenantListItem,
} from "@/lib/api";

export default function SubscriptionsSection({
  onNotify,
  onMutated,
}: {
  onNotify: (msg: string, tone?: "ok" | "err") => void;
  onMutated: () => void;
}) {
  const [items, setItems] = useState<SubscriptionInvoiceItem[]>([]);
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [q, setQ] = useState("");

  // Create invoice modal
  const [showCreate, setShowCreate] = useState(false);
  const [tenantId, setTenantId] = useState<number>(0);
  const [plan, setPlan] = useState<"PRO" | "ENTERPRISE">("PRO");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY" | "CUSTOM">("MONTHLY");
  const [durationDays, setDurationDays] = useState(30);
  const [amount, setAmount] = useState(49000);
  const [paymentMethod, setPaymentMethod] = useState<
    "MANUAL_TRANSFER" | "MIDTRANS" | "XENDIT" | "COMP"
  >("MANUAL_TRANSFER");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (q.trim()) params.set("q", q.trim());

      const [invRes, tenRes] = await Promise.all([
        boFetch<{ items: SubscriptionInvoiceItem[] }>(`/invoices?${params.toString()}`),
        boFetch<{ items: TenantListItem[] }>("/tenants"),
      ]);
      setItems(invRes.items);
      setTenants(tenRes.items);
      if (tenRes.items.length > 0 && tenantId === 0) {
        setTenantId(tenRes.items[0].id);
      }
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal memuat invoice", "err");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, q, onNotify, tenantId]);

  useEffect(() => {
    const t = setTimeout(loadData, 200);
    return () => clearTimeout(t);
  }, [loadData]);

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setSubmitting(true);
    try {
      await boFetch("/invoices", {
        method: "POST",
        body: JSON.stringify({
          tenantId: Number(tenantId),
          plan,
          billingCycle,
          durationDays: Number(durationDays),
          amount: Number(amount),
          paymentMethod,
          referenceNo: referenceNo.trim() || undefined,
          notes: notes.trim() || undefined,
          markAsPaid,
        }),
      });
      setShowCreate(false);
      setReferenceNo("");
      setNotes("");
      setMarkAsPaid(false);
      onNotify(
        markAsPaid
          ? "Invoice dibuat & langsung lunas — paket tenant diperpanjang!"
          : "Invoice baru berhasil dibuat.",
      );
      loadData();
      onMutated();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal membuat invoice", "err");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(inv: SubscriptionInvoiceItem) {
    const ok = window.confirm(
      `Konfirmasi pembayaran ${inv.invoiceNo} (${formatRupiah(inv.amount)}) untuk ${inv.tenant?.name}? Paket akan otomatis aktif/diperpanjang +${inv.durationDays} hari.`,
    );
    if (!ok) return;
    try {
      await boFetch(`/invoices/${inv.id}/approve`, { method: "POST", body: JSON.stringify({}) });
      onNotify(`Invoice ${inv.invoiceNo} disetujui — paket ${inv.plan} aktif!`);
      loadData();
      onMutated();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal approve invoice", "err");
    }
  }

  async function handleCancel(inv: SubscriptionInvoiceItem) {
    const ok = window.confirm(`Batalkan invoice ${inv.invoiceNo}?`);
    if (!ok) return;
    try {
      await boFetch(`/invoices/${inv.id}/cancel`, { method: "POST" });
      onNotify(`Invoice ${inv.invoiceNo} dibatalkan.`);
      loadData();
      onMutated();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal membatalkan invoice", "err");
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 card p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari no. invoice, referensi transfer, atau nama tenant..."
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] py-2 pl-9 pr-3 text-xs focus:border-[#0f5257] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-[var(--glass-2)] px-3 py-2 text-xs font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">PENDING</option>
            <option value="PAID">PAID</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-medium hover:bg-[var(--well)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f5257] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0b3e42]"
          >
            <Plus className="h-3.5 w-3.5" />
            Buat Invoice
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--line)] bg-[var(--bg)] font-mono-num text-[10.5px] uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">Paket &amp; Durasi</th>
                <th className="px-4 py-3">Nominal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {items.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--bg)]/60">
                  <td className="px-4 py-3">
                    <div className="font-mono-num font-semibold">{inv.invoiceNo}</div>
                    <div className="font-mono-num text-[10.5px] text-[var(--muted)]">
                      {inv.paymentMethod} {inv.referenceNo ? `· ${inv.referenceNo}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{inv.tenant?.name || `#${inv.tenantId}`}</div>
                    <div className="font-mono-num text-[10.5px] text-[var(--muted)]">
                      {formatDateTime(inv.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono-num text-[11px]">
                    <span className="font-semibold text-[#0f5257]">{inv.plan}</span> ·{" "}
                    {inv.durationDays} hari ({inv.billingCycle})
                  </td>
                  <td className="px-4 py-3 font-mono-num font-bold">
                    {formatRupiah(inv.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 font-mono-num text-[10.5px] font-semibold ${
                        inv.status === "PAID"
                          ? "bg-emerald-500/12 text-emerald-700"
                          : inv.status === "PENDING"
                            ? "bg-amber-500/15 text-amber-800"
                            : "bg-black/8 text-[#5a6068]"
                      }`}
                    >
                      {inv.status}
                    </span>
                    {inv.approvedBy && (
                      <div className="mt-0.5 text-[10px] text-[var(--muted)]">
                        oleh {inv.approvedBy.name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inv.status === "PENDING" ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(inv)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-800"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleCancel(inv)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1.5 font-medium text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Batal
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono-num text-[11px] text-[var(--muted)]">
                        {inv.paidAt ? formatDateTime(inv.paidAt) : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--muted)]">
                    Belum ada invoice langganan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateInvoice}
            className="card w-full max-w-lg space-y-4 border-[var(--line-2)] bg-[var(--raised)] p-6 text-[var(--text)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="text-base font-bold">Buat Invoice Langganan</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-[var(--line)] p-1.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-medium">Tenant</label>
                <select
                  required
                  value={tenantId}
                  onChange={(e) => setTenantId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--glass-2)] px-3 py-2"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.plan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium">Paket</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as "PRO" | "ENTERPRISE")}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--glass-2)] px-3 py-2"
                  >
                    <option value="PRO">Tumpu Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-medium">Siklus</label>
                  <select
                    value={billingCycle}
                    onChange={(e) => {
                      const c = e.target.value as "MONTHLY" | "YEARLY" | "CUSTOM";
                      setBillingCycle(c);
                      if (c === "MONTHLY") {
                        setDurationDays(30);
                        if (plan === "PRO") setAmount(49000);
                      } else if (c === "YEARLY") {
                        setDurationDays(365);
                        if (plan === "PRO") setAmount(490000);
                      }
                    }}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--glass-2)] px-3 py-2"
                  >
                    <option value="MONTHLY">Bulanan (30 hari)</option>
                    <option value="YEARLY">Tahunan (365 hari)</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium">Durasi (Hari)</label>
                  <input
                    type="number"
                    min={1}
                    max={1095}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--line)] px-3 py-2 font-mono-num"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium">Nominal (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--line)] px-3 py-2 font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-medium">Metode Bayar</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value as "MANUAL_TRANSFER" | "MIDTRANS" | "XENDIT" | "COMP",
                      )
                    }
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--glass-2)] px-3 py-2"
                  >
                    <option value="MANUAL_TRANSFER">Transfer Manual</option>
                    <option value="MIDTRANS">Midtrans</option>
                    <option value="XENDIT">Xendit</option>
                    <option value="COMP">Gratis / Trial Comp</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-medium">No. Referensi / Bukti</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="Mis. BCA-20261121-01"
                    className="w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-medium">Catatan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opsional..."
                  className="w-full rounded-xl border border-[var(--line)] px-3 py-2"
                />
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-[#0f5257]/25 bg-[#0f5257]/5 px-3 py-2.5 font-medium text-[#0f5257]">
                <input
                  type="checkbox"
                  checked={markAsPaid}
                  onChange={(e) => setMarkAsPaid(e.target.checked)}
                />
                Tandai langsung LUNAS &amp; perpanjang paket tenant sekarang
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-[var(--line)] px-4 py-2 text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#0f5257] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b3e42] disabled:opacity-60"
              >
                {submitting ? "Menyimpan..." : "Simpan Invoice"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
