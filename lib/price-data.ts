/**
 * 비급여 진료비 조회.
 *
 * 원본은 공공데이터포털 15001700 「심평원 비급여진료비정보조회서비스」다.
 * 병원급 이상 576곳 × 52개 항목 = 12,942행.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  이 사이트가 무엇을 말하고 무엇을 말하지 않는가
 * ────────────────────────────────────────────────────────────────────────
 * 가격 적용일자가 **2015년(92%)·2016년(8%)** 이다. 지금 가격이 아니다.
 * 그래서 절대 금액을 "현재 가격"으로 말하지 않는다.
 *
 * 그래서 **원 단위 금액은 화면에 한 글자도 싣지 않는다.** 대신 남는 것이 있다.
 * 비급여는 병원이 스스로 정하는 값이라 같은 항목도 몇 배씩 차이 나고, 어떤
 * 종별·지역이 상대적으로 비싼지도 갈린다. 이런 **배수와 순서**는 절대 금액과
 * 달리 시간이 지나도 크게 뒤집히지 않는다.
 *
 * 요약하면 이 사이트는 "얼마인가"에 답하지 않는다. "얼마나 다른가"에만 답하고
 * 금액은 심평원 조회로 넘긴다. formatWon 같은 표시 함수를 두지 않는 이유다.
 */

import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { REGIONS, type Region } from "@/lib/regions";

export const PRICES_TABLE = "medifee_prices";
export const ITEMS_TABLE = "medifee_items";
export const REGIONS_TABLE = "medifee_regions";

/** 원본 가격의 기준. 화면에 반복해서 노출한다. */
export const PRICE_BASE_YEARS = "2015~2016년";

/** 이 데이터에 들어 있는 의료기관 범위 */
export const SCOPE_NOTE = "병원급 이상 576곳 (의원급 제외)";

export interface PriceRow {
  id: number;
  hospital: string;
  cl_name: string | null;
  region_slug: string;
  sido: string;
  item_slug: string;
  item_name: string;
  item_category: string;
  price_min: number | null;
  price_max: number | null;
  applied_year: number | null;
  hospital_url: string | null;
}

export interface ItemStats {
  item_slug: string;
  item_name: string;
  item_category: string;
  hospital_count: number;
  region_count: number;
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  median_price: number | null;
  applied_year: number | null;
  updated_at: string;
}

export interface RegionStats {
  region_slug: string;
  sido: string;
  hospital_count: number;
  item_count: number;
  price_rows: number;
  updated_at: string;
}

const PRICE_COLUMNS =
  "id, hospital, cl_name, region_slug, sido, item_slug, item_name, item_category, price_min, price_max, applied_year, hospital_url";

const CACHE_SECONDS = 3600;
/** 조회 결과의 모양이 바뀌면 반드시 올린다 */
const CACHE_VERSION = "v1";

/* ------------------------------- 조회 ------------------------------- */

async function fetchAllItems(): Promise<ItemStats[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from(ITEMS_TABLE)
      .select("*")
      .order("hospital_count", { ascending: false })
      .limit(1000);
    if (error) {
      console.error("fetchAllItems", error.message);
      return [];
    }
    return (data ?? []) as ItemStats[];
  } catch {
    return [];
  }
}

async function fetchItem(slug: string): Promise<ItemStats | null> {
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from(ITEMS_TABLE)
      .select("*")
      .eq("item_slug", slug)
      .maybeSingle();
    if (error) {
      console.error("fetchItem", error.message);
      return null;
    }
    return (data as ItemStats) ?? null;
  } catch {
    return null;
  }
}

/** 항목 하나의 병원별 가격 (싼 순) */
async function fetchItemPrices(slug: string): Promise<PriceRow[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from(PRICES_TABLE)
      .select(PRICE_COLUMNS)
      .eq("item_slug", slug)
      .order("price_max", { ascending: true, nullsFirst: false })
      .limit(1000);
    if (error) {
      console.error("fetchItemPrices", error.message);
      return [];
    }
    return (data ?? []) as unknown as PriceRow[];
  } catch {
    return [];
  }
}

async function fetchAllRegionStats(): Promise<RegionStats[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from(REGIONS_TABLE)
      .select("*")
      .limit(1000);
    if (error) {
      console.error("fetchAllRegionStats", error.message);
      return [];
    }
    return (data ?? []) as RegionStats[];
  } catch {
    return [];
  }
}

async function fetchRegionPrices(slug: string): Promise<PriceRow[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from(PRICES_TABLE)
      .select(PRICE_COLUMNS)
      .eq("region_slug", slug)
      .order("item_category", { ascending: true })
      .order("price_max", { ascending: true, nullsFirst: false })
      .limit(1000);
    if (error) {
      console.error("fetchRegionPrices", error.message);
      return [];
    }
    return (data ?? []) as unknown as PriceRow[];
  } catch {
    return [];
  }
}

/* --------------------------- 캐시를 씌운 조회 --------------------------- */

const cachedAllItems = unstable_cache(fetchAllItems, [CACHE_VERSION, "items"], {
  revalidate: CACHE_SECONDS,
  tags: ["medifee"],
});
const cachedItem = unstable_cache(fetchItem, [CACHE_VERSION, "item"], {
  revalidate: CACHE_SECONDS,
  tags: ["medifee"],
});
const cachedItemPrices = unstable_cache(
  fetchItemPrices,
  [CACHE_VERSION, "item-prices"],
  { revalidate: CACHE_SECONDS, tags: ["medifee"] },
);
const cachedRegionStats = unstable_cache(
  fetchAllRegionStats,
  [CACHE_VERSION, "region-stats"],
  { revalidate: CACHE_SECONDS, tags: ["medifee"] },
);
const cachedRegionPrices = unstable_cache(
  fetchRegionPrices,
  [CACHE_VERSION, "region-prices"],
  { revalidate: CACHE_SECONDS, tags: ["medifee"] },
);

export function listItems() {
  return cachedAllItems();
}
export function getItem(slug: string) {
  return cachedItem(slug);
}
export function listItemPrices(slug: string) {
  return cachedItemPrices(slug);
}
export function listRegionPrices(slug: string) {
  return cachedRegionPrices(slug);
}

export async function getAllRegionStats(): Promise<Map<string, RegionStats>> {
  const rows = await cachedRegionStats();
  return new Map(rows.map((r) => [r.region_slug, r]));
}

export async function getRegionStats(
  slug: string,
): Promise<RegionStats | null> {
  return (await getAllRegionStats()).get(slug) ?? null;
}

/* ----------------------------- 화면용 계산 ----------------------------- */

/**
 * 앞말의 받침에 맞는 조사를 골라 붙인다.
 * 항목 이름이 그대로 문장에 들어가므로 "은(는)" 표기를 쓰지 않는다.
 */
export function withParticle(word: string, pair: "은는" | "이가"): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  if (!isHangul) return pair === "은는" ? `${word}은(는)` : `${word}이(가)`;
  const hasJong = (code - 0xac00) % 28 !== 0;
  if (pair === "은는") return `${word}${hasJong ? "은" : "는"}`;
  return `${word}${hasJong ? "이" : "가"}`;
}

/**
 * 기준값 대비 몇 퍼센트인지. "+38%" / "-12%" / "±0%"
 *
 * 절대 금액을 싣지 않기로 했으므로 비교는 전부 이 형태로 한다.
 */
export function relative(value: number, base: number): string {
  if (!base) return "-";
  const pct = Math.round(((value - base) / base) * 100);
  if (pct === 0) return "±0%";
  return `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`;
}

/** 정렬·강조에 쓰는 부호 */
export function relativeSign(value: number, base: number): "up" | "down" | "flat" {
  if (!base) return "flat";
  const pct = Math.round(((value - base) / base) * 100);
  return pct > 0 ? "up" : pct < 0 ? "down" : "flat";
}

/**
 * 항목 제목을 만든다.
 *
 * 52개 항목이 전부 "{이름}, 병원마다 N배 차이 납니다"로 같으면 자동 생성으로
 * 읽히고 검색 결과에서도 서로 잡아먹는다. 대분류마다 사람들이 실제로 치는
 * 말이 다르므로 그에 맞춰 갈라 쓴다.
 *   제증명수수료 → "발급 비용"   병실 → "병실료"   검사 → "검사비"
 *   치과 → "치과마다"           한방 → "한의원마다"
 */
export function itemHeadline(
  item: { item_name: string; item_category: string },
  ratio: number | null,
): string {
  const n = item.item_name;
  const r = ratio ? `${ratio}배` : "얼마나";
  const c = item.item_category;

  if (c === "제증명수수료") return `${n} 발급 비용, 병원마다 ${r} 차이`;
  if (c === "상급병실료차액") return `${n} 병실료, 병원마다 ${r} 차이`;
  if (c.includes("치과") || c === "충치치료료")
    return `${n} 비용, 치과마다 ${r} 차이`;
  if (c.includes("한방")) return `${n} 비용, 한의원마다 ${r} 차이`;
  if (c.includes("검사") || c.includes("진단"))
    return `${n} 검사비, 병원마다 ${r} 차이`;
  if (c.includes("상담")) return `${n} 비용, 병원마다 ${r} 차이`;
  return `${n}, 병원마다 ${r} 차이`;
}

/** 화면 안에서 항목을 부를 때 쓰는 말 */
export function itemNoun(category: string): string {
  if (category === "제증명수수료") return "서류";
  if (category === "상급병실료차액") return "병실";
  if (category.includes("검사") || category.includes("진단")) return "검사";
  return "항목";
}

/** 배수를 말로. "10배 차이" */
export function ratioText(ratio: number | null): string {
  if (!ratio) return "-";
  return `${ratio}배`;
}

/** 최고 ÷ 최저. 이 사이트가 말하려는 것의 핵심 숫자다. */
export function priceRatio(item: {
  min_price: number | null;
  max_price: number | null;
}): number | null {
  if (!item.min_price || !item.max_price) return null;
  return Math.round((item.max_price / item.min_price) * 10) / 10;
}

export interface RegionAverage {
  regionSlug: string;
  regionName: string;
  count: number;
  avg: number;
  min: number;
  max: number;
}

/** 항목 하나를 지역별 평균으로 묶는다 (표본이 적은 지역은 뺀다) */
export function averageByRegion(
  rows: PriceRow[],
  minSamples = 3,
): RegionAverage[] {
  const byRegion = new Map<string, number[]>();
  for (const r of rows) {
    if (r.price_max === null) continue;
    const list = byRegion.get(r.region_slug) ?? [];
    list.push(r.price_max);
    byRegion.set(r.region_slug, list);
  }

  const index = new Map(REGIONS.map((r) => [r.slug, r.name]));

  return [...byRegion.entries()]
    .filter(([, v]) => v.length >= minSamples)
    .map(([slug, v]) => ({
      regionSlug: slug,
      regionName: index.get(slug) ?? slug,
      count: v.length,
      avg: v.reduce((a, b) => a + b, 0) / v.length,
      min: Math.min(...v),
      max: Math.max(...v),
    }))
    .sort((a, b) => b.avg - a.avg);
}

export interface RelativeRow {
  label: string;
  count: number;
  /** 전체 평균 대비 (표시용) */
  diff: string;
  sign: "up" | "down" | "flat";
  /** 정렬용 내부 값. 화면에 그대로 내보내지 않는다. */
  index: number;
}

/**
 * 어떤 축(지역·종별)으로 묶어 **전체 평균 대비 지수**를 낸다.
 *
 * 원 단위 값은 index 계산에만 쓰고 화면에는 퍼센트만 나간다.
 * 표본이 적으면 지수가 쉽게 튀므로 minSamples 로 걸러낸다.
 */
export function relativeBy(
  rows: PriceRow[],
  pick: (r: PriceRow) => string | null,
  minSamples = 3,
): RelativeRow[] {
  const groups = new Map<string, number[]>();
  const all: number[] = [];

  for (const r of rows) {
    if (r.price_max === null) continue;
    const key = (pick(r) ?? "").trim();
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(r.price_max);
    groups.set(key, list);
    all.push(r.price_max);
  }

  if (all.length === 0) return [];
  const base = all.reduce((a, b) => a + b, 0) / all.length;

  return [...groups.entries()]
    .filter(([, v]) => v.length >= minSamples)
    .map(([label, v]) => {
      const avg = v.reduce((a, b) => a + b, 0) / v.length;
      return {
        label,
        count: v.length,
        diff: relative(avg, base),
        sign: relativeSign(avg, base),
        index: avg / base,
      };
    })
    .sort((a, b) => b.index - a.index);
}

/** 지역 축은 이름을 사람이 읽는 형태로 바꿔 준다 */
export function relativeByRegion(
  rows: PriceRow[],
  minSamples = 3,
): Array<RelativeRow & { regionSlug: string }> {
  const index = new Map(REGIONS.map((r) => [r.slug, r.name]));
  const bySlug = relativeBy(rows, (r) => r.region_slug, minSamples);
  return bySlug.map((r) => ({
    ...r,
    regionSlug: r.label,
    label: index.get(r.label) ?? r.label,
  }));
}

/** 대분류별로 항목을 묶는다 (허브 화면) */
export function groupByCategory(
  items: ItemStats[],
): Array<{ category: string; items: ItemStats[] }> {
  const map = new Map<string, ItemStats[]>();
  for (const it of items) {
    const list = map.get(it.item_category) ?? [];
    list.push(it);
    map.set(it.item_category, list);
  }
  return [...map.entries()]
    .map(([category, list]) => ({
      category,
      items: list.sort((a, b) => b.hospital_count - a.hospital_count),
    }))
    .sort((a, b) => b.items.length - a.items.length);
}

/** 데이터가 있는 지역만 */
export function regionsWithData(stats: Map<string, RegionStats>): Region[] {
  return REGIONS.filter((r) => (stats.get(r.slug)?.price_rows ?? 0) > 0);
}
