import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CLASSES,
  CLASS_HUB_SLUG,
  findScope,
  REGIONS,
  REGION_HUB_SLUG,
  scopeWord,
  type Scope,
  type ScopeType,
} from "@/lib/scopes";
import { ITEM_HUB_SLUG } from "@/lib/menu";
import { findGuide, GUIDES, type Guide } from "@/lib/guides";
import {
  DATA_YEAR,
  formatWon,
  getItem,
  itemHeadline,
  itemLabel,
  priceRatio,
  ratioText,
  type ItemStats,
} from "@/lib/fee-data";
import { buildMetadata, SITE } from "@/lib/seo";
import { decodeSlug } from "@/lib/slug";
import ItemHubView from "./ItemHubView";
import ItemView from "./ItemView";
import ScopeHubView from "./ScopeHubView";
import ScopeView from "./ScopeView";
import GuideView from "./GuideView";

/**
 * 한 라우트가 여섯 화면을 맡는다.
 *
 *   /항목          → 항목 허브
 *   /지역          → 시도 허브
 *   /종별          → 병원 종별 허브
 *   /도수치료       → 항목 상세  (medifee_items.item_slug)
 *   /서울          → 시도 상세  (lib/scopes.ts)
 *   /의원          → 종별 상세  (lib/scopes.ts)
 *   /비급여-뜻      → 가이드 글
 *
 * **고정 슬러그를 항목보다 먼저 찾는다.** 항목 슬러그는 원본 데이터에서
 * 나오는 값이라 언제 무엇이 들어올지 모른다. 순서를 뒤집으면 새 항목 이름이
 * 지역·종별·가이드 페이지를 가릴 수 있다. 적재 스크립트에도 같은 목록을
 * 예약어로 두어 애초에 그런 슬러그가 만들어지지 않게 막아 두었다.
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
      title: `비급여 항목별 진료비 — ${DATA_YEAR}년 기준 | ${SITE.name}`,
      description:
        "도수치료·MRI·초음파·예방접종·진단서까지, 건강보험이 안 되는 비급여 항목의 중간값과 최저·최고 금액을 항목별로 정리했습니다.",
      keywords: [
        "비급여",
        "비급여 진료비",
        "비급여 가격",
        "도수치료 비용",
        "MRI 비용",
        "진단서 비용",
      ],
    });
  }

  if (slug === REGION_HUB_SLUG) {
    return buildMetadata({
      path: `/${REGION_HUB_SLUG}`,
      title: `지역별 비급여 진료비 — 17개 시도 비교 | ${SITE.name}`,
      description:
        "서울·경기·부산 등 17개 시도의 비급여 진료비를 항목별로 비교합니다. 우리 지역이 전국 중간값보다 높은지 낮은지 확인하세요.",
      keywords: ["지역별 비급여", "시도별 병원비", "비급여 진료비 지역"],
    });
  }

  if (slug === CLASS_HUB_SLUG) {
    return buildMetadata({
      path: `/${CLASS_HUB_SLUG}`,
      title: `병원 종별 비급여 진료비 — 의원부터 상급종합병원까지 | ${SITE.name}`,
      description:
        "같은 도수치료도 의원과 상급종합병원의 값이 다릅니다. 10개 병원 종별로 비급여 진료비 중간값을 비교했습니다.",
      keywords: [
        "병원 종별 비급여",
        "의원 비급여",
        "상급종합병원 비용",
        "한의원 비급여",
      ],
    });
  }

  const guide = findGuide(slug);
  if (guide) return guideMetadata(guide);

  const found = findScope(slug);
  if (found) return scopeMetadata(found.type, found.scope);

  const item = await getItem(slug);
  if (item) return itemMetadata(item);

  return {};
}

function guideMetadata(guide: Guide): Metadata {
  return buildMetadata({
    path: `/${guide.slug}`,
    title: `${guide.title} | ${SITE.name}`,
    description: guide.description,
    keywords: guide.keywords,
    type: "article",
  });
}

function itemMetadata(item: ItemStats): Metadata {
  const label = itemLabel(item);
  const ratio = priceRatio(item);
  return buildMetadata({
    path: `/${item.item_slug}`,
    title: `${itemHeadline(item)} — 중간값 ${formatWon(item.median_price)} | ${SITE.name}`,
    description: `${label} 비용은 ${DATA_YEAR}년 기준 중간값 ${formatWon(item.median_price)}, 집계 범위는 ${formatWon(item.min_price)}~${formatWon(item.max_price)}${ratio ? `로 ${ratioText(ratio)} 차이` : ""}입니다. 지역별·병원 종별 금액을 함께 정리했습니다.`,
    keywords: [
      label,
      `${label} 비용`,
      `${label} 가격`,
      `${label} 실비`,
      item.category,
      "비급여",
      "비급여 진료비",
    ],
    type: "article",
  });
}

function scopeMetadata(type: ScopeType, scope: Scope): Metadata {
  const word = scopeWord(type);
  return buildMetadata({
    path: `/${scope.slug}`,
    title: `${scope.slug} 비급여 진료비 — 항목별 금액 (${DATA_YEAR}년) | ${SITE.name}`,
    description: `${scope.name}의 비급여 진료비를 항목별로 정리했습니다. 도수치료·MRI·진단서 등의 중간값이 ${word.base} 기준과 견주어 어느 쪽인지 확인하세요.`,
    keywords: [
      `${scope.slug} 비급여`,
      `${scope.slug} 병원비`,
      `${scope.slug} 도수치료`,
      "비급여 진료비",
    ],
  });
}

export default async function SlugPage({ params }: Props) {
  const slug = decodeSlug((await params).slug);

  if (slug === ITEM_HUB_SLUG) return <ItemHubView />;
  if (slug === REGION_HUB_SLUG) return <ScopeHubView type="region" />;
  if (slug === CLASS_HUB_SLUG) return <ScopeHubView type="class" />;

  const guide = findGuide(slug);
  if (guide) return <GuideView guide={guide} />;

  const found = findScope(slug);
  if (found) return <ScopeView type={found.type} scope={found.scope} />;

  const item = await getItem(slug);
  if (item) return <ItemView item={item} />;

  notFound();
}

export function generateStaticParams(): { slug: string }[] {
  return [
    { slug: ITEM_HUB_SLUG },
    { slug: REGION_HUB_SLUG },
    { slug: CLASS_HUB_SLUG },
    ...GUIDES.map((g) => ({ slug: g.slug })),
    ...REGIONS.map((r) => ({ slug: r.slug })),
    ...CLASSES.map((c) => ({ slug: c.slug })),
  ];
}
