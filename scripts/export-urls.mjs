#!/usr/bin/env node
/**
 * 전체 URL 을 naver-indexing/urls.txt 로 뽑는다.
 *
 * 네이버 서치어드바이저는 사이트맵과 별개로 URL 목록 제출을 받는다.
 * 인코딩 규칙은 lib/seo.ts 의 absoluteUrl 과 같아야 한다 — 한 조각씩
 * encodeURIComponent 를 걸고 슬래시로 다시 잇는다.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import { CLASS_TABLES, REGION_TABLES } from "./kosis-tables.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const SITE = "https://medifee.keywordegg.com";
const abs = (p) =>
  !p || p === "/"
    ? SITE
    : `${SITE}${(p.startsWith("/") ? p : `/${p}`)
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`;

const STATIC = [
  "/",
  "/항목",
  "/지역",
  "/종별",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

/** lib/guides.ts 와 같아야 한다 */
const GUIDES = [
  "/비급여-뜻",
  "/비급여-진료비-조회",
  "/비급여-실비보험-청구",
  "/병원비-환급금-조회",
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(".env.local 확인");
    process.exit(1);
  }
  const sb = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const scopes = [
    ...REGION_TABLES.map(([name]) => name),
    ...CLASS_TABLES.map(([name]) => name),
  ];

  const urls = [
    ...STATIC.map(abs),
    ...GUIDES.map(abs),
    ...scopes.map((s) => abs(`/${s}`)),
  ];

  const { data: items, error } = await sb
    .from("medifee_items")
    .select("item_slug")
    .limit(1000);
  if (error) throw new Error(error.message);
  for (const r of items ?? []) urls.push(abs(`/${r.item_slug}`));

  const uniq = [...new Set(urls)];
  const out = path.join(ROOT, "naver-indexing/urls.txt");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${uniq.join("\n")}\n`, "utf8");

  console.log(
    `고정 ${STATIC.length} · 가이드 ${GUIDES.length} · 지역/종별 ${scopes.length} · 항목 ${items?.length ?? 0}`,
  );
  console.log(`합계 ${uniq.length}\n${out}`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
