import type { ReactNode } from "react";
import { GUIDES, type Guide } from "@/lib/guides";
import {
  DATA_UPDATED,
  DATA_YEAR,
  featuredItems,
  formatWon,
  itemLabel,
  listItems,
  priceRatio,
  ratioText,
} from "@/lib/fee-data";
import { ITEM_HUB_SLUG, OFFICIAL_LINKS } from "@/lib/menu";
import { breadcrumbJsonLd, faqJsonLd, SITE } from "@/lib/seo";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

import GuideMeaning, { faq as faqMeaning } from "./guides/Meaning";
import GuideLookup, { faq as faqLookup } from "./guides/Lookup";
import GuideInsurance, { faq as faqInsurance } from "./guides/Insurance";
import GuideRefund, { faq as faqRefund } from "./guides/Refund";

/**
 * 가이드 글 화면.
 *
 * 본문은 슬러그마다 컴포넌트를 따로 둔다. HTML 문자열로 넣으면 오타를
 * 잡아주는 것이 없고, DB 에 넣으면 이 사이트에는 없는 콘텐츠 테이블이 필요하다.
 * 네 편뿐이라 컴포넌트가 가장 단순하고 안전하다.
 */
const BODIES: Record<
  string,
  { Body: () => ReactNode; faq: Array<{ q: string; a: string }> }
> = {
  "비급여-뜻": { Body: GuideMeaning, faq: faqMeaning },
  "비급여-진료비-조회": { Body: GuideLookup, faq: faqLookup },
  "비급여-실비보험-청구": { Body: GuideInsurance, faq: faqInsurance },
  "병원비-환급금-조회": { Body: GuideRefund, faq: faqRefund },
};

export default async function GuideView({ guide }: { guide: Guide }) {
  const entry = BODIES[guide.slug];
  if (!entry) return null;
  const { Body, faq } = entry;

  const others = GUIDES.filter((g) => g.slug !== guide.slug);

  // 가이드는 제도 설명만 하고 숫자가 없다. 그러면 "그래서 얼마인데"로 이어지지
  // 않는다. 실제 자료에서 많이 찾는 항목 몇 개를 끌어와 금액 화면으로 넘긴다.
  const items = await listItems();
  const sample = featuredItems(items).slice(0, 8);

  return (
    <div className="single-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "홈", path: "/" },
              { name: guide.title, path: `/${guide.slug}` },
            ]),
          ),
        }}
      />
      {faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              faqJsonLd(faq.map((f) => ({ question: f.q, answer: f.a }))),
            ),
          }}
        />
      )}

      <article className="single-article">
        <div className="single-article__inner">
          <header className="entry-header">
            <h1 className="entry-title">{guide.title}</h1>
            <div className="entry-header__bottom">
              <div className="entry-meta">
                <span>{SITE.name}</span>
                <span className="entry-meta__sep" />
                <span>가이드</span>
              </div>
              <span className="entry-cat cat-badge cat-badge--region">
                {guide.emoji} 알아두기
              </span>
            </div>
          </header>

          <div className="entry-content">
            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.top} />
            </div>

            <p className="entry-lead">{guide.description}</p>

            {guide.outline.length > 0 && (
              <nav className="toc" aria-label="이 글의 차례">
                <p className="toc__title">이 글의 차례</p>
                <ul className="toc__list">
                  {guide.outline.map((o) => (
                    <li key={o.id}>
                      <a href={`#${o.id}`}>{o.label}</a>
                    </li>
                  ))}
                  {faq.length > 0 && (
                    <li>
                      <a href="#faq">자주 묻는 질문</a>
                    </li>
                  )}
                </ul>
              </nav>
            )}

            <div className="cta-row">
              <a
                className="cta-btn"
                href={OFFICIAL_LINKS.hira}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                🔎 심사평가원에서 확인하기
              </a>
              <a
                className="cta-btn cta-btn--ghost"
                href={`/${ITEM_HUB_SLUG}`}
                target="_self"
              >
                📋 항목별 가격 차이 보기
              </a>
            </div>

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.middle} />
            </div>

            <Body />

            {sample.length > 0 && (
              <>
                <h2 id="numbers">그래서 실제로 얼마인가</h2>
                <p>
                  제도만 알고 금액을 모르면 준비가 되지 않습니다. {DATA_YEAR}년
                  건강보험심사평가원 자료에서 사람들이 자주 찾는 항목의 전국
                  중간값입니다. 이름을 누르면 지역 17곳·병원 종별 10곳의 금액과
                  실손보험 적용, 받기 전에 물어볼 것을 볼 수 있습니다.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">항목</th>
                      <th scope="col">중간값</th>
                      <th scope="col">최고 ÷ 최저</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.map((i) => (
                      <tr key={i.item_slug}>
                        <th scope="row">
                          <a target="_self" href={`/${i.item_slug}`}>
                            {itemLabel(i)}
                          </a>
                        </th>
                        <td>{formatWon(i.median_price)}</td>
                        <td>{ratioText(priceRatio(i))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>
                  집계된 최저·최고는 그런 값을 받는 곳이 한 곳만 있어도 잡히므로
                  예산은 중간값으로 잡는 편이 어긋나지 않습니다. 이 값은 지역·종별로
                  묶은 집계값이라 특정 병원의 가격이 아닙니다 — 통계표 갱신은{" "}
                  {DATA_UPDATED}입니다.{" "}
                  <a target="_self" href={`/${ITEM_HUB_SLUG}`}>
                    항목 {items.length}개 전체 보기
                  </a>
                </p>
              </>
            )}

            {faq.length > 0 && (
              <section className="faq">
                <h2 className="faq__title" id="faq">
                  자주 묻는 질문
                </h2>
                {faq.map((f, i) => (
                  <div className="faq__item" key={i}>
                    <h3 className="faq__q">{f.q}</h3>
                    <div className="faq__a">
                      <p>{f.a}</p>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>

          <footer className="entry-footer">
            <span>
              제도 내용은 바뀔 수 있습니다. 최신 기준은 공식 창구에서
              확인하세요.
            </span>
          </footer>
        </div>
      </article>

      {others.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <div className="sec-head">
            <h2 className="sec-title">함께 보면 좋은 글</h2>
          </div>
          <div className="sido-block">
            <div className="region-chips">
              {others.map((g) => (
                <a target="_self" key={g.slug} href={`/${g.slug}`}>
                  <span aria-hidden>{g.emoji}</span>
                  {g.title.split(" — ")[0].split(",")[0]}
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
