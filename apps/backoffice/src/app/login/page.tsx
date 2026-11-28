"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { boFetch, setStoredToken, type PlatformAdmin } from "@/lib/api";

export default function BackOfficeLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(
    process.env.NODE_ENV !== "production" ? "superadmin@tumpu.biz.id" : "",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await boFetch<{ accessToken: string; admin: PlatformAdmin }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      setStoredToken(res.accessToken);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk ke Back Office");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="mesh" aria-hidden="true">
        <i className="mesh__a" />
        <i className="mesh__b" />
        <i className="mesh__c" />
      </div>

      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-3">
          <img
            src="/branding/tumpu-icon-dark.svg"
            alt="Tumpu"
            width={42}
            height={42}
            className="cadra-brand__mark"
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--ink)]">
              Tumpu Back Office
            </h1>
            <p className="text-xs text-[var(--muted)]">
              admin.tumpu.biz.id · Platform Control
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--well)] px-4 py-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-[var(--primary-ink)]">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Akses Internal Tim Tumpu
          </div>
          <p className="mt-1 text-[12px] text-[var(--muted)]">
            Kontrol Account Tenant, Subscription &amp; Billing, Landing CMS &amp; Leads, serta Marketing Hub.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">
              Email Admin
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--faint)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-[var(--line-2)] bg-[var(--glass-2)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:border-[var(--iris)] focus:outline-none"
                placeholder="nama@perusahaan.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--faint)]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-[var(--line-2)] bg-[var(--glass-2)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] focus:border-[var(--iris)] focus:outline-none"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-[var(--bad)]/30 bg-[var(--bad)]/10 px-3.5 py-2.5 text-xs font-medium text-[var(--bad)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--ink)] py-3 text-sm font-semibold text-[var(--on-ink)] transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Memverifikasi..." : "Masuk ke Back Office"}
          </button>
        </form>

        {process.env.NODE_ENV !== "production" && (
          <p className="mt-6 text-center font-mono-num text-[11px] text-[var(--faint)]">
            Dev mode: superadmin@tumpu.biz.id / tumpu-superadmin-2026
          </p>
        )}
      </div>
    </div>
  );
}
