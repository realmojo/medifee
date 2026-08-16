#!/usr/bin/env node
/**
 * KOSIS 「비급여진료비용및제증명수수료통계」→ Supabase 적재.
 *
 * 출처: 국가통계포털 심사평가원(orgId 354) 354_001
 *       시도별 34개 표 + 병원규모별 20개 표 = 54개
 *       https://kosis.kr/openapi/  (KOSIS 전용 인증키 필요. data.go.kr 키와 다름)
 *
 * ────────────────────────────────────────────────────────────────────────
 *  왜 data.go.kr 대신 KOSIS 인가
 * ────────────────────────────────────────────────────────────────────────
 * data.go.kr 15001700 은 가격 적용일자가 2015~2016년이라 쓸 수 없었다.
 * KOSIS 쪽은 2021~2025년이 들어 있고 의원·치과의원·한의원까지 포함한다.
 * 대신 집계 통계라 병원별 자료가 없고 지역 단위가 시군구가 아니라 시도다.
 *
 * ────────────────────────────────────────────────────────────────────────
 *  반드시 알아야 할 함정
 * ────────────────────────────────────────────────────────────────────────
 * **항목 코드가 표 종류마다 다른 뜻이다.** A0101 이 비급여진료비용 표에서는
 * "1인실"이고 제증명수수료 표에서는 "일반(진단서)"이다. 16개 코드가 이렇게
 * 겹친다. 그래서 항목을 식별할 때 반드시 fee_kind 를 함께 써야 한다.
 * 코드만으로 합치면 서로 다른 항목이 한 페이지에 섞인다.
 *
 *   npm run probe:kosis    한 표만 받아 구조 확인
 *   npm run import:kosis   전체 적재 + 집계 갱신
 *   npm run import:kosis -- --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import { allTables, CLASS_TABLES, REGION_TABLES } from "./kosis-tables.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const ORG = 354;
const DATA_URL = "https://kosis.kr/openapi/Param/statisticsParameterData.do";
const META_URL = "https://kosis.kr/openapi/statisticsData.do";

/** 표 종류별로 항목 메타를 한 번만 받으면 된다 (모든 표가 같은 코드 체계를 쓴다) */
const META_SOURCE = {
  treatment: REGION_TABLES[0][1],
  certificate: REGION_TABLES[0][2],
};

function key() {
  const k = process.env.KOSIS_API_KEY;
  if (!k) {
    console.error(
      ".env.local 에 KOSIS_API_KEY 가 필요합니다.\n" +
        "https://kosis.kr/openapi/ 에서 발급받으세요. data.go.kr 키와 다릅니다.",
    );
    process.exit(1);
  }
  return k;
}

async function getJson(url) {
  const res = await fetch(url);
  const j = await res.json();
  if (!Array.isArray(j)) {
    throw new Error(`KOSIS 응답 오류: ${JSON.stringify(j).slice(0, 200)}`);
  }
  return j;
}

/* ------------------------------ 항목 마스터 ------------------------------ */

/** 슬러그. 한글을 살리고 특수문자만 하이픈으로 바꾼다. */
function slugify(name) {
  return (
    String(name ?? "")
      .toLowerCase()
      .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "item"
  );
}

/**
 * 항목 슬러그가 차지하면 안 되는 경로.
 *
 * `/{slug}` 한 라우트가 항목·시도·종별·가이드를 전부 맡는다. 항목 이름이
 * "의원"이나 "서울"로 나오면 그 페이지를 가려버리므로 여기서 막는다.
 */
const RESERVED = new Set([
  ...REGION_TABLES.map(([name]) => name),
  ...CLASS_TABLES.map(([name]) => name),
  "항목",
  "지역",
  "종별",
  "비급여-뜻",
  "비급여-진료비-조회",
  "비급여-실비보험-청구",
  "병원비-환급금-조회",
  "about",
  "contact",
  "privacy",
  "terms",
  "search",
  "sitemap",
  "robots",
]);

/**
 * 그 이름만 떼어 놓아도 무슨 항목인지 알 수 있는가.
 *
 * 짧은 슬러그(`/도수치료`)가 긴 것(`/이학요법료-도수치료`)보다 낫지만,
 * 이름을 떼면 뜻이 사라지는 것들이 있다. "3주 미만"(상해진단서), "1~5매"
 * (진료기록사본), "일반"(46개 항목) 이 그렇다. 이런 것은 상위 분류를 붙여야
 * URL 만 보고도 무엇인지 알 수 있다.
 */
const GENERIC_NAME = /^(일반|정밀|기타|보통|특수|단순|기본)$/;

function isSelfDescribing(name) {
  const n = String(name ?? "").trim();
  if (n.length < 3) return false; // "CD", "Ⅰ"
  if (GENERIC_NAME.test(n)) return false;
  // 수량·기간을 나타내는 이름 — "3주 미만", "6매 이상", "500모 미만"
  if (/\d/.test(n) && /(매|주|모|일|회|번|이상|미만|이하|초과)/.test(n)) {
    return false;
  }
  return true;
}

/**
 * 슬러그 규칙.
 *
 * 기본은 **상위 분류 + 이름**("증식치료-척추부위") 이다. 이름이 유일하고
 * 그것만으로 뜻이 통하며 상위 분류가 대분류와 같아 덧붙일 정보가 없을 때만
 * 이름 하나로 줄인다("도수치료", "1인실"). 그래도 겹치면 코드를 뒤에 붙인다.
 * 코드는 안 바뀌므로 URL 이 안정적이다.
 */
async function buildItems(apiKey) {
  const items = new Map(); // `${feeKind}|${code}` → item

  for (const [feeKind, tblId] of Object.entries(META_SOURCE)) {
    const meta = await getJson(
      `${META_URL}?method=getMeta&apiKey=${apiKey}&orgId=${ORG}&tblId=${tblId}&type=ITM&format=json&jsonVD=Y`,
    );
    const rows = meta.filter((x) => x.OBJ_ID === "A");
    const nameOf = new Map(rows.map((x) => [x.ITM_ID, x.ITM_NM]));
    const codes = new Set(nameOf.keys());

    const parentOf = (c) => {
      for (let len = c.length - 1; len >= 3; len -= 1) {
        const p = c.slice(0, len);
        if (codes.has(p)) return p;
      }
      return null;
    };

    for (const code of codes) {
      const parent = parentOf(code);
      const parentName = parent ? nameOf.get(parent) : null;
      const name = nameOf.get(code);
      // 최상위 조상 = 대분류
      let top = code;
      let up = parentOf(top);
      while (up) {
        top = up;
        up = parentOf(top);
      }

      const category = nameOf.get(top);
      const full =
        parentName && parentName !== name ? `${parentName} ${name}` : name;

      // MRI 표는 항목 이름에 "MRI" 가 없다. "뇌 일반" 이 뇌 MRI 다. 그대로 두면
      // 이름만 보고는 무슨 검사인지 알 수 없고 검색어와도 안 맞으므로 붙여 준다.
      const isMri = /MRI/.test(category ?? "");

      items.set(`${feeKind}|${code}`, {
        fee_kind: feeKind,
        item_code: code,
        item_name: name,
        parent_name: parentName,
        category,
        is_mri: isMri,
        // 표시용 전체 이름 — 부모가 있고 이름이 다르면 함께 적는다
        full_name: isMri ? `MRI ${full}` : full,
      });
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  // 슬러그 배정. 순서가 바뀌면 접미사가 붙는 항목이 달라져 URL 이 흔들리므로
  // 코드순으로 고정한다.
  const nameCount = new Map();
  for (const it of items.values()) {
    nameCount.set(it.item_name, (nameCount.get(it.item_name) ?? 0) + 1);
  }

  const used = new Set(RESERVED);
  const ordered = [...items.values()].sort((a, b) =>
    `${a.fee_kind}|${a.item_code}`.localeCompare(`${b.fee_kind}|${b.item_code}`),
  );

  for (const it of ordered) {
    const bare = slugify(it.item_name);
    const withParent =
      it.parent_name && it.parent_name !== it.item_name
        ? slugify(`${it.parent_name}-${it.item_name}`)
        : bare;

    // 겹칠 때 물러설 자리. MRI 는 접두어를 유지해야 무슨 검사인지 남는다.
    const qualified = it.is_mri ? `mri-${withParent}` : withParent;
    const canShorten =
      !it.is_mri &&
      nameCount.get(it.item_name) === 1 &&
      isSelfDescribing(it.item_name) &&
      (!it.parent_name || it.parent_name === it.category);
    const preferred = canShorten ? bare : qualified;

    let slug = preferred;
    if (used.has(slug)) slug = qualified;
    if (used.has(slug)) slug = `${qualified}-${it.item_code.toLowerCase()}`;
    used.add(slug);
    it.item_slug = slug;
  }

  return items;
}

/* -------------------------------- 적재 -------------------------------- */

function toInt(v) {
  const s = String(v ?? "").trim();
  if (!s || s === "-") return null;
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

async function fetchTable(apiKey, tblId) {
  return getJson(
    `${DATA_URL}?method=getList&apiKey=${apiKey}&itmId=T001+T002+T003+T004+&objL1=ALL&format=json&jsonVD=Y&prdSe=Y&newEstPrdCnt=1&orgId=${ORG}&tblId=${tblId}`,
  );
}

/** KOSIS 는 통계값을 행마다 하나씩 준다. 항목별로 네 값을 한 행으로 모은다. */
function foldRows(raw, table, items) {
  const bucket = new Map();

  for (const r of raw) {
    const item = items.get(`${table.feeKind}|${r.C1}`);
    if (!item) continue;
    const value = toInt(r.DT);
    if (value === null) continue;

    const k = r.C1;
    const e = bucket.get(k) ?? {
      scope_type: table.scopeType,
      scope: table.scope,
      fee_kind: table.feeKind,
      item_code: item.item_code,
      item_slug: item.item_slug,
      item_name: item.item_name,
      item_full_name: item.full_name,
      category: item.category,
      year: Number(r.PRD_DE),
      min_price: null,
      max_price: null,
      avg_price: null,
      median_price: null,
      surveyed_at: r.LST_CHN_DE || null,
    };

    if (r.ITM_ID === "T001") e.min_price = value;
    else if (r.ITM_ID === "T002") e.max_price = value;
    else if (r.ITM_ID === "T003") e.avg_price = value;
    else if (r.ITM_ID === "T004") e.median_price = value;

    bucket.set(k, e);
  }

  // 값이 하나도 없는 항목은 넣지 않는다
  return [...bucket.values()].filter(
    (e) => e.min_price ?? e.max_price ?? e.avg_price ?? e.median_price,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const probe = args.includes("--probe");
  const dryRun = args.includes("--dry-run");
  const apiKey = key();

  console.log("항목 마스터 만드는 중...");
  const items = await buildItems(apiKey);
  console.log(`  항목 ${items.size}개 (진료비용 + 제증명, 표 종류로 분리)`);

  const tables = probe ? allTables().slice(0, 1) : allTables();
  const records = [];

  for (const [i, t] of tables.entries()) {
    const raw = await fetchTable(apiKey, t.tblId);
    const folded = foldRows(raw, t, items);
    records.push(...folded);
    console.log(
      `  [${i + 1}/${tables.length}] ${t.scope} ${t.feeKind} — ${folded.length}건 (누적 ${records.length})`,
    );
    await new Promise((r) => setTimeout(r, 150));
  }

  if (probe) {
    console.log("\n첫 행:");
    console.log(JSON.stringify(records[0], null, 2));
    return;
  }

  const years = new Set(records.map((r) => r.year));
  const surveyed = new Set(records.map((r) => r.surveyed_at).filter(Boolean));
  console.log(`\n적재 대상 ${records.length}건`);
  console.log(`  연도 ${[...years].join(", ")} · 조사일 ${[...surveyed].join(", ")}`);
  console.log(`  항목 ${new Set(records.map((r) => r.item_slug)).size}개`);

  if (dryRun) {
    console.log("\n--dry-run: 적재하지 않고 끝냅니다.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) {
    console.error(".env.local 의 Supabase 설정을 확인하세요.");
    process.exit(1);
  }
  const supabase = createClient(url, svc, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const BATCH = 500;
  for (let i = 0; i < records.length; i += BATCH) {
    const chunk = records.slice(i, i + BATCH);
    const { error } = await supabase
      .from("medifee_fees")
      .upsert(chunk, { onConflict: "fee_kind,item_code,scope_type,scope,year" });
    if (error) throw new Error(`적재 실패 (${i}): ${error.message}`);
    console.log(`  적재 ${Math.min(i + BATCH, records.length)}/${records.length}`);
  }

  console.log("집계 갱신 중...");
  const { error } = await supabase.rpc("refresh_medifee_aggregates");
  if (error) throw new Error(`집계 갱신 실패: ${error.message}`);

  console.log("완료");
}

main().catch((e) => {
  console.error(`\n${e.message ?? e}`);
  process.exit(1);
});
