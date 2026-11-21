"use client";

import { useState } from "react";
import { ShieldAlert, X } from "lucide-react";

export function PinApprovalModal({
  open,
  title,
  description,
  requireReason = true,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  requireReason?: boolean;
  onCancel: () => void;
  onConfirm: (pin: string, reason: string) => Promise<void> | void;
}) {
  const [pin, setPin] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{4,6}$/.test(pin)) {
      setError("PIN harus 4-6 digit angka");
      return;
    }
    if (requireReason && reason.trim().length < 3) {
      setError("Mohon isi alasan minimal 3 karakter");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(pin, reason.trim());
      setPin("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={onCancel}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--bad)]/15 text-[var(--bad)]">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="text-xs text-[var(--muted)]">{description}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup">
            <X className="h-4 w-4" />
          </button>
        </div>

        {requireReason && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Alasan (dicatat di Audit Log)</label>
            <input
              className="cadra-input"
              placeholder="Contoh: Salah input menu / pelanggan batal"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">PIN Manager / Owner</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            className="cadra-input text-center text-lg tracking-[0.4em]"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
          <p className="mt-1 text-[11px] text-[var(--muted)]">Demo PIN Manager: 2222 · Owner: 1111</p>
        </div>

        {error && <p className="text-xs font-semibold text-[var(--bad)]">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-cadra btn-cadra--ghost">
            Batal
          </button>
          <button type="submit" disabled={loading} className="btn-cadra btn-cadra--danger">
            {loading ? "Memverifikasi..." : "Konfirmasi Approval"}
          </button>
        </div>
      </form>
    </div>
  );
}
