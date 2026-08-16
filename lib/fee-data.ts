/**
 * 비급여 진료비 · 제증명수수료 조회.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  원본
 * ────────────────────────────────────────────────────────────────────────
 * KOSIS 「비급여진료비용및제증명수수료통계」(심사평가원, orgId 354).
 * 시도별 17개 + 병원 종별 10개, 두 축에 각각 비급여진료비용·제증명수수료
 * 표가 있어 통계표 54개를 모아 온다. 적재는 scripts/import-kosis.mjs.
 *
 * 처음에는 공공데이터포털 15001700 을 썼는데 가격 적용일자가 2015~2016년이라
 * 버렸다. 지금 쓰는 KOSIS 자료는 **2025년 기준**이고 의원·치과의원·한의원까지
 * 들어 있다. 그래서 이 사이트는 금액을 그대로 싣는다.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  이 자료가 말하는 것과 말하지 않는 것
 * ────────────────────────────────────────────────────────────────────────
 * **병원별 가격이 아니다.** 집계 통계라서 한 항목에 대해 그 지역·종별의
 * 최저·최고·평균·중간값 네 값만 있다. "서울 A병원 도수치료 얼마"는 알 수 없고
 * "서울에서 도수치료가 어느 범위인가"만 알 수 있다.
 *
 * 그래서 화면에서 **중간값을 앞세운다.** 최저·최고는 한 곳만 있어도 잡히는
 * 값이라 대표성이 없다. 300원짜리 도수치료가 최저로 잡히지만 그건 사실상
 * 무료 진료다.
 */

import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import type { ScopeType } from "@/lib/scopes";

export const FEES_TABLE = "medifee_fees";
export const ITEMS_TABLE = "medifee_items";
export const SCOPES_TABLE = "medifee_scopes";

/** 자료의 기준 연도. 화면에 반복해서 노출한다. */
export const DATA_YEAR = 2025;
/** 통계표가 마지막으로 갱신된 날 (KOSIS LST_CHN_DE) */
export const DATA_UPDATED = "2025년 11월 19일";
/** 이 자료에 들어 있는 의료기관 범위 */
export const SCOPE_NOTE = "상급종합병원부터 동네 의원·치과의원·한의원까지";

export interface FeeRow {
  fee_kind: "treatment" | "certificate";
  item_code: string;
  item_slug: string;
  item_name: string;
  item_full_name: string;
  category: string;
  scope_type: ScopeType;
  scope: string;
  year: number;
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  median_price: number | null;
}

export interface ItemStats {
  item_slug: string;
  item_name: string;
  item_full_name: string;
  category: string;
  fee_kind: "treatment" | "certificate";
  /** 값이 있는 시도 수 (최대 17) */
  scope_count: number;
  /** 값이 있는 병원 종별 수 (최대 10) */
  class_count: number;
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  median_price: number | null;
  /** 17개 시도 중간값들의 중간값. 지역 화면의 비교 기준 */
  region_median: number | null;
  /** 10개 종별 중간값들의 중간값. 종별 화면의 비교 기준 */
  class_median: number | null;
  year: number;
}

export interface ScopeStats {
  scope_type: ScopeType;
  scope: string;
  item_count: number;
  category_count: number;
  year: number;
}

const FEE_COLUMNS =
  "fee_kind, item_code, item_slug, item_name, item_full_name, category, scope_type, scope, year, min_price, max_price, avg_price, median_price";

const CACHE_SECONDS = 3600;
/** 조회 결과의 모양이 바뀌면 반드시 올린다. 안 올리면 예전 모양이 그대로 나온다. */
const CACHE_VERSION = "kosis-v1";

/* ------------------------------- 조회 ------------------------------- */

async function fetchAllItems(): Promise<ItemStats[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from(ITEMS_TABLE)
      .select("*")
      .order("scope_count", { ascending: false })
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

/** 항목 하나의 27개 행 (시도 17 + 종별 10) */
async function fetchItemFees(slug: string): Promise<FeeRow[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from(FEES_TABLE)
      .select(FEE_COLUMNS)
      .eq("item_slug", slug)
      .order("median_price", { ascending: false, nullsFirst: false })
      .limit(100);
    if (error) {
      console.error("fetchItemFees", error.message);
      return [];
    }
    return (data ?? []) as unknown as FeeRow[];
  } catch {
    return [];
  }
}

/**
 * 지역 하나 또는 종별 하나의 전체 항목.
 *
 * 가장 많은 곳(서울)이 650행이라 Supabase 의 1000행 상한 안에 든다. 항목이
 * 늘어 상한에 닿으면 잘린 줄도 모르고 지나가므로 여기 숫자를 손볼 때 주의할 것.
 */
async function fetchScopeFees(
  scopeType: ScopeType,
  scope: string,
): Promise<FeeRow[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from(FEES_TABLE)
      .select(FEE_COLUMNS)
      .eq("scope_type", scopeType)
      .eq("scope", scope)
      .order("median_price", { ascending: false, nullsFirst: false })
      .limit(1000);
    if (error) {
      console.error("fetchScopeFees", error.message);
      return [];
    }
    return (data ?? []) as unknown as FeeRow[];
  } catch {
    return [];
  }
}

async function fetchScopeStats(): Promise<ScopeStats[]> {
  if (!supabaseAdmin) return [];
  try {
    const { data, error } = await supabaseAdmin
      .from(SCOPES_TABLE)
      .select("*")
      .limit(100);
    if (error) {
      console.error("fetchScopeStats", error.message);
      return [];
    }
    return (data ?? []) as ScopeStats[];
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
const cachedItemFees = unstable_cache(
  fetchItemFees,
  [CACHE_VERSION, "item-fees"],
  { revalidate: CACHE_SECONDS, tags: ["medifee"] },
);
const cachedScopeFees = unstable_cache(
  fetchScopeFees,
  [CACHE_VERSION, "scope-fees"],
  { revalidate: CACHE_SECONDS, tags: ["medifee"] },
);
const cachedScopeStats = unstable_cache(
  fetchScopeStats,
  [CACHE_VERSION, "scope-stats"],
  { revalidate: CACHE_SECONDS, tags: ["medifee"] },
);

export function listItems() {
  return cachedAllItems();
}
export function getItem(slug: string) {
  return cachedItem(slug);
}
export function listItemFees(slug: string) {
  return cachedItemFees(slug);
}
export function listScopeFees(scopeType: ScopeType, scope: string) {
  return cachedScopeFees(scopeType, scope);
}

export async function getScopeStats(): Promise<Map<string, ScopeStats>> {
  const rows = await cachedScopeStats();
  return new Map(rows.map((r) => [`${r.scope_type}|${r.scope}`, r]));
}

/* ----------------------------- 화면용 계산 ----------------------------- */

/** 원 단위 금액. 만 원 이상은 "12만 5,000원" 처럼 끊어 읽기 좋게 쓴다. */
export function formatWon(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (value < 10000) return `${value.toLocaleString("ko-KR")}원`;
  const man = Math.floor(value / 10000);
  const rest = value % 10000;
  if (rest === 0) return `${man.toLocaleString("ko-KR")}만원`;
  return `${man.toLocaleString("ko-KR")}만 ${rest.toLocaleString("ko-KR")}원`;
}

/**
 * 표 안에서 자리를 아껴야 할 때 쓰는 짧은 표기.
 *
 * 10만원을 넘으면 소수점을 버린다. "39.2만원" 은 자릿수만 늘리고 읽는 데는
 * 도움이 되지 않는다. 반대로 1만원대는 소수점이 없으면 1만원과 1만 9천원이
 * 같아 보이므로 한 자리를 남긴다.
 */
export function formatWonShort(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (value < 10000) return `${value.toLocaleString("ko-KR")}원`;
  const man = value / 10000;
  const rounded = man >= 10 ? Math.round(man) : Math.round(man * 10) / 10;
  return `${rounded.toLocaleString("ko-KR")}만원`;
}

/**
 * 알파벳 한 글자를 한국어로 읽었을 때 받침이 있는가.
 * L(엘) M(엠) N(엔) R(알) Z(제트) 만 받침으로 끝난다.
 */
const LATIN_JONG = new Set(["l", "m", "n", "r", "z"]);

/** 숫자를 한국어로 읽었을 때 받침이 있는가. 영·일·삼·육·칠·팔 */
const DIGIT_JONG = new Set(["0", "1", "3", "6", "7", "8"]);

/**
 * 앞말의 받침에 맞는 조사를 골라 붙인다.
 *
 * 항목 이름이 그대로 문장에 들어가므로 "은(는)" 같은 표기를 쓰지 않는다.
 * 원본 이름에는 괄호가 붙은 것이 많아서 — "DHEA(Dehydroepiandrosterone)",
 * "FIMS(Functional Intramuscular Stimulation)" — 괄호를 먼저 떼고 판단한다.
 * 떼고 나면 영문 약어나 숫자로 끝나는 경우가 남는데, 읽는 소리를 기준으로
 * 고른다. "MRI는", "CD는", "1인실은" 처럼.
 */
export function withParticle(word: string, pair: "은는" | "이가"): string {
  const bare = word
    .trim()
    .replace(/\s*[([{〈《「『【][^)\]}〉》」』】]*[)\]}〉》」』】]\s*$/, "")
    .replace(/[\s.,·]+$/, "")
    .trim();

  const last = (bare || word.trim()).slice(-1).toLowerCase();
  const code = last.charCodeAt(0);

  let hasJong: boolean;
  if (code >= 0xac00 && code <= 0xd7a3) {
    hasJong = (code - 0xac00) % 28 !== 0;
  } else if (/[a-z]/.test(last)) {
    hasJong = LATIN_JONG.has(last);
  } else if (/[0-9]/.test(last)) {
    hasJong = DIGIT_JONG.has(last);
  } else {
    return pair === "은는" ? `${word}은(는)` : `${word}이(가)`;
  }

  if (pair === "은는") return `${word}${hasJong ? "은" : "는"}`;
  return `${word}${hasJong ? "이" : "가"}`;
}

/** 최고 ÷ 최저. 비급여가 왜 문제인지 한 숫자로 말해 주는 값이다. */
export function priceRatio(item: {
  min_price: number | null;
  max_price: number | null;
}): number | null {
  if (!item.min_price || !item.max_price) return null;
  const r = item.max_price / item.min_price;
  if (!Number.isFinite(r) || r < 1) return null;
  return r >= 10 ? Math.round(r) : Math.round(r * 10) / 10;
}

/**
 * "최저 ~ 최고". 한쪽만 있는 경우가 있어서 그때는 있는 쪽만 말한다.
 * "- ~ 10만원" 처럼 보이면 값이 없는 것인지 0원인지 알 수 없다.
 */
export function rangeText(row: {
  min_price: number | null;
  max_price: number | null;
}): string {
  const { min_price: lo, max_price: hi } = row;
  if (lo === null && hi === null) return "-";
  if (lo === null) return `${formatWonShort(hi)} 이하`;
  if (hi === null) return `${formatWonShort(lo)} 이상`;
  if (lo === hi) return formatWonShort(lo);
  return `${formatWonShort(lo)} ~ ${formatWonShort(hi)}`;
}

export function ratioText(ratio: number | null): string {
  if (!ratio) return "-";
  return `${ratio.toLocaleString("ko-KR")}배`;
}

/** 기준값 대비. "+38%" / "−12%" / "±0%" */
export function relative(value: number, base: number): string {
  if (!base) return "-";
  const pct = Math.round(((value - base) / base) * 100);
  if (pct === 0) return "±0%";
  return `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`;
}

export function relativeSign(
  value: number,
  base: number,
): "up" | "down" | "flat" {
  if (!base) return "flat";
  const pct = Math.round(((value - base) / base) * 100);
  return pct > 0 ? "up" : pct < 0 ? "down" : "flat";
}

/**
 * 항목 이름을 화면용으로 다듬는다.
 *
 * 원본 이름에는 대괄호가 그대로 들어 있고("체외충격파치료[근골격계질환]"),
 * 대분류 이름이 앞에 한 번 더 붙는다("이학요법료 도수치료"). 제목에 그대로
 * 쓰면 읽는 흐름이 끊긴다.
 *
 * 다만 **제증명수수료는 손대지 않는다.** 그쪽은 대분류가 곧 서류 이름이라
 * 떼어내면 "진단서 일반"이 "일반"이 되고 "상해진단서 3주 미만"이 "3주 미만"이
 * 되어 무슨 서류인지 사라진다.
 */
export function itemLabel(item: {
  item_full_name: string;
  category?: string;
  fee_kind?: string;
}): string {
  const name = item.item_full_name
    .replace(/\s*\[([^\]]+)\]/g, " $1")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (item.fee_kind === "certificate") return name;

  const c = item.category;
  if (c && name.startsWith(`${c} `)) {
    const rest = name.slice(c.length + 1).trim();
    if (rest.length >= 3 && !/^(일반|정밀|기타|보통|특수|단순|기본)$/.test(rest)) {
      return rest;
    }
  }
  return name;
}

/**
 * 항목 제목.
 *
 * 668개가 전부 "○○ 비용"으로 같으면 자동 생성으로 읽히고 검색 결과에서도
 * 서로 잡아먹는다. 대분류마다 사람들이 실제로 치는 말이 다르므로 갈라 쓴다.
 */
export function itemHeadline(item: ItemStats): string {
  const n = itemLabel(item);
  const c = item.category;

  if (item.fee_kind === "certificate") return `${n} 발급 비용`;
  if (c === "상급병실료") return `${n} 병실료 하루 얼마`;
  if (c === "예방접종료") return `${n} 접종 비용`;
  if (c.includes("MRI")) return `${n} 검사 비용`;
  if (c.includes("초음파")) return `${n} 검사 비용`;
  if (c.includes("검사")) return `${n} 검사 비용`;
  if (c.includes("한방")) return `${n} 비용`;
  if (c === "치료재료") return `${n} 재료비`;
  return `${n} 비용`;
}

/** 화면 안에서 항목을 부를 때 쓰는 말 */
export function itemNoun(item: ItemStats): string {
  if (item.fee_kind === "certificate") return "서류";
  const c = item.category;
  if (c === "상급병실료") return "병실";
  if (c === "예방접종료") return "접종";
  if (c === "치료재료") return "재료";
  if (c.includes("검사") || c.includes("MRI") || c.includes("초음파"))
    return "검사";
  if (c.includes("수술")) return "시술";
  return "항목";
}

/** 대분류별로 묶는다 (허브 화면) */
export function groupByCategory<T extends { category: string }>(
  items: T[],
): Array<{ category: string; items: T[] }> {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const list = map.get(it.category) ?? [];
    list.push(it);
    map.set(it.category, list);
  }
  return [...map.entries()]
    .map(([category, list]) => ({ category, items: list }))
    .sort((a, b) => b.items.length - a.items.length);
}

/**
 * 앞세울 항목.
 *
 * 668개를 그대로 늘어놓으면 사람들이 실제로 찾는 것이 묻힌다. 네이버에서
 * 실제로 많이 치는 말을 기준으로 골랐다. 슬러그는 적재 스크립트가 만드는
 * 값이라, 항목이 사라지면 아래 목록에서 조용히 빠진다(에러를 내지 않는다).
 */
export const FEATURED_SLUGS = [
  "도수치료",
  "1인실",
  "체외충격파치료-근골격계질환",
  "증식치료-척추부위",
  "mri-뇌-일반",
  "mri-근골격계-슬관절-일반",
  "대상포진-싱그릭스주",
  "사람유두종바이러스-감염증-가다실9주",
  "추나요법-단순추나",
  "언어치료",
  "진단서-일반",
  "상해진단서-3주-미만",
  "후유장애진단서",
  "사망진단서",
  "2인실",
  "진료기록사본-1-5매",
];

/** FEATURED_SLUGS 순서를 지켜 실제 있는 것만 돌려준다 */
export function featuredItems(items: ItemStats[]): ItemStats[] {
  const index = new Map(items.map((i) => [i.item_slug, i]));
  return FEATURED_SLUGS.map((s) => index.get(s)).filter(
    (i): i is ItemStats => Boolean(i),
  );
}

/** 같은 분류의 다른 항목 (상세 화면 아래 내부 링크) */
export function siblingItems(
  items: ItemStats[],
  item: ItemStats,
  limit = 16,
): ItemStats[] {
  return items
    .filter((i) => i.category === item.category && i.item_slug !== item.item_slug)
    .sort((a, b) => (b.median_price ?? 0) - (a.median_price ?? 0))
    .slice(0, limit);
}
