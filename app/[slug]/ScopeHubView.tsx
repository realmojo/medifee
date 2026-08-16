import {
  DATA_YEAR,
  featuredItems,
  formatWon,
  itemLabel,
  listItemFees,
  listItems,
  relative,
  relativeSign,
  type FeeRow,
} from "@/lib/fee-data";
import {
  CLASSES,
  CLASS_HUB_SLUG,
  REGIONS,
  REGION_HUB_SLUG,
  scopeWord,
  type ScopeType,
} from "@/lib/scopes";
import { getScopeStats } from "@/lib/fee-data";
import { ITEM_HUB_SLUG } from "@/lib/menu";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/**
 * `/지역`, `/종별` — 두 축의 목록 화면.
 *
 * 목록만 늘어놓으면 클릭할 이유가 없다. 그래서 **한 항목을 골라 축 전체를
 * 견주는 표**를 함께 싣는다. 지역 허브는 도수치료, 종별 허브는 1인실이다.
 * 값이 실제로 갈린다는 것을 먼저 보여줘야 목록을 누른다.
 */
const SHOWCASE: Record<ScopeType, string> = {
  region: "도수치료",
  class: "1인실",
};

export default async function ScopeHubView({ type }: { type: ScopeType }) {
  const word = scopeWord(type);
  const scopes = type === "region" ? REGIONS : CLASSES;

  const [stats, items] = await Promise.all([getScopeStats(), listItems()]);

  const showcaseSlug = SHOWCASE[type];
  const showcase = items.find((i) => i.item_slug === showcaseSlug) ?? null;
  const showcaseRows = showcase ? await listItemFees(showcase.item_slug) : [];
  const base =
    (type === "region" ? showcase?.region_median : showcase?.class_median) ?? 0;

  const order = new Map(scopes.map((s, i) => [s.slug, i]));
  const comparison: FeeRow[] = showcaseRows
    .filter((r) => r.scope_type === type && r.median_price !== null)
    .sort((a, b) => (order.get(a.scope) ?? 99) - (order.get(b.scope) ?? 99));

  const featured = featuredItems(items).slice(0, 8);

  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>{type === "region" ? "📍" : "🏥"}</span>
          {type === "region"
            ? "지역별 비급여 진료비"
            : "병원 종별 비급여 진료비"}
        </h1>
        <p>
          {type === "region"
            ? "시도를 고르면 그 지역에서 공개된 비급여 항목의 금액을 볼 수 있습니다."
            : "같은 항목이라도 상급종합병원과 동네 의원은 값이 다릅니다. 종별을 골라 보세요."}{" "}
          {DATA_YEAR}년 건강보험심사평가원 자료입니다.
        </p>
      </div>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.top} />
      </div>

      <section className="sido-block">
        <h2 className="sido-block__title">
          {word.axis} 고르기
          <span className="sido-block__count">{scopes.length}곳</span>
        </h2>
        <div className="bento-grid">
          {scopes.map((s) => {
            const stat = stats.get(`${type}|${s.slug}`);
            return (
              <a
                target="_self"
                key={s.slug}
                href={`/${s.slug}`}
                className="bento-card"
              >
                <div className="bento-card__icon" aria-hidden>
                  {s.emoji}
                </div>
                <h3 className="bento-card__title">{s.name}</h3>
                <p className="bento-card__desc">
                  {stat ? `공개 항목 ${stat.item_count}개 · ` : ""}
                  {s.note}
                </p>
              </a>
            );
          })}
        </div>
      </section>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.middle} />
      </div>

      {showcase && comparison.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">
            {itemLabel(showcase)}로 견줘 보면
          </h2>
          <p className="panel__desc">
            같은 {itemLabel(showcase)}인데 {word.axis}에 따라 중간값이
            이만큼 갈립니다. {word.base} 중간값은 {formatWon(base)}입니다.
          </p>
          <div className="table-scroll">
            <table className="pr-table">
              <thead>
                <tr>
                  <th scope="col">{word.axis}</th>
                  <th scope="col" className="is-num">
                    중간값
                  </th>
                  <th scope="col" className="is-num">
                    {word.base} 대비
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((r) => (
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
                      {base && r.median_price !== null ? (
                        <span
                          className={`rel rel--${relativeSign(r.median_price, base)}`}
                        >
                          {relative(r.median_price, base)}
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
          <p className="panel__desc" style={{ marginBottom: 0 }}>
            <a target="_self" href={`/${showcase.item_slug}`}>
              {itemLabel(showcase)} 자세히 보기
            </a>
          </p>
        </section>
      )}

      {featured.length > 0 && (
        <section className="sido-block">
          <h2 className="sido-block__title">
            많이 찾는 항목
            <span className="sido-block__count">
              <a target="_self" href={`/${ITEM_HUB_SLUG}`}>
                전체 보기
              </a>
            </span>
          </h2>
          <div className="region-chips">
            {featured.map((i) => (
              <a target="_self" key={i.item_slug} href={`/${i.item_slug}`}>
                {itemLabel(i)}
                <span style={{ fontSize: 11, color: "#8b9184" }}>
                  {formatWon(i.median_price)}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h2 className="panel__title">
          {type === "region"
            ? "왜 시군구가 아니라 시도인가"
            : "종별은 무엇으로 나누나"}
        </h2>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          {type === "region" ? (
            <>
              원본이 병원별 자료가 아니라 <strong>집계 통계</strong>입니다.
              나뉘어 있는 가장 작은 지역 단위가 시도(17개)라 그보다 잘게 쪼갤
              수 없습니다. 대신{" "}
              <a target="_self" href={`/${CLASS_HUB_SLUG}`}>
                병원 종별
              </a>
              이라는 축이 하나 더 있고, 실제로는 지역보다 종별 차이가 더 큰
              항목이 많습니다.
            </>
          ) : (
            <>
              의료법이 정한 의료기관 종류를 따릅니다. 병상 수와 진료과목,
              전문의 수 같은 요건으로 갈리고 상급종합병원은 3년마다 새로
              지정됩니다. 같은 항목이라도 종별에 따라 장비와 시술 구성이 달라
              값이 갈립니다.{" "}
              <a target="_self" href={`/${REGION_HUB_SLUG}`}>
                지역별
              </a>
              로도 볼 수 있습니다.
            </>
          )}
        </p>
      </section>

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.bottom} />
      </div>
    </>
  );
}
