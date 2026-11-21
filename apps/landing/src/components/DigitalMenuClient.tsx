"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Instagram,
  MapPin,
  MessageCircle,
  Search,
  Share2,
  Store,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import type { PublicDigitalMenuData, PublicMenuItem } from "@/lib/digital-menu";

const THEME_PALETTES: Record<
  string,
  {
    heroBg: string;
    badge: string;
    pillActive: string;
    price: string;
    ring: string;
  }
> = {
  amber: {
    heroBg: "from-amber-950 via-stone-900 to-amber-900",
    badge: "bg-amber-500/15 text-amber-800 border-amber-500/30",
    pillActive: "bg-amber-600 text-white border-amber-600 shadow-sm",
    price: "text-amber-700",
    ring: "focus-within:ring-amber-500/30 focus-within:border-amber-500",
  },
  emerald: {
    heroBg: "from-emerald-950 via-teal-950 to-emerald-900",
    badge: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30",
    pillActive: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
    price: "text-emerald-700",
    ring: "focus-within:ring-emerald-500/30 focus-within:border-emerald-500",
  },
  indigo: {
    heroBg: "from-indigo-950 via-slate-900 to-indigo-900",
    badge: "bg-indigo-500/15 text-indigo-800 border-indigo-500/30",
    pillActive: "bg-indigo-600 text-white border-indigo-600 shadow-sm",
    price: "text-indigo-700",
    ring: "focus-within:ring-indigo-500/30 focus-within:border-indigo-500",
  },
  rose: {
    heroBg: "from-rose-950 via-stone-900 to-rose-900",
    badge: "bg-rose-500/15 text-rose-800 border-rose-500/30",
    pillActive: "bg-rose-600 text-white border-rose-600 shadow-sm",
    price: "text-rose-700",
    ring: "focus-within:ring-rose-500/30 focus-within:border-rose-500",
  },
  slate: {
    heroBg: "from-slate-950 via-zinc-900 to-slate-800",
    badge: "bg-slate-500/15 text-slate-800 border-slate-500/30",
    pillActive: "bg-slate-900 text-white border-slate-900 shadow-sm",
    price: "text-slate-900",
    ring: "focus-within:ring-slate-500/30 focus-within:border-slate-700",
  },
};

const TONE_SWATCHES: Record<string, string> = {
  amber: "bg-amber-100 text-amber-800",
  emerald: "bg-emerald-100 text-emerald-800",
  mint: "bg-teal-100 text-teal-800",
  iris: "bg-indigo-100 text-indigo-800",
  indigo: "bg-indigo-100 text-indigo-800",
  rose: "bg-rose-100 text-rose-800",
  coral: "bg-orange-100 text-orange-800",
  slate: "bg-slate-100 text-slate-700",
};

function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  const formatted = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}Rp ${formatted}`;
}

function buildWhatsappHref(raw: string, cafeName: string): string {
  const digits = raw.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  const text = encodeURIComponent(`Halo ${cafeName}, saya melihat menu digital Anda di Kassa.`);
  return `https://wa.me/${normalized}?text=${text}`;
}

export function DigitalMenuClient({ data }: { data: PublicDigitalMenuData }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "ALL">("ALL");
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
  const [copied, setCopied] = useState(false);

  const palette = THEME_PALETTES[data.cafe.themeAccent] ?? THEME_PALETTES.amber;

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.categories
      .filter((c) => selectedCategoryId === "ALL" || c.id === selectedCategoryId)
      .map((cat) => ({
        ...cat,
        items: q
          ? cat.items.filter(
              (item) =>
                item.name.toLowerCase().includes(q) ||
                item.variants.some((v) => v.name.toLowerCase().includes(q)),
            )
          : cat.items,
      }))
      .filter((c) => c.items.length > 0);
  }, [data.categories, search, selectedCategoryId]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Menu ${data.cafe.displayName}`,
          text: data.cafe.tagline || `Lihat daftar menu ${data.cafe.displayName}`,
          url,
        });
        return;
      } catch {
        // Fallback ke copy clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const initials = data.cafe.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900">
      {/* HERO HEADER */}
      <header className={`relative overflow-hidden bg-gradient-to-br ${palette.heroBg} text-white`}>
        {data.cafe.heroImageUrl && (
          <div className="absolute inset-0">
            <img
              src={data.cafe.heroImageUrl}
              alt={data.cafe.displayName}
              className="h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/30" />
          </div>
        )}

        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              MENU DIGITAL RESMI
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "Link Disalin" : "Bagikan"}
            </button>
          </div>

          {/* Cafe Identity */}
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-4">
              {data.cafe.logoUrl ? (
                <img
                  src={data.cafe.logoUrl}
                  alt={`Logo ${data.cafe.displayName}`}
                  className="h-16 w-16 shrink-0 rounded-2xl border border-white/20 bg-white object-cover shadow-lg sm:h-20 sm:w-20"
                />
              ) : (
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/15 font-display text-2xl font-bold tracking-tight backdrop-blur-md sm:h-20 sm:w-20">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-4xl">
                  {data.cafe.displayName}
                </h1>
                {data.cafe.tagline && (
                  <p className="mt-1.5 max-w-2xl text-sm text-white/85 sm:text-base">
                    {data.cafe.tagline}
                  </p>
                )}

                {/* Meta Info */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/80">
                  {(data.cafe.address || data.cafe.city) && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-white/70" />
                      <span>{data.cafe.address || data.cafe.city}</span>
                    </span>
                  )}
                  {data.cafe.openingHours && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-white/70" />
                      <span>{data.cafe.openingHours}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {data.cafe.whatsapp && (
              <a
                href={buildWhatsappHref(data.cafe.whatsapp, data.cafe.displayName)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-400"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Hubungi WhatsApp
              </a>
            )}
            {data.cafe.googleMapsUrl && (
              <a
                href={data.cafe.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <MapPin className="h-3.5 w-3.5" />
                Petunjuk Arah
              </a>
            )}
            {data.cafe.instagram && (
              <a
                href={`https://instagram.com/${data.cafe.instagram.replace(/^@+/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <Instagram className="h-3.5 w-3.5" />@{data.cafe.instagram.replace(/^@+/, "")}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* STICKY SEARCH & CATEGORY NAV */}
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div
              className={`flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:bg-white focus-within:ring-2 ${palette.ring}`}
            >
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Cari menu di ${data.cafe.displayName}...`}
                aria-label="Cari menu"
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Hapus pencarian"
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Multi-Outlet Selector */}
            {data.outlets.length > 1 && (
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 shrink-0 text-slate-500" />
                <select
                  aria-label="Pilih cabang outlet"
                  value={data.activeOutlet.id}
                  onChange={(e) =>
                    router.push(`/p/${data.slug}?outletId=${encodeURIComponent(e.target.value)}`)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                >
                  {data.outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Category Pills */}
          <nav
            aria-label="Kategori Menu"
            className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              type="button"
              onClick={() => setSelectedCategoryId("ALL")}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCategoryId === "ALL"
                  ? palette.pillActive
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              Semua ({data.totalItems})
            </button>
            {data.categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedCategoryId === cat.id
                    ? palette.pillActive
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {cat.name} ({cat.items.length})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* MAIN MENU CONTENT */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* About Cafe (SEO Content Block) */}
        {data.cafe.description && selectedCategoryId === "ALL" && !search && (
          <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tentang {data.cafe.displayName}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{data.cafe.description}</p>
          </section>
        )}

        {/* Menu Sections */}
        {filteredCategories.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">Menu tidak ditemukan</p>
            <p className="mt-1 text-xs text-slate-500">
              Coba kata kunci lain atau pilih kategori &ldquo;Semua&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategoryId("ALL");
              }}
              className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredCategories.map((category) => (
              <section key={category.id} aria-labelledby={`cat-${category.id}`}>
                <div className="mb-4 flex items-baseline justify-between border-b border-slate-200 pb-2.5">
                  <h2
                    id={`cat-${category.id}`}
                    className="font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
                  >
                    {category.name}
                  </h2>
                  <span className="text-xs font-medium text-slate-500">
                    {category.items.length} menu
                  </span>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {category.items.map((item) => {
                    const swatch = TONE_SWATCHES[item.tone] ?? TONE_SWATCHES.slate;
                    const hasDetails = item.variants.length > 0 || item.modifierGroups.length > 0;
                    const minVariantPrice =
                      item.variants.length > 0
                        ? Math.min(...item.variants.map((v) => v.finalPrice))
                        : item.price;

                    return (
                      <article
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`group flex cursor-pointer items-start gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${
                          !item.isAvailable ? "opacity-65" : ""
                        }`}
                      >
                        {/* Thumbnail / Monogram */}
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            loading="lazy"
                            className="h-20 w-20 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <div
                            className={`grid h-20 w-20 shrink-0 place-items-center rounded-xl font-display text-lg font-bold ${swatch}`}
                          >
                            {item.monogram}
                          </div>
                        )}

                        {/* Item Details */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-slate-700">
                                {item.name}
                              </h3>
                              {!item.isAvailable && (
                                <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                  Habis
                                </span>
                              )}
                            </div>

                            {item.variants.length > 0 && (
                              <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
                                Varian: {item.variants.map((v) => v.name).join(" · ")}
                              </p>
                            )}
                            {item.modifierGroups.length > 0 && (
                              <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                                + {item.modifierGroups.map((g) => g.name).join(", ")}
                              </p>
                            )}
                          </div>

                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            {data.cafe.showPrices ? (
                              <span className={`font-mono-num text-sm font-bold ${palette.price}`}>
                                {item.variants.length > 1 ? `Mulai ${formatRupiah(minVariantPrice)}` : formatRupiah(item.price)}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-400">
                                Tanya kasir
                              </span>
                            )}
                            {hasDetails && (
                              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-600">
                                Detail →
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Tax & Service Note */}
        {data.cafe.showPrices &&
          (data.taxInfo.taxRatePercent > 0 || data.taxInfo.serviceChargePercent > 0) && (
            <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
              {data.taxInfo.taxInclusive
                ? "Harga sudah termasuk pajak & layanan."
                : `Harga belum termasuk ${[
                    data.taxInfo.serviceChargePercent > 0
                      ? `Service Charge ${data.taxInfo.serviceChargePercent}%`
                      : null,
                    data.taxInfo.taxRatePercent > 0 ? `PB1 ${data.taxInfo.taxRatePercent}%` : null,
                  ]
                    .filter(Boolean)
                    .join(" & ")}.`}
            </div>
          )}
      </main>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:px-6">
          <div>
            © {new Date().getFullYear()} <strong className="text-slate-700">{data.cafe.displayName}</strong>
            {data.cafe.city ? ` · ${data.cafe.city}` : ""}
          </div>
          <div>
            Menu Digital oleh{" "}
            <Link
              href="/"
              className="font-semibold text-indigo-600 underline-offset-2 hover:underline"
            >
              Kassa POS
            </Link>
          </div>
        </div>
      </footer>

      {/* ITEM DETAIL MODAL */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className={`grid h-14 w-14 place-items-center rounded-xl font-display text-base font-bold ${
                      TONE_SWATCHES[selectedItem.tone] ?? TONE_SWATCHES.slate
                    }`}
                  >
                    {selectedItem.monogram}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    {selectedItem.name}
                  </h3>
                  {data.cafe.showPrices && (
                    <div className={`font-mono-num text-sm font-bold ${palette.price}`}>
                      {formatRupiah(selectedItem.price)}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Tutup detail menu"
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!selectedItem.isAvailable && (
              <div className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700">
                Menu ini sedang habis untuk sementara waktu.
              </div>
            )}

            {selectedItem.variants.length > 0 && (
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pilihan Varian
                </h4>
                <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {selectedItem.variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                    >
                      <span className="font-semibold text-slate-800">{v.name}</span>
                      {data.cafe.showPrices && (
                        <span className="font-mono-num font-bold text-slate-700">
                          {formatRupiah(v.finalPrice)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.modifierGroups.length > 0 && (
              <div className="mt-5 space-y-4">
                {selectedItem.modifierGroups.map((group) => (
                  <div key={group.id}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {group.name}
                    </h4>
                    <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                      {group.modifiers.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between px-3.5 py-2 text-xs"
                        >
                          <span className="text-slate-700">{m.name}</span>
                          {data.cafe.showPrices && (
                            <span className="font-mono-num font-semibold text-slate-600">
                              {m.price > 0 ? `+${formatRupiah(m.price)}` : "Gratis"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
