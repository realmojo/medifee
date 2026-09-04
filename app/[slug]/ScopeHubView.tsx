import {
  DATA_UPDATED,
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
  scopeHubSlug,
  scopeWord,
  type ScopeType,
} from "@/lib/scopes";
import { getScopeStats } from "@/lib/fee-data";
import { ITEM_HUB_SLUG } from "@/lib/menu";
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from "@/lib/seo";
import { scopeNote } from "@/lib/scope-notes";
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
  const faq = buildFaq(type, word, showcase ? itemLabel(showcase) : null, base);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "홈", path: "/" },
              { name: word.axis, path: `/${scopeHubSlug(type)}` },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListJsonLd(
              type === "region"
                ? "시도별 비급여 진료비"
                : "병원 종별 비급여 진료비",
              scopes.map((s) => ({ name: s.name, path: `/${s.slug}` })),
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
                {scopeNote(type, s.slug) && (
                  <p className="bento-card__note">
                    {scopeNote(type, s.slug)?.what[0]}
                  </p>
                )}
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
 * 축이 무엇으로 나뉘는지, 왜 이 단위인지에 답한다. 상세 페이지의 FAQ 와
 * 겹치지 않게 "고르는 법"에 머문다.
 */
function buildFaq(
  type: ScopeType,
  word: { axis: string; base: string; other: string },
  showcaseLabel: string | null,
  base: number,
): Array<{ q: string; a: string }> {
  if (type === "region") {
    return [
      {
        q: "지역에 따라 비급여 진료비가 정말 다른가요?",
        a: `다릅니다. ${showcaseLabel ? `${showcaseLabel} 하나만 놓고 봐도 시도별 중간값이 갈리고, 전국 중간값은 ${formatWon(base)}입니다.` : ""} 임대료와 인건비, 그 지역에 어떤 종별의 기관이 많은지가 값에 반영되기 때문입니다. 다만 항목마다 방향이 달라서 어느 지역이 전반적으로 비싸다고 말하기는 어렵습니다.`,
      },
      {
        q: "왜 시·군·구가 아니라 시도 단위인가요?",
        a: `원본이 병원별 자료가 아니라 집계 통계이기 때문입니다. 건강보험심사평가원이 공개한 통계표에서 나뉘어 있는 가장 작은 지역 단위가 시도 17곳이라 그보다 잘게 쪼갤 수 없습니다. 대신 병원 종별이라는 축이 하나 더 있어서, 같은 지역 안에서 의원과 병원의 값을 견줄 수 있습니다.`,
      },
      {
        q: "다른 지역에서 받으면 더 싼가요?",
        a: `항목에 따라 다릅니다. 그리고 지역을 옮기는 것보다 같은 지역 안에서 병원 종별을 견주는 편이 실속 있는 항목이 많습니다. 이동에 드는 시간과 비용, 여러 번 받아야 하는 치료라면 그 횟수까지 함께 따져 보세요. 실제 병원의 값은 건강보험심사평가원 비급여 진료비 조회에서 확인할 수 있습니다.`,
      },
      {
        q: "이 자료는 언제 기준인가요?",
        a: `${DATA_YEAR}년 건강보험심사평가원 「비급여진료비용및제증명수수료통계」이며 통계표는 ${DATA_UPDATED}에 갱신되었습니다. 17개 시도 전체가 들어 있습니다.`,
      },
    ];
  }
  return [
    {
      q: "병원 종별은 무엇으로 나누나요?",
      a: "의료법이 정한 의료기관 종류를 따릅니다. 병상 수와 진료과목, 전문의 수 같은 요건으로 갈리고 — 의원은 병상 30개 미만, 병원은 30개 이상, 종합병원은 100개 이상에 여러 진료과목을 갖춰야 합니다 — 상급종합병원은 종합병원 가운데 보건복지부가 3년마다 새로 지정합니다.",
    },
    {
      q: "큰 병원이 항상 더 비싼가요?",
      a: `항목에 따라 다릅니다. ${showcaseLabel ? `${showcaseLabel}처럼 종별 차이가 뚜렷한 항목이 있는가 하면` : "종별 차이가 뚜렷한 항목이 있는가 하면"} 거의 차이가 없는 항목도 있습니다. 규모가 큰 종별은 장비와 인력에 드는 원가가 크지만, 그만큼 다루는 환자와 시술 구성도 달라서 값만으로 견주기 어려운 항목이 있습니다.`,
    },
    {
      q: "같은 진료를 작은 병원에서 받아도 되나요?",
      a: "그 판단은 진료한 의사가 합니다. 이 사이트가 할 수 있는 것은 값의 분포를 보여주는 것까지입니다. 다만 받기 전에 \u201c이 진료가 건강보험이 되는지\u201d를 물어보는 것은 어느 종별에서든 도움이 됩니다. 급여로 받을 수 있으면 부담이 크게 줄어듭니다.",
    },
    {
      q: "이 자료는 언제 기준인가요?",
      a: `${DATA_YEAR}년 건강보험심사평가원 「비급여진료비용및제증명수수료통계」이며 통계표는 ${DATA_UPDATED}에 갱신되었습니다. 상급종합병원부터 동네 의원·치과의원·한의원까지 10개 종별이 들어 있습니다.`,
    },
  ];
}
