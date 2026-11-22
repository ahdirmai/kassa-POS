"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, LogIn } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Login gagal.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-stage flex min-h-screen flex-col items-center justify-center px-5 py-12 text-[#f4f2ec]">
      <div className="w-full max-w-md">
        <a
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Landing Page
        </a>

        <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#11181c]/90 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3">
            <img
              src="/branding/kassa-icon-dark.svg"
              alt="Kassa"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl border border-white/10"
            />
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight text-white">
                Kassa Landing Admin
              </h1>
              <p className="font-mono-num text-[11px] uppercase tracking-[0.12em] text-[#e5ba78]">
                CMS · Leads · Analytics
              </p>
            </div>
          </div>

          <p className="mt-5 text-[13.5px] leading-relaxed text-white/60">
            Masuk dengan akun admin yang dikonfigurasi di{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono-num text-[12px] text-white/85">
              .env.local
            </code>{" "}
            untuk mengelola konten, leads, dan statistik pengunjung.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-400/30 bg-red-500/15 px-3.5 py-2.5 text-[13px] text-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-white/75">
                Email Admin
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kassa.biz.id"
                className="w-full rounded-lg border border-white/15 bg-[#0b1013] px-3.5 py-2.5 text-[14px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#d9a962]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-white/75">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-white/15 bg-[#0b1013] px-3.5 py-2.5 text-[14px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#d9a962]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#d9a962] px-4 py-3 text-[14px] font-semibold text-[#0b1013] transition-colors hover:bg-[#e5ba78] disabled:opacity-60"
            >
              {loading ? (
                "Memverifikasi..."
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Masuk ke Dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-white/10 pt-5 text-[11.5px] text-white/40">
            <Lock className="h-3.5 w-3.5" />
            Dilindungi HTTP-only signed session cookie
          </div>
        </div>
      </div>
    </div>
  );
}
