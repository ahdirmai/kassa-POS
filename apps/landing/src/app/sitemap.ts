import type { MetadataRoute } from "next";
import { fetchDigitalMenuSitemapSlugs, SITE_URL } from "@/lib/digital-menu";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenantMenus = await fetchDigitalMenuSitemapSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const dynamicMenuRoutes: MetadataRoute.Sitemap = tenantMenus.map((item) => ({
    url: `${SITE_URL}/p/${item.slug}`,
    lastModified: new Date(item.updatedAt),
    changeFrequency: "daily",
    priority: 0.85,
  }));

  return [...staticRoutes, ...dynamicMenuRoutes];
}
