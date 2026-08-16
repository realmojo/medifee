import {
  DATA_UPDATED,
  DATA_YEAR,
  featuredItems,
  formatWon,
  formatWonShort,
  groupByCategory,
  itemLabel,
  listItems,
  listScopeFees,
  rangeText,
  relative,
  relativeSign,
  withParticle,
  type FeeRow,
  type ItemStats,
} from "@/lib/fee-data";
import { ITEM_HUB_SLUG, OFFICIAL_LINKS } from "@/lib/menu";
import {
  scopeHubSlug,
  scopeWord,
  type Scope,
  type ScopeType,
} from "@/lib/scopes";
import { breadcrumbJsonLd, datasetJsonLd, faqJsonLd, SITE } from "@/lib/seo";
import StatTile from "@/components/price/StatTile";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/**
 * 지역(시도) 상세와 병원 종별 상세를 한 컴포넌트가 맡는다.
 *
 * 두 축이 같은 표를 쓴다 — 항목별 금액과 전체 기준 대비 위치. 문구만 다르다.
 * 따로 만들면 한쪽만 고치는 일이 반드시 생긴다.
 *
 * 비교 기준은 축마다 다른 값을 쓴다. 지역 화면은 17개 시도의 중간값,
 * 종별 화면은 10개 종별의 중간값이다. 27개를 한꺼번에 섞으면 지역 페이지가
 * 종별 값에 끌려간다.
 */
export default async function ScopeView({
  type,
  scope,
}: {
  type: ScopeType;
  scope: Scope;
}) {
  const [rows, allItems] = await Promise.all([
    listScopeFees(type, scope.slug),
    listItems(),
  ]);

  if (rows.length === 0) return <EmptyScope type={type} scope={scope} />;

  const word = scopeWord(type);
  const stats = new Map(allItems.map((i) => [i.item_slug, i]));
  const here = new Map(rows.map((r) => [r.item_slug, r]));

  const compared = rows
    .map((r) => {
      const s = stats.get(r.item_slug);
      const base = (type === "region" ? s?.region_median : s?.class_median) ?? 0;
      return { row: r, stat: s, base };
    })
    .filter((x) => x.stat && x.row.median_price !== null && x.base > 0)
    .map((x) => ({
      ...x,
      index: (x.row.median_price as number) / x.base,
    }));

  // 표본이 얇은 항목은 지수가 쉽게 튄다. 두 축 모두 폭넓게 잡힌 것만 견준다.
  const solid = compared.filter(
    (x) => (x.stat?.scope_count ?? 0) >= 12 && (x.stat?.class_count ?? 0) >= 4,
  );
  const pricier = [...solid].sort((a, b) => b.index - a.index).slice(0, 10);
  const cheaper = [...solid].sort((a, b) => a.index - b.index).slice(0, 10);

  const featured = featuredItems(allItems).filter((i) => here.has(i.item_slug));
  const groups = groupByCategory(rows);

  const title =
    type === "region"
      ? `${scope.slug} 비급여 진료비 — 항목별 금액`
      : `${scope.name} 비급여 진료비 — 항목별 금액`;

  const description = `${scope.name}의 비급여 진료비 ${rows.length}개 항목을 ${DATA_YEAR}년 심사평가원 자료로 정리했습니다. ${word.base} 기준과 견주어 어느 쪽인지 함께 적었습니다.`;

  const faq = buildFaq({ type, scope, word, pricier, cheaper, rows });

  return (
    <div className="single-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "홈", path: "/" },
              { name: word.axis, path: `/${scopeHubSlug(type)}` },
              { name: scope.slug, path: `/${scope.slug}` },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetJsonLd({
              name: `${scope.name} 비급여 진료비 (${DATA_YEAR}년)`,
              path: `/${scope.slug}`,
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
            <a target="_self" href={`/${scopeHubSlug(type)}`}>
              {word.axis}
            </a>
            <span aria-hidden>›</span>
            <span>{scope.slug}</span>
          </nav>

          <header className="entry-header">
            <h1 className="entry-title">{title}</h1>
            <div className="entry-header__bottom">
              <div className="entry-meta">
                <span>{SITE.name}</span>
                <span className="entry-meta__sep" />
                <span>{DATA_YEAR}년 심사평가원 자료</span>
              </div>
              <span className="entry-cat cat-badge cat-badge--region">
                {scope.name}
              </span>
            </div>
          </header>

          <div className="entry-content">
            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.top} />
            </div>

            <p className="entry-lead">
              {withParticle(scope.name, "은는")} {scope.note}. 여기서 공개된
              비급여 항목은 <strong>{rows.length}개</strong>이고 분류로는{" "}
              {groups.length}가지입니다. 아래 금액은 {DATA_YEAR}년 기준
              중간값이며, {word.base} 기준과 견주어 어느 쪽인지 함께 적었습니다.
            </p>

            <div className="cta-row">
              <a
                className="cta-btn"
                href={OFFICIAL_LINKS.hira}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                🔎 병원별 가격 조회 (심평원)
              </a>
              <a
                className="cta-btn cta-btn--ghost"
                href={`/${scopeHubSlug(type)}`}
                target="_self"
              >
                📍 다른 {word.axis} 보기
              </a>
            </div>

            <section className="stat-grid" style={{ margin: "20px 0" }}>
              <StatTile label="공개 항목" value={`${rows.length}개`} />
              <StatTile label="분류" value={`${groups.length}가지`} />
              <StatTile label="기준" value={`${DATA_YEAR}년`} />
              <StatTile label="통계표 갱신" value={DATA_UPDATED} />
            </section>

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.middle} />
            </div>

            {featured.length > 0 && (
              <>
                <h2 id="featured">많이 찾는 항목부터</h2>
                <p>
                  사람들이 자주 묻는 항목을 먼저 모았습니다. 이름을 누르면 다른{" "}
                  {word.other}과 견줄 수 있습니다.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">항목</th>
                      <th scope="col">중간값</th>
                      <th scope="col">{word.base} 대비</th>
                      <th scope="col">최저~최고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featured.map((item) => {
                      const r = here.get(item.item_slug) as FeeRow;
                      const base =
                        (type === "region"
                          ? item.region_median
                          : item.class_median) ?? 0;
                      return (
                        <tr key={item.item_slug}>
                          <th scope="row">
                            <a target="_self" href={`/${item.item_slug}`}>
                              {itemLabel(item)}
                            </a>
                          </th>
                          <td>{formatWon(r.median_price)}</td>
                          <td>{diffCell(r.median_price, base)}</td>
                          <td>{rangeText(r)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}

            {pricier.length > 0 && (
              <>
                <h2 id="pricier">{word.base}보다 비싼 항목</h2>
                <p>
                  {word.base} 중간값을 기준으로{" "}
                  {withParticle(scope.slug, "이가")} 가장 많이 웃도는
                  항목입니다. 폭넓게 집계된 항목만 넣었습니다.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">항목</th>
                      <th scope="col">{scope.slug}</th>
                      <th scope="col">{word.base}</th>
                      <th scope="col">차이</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricier.map((x) => (
                      <tr key={x.row.item_slug}>
                        <th scope="row">
                          <a target="_self" href={`/${x.row.item_slug}`}>
                            {itemLabel(x.stat as ItemStats)}
                          </a>
                        </th>
                        <td>{formatWon(x.row.median_price)}</td>
                        <td>{formatWon(x.base)}</td>
                        <td>{diffCell(x.row.median_price, x.base)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.bottom} />
            </div>

            {cheaper.length > 0 && (
              <>
                <h2 id="cheaper">{word.base}보다 싼 항목</h2>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">항목</th>
                      <th scope="col">{scope.slug}</th>
                      <th scope="col">{word.base}</th>
                      <th scope="col">차이</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cheaper.map((x) => (
                      <tr key={x.row.item_slug}>
                        <th scope="row">
                          <a target="_self" href={`/${x.row.item_slug}`}>
                            {itemLabel(x.stat as ItemStats)}
                          </a>
                        </th>
                        <td>{formatWon(x.row.median_price)}</td>
                        <td>{formatWon(x.base)}</td>
                        <td>{diffCell(x.row.median_price, x.base)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <h2 id="read">이 표를 어떻게 읽어야 하나</h2>
            <p>
              여기 적힌 값은 <strong>{scope.name} 전체를 묶은 집계값</strong>
              입니다. {type === "region" ? "이 지역" : "이 종별"}의 어느 병원이
              정확히 얼마를 받는지는 이 자료로 알 수 없습니다. 대신 알 수 있는
              것은 &ldquo;대체로 이 정도&rdquo;와 &ldquo;{word.base}보다 높은
              편인가 낮은 편인가&rdquo;입니다.
            </p>
            <ul>
              <li>
                <strong>중간값을 보세요.</strong> 최저·최고는 한 곳만 있어도
                잡히는 값이라 예산을 잡는 기준이 되지 못합니다
              </li>
              <li>
                <strong>차이가 크다고 바가지는 아닙니다.</strong> 장비, 시술
                시간, 포함 범위가 다르면 값도 다릅니다
              </li>
              <li>
                <strong>진료 전에 총액을 물으세요.</strong> 비급여는 미리
                물어보면 대부분 알려줍니다
              </li>
            </ul>

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

      <section style={{ marginTop: 28 }}>
        <div className="sec-head">
          <h2 className="sec-title">{scope.slug}의 전체 항목</h2>
          <a target="_self" href={`/${ITEM_HUB_SLUG}`} className="sec-more">
            항목별로 보기
          </a>
        </div>
        {groups.map((g) => (
          <section className="sido-block" key={g.category}>
            <h2 className="sido-block__title">
              {g.category}
              <span className="sido-block__count">{g.items.length}개</span>
            </h2>
            <div className="region-chips">
              {g.items.map((r) => (
                <a target="_self" key={r.item_slug} href={`/${r.item_slug}`}>
                  {itemLabel(r)}
                  <span style={{ fontSize: 11, color: "#8b9184" }}>
                    {formatWonShort(r.median_price)}
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </section>

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.bottom} />
      </div>
    </div>
  );
}

/* ------------------------------- 도우미 ------------------------------- */


function diffCell(value: number | null, base: number) {
  if (value === null || !base) return <span>-</span>;
  return (
    <span className={`rel rel--${relativeSign(value, base)}`}>
      {relative(value, base)}
    </span>
  );
}

function buildFaq({
  type,
  scope,
  word,
  pricier,
  cheaper,
  rows,
}: {
  type: ScopeType;
  scope: Scope;
  word: { axis: string; base: string; other: string };
  pricier: Array<{ row: FeeRow; stat?: ItemStats; base: number }>;
  cheaper: Array<{ row: FeeRow; stat?: ItemStats; base: number }>;
  rows: FeeRow[];
}): Array<{ q: string; a: string }> {
  const top = pricier[0];
  const bottom = cheaper[0];

  return [
    {
      q: `${scope.name}의 비급여 진료비는 다른 곳보다 비싼가요?`,
      a: `항목마다 다릅니다. ${top ? `${withParticle(itemLabel(top.stat as ItemStats), "은는")} ${withParticle(scope.slug, "이가")} ${formatWon(top.row.median_price)}으로 ${word.base} 중간값 ${formatWon(top.base)}보다 높습니다.` : ""} ${bottom ? `반대로 ${withParticle(itemLabel(bottom.stat as ItemStats), "은는")} ${formatWon(bottom.row.median_price)}으로 더 낮습니다.` : ""} 그래서 ${withParticle(scope.slug, "이가")} 비싸다고 한 문장으로 말할 수는 없고, 받으려는 항목별로 봐야 합니다.`,
    },
    {
      q: `${scope.name}에서 병원별 가격은 어디서 보나요?`,
      a: `이 사이트의 값은 ${scope.name} 전체를 묶은 집계값이라 병원별 가격이 아닙니다. 병원 하나하나의 비급여 가격은 건강보험심사평가원 누리집의 비급여 진료비 조회에서 확인할 수 있고, 병원 접수창구나 누리집에도 고지하게 되어 있습니다.`,
    },
    {
      q:
        type === "region"
          ? `${scope.slug}에는 어떤 항목이 공개되어 있나요?`
          : `${scope.name}에서는 어떤 비급여 항목을 받나요?`,
      // 분류를 직접 세어서 말한다. "MRI·예방접종까지 있습니다" 같은 고정
      // 문장을 쓰면 한의원처럼 항목이 좁은 곳에서 사실과 어긋난다.
      a: `${DATA_YEAR}년 기준으로 ${rows.length}개 항목이 집계되어 있습니다. 항목 수가 많은 분류는 ${groupByCategory(rows)
        .slice(0, 5)
        .map((g) => `${g.category}(${g.items.length}개)`)
        .join(", ")} 순입니다. 다만 모든 기관이 모든 항목을 하는 것은 아니라 항목마다 집계된 범위가 다릅니다.`,
    },
  ];
}

function EmptyScope({ type, scope }: { type: ScopeType; scope: Scope }) {
  const word = scopeWord(type);
  return (
    <>
      <div className="page-head">
        <span className="cat-badge cat-badge--region">{scope.name}</span>
        <h1>{scope.name} 비급여 진료비</h1>
        <p>아직 집계된 자료가 없습니다.</p>
      </div>
      <div className="empty-box">
        <a
          target="_self"
          href={`/${scopeHubSlug(type)}`}
          style={{ textDecoration: "underline" }}
        >
          다른 {word.axis} 보기
        </a>
      </div>
      <DataNotice />
    </>
  );
}
