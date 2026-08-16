import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findRegion, REGION_HUB_SLUG, REGIONS, type Region } from "@/lib/regions";
import { ITEM_HUB_SLUG } from "@/lib/menu";
import {
  getItem,
  getRegionStats,
  priceRatio,
  ratioText,
  type ItemStats,
} from "@/lib/price-data";
import { buildMetadata, SITE } from "@/lib/seo";
import { decodeSlug } from "@/lib/slug";
import ItemHubView from "./ItemHubView";
import ItemView from "./ItemView";
import RegionHubView from "./RegionHubView";
import RegionView from "./RegionView";

/**
 * 한 라우트가 네 화면을 맡는다.
 *
 *   /항목          → 항목 허브
 *   /일반진단서     → 항목 상세  (medifee_items.item_slug)
 *   /지역          → 지역 허브
 *   /서울-강남구    → 지역 상세  (lib/regions.ts)
 *
 * 지역을 항목보다 **먼저** 찾는다. 지역 슬러그는 우리가 정한 고정 목록이고
 * 항목 슬러그는 원본 데이터에서 나오므로, 순서를 뒤집으면 언젠가 항목 이름이
 * 지역 페이지를 가릴 수 있다.
 */
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeSlug((await params).slug);

  if (slug === ITEM_HUB_SLUG) {
    return buildMetadata({
      path: `/${ITEM_HUB_SLUG}`,
      title: `비급여 항목별 가격 차이 | ${SITE.name}`,
      description:
        "같은 진단서가 병원마다 몇 배씩 다릅니다. 심평원이 공개한 비급여 항목별 최저·최고 가격과 그 격차를 정리했습니다.",
      keywords: ["비급여", "비급여 진료비", "진단서 비용", "병원비 비교"],
    });
  }

  if (slug === REGION_HUB_SLUG) {
    return buildMetadata({
      path: `/${REGION_HUB_SLUG}`,
      title: `지역별 비급여 진료비 | ${SITE.name}`,
      description:
        "시군구별 병원의 비급여 항목 가격을 봅니다. 우리 지역 병원들이 얼마를 받는지 확인하세요.",
      keywords: ["지역별 비급여", "병원비", "비급여 가격"],
    });
  }

  const region = findRegion(slug);
  if (region) return regionMetadata(region);

  const item = await getItem(slug);
  if (item) return itemMetadata(item);

  return {};
}

function itemMetadata(item: ItemStats): Metadata {
  const ratio = priceRatio(item);
  return buildMetadata({
    path: `/${item.item_slug}`,
    title: `${item.item_name} 비용, 병원마다 ${ratio ? ratioText(ratio) : "얼마나"} 차이 | ${SITE.name}`,
    description: `${item.item_name}은 병원에 따라 ${ratioText(ratio)}까지 차이가 납니다. 어떤 종별·지역이 상대적으로 비싼지 정리했습니다. 병원급 이상 ${item.hospital_count}곳 기준.`,
    keywords: [
      item.item_name,
      `${item.item_name} 비용`,
      `${item.item_name} 가격`,
      item.item_category,
      "비급여",
    ],
    type: "article",
  });
}

async function regionMetadata(region: Region): Promise<Metadata> {
  const stats = await getRegionStats(region.slug);
  const count = stats?.hospital_count ?? 0;

  // 자료가 없는 지역은 색인시키지 않는다. 병원급 이상만 담긴 자료라 빈 곳이 많다.
  if (count === 0) {
    return {
      ...buildMetadata({
        path: `/${region.slug}`,
        title: `${region.name} 비급여 진료비 | ${SITE.name}`,
        description: `${region.name}에는 공개된 병원급 비급여 자료가 없습니다.`,
      }),
      robots: { index: false, follow: true },
    };
  }

  return buildMetadata({
    path: `/${region.slug}`,
    title: `${region.name} 비급여 진료비 — 병원 ${count}곳 | ${SITE.name}`,
    description: `${region.name} 병원 ${count}곳이 공개한 비급여 ${stats?.item_count ?? 0}개 항목이 전국 평균과 견주어 어느 쪽인지 정리했습니다.`,
    keywords: [`${region.name} 병원비`, `${region.name} 비급여`, "진단서 비용"],
  });
}

export default async function SlugPage({ params }: Props) {
  const slug = decodeSlug((await params).slug);

  if (slug === ITEM_HUB_SLUG) return <ItemHubView />;
  if (slug === REGION_HUB_SLUG) return <RegionHubView />;

  const region = findRegion(slug);
  if (region) return <RegionView region={region} />;

  const item = await getItem(slug);
  if (item) return <ItemView item={item} />;

  notFound();
}

export function generateStaticParams(): { slug: string }[] {
  return [
    { slug: ITEM_HUB_SLUG },
    { slug: REGION_HUB_SLUG },
    ...REGIONS.map((r) => ({ slug: r.slug })),
  ];
}
