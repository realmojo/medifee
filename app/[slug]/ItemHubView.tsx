import {
  DATA_UPDATED,
  DATA_YEAR,
  featuredItems,
  formatWon,
  formatWonShort,
  groupByCategory,
  itemLabel,
  listItems,
  priceRatio,
  ratioText,
  SCOPE_NOTE,
} from "@/lib/fee-data";
import { CLASS_HUB_SLUG, REGION_HUB_SLUG } from "@/lib/scopes";
import { ITEM_HUB_SLUG } from "@/lib/menu";
import { GUIDES } from "@/lib/guides";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import StatTile from "@/components/price/StatTile";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/** `/항목` — 대분류별로 묶은 전체 항목 목록 */
export default async function ItemHubView() {
  const items = await listItems();
  const groups = groupByCategory(items);
  const featured = featuredItems(items);

  // 폭넓게 집계된 항목 중에서 최고÷최저가 큰 것. 표본이 얇으면 배수가 튄다.
  const widest = items
    .filter((i) => i.scope_count >= 15 && i.class_count >= 5)
    .map((i) => ({ item: i, ratio: priceRatio(i) }))
    .filter((x) => x.ratio !== null)
    .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0))
    .slice(0, 10);

  const faq = buildFaq(items.length, groups.length, widest[0]?.item);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "홈", path: "/" },
              { name: "항목별", path: `/${ITEM_HUB_SLUG}` },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListJsonLd(
              `많이 찾는 비급여 항목 (${DATA_YEAR}년)`,
              featured.map((i) => ({
                name: itemLabel(i),
                path: `/${i.item_slug}`,
              })),
            ),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqJsonLd(faq.map((f) => ({ question: f.q, answer: f.a }))),
          ),
        }}
      />

      <div className="page-head">
        <h1>
          <span aria-hidden>📋</span>
          비급여 항목별 진료비
        </h1>
        <p>
          건강보험이 적용되지 않는 항목은 병원이 값을 스스로 정합니다. 항목을
          고르면 지역별·병원 종별 금액을 볼 수 있습니다. {DATA_YEAR}년
          건강보험심사평가원 자료입니다.
        </p>
      </div>

      <section className="stat-grid">
        <StatTile label="공개 항목" value={`${items.length}개`} />
        <StatTile label="분류" value={`${groups.length}가지`} />
        <StatTile label="기준" value={`${DATA_YEAR}년`} />
        <StatTile label="자료 범위" value="전 종별" sub={SCOPE_NOTE} />
      </section>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.top} />
      </div>

      {featured.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">많이 찾는 항목</h2>
          <p className="panel__desc">
            사람들이 자주 묻는 항목입니다. 금액은 전국 중간값입니다.
          </p>
          <div className="table-scroll">
            <table className="pr-table">
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col" className="is-num">
                    중간값
                  </th>
                  <th scope="col" className="is-num">
                    최저~최고
                  </th>
                </tr>
              </thead>
              <tbody>
                {featured.map((i) => (
                  <tr key={i.item_slug}>
                    <td>
                      <a
                        target="_self"
                        href={`/${i.item_slug}`}
                        className="pr-table__name pr-table__link"
                      >
                        {itemLabel(i)}
                      </a>
                      <span className="pr-table__meta">{i.category}</span>
                    </td>
                    <td className="is-num">
                      <strong>{formatWon(i.median_price)}</strong>
                    </td>
                    <td className="is-num">
                      {formatWonShort(i.min_price)} ~{" "}
                      {formatWonShort(i.max_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {widest.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">차이가 가장 큰 항목</h2>
          <p className="panel__desc">
            집계된 최저와 최고가 몇 배 벌어지는지입니다. 폭넓게 집계된 항목만
            넣었습니다. 값이 크게 갈리는 항목일수록 미리 물어보는 편이 낫습니다.
          </p>
          <div className="table-scroll">
            <table className="pr-table">
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col" className="is-num">
                    중간값
                  </th>
                  <th scope="col" className="is-num">
                    차이
                  </th>
                </tr>
              </thead>
              <tbody>
                {widest.map(({ item, ratio }) => (
                  <tr key={item.item_slug}>
                    <td>
                      <a
                        target="_self"
                        href={`/${item.item_slug}`}
                        className="pr-table__name pr-table__link"
                      >
                        {itemLabel(item)}
                      </a>
                      <span className="pr-table__meta">{item.category}</span>
                    </td>
                    <td className="is-num">{formatWon(item.median_price)}</td>
                    <td className="is-num">
                      <strong>{ratioText(ratio)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.middle} />
      </div>

      <section className="panel">
        <h2 className="panel__title">이 목록을 어떻게 쓰나</h2>
        <p className="panel__desc">
          비급여는 건강보험이 적용되지 않는 진료와 서류입니다. 급여 항목은
          나라가 수가를 정해 두지만 비급여는 <strong>각 병원이 스스로 값을
          매기기 때문에</strong> 같은 이름의 진료인데도 병원마다 금액이
          다릅니다. 이 목록은 그 값이 대체로 어느 범위에 있는지를 보여줍니다.
        </p>
        <p className="panel__desc">
          항목을 누르면 그 항목이 어떤 진료·서류인지, 값이 왜 갈리는지,
          실손보험은 어떻게 되는지와 함께 <strong>지역 17곳·병원 종별 10곳의
          금액표</strong>가 나옵니다. 금액은 모두 중간값을 앞세웁니다. 최저·최고는
          한 곳만 있어도 잡히는 값이라 예산 기준이 되지 못합니다.
        </p>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          여기 실린 값은 지역·종별로 묶은 집계값이라 <strong>특정 병원의 가격이
          아닙니다.</strong> 실제로 갈 병원의 값은 건강보험심사평가원 비급여
          진료비 조회에서 확인해야 합니다. {DATA_YEAR}년 자료이며 통계표는{" "}
          {DATA_UPDATED}에 갱신되었습니다.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">금액 말고 제도가 궁금하다면</h2>
        <p className="panel__desc">
          &ldquo;비급여가 무슨 뜻인가&rdquo;, &ldquo;실비로 돌려받을 수
          있나&rdquo;, &ldquo;이미 낸 병원비를 환급받는 방법&rdquo;처럼 금액표로는
          답할 수 없는 것을 따로 정리해 두었습니다.
        </p>
        <div className="region-chips">
          {GUIDES.map((g) => (
            <a target="_self" key={g.slug} href={`/${g.slug}`}>
              <span aria-hidden>{g.emoji}</span>
              {g.summary}
            </a>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">다른 방향으로 찾기</h2>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          <a target="_self" href={`/${REGION_HUB_SLUG}`}>
            지역별로 보기
          </a>{" "}
          ·{" "}
          <a target="_self" href={`/${CLASS_HUB_SLUG}`}>
            병원 종별로 보기
          </a>{" "}
          — 같은 항목이라도 어디서 받느냐에 따라 값이 갈립니다.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">자주 묻는 질문</h2>
        <div className="faq">
          {faq.map((f, i) => (
            <div className="faq__item" key={i}>
              <h3 className="faq__q">{f.q}</h3>
              <div className="faq__a">
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {groups.map((g) => (
        <section className="sido-block" key={g.category}>
          <h2 className="sido-block__title">
            {g.category}
            <span className="sido-block__count">{g.items.length}개 항목</span>
          </h2>
          <div className="region-chips">
            {g.items.map((it) => (
              <a target="_self" key={it.item_slug} href={`/${it.item_slug}`}>
                {itemLabel(it)}
                <span style={{ fontSize: 11, color: "#8b9184" }}>
                  {formatWonShort(it.median_price)}
                </span>
              </a>
            ))}
          </div>
        </section>
      ))}

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.bottom} />
      </div>
    </>
  );
}

/* ------------------------------- 도우미 ------------------------------- */

/**
 * 허브의 자주 묻는 질문.
 *
 * 항목 페이지의 FAQ 가 "○○이 얼마인가"에 답한다면 여기서는 그 앞의 질문 —
 * 비급여가 무엇이고 왜 병원마다 다른가 — 에 답한다. 검색어가 다르다.
 */
function buildFaq(
  itemCount: number,
  groupCount: number,
  widestItem?: { item_slug: string; item_full_name: string; category: string },
): Array<{ q: string; a: string }> {
  return [
    {
      q: "비급여 진료비는 왜 병원마다 다른가요?",
      a: "건강보험이 적용되는 급여 항목은 나라가 수가를 정해 두지만, 비급여는 각 의료기관이 스스로 값을 정합니다. 장비와 인력, 임대료, 시술에 들이는 시간, 재료비를 어디까지 값에 넣는지가 기관마다 달라 같은 이름의 진료인데도 금액이 몇 배씩 벌어집니다. 다만 가격이 높다고 진료의 질이 높다는 뜻은 아닙니다.",
    },
    {
      q: `이 사이트에는 몇 개 항목이 있나요?`,
      a: `${DATA_YEAR}년 건강보험심사평가원 통계에서 ${itemCount}개 항목, ${groupCount}개 분류를 정리했습니다. 도수치료·MRI·초음파·예방접종 같은 진료비와 진단서·진료기록사본 같은 제증명 수수료가 함께 들어 있습니다. 항목마다 시도 17곳과 병원 종별 10곳의 금액을 볼 수 있습니다.`,
    },
    {
      q: "여기 나온 금액이 제가 낼 금액인가요?",
      a: "아닙니다. 이 자료는 지역과 병원 종별로 묶은 집계 통계라 특정 병원의 가격이 아닙니다. 알 수 있는 것은 \u201c대체로 이 정도 범위\u201d까지입니다. 실제로 갈 병원의 값은 건강보험심사평가원의 비급여 진료비 조회나 병원 접수창구·누리집의 고지에서 확인해야 합니다.",
    },
    {
      q: "최저가로 나온 금액에 받을 수 있나요?",
      a: `어렵습니다. 최저와 최고는 그런 값을 받는 곳이 한 곳만 있어도 잡히기 때문에 대표성이 없습니다. 실제로 도수치료의 집계 최저가 몇백 원으로 잡히는데 이는 사실상 무료로 해 준 사례입니다.${widestItem ? ` 이 자료에서 최고와 최저가 가장 크게 벌어진 항목은 ${widestItem.category} 분류에 있습니다.` : ""} 예산은 중간값으로 잡고 최고값은 상한으로 보는 편이 어긋나지 않습니다.`,
    },
    {
      q: "비급여도 실손보험으로 돌려받을 수 있나요?",
      a: "실손의료보험은 비급여도 보장하지만 전부는 아닙니다. 치료 목적이 아닌 진료, 예방 목적, 약관에서 제외한 항목은 보장되지 않고, 자기부담금을 뺀 금액만 지급됩니다. 도수치료·체외충격파·증식치료처럼 2017년 4월 이후 상품에서 특약으로 분리된 항목도 있습니다. 항목마다 다르므로 각 항목 페이지의 실손보험 항목과 본인 약관을 함께 확인하세요.",
    },
  ];
}
