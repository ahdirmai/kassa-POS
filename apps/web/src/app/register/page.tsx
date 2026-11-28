"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, RefreshCw, Store } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useUiStore } from "@/stores/ui-store";
import { TumpuBrandMark } from "@/components/tumpu-brand-mark";

interface RegisterResponse {
  requiresEmailVerification: boolean;
  email: string;
  outletCode?: string;
  message: string;
  devVerifyUrl?: string;
}

export default function RegisterPage() {
  const pushToast = useUiStore((s) => s.pushToast);

  const [businessName, setBusinessName] = useState("");
  const [outletName, setOutletName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingVerify, setPendingVerify] = useState<RegisterResponse | null>(null);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          businessName,
          outletName: outletName || undefined,
          ownerName,
          email,
          password,
        }),
      });
      if (res.outletCode) {
        window.localStorage.setItem("tumpu_outlet_code", res.outletCode);
      }
      setPendingVerify(res);
      setCooldown(60);
      pushToast("Pendaftaran berhasil! Cek email Anda untuk konfirmasi.", "good");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingVerify || resending || cooldown > 0) return;
    setResending(true);
    try {
      const res = await apiFetch<{ ok: boolean; message: string; devVerifyUrl?: string }>(
        "/auth/resend-verification",
        {
          method: "POST",
          body: JSON.stringify({ email: pendingVerify.email }),
        },
      );
      setPendingVerify((prev) =>
        prev ? { ...prev, devVerifyUrl: res.devVerifyUrl ?? prev.devVerifyUrl } : prev,
      );
      setCooldown(60);
      pushToast(res.message || "Email konfirmasi dikirim ulang!", "good");
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal mengirim ulang email", "bad");
    } finally {
      setResending(false);
    }
  };

  if (pendingVerify) {
    return (
      <div className="grid min-h-dvh place-items-center p-5">
        <div className="cadra-card w-full max-w-md space-y-5 p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <Mail className="h-7 w-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg font-bold tracking-tight">Cek Kotak Masuk Email Anda</h1>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              Kami telah mengirimkan tautan konfirmasi ke{" "}
              <strong className="text-[var(--ink)]">{pendingVerify.email}</strong>. Klik tautan
              tersebut untuk mengaktifkan akun dan melanjutkan setup outlet Anda.
            </p>
          </div>

          {pendingVerify.devVerifyUrl && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-left text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                <CheckCircle2 className="h-4 w-4" />
                Mode Dev Lokal (Console Mailer)
              </div>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                SMTP/Resend belum diisi di `.env`. Klik tautan di bawah untuk menyimulasikan klik
                dari email:
              </p>
              <a
                href={pendingVerify.devVerifyUrl}
                className="mt-2 inline-flex items-center gap-1.5 font-semibold text-[var(--primary-ink)] underline"
              >
                Konfirmasi Email Sekarang
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={resending || cooldown > 0}
              onClick={handleResend}
              className="btn-cadra w-full justify-center text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
              {resending
                ? "Mengirim ulang..."
                : cooldown > 0
                  ? `Kirim Ulang Email (${cooldown}d)`
                  : "Kirim Ulang Email Konfirmasi"}
            </button>

            <Link href="/login" className="btn-cadra btn-cadra--primary w-full justify-center text-xs">
              Ke Halaman Login
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <p className="text-[11px] text-[var(--muted)]">
            Tidak menemukan email? Periksa folder <strong>Spam / Promosi</strong> atau tunggu 1
            menit lalu klik Kirim Ulang.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh place-items-center p-5">
      <div className="cadra-card w-full max-w-md space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TumpuBrandMark />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Daftar Tumpu Gratis</h1>
              <p className="text-xs text-[var(--muted)]">Paket Free: 1 Outlet · Total 3 Akun · Kasir POS</p>
            </div>
          </div>
          <Store className="h-5 w-5 text-[var(--muted)]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Bisnis / Brand</label>
            <input
              type="text"
              className="cadra-input"
              placeholder="Contoh: Kopi Pagi Nusantara"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Outlet Pertama (Opsional)</label>
            <input
              type="text"
              className="cadra-input"
              placeholder="Contoh: Cabang Kemang"
              value={outletName}
              onChange={(e) => setOutletName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Owner</label>
            <input
              type="text"
              className="cadra-input"
              placeholder="Nama lengkap"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Email Owner</label>
            <input
              type="email"
              className="cadra-input"
              placeholder="owner@bisnisanda.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Password</label>
            <input
              type="password"
              className="cadra-input"
              placeholder="Minimal 6 karakter"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-cadra btn-cadra--primary w-full">
            {loading ? "Membuat akun..." : "Buat Akun & Lanjut Setup"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {error && (
          <div className="rounded-2xl bg-[var(--bad)]/12 px-3.5 py-2.5 text-center text-xs font-semibold text-[var(--bad)]">
            {error}
          </div>
        )}

        <div className="border-t border-[var(--rim)] pt-3 text-center text-xs text-[var(--muted)]">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-[var(--primary-ink)] hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
