import LandingClient from "@/components/LandingClient";
import { getLandingContent } from "@/lib/storage";

export const revalidate = 60;

export default async function HomePage() {
  const content = await getLandingContent();

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tumpu POS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS, Windows, macOS",
    url: "https://tumpu.biz.id",
    description:
      "Sistem kasir POS offline-ready, Kitchen Display Kanban realtime, stok bahan & HPP otomatis, multi-outlet, dan Menu Digital SEO untuk cafe & rumah makan Indonesia.",
    offers: [
      {
        "@type": "Offer",
        name: "Tumpu Starter",
        price: "0",
        priceCurrency: "IDR",
      },
      {
        "@type": "Offer",
        name: "Tumpu Pro",
        price: "49000",
        priceCurrency: "IDR",
      },
    ],
  };

  const faqSchema =
    content.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema).replace(/</g, "\\u003c"),
        }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <LandingClient content={content} />
    </>
  );
}
