"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, Mail } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuthStore, type UserSession } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { getDefaultHomePath } from "@/lib/rbac";
import { KassaBrandMark } from "@/components/kassa-brand-mark";

const OUTLET_CODE_STORAGE_KEY = "kassa_outlet_code";
const SHOW_DEMO_HINTS =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const pushToast = useUiStore((s) => s.pushToast);

  const [mode, setMode] = useState<"pin" | "email">("pin");
  const [outletCode, setOutletCode] = useState(SHOW_DEMO_HINTS ? "OUT-01" : "");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState(SHOW_DEMO_HINTS ? "owner@senja.id" : "");
  const [password, setPassword] = useState(SHOW_DEMO_HINTS ? "password123" : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(OUTLET_CODE_STORAGE_KEY);
    if (saved) setOutletCode(saved);
  }, []);

  const routeAfterLogin = (user: UserSession) => {
    if (user.outletCode) {
      window.localStorage.setItem(OUTLET_CODE_STORAGE_KEY, user.outletCode);
    }
    pushToast(`Selamat datang, ${user.name}`, "good");
    const can = (p: string) => user.roleCode === "OWNER" || user.permissions.includes(p);
    router.push(getDefaultHomePath(can, user.plan));
  };

  const handlePinLogin = async (pinValue: string, overrideOutletCode?: string) => {
    const cleanCode = (overrideOutletCode ?? outletCode).trim().toUpperCase();
    if (!cleanCode) {
      setError("Masukkan Kode Outlet terlebih dahulu");
      return;
    }
    if (overrideOutletCode) setOutletCode(cleanCode);
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ user: UserSession; accessToken: string }>("/auth/pin-login", {
        method: "POST",
        body: JSON.stringify({ pin: pinValue, outletCode: cleanCode }),
      });
      setSession(data.user, data.accessToken);
      routeAfterLogin(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PIN salah");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ user: UserSession; accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(data.user, data.accessToken);
      routeAfterLogin(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const pressDigit = (d: string) => {
    if (loading || pin.length >= 6) return;
    setPin((prev) => prev + d);
  };

  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <div className="cadra-card w-full max-w-md space-y-6 p-7">
        <div className="flex items-center gap-3">
          <KassaBrandMark />
          <div>
            <h1 className="text-xl font-bold tracking-tight">Kassa</h1>
            <p className="text-xs font-semibold text-[var(--muted)]">Cloud POS Multi-Outlet · app.kassa.biz.id</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 rounded-full bg-[var(--well)] p-1">
          <button
            type="button"
            onClick={() => { setMode("pin"); setError(""); }}
            className={`rounded-full py-2 text-xs font-bold transition ${
              mode === "pin" ? "bg-[var(--ink)] text-[var(--on-ink)]" : "text-[var(--muted)]"
            }`}
          >
            <KeyRound className="mr-1.5 inline h-3.5 w-3.5" />
            PIN Cepat Kasir
          </button>
          <button
            type="button"
            onClick={() => { setMode("email"); setError(""); }}
            className={`rounded-full py-2 text-xs font-bold transition ${
              mode === "email" ? "bg-[var(--ink)] text-[var(--on-ink)]" : "text-[var(--muted)]"
            }`}
          >
            <Mail className="mr-1.5 inline h-3.5 w-3.5" />
            Email Admin
          </button>
        </div>

        {mode === "pin" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Kode Outlet</label>
              <input
                type="text"
                className="cadra-input uppercase tracking-wider font-mono text-sm"
                placeholder="Contoh: SENJA-01 atau KSA-XXXX"
                value={outletCode}
                onChange={(e) => setOutletCode(e.target.value.toUpperCase())}
              />
            </div>

            <div className="flex justify-center gap-3 py-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`h-3.5 w-3.5 rounded-full border-2 transition ${
                    pin.length > idx
                      ? "border-[var(--ink)] bg-[var(--ink)] scale-110"
                      : idx < 4
                        ? "border-[var(--line-2)] bg-transparent"
                        : "border-dashed border-[var(--line-2)] bg-transparent opacity-55"
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((key) => (
                <button
                  key={key}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    if (key === "C") setPin("");
                    else if (key === "⌫") setPin((p) => p.slice(0, -1));
                    else pressDigit(key);
                  }}
                  className="h-14 rounded-2xl border border-[var(--line)] bg-[var(--raised)] text-lg font-bold transition hover:bg-[var(--well)] active:scale-95"
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={loading || pin.length < 4}
              onClick={() => handlePinLogin(pin)}
              className="btn-cadra btn-cadra--primary w-full"
            >
              <KeyRound className="h-4 w-4" />
              {loading ? "Memverifikasi PIN..." : `Masuk dengan PIN (${pin.length}/4–6 digit)`}
            </button>

            {SHOW_DEMO_HINTS && (
              <div className="rounded-2xl bg-[var(--well)] p-3 text-xs text-[var(--muted)] space-y-1">
                <div className="font-bold text-[var(--text)]">PIN Demo Cepat (Outlet OUT-01):</div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handlePinLogin("1234", "OUT-01")} className="chip">Kasir: 1234</button>
                  <button type="button" onClick={() => handlePinLogin("2222", "OUT-01")} className="chip">Manager: 2222</button>
                  <button type="button" onClick={() => handlePinLogin("1111", "OUT-01")} className="chip">Owner: 1111</button>
                  <button type="button" onClick={() => handlePinLogin("5678", "OUT-01")} className="chip">Dapur: 5678</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Email</label>
              <input
                type="email"
                className="cadra-input"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-cadra btn-cadra--primary w-full">
              <Lock className="h-4 w-4" />
              {loading ? "Memproses..." : "Masuk ke Sistem"}
            </button>
          </form>
        )}

        {error && (
          <div className="rounded-2xl bg-[var(--bad)]/12 px-3.5 py-2.5 text-center text-xs font-semibold text-[var(--bad)]">
            {error}
          </div>
        )}

        <div className="border-t border-[var(--rim)] pt-3 text-center text-xs text-[var(--muted)]">
          Pemilik bisnis baru?{" "}
          <Link href="/register" className="font-semibold text-[var(--primary-ink)] hover:underline">
            Daftar Gratis (1 Outlet · 3 Akun)
          </Link>
        </div>
      </div>
    </div>
  );
}
