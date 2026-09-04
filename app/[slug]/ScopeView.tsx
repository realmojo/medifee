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
import { scopeDrivers, scopeNote } from "@/lib/scope-notes";
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
 *
 * ────────────────────────────────────────────────────────────────────────
 *  27개가 서로를 잡아먹지 않게
 * ────────────────────────────────────────────────────────────────────────
 * 표만 있으면 27개 페이지의 문장이 전부 같아진다. 그래서 두 가지를 더 싣는다.
 *   - lib/scope-notes.ts 의 **성격 해설** — 이곳이 어떤 곳인가
 *   - 이 페이지의 자료로 직접 계산한 **위치** — 전체 기준보다 높은 항목이
 *     몇 개인가, 분류별로는 어떤가
 * 뒤엣것은 자료가 갱신되면 함께 바뀐다.
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
  const note = scopeNote(type, scope.slug);
  const drivers = scopeDrivers(type);
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

  // 전체 기준보다 위인 항목이 몇 개인가. 이 페이지에서만 나오는 숫자다.
  const above = solid.filter((x) => x.index > 1.02).length;
  const below = solid.filter((x) => x.index < 0.98).length;
  const even = solid.length - above - below;

  const featured = featuredItems(allItems).filter((i) => here.has(i.item_slug));
  const groups = groupByCategory(rows);
  const categoryRows = groups.slice(0, 12).map((g) => ({
    category: g.category,
    count: g.items.length,
    median: medianOf(g.items.map((r) => r.median_price)),
    top: [...g.items].sort(
      (a, b) => (b.median_price ?? 0) - (a.median_price ?? 0),
    )[0],
  }));

  const title =
    type === "region"
      ? `${scope.slug} 비급여 진료비 — 항목별 금액`
      : `${scope.name} 비급여 진료비 — 항목별 금액`;

  const description = `${scope.name}의 비급여 진료비 ${rows.length}개 항목을 ${DATA_YEAR}년 심사평가원 자료로 정리했습니다. ${word.base} 기준과 견주어 어느 쪽인지 함께 적었습니다.`;

  const faq = buildFaq({
    type,
    scope,
    word,
    pricier,
    cheaper,
    rows,
    groups,
    above,
    below,
  });

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
              keywords: [scope.name, word.axis, "비급여 진료비", "중간값"],
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

            <nav className="toc" aria-label="이 글의 차례">
              <p className="toc__title">이 글에서 확인할 수 있는 것</p>
              <ul className="toc__list">
                {note && (
                  <li>
                    <a href="#about">
                      {withParticle(scope.slug, "은는")} 어떤 곳인가
                    </a>
                  </li>
                )}
                {solid.length > 0 && (
                  <li>
                    <a href="#position">{word.base} 기준과 견준 위치</a>
                  </li>
                )}
                {featured.length > 0 && (
                  <li>
                    <a href="#featured">많이 찾는 항목의 금액</a>
                  </li>
                )}
                {pricier.length > 0 && (
                  <li>
                    <a href="#pricier">{word.base}보다 비싼 항목</a>
                  </li>
                )}
                {categoryRows.length > 0 && (
                  <li>
                    <a href="#category">분류별 금액</a>
                  </li>
                )}
                <li>
                  <a href="#why">값이 갈리는 이유</a>
                </li>
                <li>
                  <a href="#read">이 표를 어떻게 읽어야 하나</a>
                </li>
              </ul>
            </nav>

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.middle} />
            </div>

            {note && (
              <>
                <h2 id="about">{withParticle(scope.slug, "은는")} 어떤 곳인가</h2>
                {note.what.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </>
            )}

            {solid.length > 0 && (
              <>
                <h2 id="position">{word.base} 기준과 견주면 어느 쪽인가</h2>
                <p>
                  두 축 모두에서 폭넓게 집계된 항목 <strong>{solid.length}개</strong>
                  를 {word.base} 중간값과 하나씩 견주었습니다.{" "}
                  {withParticle(scope.slug, "이가")} 더 비싼 항목이{" "}
                  <strong>{above}개</strong>, 더 싼 항목이{" "}
                  <strong>{below}개</strong>
                  {even > 0 ? `, 비슷한 항목이 ${even}개` : ""}입니다.{" "}
                  {positionText(scope.slug, above, below)}
                </p>
                {note?.caution && (
                  <p>
                    <strong>다만</strong> — {note.caution}
                  </p>
                )}
              </>
            )}

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
                <p>
                  반대로 {word.base} 중간값보다 낮게 잡힌 항목입니다. 값이 낮다고
                  진료가 부실하다는 뜻은 아닙니다 — 그 {word.axis}에서 이 항목을
                  하는 기관의 구성이 다르다는 뜻으로 읽는 편이 맞습니다.
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

            {categoryRows.length > 0 && (
              <>
                <h2 id="category">분류별로 보면</h2>
                <p>
                  {scope.slug}에서 집계된 항목을 대분류로 묶었습니다. 항목 수가
                  많은 분류부터입니다. 가운데 값은 그 분류에 속한 항목들의
                  중간값을 다시 가운데로 놓은 것이라, 분류의 대체적인 무게를
                  보는 데 씁니다.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">분류</th>
                      <th scope="col">항목 수</th>
                      <th scope="col">가운데 값</th>
                      <th scope="col">가장 비싼 항목</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryRows.map((c) => (
                      <tr key={c.category}>
                        <th scope="row">{c.category}</th>
                        <td>{c.count}개</td>
                        <td>{formatWon(c.median)}</td>
                        <td>
                          {c.top ? (
                            <a target="_self" href={`/${c.top.item_slug}`}>
                              {itemLabel(c.top)} {formatWonShort(c.top.median_price)}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {groups.length > categoryRows.length && (
                  <p>
                    나머지 {groups.length - categoryRows.length}개 분류는 아래
                    전체 목록에서 볼 수 있습니다.
                  </p>
                )}
              </>
            )}

            <h2 id="why">값이 갈리는 이유</h2>
            <p>
              비급여는 건강보험 수가가 정해져 있지 않아 각 의료기관이 스스로
              값을 매깁니다. {word.axis}에 따라 값이 갈리는 데는 이런 이유가
              작용합니다.
            </p>
            <ul>
              {drivers.map((d) => (
                <li key={d.label}>
                  <strong>{d.label}</strong> — {d.text}
                </li>
              ))}
            </ul>
            <p>
              무엇이 비급여이고 왜 병원마다 다른지는{" "}
              <a target="_self" href="/비급여-뜻">
                비급여가 무슨 뜻인가
              </a>
              에 따로 정리했습니다.
            </p>

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
              <li>
                <strong>실제 병원 값은 따로 확인하세요.</strong>{" "}
                <a target="_self" href="/비급여-진료비-조회">
                  비급여 진료비 조회
                </a>
                에 심평원 조회와 병원 고지를 쓰는 법을 적어 두었습니다
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

/** 값이 있는 것만 모아 가운데 값을 고른다 */
function medianOf(values: Array<number | null>): number | null {
  const list = values
    .filter((v): v is number => v !== null && v > 0)
    .sort((a, b) => a - b);
  if (list.length === 0) return null;
  const mid = Math.floor(list.length / 2);
  return list.length % 2 === 1 ? list[mid] : Math.round((list[mid - 1] + list[mid]) / 2);
}

/**
 * "비싼 편인가"에 한 문장으로 답한다.
 *
 * 여기서 조심할 것은 **한쪽으로 몰아 말하지 않는 것**이다. 항목마다 방향이
 * 갈리는 것이 실제 모습이고, "○○는 비싸다"고 단정하면 자료가 말하지 않는
 * 것을 말하는 셈이 된다.
 */
function positionText(slug: string, above: number, below: number): string {
  const total = above + below;
  if (total === 0) return "";
  const share = above / total;
  if (share >= 0.65) {
    return `비싼 쪽으로 기운 항목이 더 많습니다. 다만 항목마다 방향이 다르므로 받으려는 항목을 직접 보는 편이 정확합니다.`;
  }
  if (share <= 0.35) {
    return `싼 쪽으로 기운 항목이 더 많습니다. 그렇다고 모든 항목이 낮은 것은 아니니 받으려는 항목을 직접 확인하세요.`;
  }
  return `양쪽이 비슷하게 갈립니다. ${withParticle(slug, "이가")} 전반적으로 비싸다거나 싸다고 한마디로 말하기 어렵다는 뜻입니다.`;
}

/**
 * 자주 묻는 질문.
 *
 * 27개 페이지가 같은 문장이 되지 않도록 답에 이 페이지의 숫자를 넣는다.
 */
function buildFaq({
  type,
  scope,
  word,
  pricier,
  cheaper,
  rows,
  groups,
  above,
  below,
}: {
  type: ScopeType;
  scope: Scope;
  word: { axis: string; base: string; other: string };
  pricier: Array<{ row: FeeRow; stat?: ItemStats; base: number }>;
  cheaper: Array<{ row: FeeRow; stat?: ItemStats; base: number }>;
  rows: FeeRow[];
  groups: Array<{ category: string; items: FeeRow[] }>;
  above: number;
  below: number;
}): Array<{ q: string; a: string }> {
  const top = pricier[0];
  const bottom = cheaper[0];

  return [
    {
      q: `${scope.name}의 비급여 진료비는 다른 곳보다 비싼가요?`,
      a: `항목마다 다릅니다. ${top ? `${withParticle(itemLabel(top.stat as ItemStats), "은는")} ${withParticle(scope.slug, "이가")} ${formatWon(top.row.median_price)}으로 ${word.base} 중간값 ${formatWon(top.base)}보다 높습니다.` : ""} ${bottom ? `반대로 ${withParticle(itemLabel(bottom.stat as ItemStats), "은는")} ${formatWon(bottom.row.median_price)}으로 더 낮습니다.` : ""} 폭넓게 집계된 항목만 놓고 보면 ${word.base}보다 비싼 항목이 ${above}개, 싼 항목이 ${below}개입니다. 그래서 ${withParticle(scope.slug, "이가")} 비싸다고 한 문장으로 말할 수는 없고, 받으려는 항목별로 봐야 합니다.`,
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
      a: `${DATA_YEAR}년 기준으로 ${rows.length}개 항목이 집계되어 있습니다. 항목 수가 많은 분류는 ${groups
        .slice(0, 5)
        .map((g) => `${g.category}(${g.items.length}개)`)
        .join(", ")} 순입니다. 다만 모든 기관이 모든 항목을 하는 것은 아니라 항목마다 집계된 범위가 다릅니다.`,
    },
    {
      q:
        type === "region"
          ? `${scope.slug}에서 더 싸게 받으려면 어떻게 해야 하나요?`
          : `${scope.name}보다 싼 곳이 있나요?`,
      a:
        type === "region"
          ? `같은 지역 안에서도 병원 종별에 따라 값이 갈립니다. 의원에서 할 수 있는 진료를 큰 병원에서 받으면 값이 올라가는 항목이 있고, 반대인 항목도 있습니다. 항목 페이지에서 종별 표를 함께 보시고, 실제 갈 병원의 값은 심사평가원 비급여 조회에서 확인하세요. 그리고 값을 묻기 전에 "이게 건강보험이 되는 진료인지"를 먼저 물으면 부담이 크게 줄어드는 경우가 있습니다.`
          : `항목에 따라 다릅니다. ${scope.name}에서 높게 잡히는 항목이 다른 종별에서는 낮은 경우가 있고 그 반대도 있습니다. 다만 종별 차이는 다루는 환자와 시술 구성의 차이를 함께 담고 있어서, 값만 보고 옮기기 어려운 항목도 있습니다. 항목 페이지의 종별 표에서 전체 10개 종별을 한 번에 견줄 수 있습니다.`,
    },
    {
      q: `이 자료는 언제 기준인가요?`,
      a: `건강보험심사평가원 「비급여진료비용및제증명수수료통계」의 ${DATA_YEAR}년 자료이고 통계표는 ${DATA_UPDATED}에 갱신되었습니다. ${scope.name}에서 ${rows.length}개 항목이 집계되었습니다. 의료기관이 값을 바꾸면 다음 공개 때 반영되므로, 실제 방문 전에는 해당 기관에 다시 확인하는 것이 정확합니다.`,
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
