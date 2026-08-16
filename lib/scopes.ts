/**
 * 이 사이트가 가르는 두 축 — 지역(시도)과 병원 종별.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  왜 시군구가 아니라 시도인가
 * ────────────────────────────────────────────────────────────────────────
 * 원본이 KOSIS 집계 통계라 병원별 자료가 없다. 나뉘어 있는 가장 작은 지역
 * 단위가 시도(17개)다. 시군구 페이지를 만들면 그 안에 넣을 값이 없다.
 * 대신 원본에는 **병원 종별**이라는 축이 하나 더 있다. 의원·치과의원·한의원까지
 * 들어 있어서 오히려 사람들이 실제로 가는 곳에 가깝다.
 *
 * 여기 적힌 이름은 `medifee_fees.scope` 값과 **글자 그대로 같아야 한다.**
 * 조회가 이 문자열로 이루어지므로 하나라도 어긋나면 그 페이지가 빈다.
 */

export type ScopeType = "region" | "class";

export interface Scope {
  /** URL 경로이자 DB 의 scope 값. 예: "서울", "의원" */
  slug: string;
  /** 화면에 쓰는 온전한 이름. 예: "서울특별시" */
  name: string;
  /** 목록 화면 아이콘 */
  emoji: string;
  /** 이 축이 무엇인지 한 줄 설명 */
  note: string;
}

/** 지역 허브 경로 */
export const REGION_HUB_SLUG = "지역";
/** 종별 허브 경로 */
export const CLASS_HUB_SLUG = "종별";

/** 17개 시도. KOSIS 표 순서가 아니라 사람이 훑기 좋은 순서로 둔다. */
export const REGIONS: Scope[] = [
  { slug: "서울", name: "서울특별시", emoji: "🏙️", note: "가장 많은 항목이 공개된 지역" },
  { slug: "부산", name: "부산광역시", emoji: "🌊", note: "영남권 최대 도시" },
  { slug: "대구", name: "대구광역시", emoji: "🍎", note: "경북권 중심" },
  { slug: "인천", name: "인천광역시", emoji: "✈️", note: "수도권 서부" },
  { slug: "광주", name: "광주광역시", emoji: "🌻", note: "호남권 중심" },
  { slug: "대전", name: "대전광역시", emoji: "🔬", note: "충청권 중심" },
  { slug: "울산", name: "울산광역시", emoji: "🏭", note: "동남권 공업 도시" },
  { slug: "세종", name: "세종특별자치시", emoji: "🏛️", note: "의료기관 수가 가장 적은 곳" },
  { slug: "경기", name: "경기도", emoji: "🏘️", note: "인구가 가장 많은 광역자치단체" },
  { slug: "강원", name: "강원특별자치도", emoji: "⛰️", note: "면적이 넓고 기관이 흩어져 있음" },
  { slug: "충북", name: "충청북도", emoji: "🌾", note: "충청 내륙" },
  { slug: "충남", name: "충청남도", emoji: "🌅", note: "충청 서해안" },
  { slug: "전북", name: "전북특별자치도", emoji: "🍚", note: "호남 북부" },
  { slug: "전남", name: "전라남도", emoji: "🏝️", note: "호남 남부와 도서 지역" },
  { slug: "경북", name: "경상북도", emoji: "🏯", note: "면적이 가장 넓은 도" },
  { slug: "경남", name: "경상남도", emoji: "⚓", note: "영남 서부" },
  { slug: "제주", name: "제주특별자치도", emoji: "🍊", note: "공개 항목 수가 가장 적은 곳" },
];

/**
 * 10개 병원 종별.
 *
 * 순서는 규모가 큰 곳부터다. 같은 항목이라도 상급종합병원과 의원은 값이 크게
 * 다르므로, 어느 종별을 보는지가 "얼마인가"의 절반을 결정한다.
 */
export const CLASSES: Scope[] = [
  {
    slug: "상급종합병원",
    name: "상급종합병원",
    emoji: "🏥",
    note: "중증질환을 맡는 대형 병원. 종합병원 중에서 따로 지정된다",
  },
  {
    slug: "종합병원",
    name: "종합병원",
    emoji: "🏨",
    note: "여러 진료과와 입원 병상을 갖춘 병원",
  },
  {
    slug: "병원",
    name: "병원",
    emoji: "🩺",
    note: "입원 병상을 갖췄지만 종합병원보다 규모가 작은 곳",
  },
  {
    slug: "요양병원",
    name: "요양병원",
    emoji: "🛏️",
    note: "장기 입원과 요양을 맡는 병원",
  },
  {
    slug: "정신병원",
    name: "정신병원",
    emoji: "🧠",
    note: "정신건강의학과 진료를 전문으로 하는 병원",
  },
  {
    slug: "치과병원",
    name: "치과병원",
    emoji: "🦷",
    note: "치과 진료를 전문으로 하는 병원급 기관",
  },
  {
    slug: "한방병원",
    name: "한방병원",
    emoji: "🌿",
    note: "한의학 진료를 하는 병원급 기관",
  },
  {
    slug: "의원",
    name: "의원",
    emoji: "🏪",
    note: "동네 의원. 사람들이 가장 자주 가는 곳이다",
  },
  {
    slug: "치과의원",
    name: "치과의원",
    emoji: "😁",
    note: "동네 치과",
  },
  {
    slug: "한의원",
    name: "한의원",
    emoji: "🍵",
    note: "동네 한의원. 추나요법과 약침이 여기 몰려 있다",
  },
];

const REGION_INDEX = new Map(REGIONS.map((r) => [r.slug, r]));
const CLASS_INDEX = new Map(CLASSES.map((c) => [c.slug, c]));

export function findRegion(slug: string): Scope | null {
  return REGION_INDEX.get(slug) ?? null;
}

export function findClass(slug: string): Scope | null {
  return CLASS_INDEX.get(slug) ?? null;
}

/** 슬러그 하나로 두 축을 함께 찾는다. 라우터가 쓴다. */
export function findScope(
  slug: string,
): { type: ScopeType; scope: Scope } | null {
  const region = findRegion(slug);
  if (region) return { type: "region", scope: region };
  const cls = findClass(slug);
  if (cls) return { type: "class", scope: cls };
  return null;
}

export function scopeHubSlug(type: ScopeType): string {
  return type === "region" ? REGION_HUB_SLUG : CLASS_HUB_SLUG;
}

/** 화면 문구를 축에 맞게 고른다 */
export function scopeWord(type: ScopeType): {
  /** "지역" / "종별" */
  axis: string;
  /** "전국" / "전체 종별" — 비교 기준을 부르는 말 */
  base: string;
  /** 다른 축의 이름. 상세 화면에서 서로 넘겨줄 때 쓴다 */
  other: string;
} {
  return type === "region"
    ? { axis: "지역", base: "전국", other: "병원 종별" }
    : { axis: "병원 종별", base: "전체 종별", other: "지역" };
}
