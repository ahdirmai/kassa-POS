export interface PublicMenuVariant {
  id: number;
  name: string;
  priceDelta: number;
  finalPrice: number;
  isDefault: boolean;
}

export interface PublicMenuModifierGroup {
  id: number;
  name: string;
  isRequired: boolean;
  modifiers: Array<{
    id: number;
    name: string;
    price: number;
  }>;
}

export interface PublicMenuItem {
  id: number;
  sku: string;
  name: string;
  monogram: string;
  tone: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  variants: PublicMenuVariant[];
  modifierGroups: PublicMenuModifierGroup[];
}

export interface PublicMenuCategory {
  id: number;
  name: string;
  tone: string;
  items: PublicMenuItem[];
}

export interface PublicDigitalMenuData {
  slug: string;
  updatedAt: string;
  cafe: {
    displayName: string;
    tagline: string | null;
    description: string | null;
    city: string | null;
    address: string | null;
    openingHours: string | null;
    whatsapp: string | null;
    instagram: string | null;
    googleMapsUrl: string | null;
    heroImageUrl: string | null;
    logoUrl: string | null;
    themeAccent: string;
    showPrices: boolean;
    showUnavailable: boolean;
    cuisineType: string;
    priceRange: string;
  };
  seo: {
    title: string | null;
    description: string | null;
    keywords: string | null;
  };
  taxInfo: {
    taxRatePercent: number;
    serviceChargePercent: number;
    taxInclusive: boolean;
  };
  activeOutlet: {
    id: number;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
  };
  outlets: Array<{
    id: number;
    code: string;
    name: string;
    address: string | null;
  }>;
  categories: PublicMenuCategory[];
  totalItems: number;
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://kassa.biz.id").replace(/\/$/, "");

const POS_API_URL = (
  process.env.POS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000/api/v1"
).replace(/\/$/, "");

export async function fetchPublicDigitalMenu(
  slug: string,
  outletId?: number | null,
): Promise<PublicDigitalMenuData | null> {
  try {
    const query = outletId ? `?outletId=${encodeURIComponent(String(outletId))}` : "";
    const res = await fetch(
      `${POS_API_URL}/public/digital-menu/${encodeURIComponent(slug.toLowerCase())}${query}`,
      {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as PublicDigitalMenuData;
  } catch {
    return null;
  }
}

export async function fetchDigitalMenuSitemapSlugs(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  try {
    const res = await fetch(`${POS_API_URL}/public/digital-menu/sitemap`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: Array<{ slug: string; updatedAt: string }> };
    return Array.isArray(json.items) ? json.items : [];
  } catch {
    return [];
  }
}

export function buildDigitalMenuSeo(data: PublicDigitalMenuData) {
  const { cafe, seo, categories } = data;
  const cityPart = cafe.city ? ` ${cafe.city}` : "";
  const cityIn = cafe.city ? ` di ${cafe.city}` : "";

  const title =
    seo.title?.trim() ||
    `Menu ${cafe.displayName}${cityPart} — Harga & Daftar Menu Terbaru`;

  const topCategories = categories
    .slice(0, 4)
    .map((c) => c.name)
    .join(", ");

  const description =
    seo.description?.trim() ||
    `Lihat daftar menu lengkap ${cafe.displayName}${cityIn}${topCategories ? ` (${topCategories})` : ""}.${cafe.tagline ? ` ${cafe.tagline}.` : ""} Cek harga terbaru, varian, jam buka, dan lokasi.`;

  const autoKeywords = [
    `menu ${cafe.displayName.toLowerCase()}`,
    `harga menu ${cafe.displayName.toLowerCase()}`,
    cafe.city ? `cafe ${cafe.city.toLowerCase()}` : null,
    cafe.city ? `menu ${cafe.displayName.toLowerCase()} ${cafe.city.toLowerCase()}` : null,
    ...categories.slice(0, 5).map((c) => c.name.toLowerCase()),
  ].filter(Boolean) as string[];

  const keywords = seo.keywords?.trim()
    ? seo.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : autoKeywords;

  const canonicalUrl = `${SITE_URL}/p/${data.slug}`;

  return { title, description, keywords, canonicalUrl };
}

export function buildDigitalMenuJsonLd(data: PublicDigitalMenuData) {
  const { cafe, categories, slug } = data;
  const { description, canonicalUrl } = buildDigitalMenuSeo(data);

  const sameAs: string[] = [];
  if (cafe.instagram) {
    sameAs.push(`https://instagram.com/${cafe.instagram.replace(/^@+/, "")}`);
  }
  if (cafe.googleMapsUrl) {
    sameAs.push(cafe.googleMapsUrl);
  }

  const servesCuisine = cafe.cuisineType
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const cafeSchema = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "@id": `${canonicalUrl}#business`,
    name: cafe.displayName,
    description: cafe.description || description,
    url: canonicalUrl,
    ...(cafe.heroImageUrl || cafe.logoUrl
      ? { image: [cafe.heroImageUrl, cafe.logoUrl].filter(Boolean) }
      : {}),
    ...(cafe.whatsapp ? { telephone: cafe.whatsapp } : {}),
    priceRange: cafe.priceRange || "$$",
    servesCuisine: servesCuisine.length > 0 ? servesCuisine : ["Coffee Shop", "Cafe"],
    ...(cafe.openingHours ? { openingHours: cafe.openingHours } : {}),
    ...(cafe.address || cafe.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(cafe.address ? { streetAddress: cafe.address } : {}),
            ...(cafe.city ? { addressLocality: cafe.city } : {}),
            addressCountry: "ID",
          },
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    hasMenu: {
      "@type": "Menu",
      "@id": `${canonicalUrl}#menu`,
      name: `Daftar Menu ${cafe.displayName}`,
      url: canonicalUrl,
      inLanguage: "id-ID",
      hasMenuSection: categories.map((cat) => ({
        "@type": "MenuSection",
        name: cat.name,
        hasMenuItem: cat.items.map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          ...(item.imageUrl ? { image: item.imageUrl } : {}),
          ...(cafe.showPrices
            ? {
                offers: {
                  "@type": "Offer",
                  price: item.price,
                  priceCurrency: "IDR",
                  availability: item.isAvailable
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                },
              }
            : {}),
        })),
      })),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Kassa",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cafe.displayName,
        item: `${SITE_URL}/p/${slug}`,
      },
    ],
  };

  return { cafeSchema, breadcrumbSchema };
}
