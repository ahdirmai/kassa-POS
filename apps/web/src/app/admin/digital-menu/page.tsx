"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Globe,
  Palette,
  Save,
  Search,
  Sparkles,
  Store,
  AlertCircle,
} from "lucide-react";
import { DIGITAL_MENU_SLUG_REGEX, type DigitalMenuTheme } from "@pos/shared";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";
import { useUiStore } from "@/stores/ui-store";

interface OutletItem {
  id: number;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface DigitalMenuConfig {
  enabled: boolean;
  slug: string;
  defaultOutletId: number | null;
  displayName: string;
  tagline: string;
  description: string;
  city: string;
  address: string;
  openingHours: string;
  whatsapp: string;
  instagram: string;
  googleMapsUrl: string;
  heroImageUrl: string;
  logoUrl: string;
  themeAccent: DigitalMenuTheme;
  showPrices: boolean;
  showUnavailable: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  cuisineType: string;
  priceRange: "$" | "$$" | "$$$";
  updatedAt: string | null;
}

interface DigitalMenuResponse {
  tenant: {
    id: number;
    name: string;
    slug: string;
    plan: string;
  };
  publicUrl: string;
  outlets: OutletItem[];
  stats: {
    activeProductCount: number;
    categoryCount: number;
  };
  config: DigitalMenuConfig;
}

const THEME_OPTIONS: Array<{ id: DigitalMenuTheme; label: string; swatch: string }> = [
  { id: "amber", label: "Warm Coffee", swatch: "bg-amber-500" },
  { id: "emerald", label: "Matcha Mint", swatch: "bg-emerald-500" },
  { id: "indigo", label: "Tumpu Indigo", swatch: "bg-indigo-500" },
  { id: "rose", label: "Berry Rose", swatch: "bg-rose-500" },
  { id: "slate", label: "Minimal Mono", swatch: "bg-slate-800" },
];

const LANDING_BASE_URL =
  process.env.NEXT_PUBLIC_LANDING_URL?.replace(/\/$/, "") || "https://tumpu.biz.id";

export default function AdminDigitalMenuPage() {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [form, setForm] = useState<DigitalMenuConfig | null>(null);
  const [slugCheck, setSlugCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    reason: string | null;
  }>({ checking: false, available: null, reason: null });

  const { data, isLoading } = useQuery({
    queryKey: ["digital-menu-config"],
    queryFn: () => apiFetch<DigitalMenuResponse>("/digital-menu"),
  });

  useEffect(() => {
    if (data && !form) {
      setForm(data.config);
    }
  }, [data, form]);

  // Realtime cek ketersediaan slug saat diubah
  useEffect(() => {
    if (!form || !data) return;
    const candidate = form.slug.trim().toLowerCase();
    if (candidate === data.tenant.slug) {
      setSlugCheck({ checking: false, available: true, reason: null });
      return;
    }
    if (candidate.length < 3 || !DIGITAL_MENU_SLUG_REGEX.test(candidate)) {
      setSlugCheck({
        checking: false,
        available: false,
        reason: "Minimal 3 karakter: huruf kecil, angka, dan tanda hubung (-)",
      });
      return;
    }

    let cancelled = false;
    setSlugCheck({ checking: true, available: null, reason: null });
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<{ available: boolean; reason: string | null }>(
          `/digital-menu/check-slug?slug=${encodeURIComponent(candidate)}`,
        );
        if (!cancelled) {
          setSlugCheck({ checking: false, available: res.available, reason: res.reason });
        }
      } catch {
        if (!cancelled) {
          setSlugCheck({ checking: false, available: null, reason: null });
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form?.slug, data]);

  const saveMut = useMutation({
    mutationFn: async (payload: DigitalMenuConfig) => {
      return apiFetch<{ slug: string; publicUrl: string }>("/digital-menu", {
        method: "PATCH",
        body: JSON.stringify({
          enabled: payload.enabled,
          slug: payload.slug.trim().toLowerCase(),
          defaultOutletId: payload.defaultOutletId,
          displayName: payload.displayName,
          tagline: payload.tagline,
          description: payload.description,
          city: payload.city,
          address: payload.address,
          openingHours: payload.openingHours,
          whatsapp: payload.whatsapp,
          instagram: payload.instagram,
          googleMapsUrl: payload.googleMapsUrl,
          heroImageUrl: payload.heroImageUrl,
          logoUrl: payload.logoUrl,
          themeAccent: payload.themeAccent,
          showPrices: payload.showPrices,
          showUnavailable: payload.showUnavailable,
          seoTitle: payload.seoTitle,
          seoDescription: payload.seoDescription,
          seoKeywords: payload.seoKeywords,
          cuisineType: payload.cuisineType,
          priceRange: payload.priceRange,
        }),
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["digital-menu-config"] });
      pushToast(`Menu digital disimpan (${res.publicUrl})`, "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const liveUrl = useMemo(() => {
    const slug = (form?.slug || data?.tenant.slug || "").trim().toLowerCase();
    return `${LANDING_BASE_URL}/p/${slug}`;
  }, [form?.slug, data?.tenant.slug]);

  const displayPublicUrl = useMemo(() => {
    const slug = (form?.slug || data?.tenant.slug || "").trim().toLowerCase();
    return `https://tumpu.biz.id/p/${slug}`;
  }, [form?.slug, data?.tenant.slug]);

  const computedSeoTitle = useMemo(() => {
    if (!form) return "";
    if (form.seoTitle.trim()) return form.seoTitle.trim();
    const name = form.displayName.trim() || data?.tenant.name || "Cafe Anda";
    const cityPart = form.city.trim() ? ` ${form.city.trim()}` : "";
    return `Menu ${name}${cityPart} — Harga & Daftar Menu Terbaru`;
  }, [form, data]);

  const computedSeoDesc = useMemo(() => {
    if (!form) return "";
    if (form.seoDescription.trim()) return form.seoDescription.trim();
    const name = form.displayName.trim() || data?.tenant.name || "Cafe Anda";
    const cityPart = form.city.trim() ? ` di ${form.city.trim()}` : "";
    const taglinePart = form.tagline.trim() ? ` ${form.tagline.trim()}.` : "";
    return `Lihat daftar menu lengkap ${name}${cityPart}.${taglinePart} Cek harga terbaru, varian minuman & makanan, jam buka, dan lokasi.`;
  }, [form, data]);

  const seoChecklist = useMemo(() => {
    if (!form || !data) return [];
    return [
      {
        label: "Halaman Menu Digital dipublikasikan (Aktif)",
        done: form.enabled,
      },
      {
        label: "Nama Cafe & Kota/Area terisi untuk SEO lokal Google",
        done: Boolean(form.displayName.trim() && form.city.trim()),
      },
      {
        label: "Deskripsi cafe informatif (minimal 40 karakter)",
        done: form.description.trim().length >= 40,
      },
      {
        label: "Alamat & Jam Buka lengkap (Schema.org LocalBusiness)",
        done: Boolean(form.address.trim() && form.openingHours.trim()),
      },
      {
        label: `Minimal 3 produk menu aktif (saat ini: ${data.stats.activeProductCount} produk)`,
        done: data.stats.activeProductCount >= 3,
      },
    ];
  }, [form, data]);

  const seoScore = useMemo(() => {
    if (seoChecklist.length === 0) return 0;
    const passed = seoChecklist.filter((c) => c.done).length;
    return Math.round((passed / seoChecklist.length) * 100);
  }, [seoChecklist]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(displayPublicUrl);
      pushToast("Link Menu Digital disalin ke clipboard!", "good");
    } catch {
      pushToast("Gagal menyalin link", "bad");
    }
  };

  const handleSlugInput = (raw: string) => {
    if (!form) return;
    const sanitized = raw
      .toLowerCase()
      .replace(/[^a-z0-9-\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setForm({ ...form, slug: sanitized });
  };

  return (
    <CadraShell
      title="Landing Page & Menu Digital"
      crumb="Menu Digital (Pro)"
      rightSlot={
        form && (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleCopyUrl} className="btn-cadra">
              <Copy className="h-3.5 w-3.5" />
              Salin Link
            </button>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cadra"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Buka Halaman
            </a>
            <button
              type="button"
              disabled={saveMut.isPending || slugCheck.available === false}
              onClick={() => saveMut.mutate(form)}
              className="btn-cadra btn-cadra--primary"
            >
              <Save className="h-3.5 w-3.5" />
              {saveMut.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        )
      }
    >
      {isLoading || !form || !data ? (
        <div className="cadra-card text-sm text-[var(--muted)]">
          Memuat konfigurasi Landing Page &amp; Menu Digital...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Kolom Kiri: Pengaturan Utama & Profil Cafe */}
          <div className="space-y-4 lg:col-span-7">
            {/* Status Publikasi & URL */}
            <section className="cadra-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Globe className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold">Publikasi &amp; Alamat URL Cafe</h2>
                    <p className="text-xs text-[var(--muted)]">
                      Halaman menu digital otomatis tersinkronisasi dengan daftar menu POS Anda.
                    </p>
                  </div>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-[var(--rim)] bg-[var(--glass-2)] px-3.5 py-1.5 text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span className={form.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--muted)]"}>
                    {form.enabled ? "Publik (Aktif di Google)" : "Draft (Nonaktif)"}
                  </span>
                </label>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block font-semibold text-[var(--muted)]">
                  Alamat URL Menu Digital (Slug Cafe)
                </label>
                <div className="flex items-center overflow-hidden rounded-xl border border-[var(--rim)] bg-[var(--glass-2)] focus-within:border-[var(--primary)]">
                  <span className="border-r border-[var(--rim)] bg-[var(--glass-1)] px-3 py-2.5 font-mono text-[11px] font-semibold text-[var(--muted)]">
                    tumpu.biz.id/p/
                  </span>
                  <input
                    className="w-full bg-transparent px-3 py-2.5 font-mono text-xs font-semibold outline-none"
                    value={form.slug}
                    onChange={(e) => handleSlugInput(e.target.value)}
                    placeholder="nama-cafe-anda"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  {slugCheck.checking ? (
                    <span className="text-[var(--muted)]">Memeriksa ketersediaan URL...</span>
                  ) : slugCheck.available === false ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {slugCheck.reason || "Slug tidak tersedia"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      URL siap digunakan: {displayPublicUrl}
                    </span>
                  )}
                </div>
              </div>

              {data.outlets.length > 1 && (
                <div className="text-xs">
                  <label className="mb-1 block font-semibold text-[var(--muted)]">
                    Outlet Default yang Ditampilkan
                  </label>
                  <select
                    className="cadra-input"
                    value={form.defaultOutletId ?? data.outlets[0]?.id ?? ""}
                    onChange={(e) => setForm({ ...form, defaultOutletId: Number(e.target.value) })}
                  >
                    {data.outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.code} · {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </section>

            {/* Profil & Informasi Cafe */}
            <section className="cadra-card space-y-4">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-[var(--primary-ink)]" />
                <h2 className="text-sm font-bold">Profil Cafe &amp; Informasi Kontak</h2>
              </div>

              <div className="grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Nama Cafe / Brand</label>
                  <input
                    className="cadra-input"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder="Contoh: Kopi & Dapur Senja"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Kota / Area (SEO Lokal)</label>
                  <input
                    className="cadra-input"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Contoh: Jakarta Selatan"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Tagline Singkat</label>
                  <input
                    className="cadra-input"
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    placeholder="Contoh: Specialty Coffee, Pastry & Comfort Kitchen di Kemang"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Deskripsi Cafe</label>
                  <textarea
                    rows={3}
                    className="cadra-input"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Ceritakan keunggulan menu, suasana cafe, dan lokasi Anda agar mudah ditemukan di Google."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Alamat Lengkap</label>
                  <input
                    className="cadra-input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Jl. Kemang Raya No. 48, Jakarta Selatan"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Jam Buka</label>
                  <input
                    className="cadra-input"
                    value={form.openingHours}
                    onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                    placeholder="Setiap hari, 08.00 – 22.00 WIB"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">WhatsApp / Telepon</label>
                  <input
                    className="cadra-input"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="6281234567890"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Instagram (tanpa @)</label>
                  <input
                    className="cadra-input"
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value.replace(/^@+/, "") })}
                    placeholder="kopisenja.kemang"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">Link Google Maps</label>
                  <input
                    className="cadra-input"
                    value={form.googleMapsUrl}
                    onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </section>

            {/* Tampilan & Opsi Menu */}
            <section className="cadra-card space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[var(--primary-ink)]" />
                <h2 className="text-sm font-bold">Tampilan &amp; Pengaturan Menu</h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="mb-1.5 block font-semibold text-[var(--muted)]">Warna Tema Halaman</label>
                  <div className="flex flex-wrap gap-2">
                    {THEME_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, themeAccent: t.id })}
                        className="chip flex items-center gap-2"
                        data-active={form.themeAccent === t.id}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${t.swatch}`} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-[var(--muted)]">URL Logo Cafe (Opsional)</label>
                    <input
                      className="cadra-input"
                      value={form.logoUrl}
                      onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-[var(--muted)]">URL Foto Banner Hero (Opsional)</label>
                    <input
                      className="cadra-input"
                      value={form.heroImageUrl}
                      onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={form.showPrices}
                      onChange={(e) => setForm({ ...form, showPrices: e.target.checked })}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    Tampilkan harga menu
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={form.showUnavailable}
                      onChange={(e) => setForm({ ...form, showUnavailable: e.target.checked })}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    Tampilkan menu habis (badge &ldquo;Habis&rdquo;)
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* Kolom Kanan: Penguatan SEO Google & SERP Preview */}
          <div className="space-y-4 lg:col-span-5">
            {/* Live Google SERP Preview */}
            <section className="cadra-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-[var(--primary-ink)]" />
                  <h2 className="text-sm font-bold">Pratinjau Pencarian Google</h2>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  Skor SEO: {seoScore}%
                </span>
              </div>

              <div className="rounded-xl border border-[var(--rim)] bg-white p-4 text-left shadow-sm dark:bg-slate-950">
                <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                    K
                  </span>
                  <div className="min-w-0 truncate">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Tumpu Digital Menu</div>
                    <div className="truncate text-[10px] text-slate-500">
                      https://tumpu.biz.id › p › {form.slug || "nama-cafe"}
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 line-clamp-1 text-[15px] font-semibold text-[#1a0dab] dark:text-blue-400">
                  {computedSeoTitle}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {computedSeoDesc}
                </p>
              </div>

              {/* Checklist SEO */}
              <div className="space-y-1.5 pt-1 text-xs">
                {seoChecklist.map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    {item.done ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
                    )}
                    <span className={item.done ? "text-[var(--ink)]" : "text-[var(--muted)]"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Pengaturan Meta SEO & Schema.org */}
            <section className="cadra-card space-y-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold">Penguatan SEO &amp; Schema.org</h2>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Halaman Anda otomatis menyertakan <b>JSON-LD CafeOrCoffeeShop + Menu</b>, <b>OpenGraph</b>,{" "}
                <b>Canonical URL</b>, dan <b>Dynamic XML Sitemap</b> untuk Googlebot. Kosongkan field di bawah jika ingin memakai format otomatis.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="mb-1 flex items-center justify-between font-semibold text-[var(--muted)]">
                    <span>Custom SEO Title (Opsional)</span>
                    <span>{form.seoTitle.length}/140</span>
                  </label>
                  <input
                    className="cadra-input"
                    maxLength={140}
                    value={form.seoTitle}
                    onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                    placeholder={computedSeoTitle}
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center justify-between font-semibold text-[var(--muted)]">
                    <span>Custom Meta Description (Opsional)</span>
                    <span>{form.seoDescription.length}/320</span>
                  </label>
                  <textarea
                    rows={3}
                    maxLength={320}
                    className="cadra-input"
                    value={form.seoDescription}
                    onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                    placeholder={computedSeoDesc}
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-[var(--muted)]">
                    Kata Kunci Pencarian (pisahkan dengan koma)
                  </label>
                  <input
                    className="cadra-input"
                    value={form.seoKeywords}
                    onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
                    placeholder="menu kopi senja, cafe kemang, kopi susu gula aren"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-[var(--muted)]">
                      Jenis Kuliner (Schema.org)
                    </label>
                    <input
                      className="cadra-input"
                      value={form.cuisineType}
                      onChange={(e) => setForm({ ...form, cuisineType: e.target.value })}
                      placeholder="Coffee Shop, Indonesian, Cafe"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-[var(--muted)]">
                      Rentang Harga (Schema.org)
                    </label>
                    <select
                      className="cadra-input"
                      value={form.priceRange}
                      onChange={(e) =>
                        setForm({ ...form, priceRange: e.target.value as "$" | "$$" | "$$$" })
                      }
                    >
                      <option value="$">$ · Terjangkau</option>
                      <option value="$$">$$ · Menengah</option>
                      <option value="$$$">$$$ · Premium</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </CadraShell>
  );
}
