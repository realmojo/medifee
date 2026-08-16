#!/usr/bin/env node
/** 전체 URL 을 naver-indexing/urls.txt 로 뽑는다. 인코딩은 사이트맵과 같다. */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { ROOT } from "./price-common.mjs";

dotenv.config({ path: path.join(ROOT, ".env.local") });
const SITE = "https://medifee.keywordegg.com";
const abs = (p) =>
  !p || p === "/" ? SITE : `${SITE}${(p.startsWith("/") ? p : `/${p}`).split("/").map(encodeURIComponent).join("/")}`;

const STATIC = ["/", "/항목", "/지역", "/about", "/contact", "/privacy", "/terms"];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error(".env.local 확인"); process.exit(1); }
  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const urls = STATIC.map(abs);
  const counts = { static: STATIC.length };

  const { data: items } = await sb.from("medifee_items").select("item_slug").limit(1000);
  for (const r of items ?? []) urls.push(abs(`/${r.item_slug}`));
  counts.items = items?.length ?? 0;

  const { data: regions } = await sb.from("medifee_regions").select("region_slug").gt("price_rows", 0).limit(1000);
  for (const r of regions ?? []) urls.push(abs(`/${r.region_slug}`));
  counts.regions = regions?.length ?? 0;

  const uniq = [...new Set(urls)];
  const out = path.join(ROOT, "naver-indexing/urls.txt");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${uniq.join("\n")}\n`, "utf8");

  console.log(`고정 ${counts.static} · 항목 ${counts.items} · 지역 ${counts.regions}`);
  console.log(`합계 ${uniq.length}\n${out}`);
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
