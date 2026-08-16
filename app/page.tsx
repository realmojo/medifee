import {
  DATA_UPDATED,
  DATA_YEAR,
  featuredItems,
  formatWon,
  formatWonShort,
  groupByCategory,
  itemLabel,
  listItemFees,
  listItems,
  priceRatio,
  ratioText,
  relative,
  relativeSign,
  SCOPE_NOTE,
} from "@/lib/fee-data";
import { ITEM_HUB_SLUG, OFFICIAL_LINKS } from "@/lib/menu";
import { GUIDES } from "@/lib/guides";
import { CLASSES, CLASS_HUB_SLUG, REGIONS, REGION_HUB_SLUG } from "@/lib/scopes";
import StatTile from "@/components/price/StatTile";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

export const revalidate = 300;

/** 첫 화면에서 종별 차이를 보여줄 항목. 가장 많이 검색되는 비급여다. */
const SHOWCASE_SLUG = "도수치료";

export default async function HomePage() {
  const items = await listItems();
  const groups = groupByCategory(items);
  const featured = featuredItems(items).slice(0, 10);

  const showcase = items.find((i) => i.item_slug === SHOWCASE_SLUG) ?? null;
  const showcaseRows = showcase ? await listItemFees(showcase.item_slug) : [];
  const classOrder = new Map(CLASSES.map((c, i) => [c.slug, i]));
  const byClass = showcaseRows
    .filter((r) => r.scope_type === "class" && r.median_price !== null)
    .sort((a, b) => (classOrder.get(a.scope) ?? 99) - (classOrder.get(b.scope) ?? 99));
  const classBase = showcase?.class_median ?? 0;

  const widest = items
    .filter((i) => i.scope_count >= 15 && i.class_count >= 5)
    .map((i) => ({ item: i, ratio: priceRatio(i) }))
    .filter((x) => x.ratio !== null)
    .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0))
    .slice(0, 8);

  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>🩺</span>
          도수치료 10만원, 그런데 어디서 받느냐에 따라
        </h1>
        <p>
          건강보험이 적용되지 않는 <strong>비급여</strong>는 병원이 값을 스스로
          정합니다. 건강보험심사평가원이 공개한 {DATA_YEAR}년 자료로 항목별
          금액과 지역·병원 종별 차이를 정리했습니다.
        </p>
      </div>

      <section className="stat-grid">
        <StatTile label="공개 항목" value={`${items.length}개`} />
        <StatTile label="지역" value={`${REGIONS.length}개 시도`} />
        <StatTile
          label="병원 종별"
          value={`${CLASSES.length}종`}
          sub={SCOPE_NOTE}
        />
        <StatTile label="기준" value={`${DATA_YEAR}년`} sub={DATA_UPDATED} />
      </section>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.home} />
      </div>

      {featured.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div className="sec-head">
            <h2 className="sec-title">많이 찾는 항목</h2>
            <a target="_self" href={`/${ITEM_HUB_SLUG}`} className="sec-more">
              전체 항목 보기
            </a>
          </div>
          <div className="panel">
            <p className="panel__desc">
              전국 중간값입니다. 최저·최고는 한 곳만 있어도 잡히는 값이라
              중간값을 기준으로 보시는 편이 실제에 가깝습니다.
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
          </div>
        </section>
      )}

      {showcase && byClass.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div className="sec-head">
            <h2 className="sec-title">
              같은 {itemLabel(showcase)}, 어디서 받느냐에 따라
            </h2>
            <a target="_self" href={`/${CLASS_HUB_SLUG}`} className="sec-more">
              종별로 보기
            </a>
          </div>
          <div className="panel">
            <p className="panel__desc">
              병원 종별 중간값입니다. 전체 종별 중간값은{" "}
              {formatWon(classBase)}입니다.
            </p>
            <div className="table-scroll">
              <table className="pr-table">
                <thead>
                  <tr>
                    <th scope="col">병원 종별</th>
                    <th scope="col" className="is-num">
                      중간값
                    </th>
                    <th scope="col" className="is-num">
                      전체 대비
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byClass.map((r) => (
                    <tr key={r.scope}>
                      <td>
                        <a
                          target="_self"
                          href={`/${r.scope}`}
                          className="pr-table__name pr-table__link"
                        >
                          {r.scope}
                        </a>
                      </td>
                      <td className="is-num">{formatWon(r.median_price)}</td>
                      <td className="is-num">
                        {classBase && r.median_price !== null ? (
                          <span
                            className={`rel rel--${relativeSign(r.median_price, classBase)}`}
                          >
                            {relative(r.median_price, classBase)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {widest.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div className="sec-head">
            <h2 className="sec-title">차이가 가장 큰 항목</h2>
          </div>
          <div className="panel">
            <p className="panel__desc">
              집계된 최저와 최고가 몇 배 벌어지는지입니다. 이런 항목일수록
              진료 전에 총액을 물어보는 편이 낫습니다.
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
          </div>
        </section>
      )}

      <section style={{ marginBottom: 36 }}>
        <div className="sec-head">
          <h2 className="sec-title">지역으로 찾기</h2>
          <a target="_self" href={`/${REGION_HUB_SLUG}`} className="sec-more">
            전체 지역 보기
          </a>
        </div>
        <div className="sido-block">
          <div className="region-chips">
            {REGIONS.map((s) => (
              <a target="_self" key={s.slug} href={`/${s.slug}`}>
                <span aria-hidden>{s.emoji}</span>
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 36 }}>
        <div className="sec-head">
          <h2 className="sec-title">분류로 찾기</h2>
          <a target="_self" href={`/${ITEM_HUB_SLUG}`} className="sec-more">
            전체 분류 보기
          </a>
        </div>
        <div className="bento-grid">
          {groups.slice(0, 6).map((g) => (
            <a
              target="_self"
              key={g.category}
              href={`/${ITEM_HUB_SLUG}`}
              className="bento-card"
            >
              <h3 className="bento-card__title">{g.category}</h3>
              <p className="bento-card__desc">
                {g.items.length}개 항목 ·{" "}
                {g.items
                  .slice(0, 3)
                  .map((i) => itemLabel(i))
                  .join(", ")}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 36 }}>
        <div className="sec-head">
          <h2 className="sec-title">알아두면 돈이 되는 것들</h2>
        </div>
        <div className="bento-grid">
          {GUIDES.map((g) => (
            <a
              target="_self"
              key={g.slug}
              href={`/${g.slug}`}
              className="bento-card"
            >
              <div className="bento-card__icon" aria-hidden>
                {g.emoji}
              </div>
              <h3 className="bento-card__title">
                {g.title.split(" — ")[0].split(",")[0]}
              </h3>
              <p className="bento-card__desc">{g.summary}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title">비급여가 뭔가요</h2>
        <p className="panel__desc">
          건강보험이 부담하지 않아 <strong>환자가 전액 내는 항목</strong>입니다.
          급여 항목은 나라가 수가를 정해두지만 비급여는 각 병원이 스스로 값을
          매깁니다. 그래서 같은 이름의 진료·서류인데도 금액이 몇 배씩
          벌어집니다.
        </p>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          <strong>가격 차이가 곧 품질 차이는 아닙니다.</strong> 다만 미리
          물어보지 않으면 생각보다 많이 나올 수 있습니다. 병원별 실제 가격은{" "}
          <a
            href={OFFICIAL_LINKS.hira}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            심사평가원
          </a>
          에서 조회하세요.
        </p>
      </section>

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.home} />
      </div>
    </>
  );
}
