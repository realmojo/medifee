/**
 * 주제 글 — 사람들이 실제로 치는 말("임플란트 가격", "무릎 MRI 비용")로
 * 여러 항목을 묶어 보여 주는 글.
 *
 * 항목 페이지는 원본 이름("치과임플란트(1치당) Zirconia")으로 하나씩 답한다.
 * 그런데 검색어는 그보다 넓다. 임플란트 7개 재료, 다초점 렌즈 78개 제품,
 * 독감 백신 13개를 한 번에 비교해 주는 글이 없으면 그 검색은 놓친다.
 *
 * 주제는 네이버 검색광고 키워드 도구로 실제 검색량이 확인된 것만 만든다.
 * 항목 하나뿐인 주제는 만들지 않는다 — 항목 페이지와 같은 글이 된다.
 * 본문(intro·points·faq)은 손으로 쓰고, 제도 설명은 확인한 날(checked)과
 * 출처(sources)를 남긴다. 숫자만 갈아 끼운 글을 늘리면 검색엔진이 자동
 * 생성 문서로 본다.
 *
 * 슬러그를 추가하면 scripts/import-kosis.mjs 의 RESERVED 에도 넣을 것.
 * (scripts/check-topics.mjs 가 겹침과 빈 주제를 잡아 준다)
 */

import type { Topic, TopicGroup } from "./types";
import { VACCINE_TOPICS } from "./vaccines";
import { DENTAL_TOPICS, EYE_TOPICS } from "./dental-eye";
import { MRI_TOPICS, ULTRASOUND_TOPICS } from "./imaging";
import { PROCEDURE_TOPICS } from "./procedures";
import { PAPER_TOPICS, TEST_TOPICS } from "./tests-papers";

export type { Topic, TopicGroup } from "./types";

/** 주제 목록 화면 */
export const TOPIC_HUB_SLUG = "주제";

export const TOPIC_GROUPS: TopicGroup[] = [
  "예방접종",
  "치과",
  "눈",
  "MRI",
  "초음파",
  "시술·치료",
  "검사",
  "서류·병실",
];

export const TOPICS: Topic[] = [
  ...PROCEDURE_TOPICS,
  ...VACCINE_TOPICS,
  ...DENTAL_TOPICS,
  ...EYE_TOPICS,
  ...MRI_TOPICS,
  ...ULTRASOUND_TOPICS,
  ...TEST_TOPICS,
  ...PAPER_TOPICS,
];

const BY_SLUG = new Map(TOPICS.map((t) => [t.slug, t]));

export function findTopic(slug: string): Topic | undefined {
  return BY_SLUG.get(slug);
}

/** 주제에 들어가는 항목. 금액순(중간값 높은 순)으로 돌려준다 */
export function topicItems<
  T extends { item_slug: string; median_price: number | null },
>(topic: Topic, items: T[]): T[] {
  return items
    .filter((i) => topic.match.test(i.item_slug))
    .sort((a, b) => (b.median_price ?? 0) - (a.median_price ?? 0));
}

/** 이 항목이 들어 있는 주제 (항목 화면에서 거꾸로 잇는 링크) */
export function topicsForItem(itemSlug: string): Topic[] {
  return TOPICS.filter((t) => t.match.test(itemSlug));
}

/** 같은 묶음의 다른 주제 */
export function relatedTopics(topic: Topic, limit = 8): Topic[] {
  return TOPICS.filter(
    (t) => t.group === topic.group && t.slug !== topic.slug,
  ).slice(0, limit);
}

export function groupTopics(): Array<{ group: TopicGroup; topics: Topic[] }> {
  return TOPIC_GROUPS.map((group) => ({
    group,
    topics: TOPICS.filter((t) => t.group === group),
  })).filter((g) => g.topics.length > 0);
}
