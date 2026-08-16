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
 * 대신 말할 수 있는 것이 있다. **비급여는 병원이 스스로 정하는 값이라 같은
 * 항목도 몇 배씩 차이 난다**는 구조다. 소견서 300배, 진료확인서 100배,
 * 일반진단서 25배. 이건 연도가 지나도 달라지지 않는 성질이고, 실제로 사람들이
 * 겪는 일이다. 그 구조를 보여주고 현재 가격은 심평원 조회로 넘긴다.
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

export function formatWon(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${Math.round(value).toLocaleString()}원`;
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
