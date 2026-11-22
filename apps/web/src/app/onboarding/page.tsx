"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  KeyRound,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import {
  BUSINESS_TYPES,
  FOOD_TYPES,
  buildOnboardingSeedBlueprint,
  type BusinessType,
  type FoodType,
  type ServiceMode,
} from "@pos/shared";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { KassaBrandMark } from "@/components/kassa-brand-mark";
import { useUiStore } from "@/stores/ui-store";

interface OnboardingStatus {
  completed: boolean;
  hasPin: boolean;
  sampleDataActive: boolean;
  businessType: BusinessType | null;
  foodTypes: FoodType[];
  serviceMode: ServiceMode | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const pushToast = useUiStore((s) => s.pushToast);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("COFFEE_SHOP");
  const [foodTypes, setFoodTypes] = useState<FoodType[]>(["COFFEE", "NON_COFFEE", "PASTRY_CAKE", "SNACK"]);
  const [serviceMode, setServiceMode] = useState<ServiceMode>("DINE_IN_AND_TAKEAWAY");
  const [seedSampleData, setSeedSampleData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    apiFetch<OnboardingStatus>("/onboarding/status")
      .then((st) => {
        setHasExistingPin(st.hasPin);
        if (st.businessType) setBusinessType(st.businessType);
        if (st.foodTypes.length > 0) setFoodTypes(st.foodTypes);
        if (st.serviceMode) setServiceMode(st.serviceMode);
      })
      .catch(() => {
        // Ignore if status fetch fails
      });
  }, [accessToken, router]);

  const preview = useMemo(
    () => buildOnboardingSeedBlueprint({ businessType, foodTypes, serviceMode }),
    [businessType, foodTypes, serviceMode],
  );

  const selectBusinessType = (code: BusinessType) => {
    setBusinessType(code);
    const opt = BUSINESS_TYPES.find((b) => b.code === code);
    if (opt) {
      setFoodTypes(opt.defaultFoodTypes);
      setServiceMode(opt.defaultServiceMode);
    }
  };

  const toggleFoodType = (code: FoodType) => {
    setFoodTypes((prev) =>
      prev.includes(code) ? (prev.length > 1 ? prev.filter((x) => x !== code) : prev) : [...prev, code],
    );
  };

  const handleNextFromPin = () => {
    setError(null);
    if (!hasExistingPin || pin.length > 0) {
      if (!/^\d{6}$/.test(pin)) {
        setError("PIN baru harus terdiri dari 6 digit angka.");
        return;
      }
      if (pin !== pinConfirm) {
        setError("Konfirmasi PIN tidak cocok.");
        return;
      }
    }
    setStep(2);
  };

  const handleFinish = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<{
        ok: boolean;
        summary: { categories: number; products: number; modifierGroups: number; tables: number; ingredients: number };
      }>("/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({
          pin: pin.length === 6 ? pin : undefined,
          businessType,
          foodTypes,
          serviceMode,
          seedSampleData,
        }),
      });
      if (user && accessToken) {
        setSession({ ...user, hasPin: true }, accessToken);
      }
      if (seedSampleData) {
        pushToast(
          `Setup selesai! ${res.summary.products} menu, ${res.summary.modifierGroups} grup add-on, & ${res.summary.tables} meja contoh siap dipakai.`,
          "good",
        );
      } else {
        pushToast("Setup bisnis & PIN berhasil disimpan!", "good");
      }
      router.replace("/pos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyelesaikan onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center p-4 sm:p-6">
      <div className="cadra-card w-full max-w-2xl space-y-6 p-6 sm:p-8">
        {/* Header + Stepper */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-3">
            <KassaBrandMark />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Setup Awal Outlet Anda</h1>
              <p className="text-xs text-[var(--muted)]">
                {user?.tenantName ?? "Bisnis Baru"} · Kode Outlet:{" "}
                <span className="font-mono font-bold text-[var(--text)]">{user?.outletCode ?? "—"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold">
            {[
              { id: 1 as const, label: "1. Set PIN" },
              { id: 2 as const, label: "2. Tipe Bisnis" },
              { id: 3 as const, label: "3. Menu & Seeder" },
            ].map((s) => (
              <span
                key={s.id}
                className={`rounded-full px-2.5 py-1 ${
                  step === s.id
                    ? "bg-[var(--ink)] text-[var(--on-ink)]"
                    : step > s.id
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-[var(--well)] text-[var(--muted)]"
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* STEP 1: SET PIN */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-[var(--well)] p-4">
              <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary-ink)]" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-[var(--text)]">Atur PIN Owner (6 digit angka)</div>
                <p className="text-[var(--muted)]">
                  PIN digunakan untuk <strong>login cepat di layar kasir POS</strong> (bersama Kode Outlet{" "}
                  <span className="font-mono font-semibold">{user?.outletCode}</span>) serta untuk{" "}
                  <strong>approval Void &amp; Refund</strong>.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                  PIN Baru (6 digit) {hasExistingPin ? "(Opsional jika tidak diubah)" : "*"}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Contoh: 258046"
                  className="cadra-input font-mono text-base tracking-[0.35em]"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Konfirmasi PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Ulangi PIN"
                  className="cadra-input font-mono text-base tracking-[0.35em]"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="button" onClick={handleNextFromPin} className="btn-cadra btn-cadra--primary">
                Lanjut Pilih Tipe Bisnis
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: BUSINESS TYPE */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Store className="h-4 w-4 text-[var(--primary-ink)]" />
              Apa tipe bisnis F&amp;B Anda?
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {BUSINESS_TYPES.map((bt) => {
                const active = businessType === bt.code;
                return (
                  <button
                    key={bt.code}
                    type="button"
                    onClick={() => selectBusinessType(bt.code)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[var(--ink)] bg-[var(--well)] ring-2 ring-[var(--ink)]/15"
                        : "border-[var(--line)] bg-[var(--raised)] hover:bg-[var(--well)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">{bt.label}</span>
                      {active && <Check className="h-4 w-4 text-[var(--primary-ink)]" />}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{bt.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-cadra">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn-cadra btn-cadra--primary">
                Lanjut Pilih Menu
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FOOD TYPES, SERVICE MODE & AUTO-SEEDER */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <UtensilsCrossed className="h-4 w-4 text-[var(--primary-ink)]" />
                Pilih kategori menu yang Anda jual (bisa lebih dari satu)
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {FOOD_TYPES.map((ft) => {
                  const selected = foodTypes.includes(ft.code);
                  return (
                    <button
                      key={ft.code}
                      type="button"
                      onClick={() => toggleFoodType(ft.code)}
                      className={`flex items-start justify-between gap-2 rounded-2xl border p-3 text-left transition ${
                        selected
                          ? "border-[var(--ink)] bg-[var(--well)]"
                          : "border-[var(--line)] bg-[var(--raised)] opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{ft.label}</div>
                        <div className="text-[11px] text-[var(--muted)]">{ft.description}</div>
                      </div>
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                          selected ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]" : "border-[var(--line-2)]"
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-[var(--muted)]">Mode Layanan Outlet</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setServiceMode("DINE_IN_AND_TAKEAWAY")}
                  className={`rounded-2xl border p-3 text-left text-xs ${
                    serviceMode === "DINE_IN_AND_TAKEAWAY"
                      ? "border-[var(--ink)] bg-[var(--well)] font-bold"
                      : "border-[var(--line)] bg-[var(--raised)]"
                  }`}
                >
                  Dine-in (Pakai Meja) &amp; Takeaway
                  <div className="mt-0.5 text-[11px] font-normal text-[var(--muted)]">
                    Otomatis buatkan denah area &amp; meja makan.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setServiceMode("COUNTER_ONLY")}
                  className={`rounded-2xl border p-3 text-left text-xs ${
                    serviceMode === "COUNTER_ONLY"
                      ? "border-[var(--ink)] bg-[var(--well)] font-bold"
                      : "border-[var(--line)] bg-[var(--raised)]"
                  }`}
                >
                  Counter / Takeaway / Delivery Saja
                  <div className="mt-0.5 text-[11px] font-normal text-[var(--muted)]">
                    Langsung fokus ke antrean kasir tanpa denah meja.
                  </div>
                </button>
              </div>
            </div>

            {/* Auto-Seeder Toggle + Live Preview */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--well)] p-4 space-y-2.5">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--primary-ink)]" />
                  <span className="text-xs font-bold">Buat Data Contoh (Seeder) Otomatis Sesuai Pilihan</span>
                </div>
                <input
                  type="checkbox"
                  checked={seedSampleData}
                  onChange={(e) => setSeedSampleData(e.target.checked)}
                  className="h-4 w-4 accent-[var(--ink)]"
                />
              </label>

              {seedSampleData ? (
                <div className="text-xs text-[var(--muted)] space-y-1">
                  <div>
                    Akan dibuat otomatis:{" "}
                    <strong className="text-[var(--text)]">{preview.categories.length} Kategori</strong>,{" "}
                    <strong className="text-[var(--text)]">{preview.products.length} Menu contoh</strong>,{" "}
                    <strong className="text-[var(--text)]">{preview.modifierGroups.length} Grup Add-on</strong>,{" "}
                    <strong className="text-[var(--text)]">
                      {preview.areas.reduce((s, a) => s + a.tables.length, 0)} Meja
                    </strong>
                    , dan <strong className="text-[var(--text)]">{preview.ingredients.length} Bahan Baku</strong>.
                  </div>
                  <div className="text-[11px]">
                    Tenang, Anda bisa menghapus semua data contoh ini kapan saja lewat tombol{" "}
                    <strong>Reset Data Contoh</strong> di menu <em>Pengaturan</em>.
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  Outlet akan dimulai dalam keadaan kosong (hanya 1 kategori &quot;Menu Utama&quot;) agar Anda bisa input menu asli sendiri.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setStep(2)} className="btn-cadra">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinish}
                className="btn-cadra btn-cadra--primary"
              >
                <Sparkles className="h-4 w-4" />
                {submitting ? "Menyiapkan Outlet..." : "Selesai & Masuk Kasir"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-[var(--bad)]/12 px-3.5 py-2.5 text-center text-xs font-semibold text-[var(--bad)]">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
