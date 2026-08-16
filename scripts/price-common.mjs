/**
 * 비급여 진료비 적재 공통 모듈.
 *
 * 원본은 공공데이터포털 15001700 「건강보험심사평가원_비급여진료비정보조회서비스」의
 * getNonPaymentItemHospList 오퍼레이션이다. 14,058건 · XML.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  이 데이터의 성격을 먼저 알아야 한다
 * ────────────────────────────────────────────────────────────────────────
 * **가격의 적용일자가 2015년(92%)·2016년(8%)이다.** 지금 가격이 아니다.
 * 그래서 이 사이트는 절대 금액을 "현재 가격"으로 말하지 않는다. 대신
 * "같은 항목인데 병원·지역마다 몇 배씩 다르다"는 **구조**를 보여주고,
 * 현재 가격은 심평원 조회로 넘긴다. 기준 연도를 페이지마다 밝힌다.
 *
 * 병원급 이상 576곳만 들어 있다(의원급 없음)는 것도 함께 밝혀야 한다.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");

const regionData = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/regions.json"), "utf8"),
);
const SIDOS = regionData.sidos;
const SIGUNGU = regionData.sigungu;

export const KNOWN_SLUGS = new Set();
for (const s of SIDOS) {
  const c = SIGUNGU[s.short] ?? [];
  if (!c.length) {
    KNOWN_SLUGS.add(s.short);
    continue;
  }
  for (const g of c) KNOWN_SLUGS.add(`${s.short}-${g}`);
}

/* ---------------------------- 지역 매칭 ---------------------------- */

/**
 * 심평원 시도명을 표준 시도 후보로 바꾼다.
 *
 * 심평원은 자체 구분을 써서 **"전남광주"처럼 두 시도를 합쳐 놓은 값**이 있다.
 * 그래서 하나로 못 정하고 후보를 여러 개 돌려준 뒤, 시군구로 판별한다.
 */
export function sidoCandidates(raw) {
  const n = String(raw ?? "").trim();
  if (n === "전남광주") return ["전남", "광주"];
  const hit = SIDOS.find((s) => s.short === n || s.name === n);
  if (hit) return [hit.short];
  return SIDOS.filter((s) => n.includes(s.short)).map((s) => s.short);
}

/**
 * 시도 안에서 시군구를 찾는다. 순서가 중요하다.
 *
 *   1) 정확 일치      — "부산진구"를 먼저 잡아야 한다. 접두어를 먼저 떼면
 *                       "부산"+"진구"로 잘려서 없는 지역이 된다 (실제로 겪었다)
 *   2) 시도 접두어 제거 — "광주서구" → "서구"
 *   3) 일반구 합치기   — "고양일산동구" → "고양시", "수원팔달구" → "수원시"
 *
 * 못 찾으면 null, 하위 시군구가 없는 시도(세종)는 빈 문자열.
 */
export function matchSigungu(sido, raw) {
  const list = SIGUNGU[sido] ?? [];
  const g = String(raw ?? "").replace(/\s+/g, "");
  if (!list.length) return "";
  if (list.includes(g)) return g;

  if (g.startsWith(sido)) {
    const t = g.slice(sido.length);
    if (list.includes(t)) return t;
  }

  for (const c of list) {
    if (!c.endsWith("시")) continue;
    const stem = c.slice(0, -1);
    if (g.startsWith(stem) && g.endsWith("구")) return c;
    if (g.startsWith(c)) return c;
  }
  return null;
}

export function resolveRegionSlug(sidoNm, sgguNm) {
  for (const sd of sidoCandidates(sidoNm)) {
    const g = matchSigungu(sd, sgguNm);
    if (g === null) continue;
    const slug = g ? `${sd}-${g}` : sd;
    if (KNOWN_SLUGS.has(slug)) return slug;
  }
  return null;
}

/* ------------------------------ 항목 ------------------------------ */

/**
 * 항목 식별.
 *
 * itmCdNm(항목명)은 병원이 자유롭게 적어서 5,000가지가 넘는다. 그걸로 묶으면
 * 페이지가 폭발하고 같은 항목이 여러 개로 쪼개진다. 그래서 심평원이 코드로
 * 관리하는 divCd1~3 을 쓴다. 가장 구체적인 이름을 항목 이름으로 삼는다.
 */
export function itemIdentity(row) {
  const big = (row.divCd1Nm ?? "").trim();
  const mid = (row.divCd2Nm ?? "").trim();
  const small = (row.divCd3Nm ?? "").trim();
  const code = [row.divCd1, row.divCd2, row.divCd3].filter(Boolean).join("-");
  const name = small || mid || big;
  return { code, name, category: big, sub: mid };
}

/** 항목 URL 슬러그. 한글을 쓰고 특수문자만 하이픈으로 바꾼다. */
export function itemSlug(name) {
  return (
    String(name ?? "")
      .toLowerCase()
      .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50)
      .replace(/-+$/g, "") || "item"
  );
}

/* ------------------------------ 값 정리 ------------------------------ */

export function toInt(value) {
  const n = Number(String(value ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** "15-09-11" → 2015 */
export function toYear(value) {
  const m = String(value ?? "").match(/^(\d{2})-/);
  if (!m) return null;
  const y = Number(m[1]);
  return y >= 90 ? 1900 + y : 2000 + y;
}

function nullable(v) {
  const s = String(v ?? "").trim();
  return s.length > 0 ? s : null;
}

export function normalizeRows(rows) {
  const records = [];
  const unknownRegions = new Map();

  for (const r of rows) {
    const regionSlug = resolveRegionSlug(r.sidoCdNm, r.sgguCdNm);
    if (!regionSlug) {
      const key = `${r.sidoCdNm} | ${r.sgguCdNm}`;
      unknownRegions.set(key, (unknownRegions.get(key) ?? 0) + 1);
      continue;
    }

    const item = itemIdentity(r);
    if (!item.name) continue;

    const min = toInt(r.prcMin) ?? toInt(r.itmPrcMin);
    const max = toInt(r.prcMax) ?? toInt(r.itmPrcMax);
    if (min === null && max === null) continue;

    const [sido] = regionSlug.split("-");

    records.push({
      hospital: String(r.yadmNm ?? "").trim(),
      ykiho: nullable(r.ykiho),
      cl_name: nullable(r.clCdNm),
      region_slug: regionSlug,
      sido,
      item_code: item.code,
      item_name: item.name,
      item_slug: itemSlug(item.name),
      item_category: item.category,
      item_sub: nullable(item.sub),
      price_min: min ?? max,
      price_max: max ?? min,
      applied_year: toYear(r.invtDt),
      hospital_url: nullable(r.url),
    });
  }

  return { records, unknownRegions };
}

/** upsert 키 중복을 미리 걷어낸다 */
export function dedupeByKey(records) {
  const seen = new Map();
  for (const r of records) {
    seen.set(`${r.ykiho ?? r.hospital}|${r.item_code}|${r.region_slug}`, r);
  }
  return [...seen.values()];
}

export async function loadIntoSupabase(supabase, records, { batch = 500 } = {}) {
  for (let i = 0; i < records.length; i += batch) {
    const chunk = records.slice(i, i + batch);
    const { error } = await supabase
      .from("medifee_prices")
      .upsert(chunk, { onConflict: "ykiho,item_code" });
    if (error) {
      throw new Error(`적재 실패 (${i}~${i + chunk.length}): ${error.message}`);
    }
    console.log(`  적재 ${Math.min(i + batch, records.length)}/${records.length}`);
  }
}

export async function refreshAggregates(supabase) {
  console.log("집계 갱신 중...");
  const { error } = await supabase.rpc("refresh_medifee_aggregates");
  if (error) throw new Error(`집계 갱신 실패: ${error.message}`);
}

export function reportUnknownRegions(unknownRegions) {
  if (unknownRegions.size === 0) return;
  console.warn("\n⚠ 목록에 없는 지역명 — 이 행들은 적재되지 않았습니다.");
  console.warn("  data/regions.json 을 고친 뒤 다시 실행하세요.\n");
  for (const [k, v] of [...unknownRegions.entries()].sort((a, b) => b[1] - a[1])) {
    console.warn(`   ${k} — ${v}건`);
  }
  console.warn("");
}
