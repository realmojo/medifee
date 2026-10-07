import type { ReactNode } from "react";
import {
  DATA_YEAR,
  formatWon,
  itemLabel,
  listItemFees,
  listItems,
  rangeText,
  withParticle,
  type ItemStats,
} from "@/lib/fee-data";
import { OFFICIAL_LINKS } from "@/lib/menu";
import { CLASSES, REGIONS } from "@/lib/scopes";
import {
  relatedTopics,
  TOPIC_HUB_SLUG,
  topicItems,
  type Topic,
} from "@/lib/topics";
import { breadcrumbJsonLd, datasetJsonLd, faqJsonLd, SITE } from "@/lib/seo";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";
import { diffCell, highest, lowest, orderRows } from "./rows";

/**
 * 주제 글 — 검색어 하나에 여러 항목을 묶어 답한다.
 *
 * 항목 화면과 같은 뼈대(머리글 → 광고 → 소개 → 버튼 → 광고 → 본문)와 같은
 * 광고 자리 네 곳을 쓴다. 다른 점은 본문 첫 표가 "항목 하나의 지역별 값"이
 * 아니라 "묶인 항목끼리의 비교"라는 것. 지역·종별 표는 기준 항목 하나로만
 * 보여 준다 — 서로 다른 제품의 중간값을 다시 섞으면 뜻이 흐려진다.
 *
 * 글은 lib/topics/ 에서 손으로 쓴 것이고, 이 화면은 그 사이사이에 자료에서
 * 계산한 문장과 표를 끼운다. 그래야 같은 틀이어도 주제마다 내용이 다르다.
 */
export default async function TopicView({ topic }: { topic: Topic }) {
  const all = await listItems();
  const items = topicItems(topic, all);
  const primary = pickPrimary(topic, items);
  const rows = primary ? await listItemFees(primary.item_slug) : [];

  const labels = shortLabels(items, topic.trim);
  const primaryLabel = primary ? sentenceLabel(topic, labels.get(primary.item_slug) ?? "") : "";

  const regions = orderRows(
    rows.filter((r) => r.scope_type === "region"),
    REGIONS.map((r) => r.slug),
  );
  const classes = orderRows(
    rows.filter((r) => r.scope_type === "class"),
    CLASSES.map((c) => c.slug),
  );
  const priciestRegion = highest(regions);
  const cheapestRegion = lowest(regions);
  const priciestClass = highest(classes);
  const cheapestClass = lowest(classes);

  const priced = items.filter((i) => i.median_price !== null);
  const top = priced[0];
  const bottom = priced[priced.length - 1];

  const summary =
    top && bottom && top.median_price === bottom.median_price
      ? `${DATA_YEAR}년 심사평가원 자료에서 ${topic.name}에 해당하는 항목은 ${items.length}개이고, 전국 중간값은 모두 ${formatWon(top.median_price)}으로 같습니다. 차이는 지역과 병원 종별에서 납니다.`
      : top && bottom && top !== bottom
      ? `${DATA_YEAR}년 심사평가원 자료에서 ${topic.name}에 해당하는 항목은 ${items.length}개입니다. 전국 중간값으로 가장 높은 것은 ${labels.get(top.item_slug)}(${formatWon(top.median_price)}), 가장 낮은 것은 ${labels.get(bottom.item_slug)}(${formatWon(bottom.median_price)})입니다.`
      : `${DATA_YEAR}년 심사평가원 자료에서 ${topic.name}에 해당하는 항목은 ${items.length}개입니다.`;

  const faq = [dataFaq(), ...topic.faq];

  function dataFaq() {
    const where =
      priciestClass && cheapestClass && priciestClass !== cheapestClass
        ? ` 병원 종별로 보면 ${withParticle(priciestClass.scope, "이가")} ${formatWon(priciestClass.median_price)}으로 가장 높고 ${withParticle(cheapestClass.scope, "이가")} ${formatWon(cheapestClass.median_price)}으로 가장 낮습니다.`
        : "";
    const base = primary
      ? `${DATA_YEAR}년 건강보험심사평가원 자료에서 ${primaryLabel}의 전국 중간값은 ${formatWon(primary.median_price)}입니다.${where}`
      : `${DATA_YEAR}년 건강보험심사평가원 자료 기준입니다.`;
    return {
      q: `${topic.name} ${topic.title.includes("가격") ? "가격" : "비용"}은 얼마인가요?`,
      a: `${topic.itemNotice ? `${topic.itemNotice} ` : ""}${base} 지역·종별로 묶은 집계값이라 특정 병원의 가격은 아니며, 최저·최고보다 중간값이 실제에 가깝습니다.`,
    };
  }

  const related = relatedTopics(topic);
  const description = `${topic.name} 관련 비급여 항목 ${items.length}개의 ${DATA_YEAR}년 전국 중간값과 지역별·병원 종별 금액.`;

  return (
    <div className="single-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "홈", path: "/" },
              { name: "주제별", path: `/${TOPIC_HUB_SLUG}` },
              { name: topic.name, path: `/${topic.slug}` },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetJsonLd({
              name: `${topic.name} 비급여 비용 (${DATA_YEAR}년)`,
              path: `/${topic.slug}`,
              description,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqJsonLd(faq.map((f) => ({ question: f.q, answer: plain(f.a) }))),
          ),
        }}
      />

      <article className="single-article">
        <div className="single-article__inner">
          <nav className="crumbs" aria-label="이동 경로">
            <a target="_self" href={`/${TOPIC_HUB_SLUG}`}>
              주제별
            </a>
            <span aria-hidden>›</span>
            <span>{topic.group}</span>
          </nav>

          <header className="entry-header">
            <h1 className="entry-title">{topic.title}</h1>
            <div className="entry-header__bottom">
              <div className="entry-meta">
                <span>{SITE.name}</span>
                <span className="entry-meta__sep" />
                <span>{DATA_YEAR}년 심사평가원 자료</span>
                <span className="entry-meta__sep" />
                <span>내용 확인 {topic.checked}</span>
              </div>
              <span className="entry-cat cat-badge cat-badge--region">
                {topic.emoji} {topic.group}
              </span>
            </div>
          </header>

          <div className="entry-content">
            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.top} />
            </div>

            <p className="entry-lead">{rich(topic.intro[0])}</p>
            {topic.intro.slice(1).map((p, i) => (
              <p key={i}>{rich(p)}</p>
            ))}

            <div className="cta-row">
              <a
                className="cta-btn"
                href={OFFICIAL_LINKS.hira}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                🔎 우리 동네 병원 가격 조회 (심평원)
              </a>
              <a
                className="cta-btn cta-btn--ghost"
                href={`/${TOPIC_HUB_SLUG}`}
                target="_self"
              >
                📋 다른 주제 보기
              </a>
              <p className="cta-row__note">
                아래 금액은 지역·종별로 묶은 집계값입니다. 특정 병원의 가격은
                심사평가원에서 확인하세요.
              </p>
            </div>

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.middle} />
            </div>

            <h2 id="compare">{topic.name}, 종류별로 얼마인가</h2>
            <p>{summary} 항목 이름을 누르면 지역별·종별 금액을 따로 볼 수 있습니다.</p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">항목</th>
                    <th scope="col">중간값</th>
                    <th scope="col">최저~최고</th>
                    <th scope="col">집계 시도</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.item_slug}>
                      <th scope="row">
                        <a target="_self" href={`/${i.item_slug}`}>
                          {labels.get(i.item_slug)}
                        </a>
                      </th>
                      <td>
                        <strong>{formatWon(i.median_price)}</strong>
                      </td>
                      <td>{rangeText(i)}</td>
                      <td>{i.scope_count}곳</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 id="points">알아둘 것</h2>
            {topic.points.map((p) => (
              <section key={p.title}>
                <h3>{p.title}</h3>
                <p>{rich(p.body)}</p>
              </section>
            ))}

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.bottom} />
            </div>

            {primary && classes.length > 0 && (
              <>
                <h2 id="class">병원 종별로 보면</h2>
                <p>
                  기준 항목은 <strong>{primaryLabel}</strong>입니다.
                  {priciestClass && cheapestClass && priciestClass !== cheapestClass && (
                    <>
                      {" "}
                      {withParticle(priciestClass.scope, "이가")}{" "}
                      {formatWon(priciestClass.median_price)}으로 가장 높고,{" "}
                      {withParticle(cheapestClass.scope, "이가")}{" "}
                      {formatWon(cheapestClass.median_price)}으로 가장 낮습니다.
                    </>
                  )}
                </p>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">병원 종별</th>
                        <th scope="col">중간값</th>
                        <th scope="col">전체 대비</th>
                        <th scope="col">최저~최고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map((r) => (
                        <tr key={r.scope}>
                          <th scope="row">
                            <a target="_self" href={`/${r.scope}`}>
                              {r.scope}
                            </a>
                          </th>
                          <td>{formatWon(r.median_price)}</td>
                          <td>{diffCell(r.median_price, primary.class_median ?? 0)}</td>
                          <td>{rangeText(r)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {primary && regions.length > 0 && (
              <>
                <h2 id="region">지역별로 보면</h2>
                <p>
                  같은 {primaryLabel} 기준 17개 시도의 중간값입니다.
                  {priciestRegion && cheapestRegion && priciestRegion !== cheapestRegion && (
                    <>
                      {" "}
                      {withParticle(priciestRegion.scope, "이가")}{" "}
                      {formatWon(priciestRegion.median_price)}으로 가장 높고,{" "}
                      {withParticle(cheapestRegion.scope, "이가")}{" "}
                      {formatWon(cheapestRegion.median_price)}으로 가장 낮습니다.
                    </>
                  )}
                </p>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">지역</th>
                        <th scope="col">중간값</th>
                        <th scope="col">전국 대비</th>
                        <th scope="col">최저~최고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regions.map((r) => (
                        <tr key={r.scope}>
                          <th scope="row">
                            <a target="_self" href={`/${r.scope}`}>
                              {r.scope}
                            </a>
                          </th>
                          <td>{formatWon(r.median_price)}</td>
                          <td>{diffCell(r.median_price, primary.region_median ?? 0)}</td>
                          <td>{rangeText(r)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <section className="faq">
              <h2 className="faq__title" id="faq">
                자주 묻는 질문
              </h2>
              {faq.map((f, i) => (
                <div className="faq__item" key={i}>
                  <h3 className="faq__q">{f.q}</h3>
                  <div className="faq__a">
                    <p>{rich(f.a)}</p>
                  </div>
                </div>
              ))}
            </section>

            {topic.sources && topic.sources.length > 0 && (
              <>
                <h2 id="sources">참고한 자료</h2>
                <ul>
                  {topic.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="nofollow noopener noreferrer">
                        {s.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <footer className="entry-footer">
            <span>
              출처: 건강보험심사평가원 「비급여진료비용및제증명수수료통계」
              ({DATA_YEAR})
            </span>
            <span>
              제도 내용은 {topic.checked} 기준이며 바뀔 수 있습니다
            </span>
          </footer>
        </div>
      </article>

      {related.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <div className="sec-head">
            <h2 className="sec-title">{topic.group} 다른 글</h2>
            <a target="_self" href={`/${TOPIC_HUB_SLUG}`} className="sec-more">
              전체 주제
            </a>
          </div>
          <div className="sido-block">
            <div className="region-chips">
              {related.map((t) => (
                <a target="_self" key={t.slug} href={`/${t.slug}`}>
                  <span aria-hidden>{t.emoji}</span>
                  {t.name}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.bottom} />
      </div>
    </div>
  );
}

/* ------------------------------- 도우미 ------------------------------- */

/** 기준 항목: 지정한 것, 없으면 가장 넓게 집계된 것 */
function pickPrimary(topic: Topic, items: ItemStats[]): ItemStats | null {
  if (items.length === 0) return null;
  const named = topic.primary && items.find((i) => i.item_slug === topic.primary);
  if (named) return named;
  return [...items].sort(
    (a, b) => b.scope_count - a.scope_count || b.class_count - a.class_count,
  )[0];
}

/**
 * 표 안에서 쓸 짧은 이름.
 *
 * 묶인 항목들이 같은 말로 시작하면("인플루엔자 …", "MRI 근골격계-슬관절 …")
 * 그 앞부분을 떼어 낸다. 제목에 이미 있는 말이 표 한 줄 한 줄에 반복되면
 * 정작 다른 부분(제품명, 촬영 방식)이 묻힌다.
 */
function shortLabels(items: ItemStats[], trim?: RegExp): Map<string, string> {
  const full = items.map((i) => {
    const label = itemLabel(i);
    return (trim ? label.replace(trim, "").trim() : label) || label;
  });
  const words = full.map((l) => l.split(" "));
  let k = 0;
  if (items.length > 1 && !trim) {
    const min = Math.min(...words.map((w) => w.length));
    while (k < min - 1 && words.every((w) => w[k] === words[0][k])) k++;
  }
  return new Map(
    items.map((i, n) => [i.item_slug, words[n].slice(k).join(" ") || full[n]]),
  );
}

/**
 * 문장 안에서 부를 이름.
 *
 * 표 안의 짧은 이름은 표 제목 덕에 뜻이 통하지만("일반", "Zirconia") 문장에
 * 홀로 서면 무엇인지 모른다. 주제 이름의 낱말이 하나도 없으면 앞에 붙인다.
 */
function sentenceLabel(topic: Topic, short: string): string {
  const words = topic.name.split(/[\s·()]+/).filter((w) => w.length > 0);
  return words.some((w) => short.includes(w)) ? short : `${topic.name} ${short}`;
}

/** "**굵게**" 만 지원하는 아주 작은 서식 */
function rich(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : p));
}

function plain(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}
