import {
  DATA_UPDATED,
  DATA_YEAR,
  formatWon,
  formatWonShort,
  itemHeadline,
  itemLabel,
  itemNoun,
  listItemFees,
  listItems,
  priceRatio,
  rangeText,
  ratioText,
  relative,
  relativeSign,
  siblingItems,
  withParticle,
  type FeeRow,
  type ItemStats,
} from "@/lib/fee-data";
import { ITEM_HUB_SLUG, OFFICIAL_LINKS } from "@/lib/menu";
import { CLASSES, CLASS_HUB_SLUG, REGIONS, REGION_HUB_SLUG } from "@/lib/scopes";
import { breadcrumbJsonLd, datasetJsonLd, faqJsonLd, SITE } from "@/lib/seo";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/**
 * 항목 상세 — 이 사이트의 주축 화면.
 *
 * 하나의 글로 읽히도록 짠다. 패널을 여러 개 늘어놓으면 검색엔진에게도
 * 사람에게도 "표 모음"으로 보인다. h2 로 문단을 나누고 표는 그 안에 둔다.
 *
 * 금액은 **중간값을 앞세운다.** 최저·최고는 한 곳만 있어도 잡히는 값이라
 * 대표성이 없다. 도수치료 최저가 300원인 것이 그런 경우다.
 */
export default async function ItemView({ item }: { item: ItemStats }) {
  const [rows, allItems] = await Promise.all([
    listItemFees(item.item_slug),
    listItems(),
  ]);

  const label = itemLabel(item);
  const ratio = priceRatio(item);
  const noun = itemNoun(item);

  const regions = orderRows(
    rows.filter((r) => r.scope_type === "region"),
    REGIONS.map((r) => r.slug),
  );
  const classes = orderRows(
    rows.filter((r) => r.scope_type === "class"),
    CLASSES.map((c) => c.slug),
  );

  const regionBase = item.region_median ?? 0;
  const classBase = item.class_median ?? 0;

  const priciestRegion = highest(regions);
  const cheapestRegion = lowest(regions);
  const priciestClass = highest(classes);
  const cheapestClass = lowest(classes);

  const siblings = siblingItems(allItems, item);

  const description = `${label} 중간값은 ${formatWon(item.median_price)}입니다. ${DATA_YEAR}년 심사평가원 자료로 시도 ${item.scope_count}곳과 병원 종별 ${item.class_count}곳의 금액을 정리했습니다.`;

  const faq = buildFaq({
    item,
    label,
    noun,
    ratio,
    priciestClass,
    cheapestClass,
    priciestRegion,
  });

  return (
    <div className="single-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "홈", path: "/" },
              { name: "항목별", path: `/${ITEM_HUB_SLUG}` },
              { name: label, path: `/${item.item_slug}` },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetJsonLd({
              name: `${label} 비급여 진료비 (${DATA_YEAR}년)`,
              path: `/${item.item_slug}`,
              description,
            }),
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

      <article className="single-article">
        <div className="single-article__inner">
          <nav className="crumbs" aria-label="이동 경로">
            <a target="_self" href={`/${ITEM_HUB_SLUG}`}>
              항목별
            </a>
            <span aria-hidden>›</span>
            <span>{item.category}</span>
          </nav>

          <header className="entry-header">
            <h1 className="entry-title">{itemHeadline(item)}</h1>
            <div className="entry-header__bottom">
              <div className="entry-meta">
                <span>{SITE.name}</span>
                <span className="entry-meta__sep" />
                <span>{DATA_YEAR}년 심사평가원 자료</span>
              </div>
              <span className="entry-cat cat-badge cat-badge--region">
                {item.category}
              </span>
            </div>
          </header>

          <div className="entry-content">
            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.top} />
            </div>

            <p className="entry-lead">
              {withParticle(label, "은는")} 건강보험이 적용되지 않는 비급여{" "}
              {noun}라 병원이 값을 스스로 정합니다. {DATA_YEAR}년 기준 전국
              중간값은 <strong>{formatWon(item.median_price)}</strong>이고,
              집계된 최저와 최고는 {formatWon(item.min_price)}과{" "}
              {formatWon(item.max_price)}
              {ratio ? ` — ${ratioText(ratio)} 차이입니다.` : "입니다."}
            </p>

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
                href={`/${ITEM_HUB_SLUG}`}
                target="_self"
              >
                📋 다른 항목 보기
              </a>
              <p className="cta-row__note">
                아래 금액은 지역·종별로 묶은 집계값입니다. 특정 병원의 가격은
                심사평가원에서 확인하세요.
              </p>
            </div>

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.middle} />
            </div>

            <h2 id="summary">{label}, 얼마나 하나</h2>
            <p>
              전국을 한데 모은 값입니다. <strong>중간값</strong>이 실제 부담에
              가장 가깝습니다. 최저·최고는 한 곳만 있어도 잡히기 때문에 그
              값으로 예산을 잡으면 어긋납니다.
            </p>
            <table>
              <tbody>
                <tr>
                  <th scope="row">항목</th>
                  <td>{label}</td>
                </tr>
                <tr>
                  <th scope="row">분류</th>
                  <td>{item.category}</td>
                </tr>
                <tr>
                  <th scope="row">중간값</th>
                  <td>
                    <strong>{formatWon(item.median_price)}</strong>
                  </td>
                </tr>
                <tr>
                  <th scope="row">평균</th>
                  <td>{formatWon(item.avg_price)}</td>
                </tr>
                <tr>
                  <th scope="row">가장 낮은 값</th>
                  <td>{formatWon(item.min_price)}</td>
                </tr>
                <tr>
                  <th scope="row">가장 높은 값</th>
                  <td>{formatWon(item.max_price)}</td>
                </tr>
                {ratio && (
                  <tr>
                    <th scope="row">최고 ÷ 최저</th>
                    <td>
                      <strong>{ratioText(ratio)}</strong>
                    </td>
                  </tr>
                )}
                <tr>
                  <th scope="row">집계 범위</th>
                  <td>
                    시도 {item.scope_count}곳 · 병원 종별 {item.class_count}종
                  </td>
                </tr>
                <tr>
                  <th scope="row">기준</th>
                  <td>
                    {DATA_YEAR}년 · 통계표 갱신 {DATA_UPDATED}
                  </td>
                </tr>
              </tbody>
            </table>

            {classes.length > 0 && (
              <>
                <h2 id="class">어느 병원에서 받느냐가 절반입니다</h2>
                <p>
                  같은 {noun}라도 병원 종별에 따라 값이 갈립니다. 아래는 종별로
                  묶은 중간값입니다.
                  {priciestClass && cheapestClass && priciestClass !== cheapestClass && (
                    <>
                      {" "}
                      가장 높은 곳은 <strong>{priciestClass.scope}</strong>(
                      {formatWon(priciestClass.median_price)}), 가장 낮은 곳은{" "}
                      <strong>{cheapestClass.scope}</strong>(
                      {formatWon(cheapestClass.median_price)})입니다.
                    </>
                  )}
                </p>
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
                        <td>{diffCell(r.median_price, classBase)}</td>
                        <td>{rangeText(r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>
                  <a target="_self" href={`/${CLASS_HUB_SLUG}`}>
                    병원 종별로 전체 항목 보기
                  </a>
                </p>
              </>
            )}

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.bottom} />
            </div>

            {regions.length > 0 && (
              <>
                <h2 id="region">지역별로는 이렇습니다</h2>
                <p>
                  17개 시도의 중간값입니다. 전국 중간값(
                  {formatWon(item.region_median)})을 기준으로 어느 쪽인지 함께
                  적었습니다.
                  {priciestRegion && cheapestRegion && (
                    <>
                      {" "}
                      가장 높은 곳은 <strong>{priciestRegion.scope}</strong>(
                      {formatWon(priciestRegion.median_price)}), 가장 낮은 곳은{" "}
                      <strong>{cheapestRegion.scope}</strong>(
                      {formatWon(cheapestRegion.median_price)})입니다.
                    </>
                  )}
                </p>
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
                        <td>{diffCell(r.median_price, regionBase)}</td>
                        <td>{rangeText(r)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>
                  <a target="_self" href={`/${REGION_HUB_SLUG}`}>
                    지역별로 전체 항목 보기
                  </a>
                </p>
              </>
            )}

            <h2 id="why">왜 이렇게 벌어지나</h2>
            <p>
              비급여는 건강보험이 적용되지 않는 항목입니다. 급여 항목은 나라가
              수가를 정해두지만, 비급여는{" "}
              <strong>각 병원이 스스로 가격을 매깁니다.</strong> 그래서 같은
              이름의 진료·서류인데도 금액이 몇 배씩 벌어집니다.
            </p>
            <ul>
              <li>
                <strong>병원 종별</strong> — 장비와 인력, 원가 구조가 다릅니다.
                위 표에서 종별 차이가 지역 차이보다 큰 항목이 많습니다
              </li>
              <li>
                <strong>지역</strong> — 임대료와 인건비가 값에 반영됩니다
              </li>
              <li>
                <strong>포함 범위</strong> — 같은 이름이어도 어디까지
                포함하는지가 병원마다 다를 수 있습니다. 재료비·판독료가 따로
                붙기도 합니다
              </li>
            </ul>
            <p>
              <strong>가격 차이가 곧 품질 차이는 아닙니다.</strong> 비싸다고 더
              좋은 것도, 싸다고 부실한 것도 아닙니다. 다만 미리 묻지 않으면
              생각보다 많이 나올 수 있다는 뜻입니다.
            </p>

            <h2 id="check">받기 전에 물어볼 것</h2>
            <ol>
              <li>
                <strong>이게 비급여가 맞는지</strong> — 같은 진료라도 조건에
                따라 건강보험이 적용되기도 합니다. 적용되면 부담이 크게 줄어듭니다
              </li>
              <li>
                <strong>총액이 얼마인지</strong> — 시술료 외에 재료비·판독료가
                따로 붙는 경우가 있습니다. &ldquo;오늘 다 해서 얼마 나오나요&rdquo;로
                물으세요
              </li>
              <li>
                <strong>몇 번을 받아야 하는지</strong> — 회당 금액이 낮아도
                횟수가 붙으면 총액이 달라집니다
              </li>
              <li>
                <strong>실손보험이 되는지</strong> —{" "}
                <a target="_self" href="/비급여-실비보험-청구">
                  비급여 실비 청구
                </a>
                에 되는 것과 안 되는 것을 정리해 두었습니다
              </li>
            </ol>

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
          </div>

          <footer className="entry-footer">
            <span>
              출처: 건강보험심사평가원 「비급여진료비용및제증명수수료통계」
              ({DATA_YEAR})
            </span>
            <span>집계값이며 특정 병원의 가격이 아닙니다</span>
          </footer>
        </div>
      </article>

      {siblings.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <div className="sec-head">
            <h2 className="sec-title">{item.category}의 다른 항목</h2>
            <a target="_self" href={`/${ITEM_HUB_SLUG}`} className="sec-more">
              전체 항목
            </a>
          </div>
          <div className="sido-block">
            <div className="region-chips">
              {siblings.map((s) => (
                <a target="_self" key={s.item_slug} href={`/${s.item_slug}`}>
                  {itemLabel(s)}
                  <span style={{ fontSize: 11, color: "#8b9184" }}>
                    {formatWonShort(s.median_price)}
                  </span>
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

/** 정해 둔 순서대로 늘어놓는다. 금액순으로 두면 페이지마다 순서가 달라진다. */
function orderRows(rows: FeeRow[], order: string[]): FeeRow[] {
  const rank = new Map(order.map((s, i) => [s, i]));
  return [...rows].sort(
    (a, b) => (rank.get(a.scope) ?? 99) - (rank.get(b.scope) ?? 99),
  );
}

function highest(rows: FeeRow[]): FeeRow | null {
  const withValue = rows.filter((r) => r.median_price !== null);
  if (withValue.length === 0) return null;
  return withValue.reduce((a, b) =>
    (b.median_price ?? 0) > (a.median_price ?? 0) ? b : a,
  );
}

function lowest(rows: FeeRow[]): FeeRow | null {
  const withValue = rows.filter((r) => r.median_price !== null);
  if (withValue.length === 0) return null;
  return withValue.reduce((a, b) =>
    (b.median_price ?? 0) < (a.median_price ?? 0) ? b : a,
  );
}


function diffCell(value: number | null, base: number) {
  if (value === null || !base) return <span>-</span>;
  return (
    <span className={`rel rel--${relativeSign(value, base)}`}>
      {relative(value, base)}
    </span>
  );
}

/**
 * 자주 묻는 질문 3개.
 *
 * 항목마다 값이 달라지므로 문장에 실제 숫자를 넣는다. 668개가 같은 문장이면
 * 검색엔진이 중복으로 본다.
 */
function buildFaq({
  item,
  label,
  noun,
  ratio,
  priciestClass,
  cheapestClass,
  priciestRegion,
}: {
  item: ItemStats;
  label: string;
  noun: string;
  ratio: number | null;
  priciestClass: FeeRow | null;
  cheapestClass: FeeRow | null;
  priciestRegion: FeeRow | null;
}): Array<{ q: string; a: string }> {
  const median = formatWon(item.median_price);

  const first = {
    q: `${label} 비용은 얼마인가요?`,
    a: `${DATA_YEAR}년 건강보험심사평가원 자료 기준으로 전국 중간값은 ${median}입니다. 집계된 범위는 ${formatWon(item.min_price)}부터 ${formatWon(item.max_price)}까지${ratio ? `로, 최고가 최저의 ${ratioText(ratio)}입니다` : "입니다"}. 다만 이 값은 지역·종별로 묶은 집계값이라 특정 병원의 가격이 아닙니다. 최저와 최고는 한 곳만 있어도 잡히는 값이므로 중간값을 기준으로 보시는 편이 실제에 가깝습니다.`,
  };

  const second =
    priciestClass && cheapestClass && priciestClass !== cheapestClass
      ? {
          q: `${withParticle(label, "은는")} 어디가 더 비싼가요?`,
          a: `병원 종별로 보면 ${priciestClass.scope}의 중간값이 ${formatWon(priciestClass.median_price)}으로 가장 높고, ${cheapestClass.scope}이 ${formatWon(cheapestClass.median_price)}으로 가장 낮습니다. 지역별로는 ${priciestRegion ? `${withParticle(priciestRegion.scope, "이가")} ${formatWon(priciestRegion.median_price)}으로 가장 높습니다` : "지역마다 다릅니다"}. 다만 종별 차이는 진료 내용과 장비 차이를 함께 반영하므로 단순 비교는 조심해야 합니다.`,
        }
      : {
          q: `${label} 가격이 병원마다 다른가요?`,
          a: `다릅니다. 비급여는 건강보험 수가가 정해져 있지 않아 각 병원이 스스로 값을 매깁니다. 이 자료에서도 집계된 최저 ${formatWon(item.min_price)}와 최고 ${formatWon(item.max_price)} 사이가 크게 벌어져 있습니다.`,
        };

  const third = {
    q: `${label}${item.fee_kind === "certificate" ? " 발급비" : ""}는 실비보험이 되나요?`,
    a:
      item.fee_kind === "certificate"
        ? "서류 발급 수수료는 치료 행위가 아니라 보장 대상이 아닌 경우가 많습니다. 다만 보험금 청구를 위해 보험사가 요구해서 발급한 서류는 보험사가 비용을 부담하기도 합니다. 청구 전에 보험사에 먼저 확인하세요."
        : `실손의료보험은 비급여도 보장하지만 전부는 아닙니다. 치료 목적이 아닌 ${noun}, 예방 목적, 약관에서 제외한 항목은 보장되지 않고, 자기부담금을 뺀 금액만 지급됩니다. 자기부담 비율은 가입 시기에 따라 다르므로 본인 약관을 확인하는 것이 가장 정확합니다.`,
  };

  return [first, second, third];
}
