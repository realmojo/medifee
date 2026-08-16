#!/usr/bin/env node
/**
 * 비급여 진료비 API → Supabase 적재.
 *
 * 원본: 공공데이터포털 15001700 (심평원 비급여진료비정보조회서비스)
 *       https://www.data.go.kr/data/15001700/openapi.do  · 자동승인 · XML
 *
 *   npm run probe:prices     한 페이지만 받아 구조 확인
 *   npm run import:prices    전체 적재 + 집계 갱신
 *   npm run import:prices -- --dry-run
 */

import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import {
  ROOT,
  normalizeRows,
  dedupeByKey,
  loadIntoSupabase,
  refreshAggregates,
  reportUnknownRegions,
} from "./price-common.mjs";

dotenv.config({ path: path.join(ROOT, ".env.local") });

const OP = "getNonPaymentItemHospList";

/** XML 한 페이지를 객체 배열로 */
function parseItems(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const o = {};
    for (const f of m[1].matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)) o[f[1]] = f[2];
    return o;
  });
}

async function fetchAll({ pages } = {}) {
  const key = process.env.DATA_GO_KR_SERVICE_KEY;
  const base = process.env.HIRA_API_BASE;
  if (!key || !base) {
    console.error(
      ".env.local 의 DATA_GO_KR_SERVICE_KEY / HIRA_API_BASE 를 확인하세요.",
    );
    process.exit(1);
  }

  const all = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const url = `${base}/${OP}?serviceKey=${key}&pageNo=${page}&numOfRows=1000`;
    const res = await fetch(url);
    const xml = await res.text();

    // 공공데이터포털은 오류도 200 으로 돌려준다. 헤더를 먼저 본다.
    const code = xml.match(/<resultCode>(\d+)<\/resultCode>/)?.[1];
    if (code && code !== "00") {
      const msg = xml.match(/<resultMsg>([^<]*)<\/resultMsg>/)?.[1] ?? "";
      throw new Error(`API 오류 ${code}: ${msg}`);
    }
    if (!xml.includes("<item>") && page === 1) {
      throw new Error(`응답에 항목이 없습니다:\n${xml.slice(0, 400)}`);
    }

    if (!total) total = Number(xml.match(/<totalCount>(\d+)/)?.[1] ?? 0);
    const items = parseItems(xml);
    all.push(...items);
    console.log(`  받음 ${all.length}${total ? `/${total}` : ""}`);

    if (!items.length || (total && all.length >= total)) break;
    if (pages && page >= pages) break;
    page += 1;
    await new Promise((r) => setTimeout(r, 120));
  }

  return all;
}

async function main() {
  const args = process.argv.slice(2);
  const probe = args.includes("--probe");
  const dryRun = args.includes("--dry-run");

  const rows = await fetchAll(probe ? { pages: 1 } : {});
  if (rows.length === 0) {
    console.error("받은 행이 없습니다.");
    process.exit(1);
  }

  if (probe) {
    console.log(`\n컬럼: ${Object.keys(rows[0]).join(" | ")}`);
    console.log("\n첫 행:");
    console.log(JSON.stringify(rows[0], null, 2));
    const { records, unknownRegions } = normalizeRows(rows);
    console.log(`\n정규화: ${rows.length} → ${records.length}`);
    reportUnknownRegions(unknownRegions);
    if (records[0]) {
      console.log("정규화 결과 예시:");
      console.log(JSON.stringify(records[0], null, 2));
    }
    return;
  }

  const { records, unknownRegions } = normalizeRows(rows);
  const deduped = dedupeByKey(records);

  console.log(
    `\n원본 ${rows.length}건 → 적재 대상 ${deduped.length}건` +
      (records.length !== deduped.length
        ? ` (중복 키 ${records.length - deduped.length}건 정리)`
        : ""),
  );
  reportUnknownRegions(unknownRegions);

  const years = new Map();
  for (const r of deduped) years.set(r.applied_year, (years.get(r.applied_year) ?? 0) + 1);
  console.log(
    "적용 연도: " +
      [...years].sort().map(([y, c]) => `${y} ${c}건`).join(" · "),
  );

  if (dryRun) {
    console.log("\n--dry-run: 적재하지 않고 끝냅니다.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(".env.local 의 Supabase 설정을 확인하세요.");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await loadIntoSupabase(supabase, deduped);
  await refreshAggregates(supabase);
  console.log("완료");
}

main().catch((e) => {
  console.error(`\n${e.message ?? e}`);
  process.exit(1);
});
