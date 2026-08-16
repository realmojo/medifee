import { MetadataRoute } from "next";
import { SITE_LINKS, ITEM_HUB_SLUG } from "@/lib/menu";
import { CLASSES, CLASS_HUB_SLUG, REGIONS, REGION_HUB_SLUG } from "@/lib/scopes";
import { listItems } from "@/lib/fee-data";
import { GUIDES } from "@/lib/guides";
import { absoluteUrl } from "@/lib/seo";

/** 전체 URL 이 700개쯤이라 한 파일로 충분하다 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const items = await listItems();

  const statics = [
    "/",
    `/${ITEM_HUB_SLUG}`,
    `/${REGION_HUB_SLUG}`,
    `/${CLASS_HUB_SLUG}`,
    ...SITE_LINKS.map((l) => l.href),
  ].map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: (path === "/" ? "daily" : "monthly") as "daily" | "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));

  return [
    ...statics,
    ...GUIDES.map((g) => ({
      url: absoluteUrl(`/${g.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...REGIONS.map((r) => ({
      url: absoluteUrl(`/${r.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...CLASSES.map((c) => ({
      url: absoluteUrl(`/${c.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    // 폭넓게 집계된 항목을 앞에 둔다. 값이 한두 곳에만 있는 항목은 페이지가
    // 얇아서 우선순위를 낮춘다.
    ...items.map((i) => ({
      url: absoluteUrl(`/${i.item_slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: i.scope_count >= 12 ? 0.8 : 0.5,
    })),
  ];
}
