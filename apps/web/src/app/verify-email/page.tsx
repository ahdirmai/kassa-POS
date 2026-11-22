"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore, type UserSession } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { KassaBrandMark } from "@/components/kassa-brand-mark";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";

  const setSession = useAuthStore((s) => s.setSession);
  const pushToast = useUiStore((s) => s.pushToast);

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    token ? "verifying" : "error",
  );
  const [message, setMessage] = useState(
    token
      ? "Sedang memverifikasi tautan email Anda..."
      : "Tautan verifikasi tidak ditemukan. Silakan minta kirim ulang email konfirmasi.",
  );
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    (async () => {
      try {
        const res = await apiFetch<{
          verified: boolean;
          message: string;
          accessToken: string;
          user: UserSession;
        }>("/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ token }),
        });

        setSession(res.user, res.accessToken);
        if (res.user.outletCode) {
          window.localStorage.setItem("kassa_outlet_code", res.user.outletCode);
        }
        setStatus("success");
        setMessage("Email Anda berhasil dikonfirmasi! Mengarahkan ke setup outlet...");
        pushToast("Email terverifikasi! Lanjut atur PIN & profil bisnis.", "good");

        setTimeout(() => {
          router.replace("/onboarding");
        }, 1200);
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Tautan verifikasi tidak valid atau sudah kedaluwarsa.",
        );
      }
    })();
  }, [token, setSession, pushToast, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    setResendInfo(null);
    setDevVerifyUrl(null);
    try {
      const res = await apiFetch<{ ok: boolean; message: string; devVerifyUrl?: string }>(
        "/auth/resend-verification",
        {
          method: "POST",
          body: JSON.stringify({ email: resendEmail.trim() }),
        },
      );
      setResendInfo(res.message);
      if (res.devVerifyUrl) setDevVerifyUrl(res.devVerifyUrl);
      pushToast("Email konfirmasi dikirim ulang!", "good");
    } catch (err) {
      setResendInfo(err instanceof Error ? err.message : "Gagal mengirim ulang email");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center p-5">
      <div className="cadra-card w-full max-w-md space-y-5 p-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <KassaBrandMark />
          <div className="text-left">
            <h1 className="text-lg font-bold tracking-tight">Konfirmasi Email</h1>
            <p className="text-xs text-[var(--muted)]">Kassa Cloud POS · app.kassa.biz.id</p>
          </div>
        </div>

        {status === "verifying" && (
          <div className="space-y-3 py-6">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--primary)]" />
            <p className="text-sm font-medium text-[var(--muted)]">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <div className="space-y-1">
              <h2 className="text-base font-bold">Email Terkonfirmasi!</h2>
              <p className="text-xs text-[var(--muted)]">{message}</p>
            </div>
            <Link href="/onboarding" className="btn-cadra btn-cadra--primary w-full justify-center">
              Lanjut ke Onboarding
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-2 text-left">
            <div className="flex flex-col items-center text-center">
              <XCircle className="h-11 w-11 text-red-500" />
              <h2 className="mt-2 text-base font-bold">Verifikasi Gagal</h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{message}</p>
            </div>

            <form
              onSubmit={handleResend}
              className="space-y-2.5 rounded-2xl border border-[var(--rim)] bg-[var(--glass-2)] p-4"
            >
              <label className="block text-xs font-semibold text-[var(--muted)]">
                Kirim Ulang Email Konfirmasi
              </label>
              <input
                type="email"
                required
                className="cadra-input"
                placeholder="email@bisnisanda.id"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={resending}
                className="btn-cadra btn-cadra--primary w-full justify-center text-xs"
              >
                <Mail className="h-3.5 w-3.5" />
                {resending ? "Mengirim..." : "Kirim Ulang Tautan Verifikasi"}
              </button>

              {resendInfo && (
                <p className="text-xs font-medium text-[var(--primary-ink)]">{resendInfo}</p>
              )}

              {devVerifyUrl && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px]">
                  <div className="font-bold text-amber-700 dark:text-amber-300">
                    Mode Dev (Console Mailer):
                  </div>
                  <a
                    href={devVerifyUrl}
                    className="mt-1 block break-all font-mono underline text-[var(--primary-ink)]"
                  >
                    Klik di sini untuk verifikasi langsung
                  </a>
                </div>
              )}
            </form>

            <div className="text-center text-xs text-[var(--muted)]">
              <Link href="/login" className="font-semibold text-[var(--primary-ink)] hover:underline">
                Kembali ke halaman Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center p-5 text-sm text-[var(--muted)]">
          Memuat halaman konfirmasi email...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
