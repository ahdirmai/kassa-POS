"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Store } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore, type UserSession } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { KassaBrandMark } from "@/components/kassa-brand-mark";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const pushToast = useUiStore((s) => s.pushToast);

  const [businessName, setBusinessName] = useState("");
  const [outletName, setOutletName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ accessToken: string; user: UserSession }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          businessName,
          outletName: outletName || undefined,
          ownerName,
          email,
          password,
        }),
      });
      setSession(res.user, res.accessToken);
      if (res.user.outletCode) {
        window.localStorage.setItem("kassa_outlet_code", res.user.outletCode);
      }
      pushToast(`Akun berhasil dibuat! Lanjut atur PIN & profil bisnis.`, "good");
      router.replace("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center p-5">
      <div className="cadra-card w-full max-w-md space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KassaBrandMark />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Daftar Kassa Gratis</h1>
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
