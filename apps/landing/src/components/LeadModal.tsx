"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, MessageCircle, Send, X } from "lucide-react";

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  defaultPlan?: string;
  source?: string;
  waUrl: string;
  onSubmitted?: () => void;
}

export default function LeadModal({
  open,
  onClose,
  defaultPlan = "Pro",
  source = "landing-modal",
  waUrl,
  onSubmitted,
}: LeadModalProps) {
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [outletCount, setOutletCount] = useState("1 outlet");
  const [planInterest, setPlanInterest] = useState(defaultPlan);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setPlanInterest(defaultPlan);
  }, [defaultPlan]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !whatsapp.trim()) {
      setError("Nama dan nomor WhatsApp wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      let utm: { utmSource?: string; utmMedium?: string; utmCampaign?: string } = {};
      try {
        const params = new URLSearchParams(window.location.search);
        const saved = JSON.parse(sessionStorage.getItem("tumpu_utm") || "{}") as typeof utm;
        utm = {
          utmSource: params.get("utm_source") || saved.utmSource,
          utmMedium: params.get("utm_medium") || saved.utmMedium,
          utmCampaign: params.get("utm_campaign") || saved.utmCampaign,
        };
      } catch {}

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          businessName,
          whatsapp,
          outletCount,
          planInterest,
          message,
          source,
          ...utm,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Gagal mengirim permintaan.");
      } else {
        setSubmitted(true);
        onSubmitted?.();
      }
    } catch {
      setError("Koneksi bermasalah. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSubmitted(false);
    setError("");
    setName("");
    setBusinessName("");
    setWhatsapp("");
    setMessage("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={resetAndClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <p className="font-mono-num text-[10.5px] uppercase tracking-[0.14em] text-[var(--accent)]">
              Konsultasi &amp; Demo Gratis
            </p>
            <h3 className="mt-0.5 text-[18px] font-semibold tracking-tight">
              Diskusi kebutuhan outlet Anda
            </h3>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Tutup"
            className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-7 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="mt-4 text-[18px] font-semibold">
              Terima kasih, {name}!
            </h4>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-secondary)]">
              Permintaan Anda sudah tercatat. Tim Tumpu akan menghubungi via
              WhatsApp dalam waktu dekat untuk demo dan bantu setup outlet.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                <MessageCircle className="h-4 w-4" />
                Chat WhatsApp Sekarang
              </a>
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-[13.5px] font-medium text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--ink-secondary)]">
                  Nama Anda *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="cth. Budi Santoso"
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3.5 py-2.5 text-[13.5px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--ink-secondary)]">
                  No. WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="cth. 08123456789"
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3.5 py-2.5 text-[13.5px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--ink-secondary)]">
                  Nama Cafe / Rumah Makan
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="cth. Kopi Senja"
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3.5 py-2.5 text-[13.5px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--ink-secondary)]">
                  Jumlah Outlet
                </label>
                <select
                  value={outletCount}
                  onChange={(e) => setOutletCount(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3.5 py-2.5 text-[13.5px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
                >
                  <option value="1 outlet">1 outlet</option>
                  <option value="2-5 outlet">2 – 5 outlet</option>
                  <option value="6-15 outlet">6 – 15 outlet</option>
                  <option value="15+ outlet">Lebih dari 15 outlet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--ink-secondary)]">
                Paket yang Diminati
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Starter", "Pro", "Enterprise"].map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setPlanInterest(plan)}
                    className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
                      planInterest === plan
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border-strong)] bg-[var(--bg)] text-[var(--ink-secondary)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--ink-secondary)]">
                Kebutuhan / Pertanyaan (opsional)
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Misal: mau tanya soal printer thermal, migrasi menu, atau instalasi server sendiri..."
                className="w-full resize-none rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3.5 py-2.5 text-[13.5px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[12.5px] font-medium text-[var(--accent)] hover:underline"
              >
                Atau langsung via WhatsApp →
              </a>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? "Mengirim..." : "Kirim Permintaan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
