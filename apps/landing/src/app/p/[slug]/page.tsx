import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildDigitalMenuJsonLd,
  buildDigitalMenuSeo,
  fetchPublicDigitalMenu,
} from "@/lib/digital-menu";
import { DigitalMenuClient } from "@/components/DigitalMenuClient";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ outletId?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { outletId } = await searchParams;
  const parsedOutletId = outletId ? Number(outletId) : null;

  const data = await fetchPublicDigitalMenu(
    slug,
    parsedOutletId && Number.isFinite(parsedOutletId) ? parsedOutletId : null,
  );

  if (!data) {
    return {
      title: "Menu Digital Tidak Ditemukan — Kassa",
      robots: { index: false, follow: false },
    };
  }

  const { title, description, keywords, canonicalUrl } = buildDigitalMenuSeo(data);
  const ogImages = [data.cafe.heroImageUrl, data.cafe.logoUrl].filter(Boolean) as string[];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: `${data.cafe.displayName} · Kassa`,
      locale: "id_ID",
      type: "website",
      ...(ogImages.length > 0 ? { images: ogImages.map((url) => ({ url, alt: data.cafe.displayName })) } : {}),
    },
    twitter: {
      card: ogImages.length > 0 ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImages.length > 0 ? { images: [ogImages[0]] } : {}),
    },
  };
}

export default async function PublicDigitalMenuPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { outletId } = await searchParams;
  const parsedOutletId = outletId ? Number(outletId) : null;

  const data = await fetchPublicDigitalMenu(
    slug,
    parsedOutletId && Number.isFinite(parsedOutletId) ? parsedOutletId : null,
  );

  if (!data) {
    notFound();
  }

  const { cafeSchema, breadcrumbSchema } = buildDigitalMenuJsonLd(data);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cafeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <DigitalMenuClient data={data} />
    </>
  );
}
