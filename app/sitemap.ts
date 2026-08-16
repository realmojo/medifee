import { MetadataRoute } from "next";
import { SITE_LINKS, ITEM_HUB_SLUG } from "@/lib/menu";
import { REGION_HUB_SLUG } from "@/lib/regions";
import { getAllRegionStats, listItems, regionsWithData } from "@/lib/price-data";
import { absoluteUrl } from "@/lib/seo";

/** 전체 URL 이 200여 개라 한 파일로 충분하다 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [items, stats] = await Promise.all([listItems(), getAllRegionStats()]);

  const statics = [
    "/",
    `/${ITEM_HUB_SLUG}`,
    `/${REGION_HUB_SLUG}`,
    ...SITE_LINKS.map((l) => l.href),
  ].map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: (path === "/" ? "daily" : "monthly") as "daily" | "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));

  return [
    ...statics,
    ...items.map((i) => ({
      url: absoluteUrl(`/${i.item_slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...regionsWithData(stats).map((r) => ({
      url: absoluteUrl(`/${r.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
