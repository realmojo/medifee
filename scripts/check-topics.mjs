#!/usr/bin/env node
/**
 * 주제 글 점검.
 *
 *   npm run check:topics
 *
 * 걸러 내는 것
 *   - 슬러그가 항목·지역·종별·가이드·예약어와 겹치는 주제 (겹치면 한쪽이 가려진다)
 *   - 묶인 항목이 2개 미만인 주제 (항목 페이지와 같은 글이 된다)
 *   - primary 로 지정한 항목이 주제 안에 없는 경우
 *   - 한 항목이 너무 많은 주제에 걸리는 경우 (정규식이 너무 넓다는 신호)
 */
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import { CLASS_TABLES, REGION_TABLES } from "./kosis-tables.mjs";
import { loadTopics } from "./load-topics.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

const FIXED = new Set([
  "항목",
  "지역",
  "종별",
  "about",
  "contact",
  "privacy",
  "terms",
  "search",
  "sitemap",
  "robots",
  "비급여-뜻",
  "비급여-진료비-조회",
  "비급여-실비보험-청구",
  "병원비-환급금-조회",
  ...REGION_TABLES.map(([name]) => name),
  ...CLASS_TABLES.map(([name]) => name),
]);

async function main() {
  const { TOPICS, TOPIC_HUB_SLUG, topicItems } = await loadTopics();

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: items, error } = await sb
    .from("medifee_items")
    .select("item_slug, item_full_name, median_price")
    .limit(1000);
  if (error) throw new Error(error.message);

  const itemSlugs = new Set(items.map((i) => i.item_slug));

  const problems = [];
  const seen = new Set();
  const hits = new Map();

  for (const slug of [TOPIC_HUB_SLUG, ...TOPICS.map((t) => t.slug)]) {
    if (seen.has(slug)) problems.push(`중복 슬러그: ${slug}`);
    seen.add(slug);
    if (FIXED.has(slug)) problems.push(`고정 슬러그와 겹침: ${slug}`);
    if (itemSlugs.has(slug)) problems.push(`항목 슬러그와 겹침: ${slug}`);
  }

  for (const t of TOPICS) {
    const list = topicItems(t, items);
    if (list.length < 2) problems.push(`항목 ${list.length}개뿐: ${t.slug}`);
    if (t.primary && !list.some((i) => i.item_slug === t.primary)) {
      problems.push(`primary 없음: ${t.slug} → ${t.primary}`);
    }
    for (const i of list) hits.set(i.item_slug, [...(hits.get(i.item_slug) ?? []), t.slug]);
    console.log(`${String(list.length).padStart(3)}  ${t.slug}`);
  }

  for (const [slug, ts] of hits) {
    if (ts.length > 2) problems.push(`항목이 주제 ${ts.length}개에 걸림: ${slug} (${ts.join(", ")})`);
  }

  console.log(`\n주제 ${TOPICS.length}개 · 묶인 항목 ${hits.size}개`);
  if (problems.length) {
    console.error(`\n문제 ${problems.length}건\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  console.log("문제 없음");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
