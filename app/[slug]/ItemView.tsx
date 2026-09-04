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
import { cadenceWord, itemNote, type ItemNote } from "@/lib/item-notes";
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
 *
 * ────────────────────────────────────────────────────────────────────────
 *  글이 답해야 하는 것
 * ────────────────────────────────────────────────────────────────────────
 * 사람들이 치는 말은 "도수치료 비용" 하나가 아니다. "도수치료란", "도수치료
 * 실비", "도수치료 몇 회", "도수치료 병원마다 다른 이유"로 갈라진다. 표는
 * 그중 첫 번째에만 답한다. 그래서 lib/item-notes.ts 의 해설을 끌어와
 * **무엇인가 · 값이 왜 갈리나 · 보험은 · 물어볼 것**을 함께 싣는다.
 * 나머지는 이 페이지의 숫자로 직접 만든다 — 총액, 편차, 같은 분류 비교.
 */
export default async function ItemView({ item }: { item: ItemStats }) {
  const [rows, allItems] = await Promise.all([
    listItemFees(item.item_slug),
    listItems(),
  ]);

  const label = itemLabel(item);
  const ratio = priceRatio(item);
  const noun = itemNoun(item);
  const note = itemNote(item);
  const unit = cadenceWord(note);

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

  const regionSpread = spread(regions);
  const classSpread = spread(classes);

  const siblings = siblingItems(allItems, item);
  const compareRows = siblings.slice(0, 8);

  const projection = buildProjection(item, note);

  const description = `${label} 중간값은 ${formatWon(item.median_price)}입니다. ${DATA_YEAR}년 심사평가원 자료로 시도 ${item.scope_count}곳과 병원 종별 ${item.class_count}곳의 금액을 정리했습니다.`;

  const faq = buildFaq({
    item,
    label,
    noun,
    note,
    ratio,
    priciestClass,
    cheapestClass,
    priciestRegion,
    cheapestRegion,
    projection,
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
              keywords: [label, item.category, "비급여 진료비", "중간값"],
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
              {withParticle(noun, "이라")} 병원이 값을 스스로 정합니다. {DATA_YEAR}년 기준 전국
              중간값은 <strong>{formatWon(item.median_price)}</strong>
              {unit ? `(${unit})` : ""}이고, 집계된 최저와 최고는{" "}
              {formatWon(item.min_price)}과 {formatWon(item.max_price)}
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

            {/* 이 글이 무엇에 답하는지 먼저 보여준다. 사람은 훑고 검색엔진은 읽는다 */}
            <nav className="toc" aria-label="이 글의 차례">
              <p className="toc__title">이 글에서 확인할 수 있는 것</p>
              <ul className="toc__list">
                <li>
                  <a href="#what">{withParticle(label, "은는")} 어떤 {noun}인가</a>
                </li>
                <li>
                  <a href="#summary">{DATA_YEAR}년 기준 금액 — 중간값·평균·범위</a>
                </li>
                {classes.length > 0 && (
                  <li>
                    <a href="#class">병원 종별 금액 {classes.length}곳 비교</a>
                  </li>
                )}
                {regions.length > 0 && (
                  <li>
                    <a href="#region">지역별 금액 {regions.length}곳 비교</a>
                  </li>
                )}
                <li>
                  <a href="#why">값이 갈리는 이유</a>
                </li>
                <li>
                  <a href="#insurance">실손보험은 어떻게 되나</a>
                </li>
                <li>
                  <a href="#check">받기 전에 물어볼 것</a>
                </li>
              </ul>
            </nav>

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.middle} />
            </div>

            <h2 id="what">{withParticle(label, "은는")} 어떤 {noun}인가</h2>
            {note.what.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {note.aka && note.aka.length > 0 && (
              <p className="entry-aka">
                <strong>이렇게도 찾습니다</strong> — {note.aka.join(" · ")}
              </p>
            )}

            <h2 id="summary">{label}, 얼마나 하나</h2>
            <p>
              전국을 한데 모은 값입니다. <strong>중간값</strong>이 실제 부담에
              가장 가깝습니다. 최저·최고는 한 곳만 있어도 잡히기 때문에 그
              값으로 예산을 잡으면 어긋납니다.
              {unit ? ` 아래 금액은 ${unit} 기준입니다.` : ""}
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
                    {unit ? ` (${unit})` : ""}
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
            <p>
              평균({formatWon(item.avg_price)})과 중간값(
              {formatWon(item.median_price)})이 {gapWord(item)}. 평균은 유난히
              높은 한두 곳에 끌려가기 때문에, 예산은 중간값으로 잡고 최고값은
              &ldquo;이만큼까지 나올 수도 있다&rdquo;는 상한으로 보는 편이
              어긋나지 않습니다.
            </p>

            {projection && (
              <>
                <h2 id="total">{projection.title}</h2>
                <p>{projection.lead}</p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">{projection.head}</th>
                      <th scope="col">중간값 기준</th>
                      <th scope="col">집계 최저 기준</th>
                      <th scope="col">집계 최고 기준</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.rows.map((r) => (
                      <tr key={r.count}>
                        <th scope="row">{r.countLabel}</th>
                        <td>
                          <strong>{formatWon(r.median)}</strong>
                        </td>
                        <td>{formatWon(r.min)}</td>
                        <td>{formatWon(r.max)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>
                  단순히 곱한 값입니다. 실제로는 횟수가 늘면 단가를 낮추는 곳도
                  있고, 검사·재료가 따로 붙어 더 나오는 곳도 있습니다.{" "}
                  <strong>몇 번을 예정하는지</strong>를 처음에 물어보면 총액이
                  먼저 보입니다.
                </p>
              </>
            )}

            {classes.length > 0 && (
              <>
                <h2 id="class">어느 병원에서 받느냐가 절반입니다</h2>
                <p>
                  같은 {withParticle(noun, "이라")}도 병원 종별에 따라 값이 갈립니다. 아래는 종별로
                  묶은 중간값입니다.
                  {priciestClass && cheapestClass && priciestClass !== cheapestClass && (
                    <>
                      {" "}
                      가장 높은 곳은 <strong>{priciestClass.scope}</strong>(
                      {formatWon(priciestClass.median_price)}), 가장 낮은 곳은{" "}
                      <strong>{cheapestClass.scope}</strong>(
                      {formatWon(cheapestClass.median_price)})입니다.
                      {classSpread && classSpread > 1.05 && (
                        <>
                          {" "}
                          종별 사이가 <strong>{ratioText(classSpread)}</strong>{" "}
                          벌어집니다.
                        </>
                      )}
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
                  {regions.length}개 시도의 중간값입니다. 전국 중간값(
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
                  {aboveBelowText(regions, regionBase)}{" "}
                  <a target="_self" href={`/${REGION_HUB_SLUG}`}>
                    지역별로 전체 항목 보기
                  </a>
                </p>
              </>
            )}

            {regionSpread && classSpread && (
              <>
                <h2 id="axis">지역 차이와 종별 차이, 어느 쪽이 큰가</h2>
                <p>
                  {withParticle(label, "은는")} 지역 사이가{" "}
                  <strong>{ratioText(regionSpread)}</strong>, 병원 종별 사이가{" "}
                  <strong>{ratioText(classSpread)}</strong> 벌어집니다.{" "}
                  {axisText(label, regionSpread, classSpread)}
                </p>
              </>
            )}

            <h2 id="why">왜 이렇게 벌어지나</h2>
            <p>
              비급여는 건강보험이 적용되지 않는 항목입니다. 급여 항목은 나라가
              수가를 정해두지만, 비급여는{" "}
              <strong>각 병원이 스스로 가격을 매깁니다.</strong> 그래서 같은
              이름의 진료·서류인데도 금액이 몇 배씩 벌어집니다.{" "}
              {withParticle(label, "이가")} 갈리는 이유는 이렇습니다.
            </p>
            <ul>
              {note.drivers.map((d) => (
                <li key={d.label}>
                  <strong>{d.label}</strong> — {d.text}
                </li>
              ))}
            </ul>
            <p>
              <strong>가격 차이가 곧 품질 차이는 아닙니다.</strong> 비싸다고 더
              좋은 것도, 싸다고 부실한 것도 아닙니다. 다만 미리 묻지 않으면
              생각보다 많이 나올 수 있다는 뜻입니다.{" "}
              <a target="_self" href="/비급여-뜻">
                비급여가 무슨 뜻인지
              </a>
              부터 정리해 두었습니다.
            </p>

            <h2 id="insurance">실손보험은 어떻게 되나</h2>
            <p>{note.insurance}</p>
            <p>
              청구에 필요한 서류와 자주 거절되는 경우는{" "}
              <a target="_self" href="/비급여-실비보험-청구">
                비급여 실비 청구
              </a>
              에 따로 정리했습니다. 이미 낸 병원비를 돌려받는 다른 길 —
              본인부담상한제와 진료비 확인요청 — 은{" "}
              <a target="_self" href="/병원비-환급금-조회">
                병원비 환급금 조회
              </a>
              에 있습니다.
            </p>

            <h2 id="check">받기 전에 물어볼 것</h2>
            <ol>
              <li>
                <strong>이게 비급여가 맞는지</strong> — 같은 진료라도 조건에
                따라 건강보험이 적용되기도 합니다. 적용되면 부담이 크게
                줄어듭니다
              </li>
              {note.ask.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
              <li>
                <strong>총액이 얼마인지</strong> — 시술료 외에 재료비·판독료가
                따로 붙는 경우가 있습니다. &ldquo;오늘 다 해서 얼마
                나오나요&rdquo;로 물으세요
              </li>
              <li>
                <strong>병원별 가격은 어디서 보는지</strong> —{" "}
                <a target="_self" href="/비급여-진료비-조회">
                  비급여 진료비 조회
                </a>
                에서 심사평가원 조회와 병원 고지를 어떻게 쓰는지 정리했습니다
              </li>
            </ol>

            {compareRows.length > 0 && (
              <>
                <h2 id="compare">{item.category}의 다른 항목과 견주면</h2>
                <p>
                  같은 분류에 묶인 항목입니다. {withParticle(label, "이가")}{" "}
                  이 분류 안에서 어디쯤인지 보면 값이 특별히 높은 편인지
                  아닌지를 가늠할 수 있습니다.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">항목</th>
                      <th scope="col">중간값</th>
                      <th scope="col">{label} 대비</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">{label} (이 글)</th>
                      <td>
                        <strong>{formatWon(item.median_price)}</strong>
                      </td>
                      <td>
                        <span className="rel rel--flat">기준</span>
                      </td>
                    </tr>
                    {compareRows.map((s) => (
                      <tr key={s.item_slug}>
                        <th scope="row">
                          <a target="_self" href={`/${s.item_slug}`}>
                            {itemLabel(s)}
                          </a>
                        </th>
                        <td>{formatWon(s.median_price)}</td>
                        <td>{diffCell(s.median_price, item.median_price ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

/**
 * 한 축 안에서 가장 높은 중간값 ÷ 가장 낮은 중간값.
 *
 * 항목의 최고÷최저(priceRatio)와 다른 값이다. 그쪽은 병원 하나만 튀어도 잡히지만
 * 이쪽은 지역·종별로 이미 묶인 중간값끼리 견주는 것이라 훨씬 덜 튄다.
 * 두 축의 값을 나란히 놓으면 "어디서 받느냐"와 "어느 지역이냐" 중
 * 무엇이 더 크게 작용하는지 말할 수 있다.
 */
function spread(rows: FeeRow[]): number | null {
  const values = rows
    .map((r) => r.median_price)
    .filter((v): v is number => v !== null && v > 0);
  if (values.length < 2) return null;
  const r = Math.max(...values) / Math.min(...values);
  if (!Number.isFinite(r) || r < 1) return null;
  return r >= 10 ? Math.round(r) : Math.round(r * 10) / 10;
}

/** 두 축의 편차를 견줘 한 문장으로 말한다 */
function axisText(label: string, region: number, cls: number): string {
  if (cls >= region * 1.3) {
    return `어느 지역이냐보다 어느 종별에서 받느냐가 더 크게 작용합니다. 같은 동네 안에서도 의원과 병원의 값이 갈린다는 뜻이라, 지역을 옮기는 것보다 종별을 견주는 편이 실속 있습니다.`;
  }
  if (region >= cls * 1.3) {
    return `종별보다 지역에 따라 더 갈립니다. ${label} 같은 항목은 어느 병원 급이냐보다 어디에서 받느냐가 값을 좌우한다는 뜻입니다.`;
  }
  return `두 축이 비슷하게 작용합니다. 지역과 종별 어느 한쪽만 보고 판단하기 어렵다는 뜻이라, 실제로 갈 병원의 값을 심사평가원에서 직접 확인하는 편이 낫습니다.`;
}

/** 전국 기준보다 높은 지역이 몇 곳인지 세어 한 문장으로 */
function aboveBelowText(rows: FeeRow[], base: number): string {
  if (!base) return "";
  const values = rows
    .map((r) => r.median_price)
    .filter((v): v is number => v !== null);
  if (values.length === 0) return "";
  const above = values.filter((v) => v > base).length;
  const below = values.filter((v) => v < base).length;
  return `전국 중간값보다 높은 지역이 ${above}곳, 낮은 지역이 ${below}곳입니다.`;
}

/** 평균과 중간값의 관계를 말로 */
function gapWord(item: ItemStats): string {
  const avg = item.avg_price;
  const med = item.median_price;
  if (!avg || !med) return "함께 적혀 있습니다";
  const diff = (avg - med) / med;
  if (diff > 0.15) return "제법 벌어져 있습니다 — 평균이 중간값보다 높습니다";
  if (diff < -0.15) return "제법 벌어져 있습니다 — 평균이 중간값보다 낮습니다";
  return "크게 다르지 않습니다";
}

function diffCell(value: number | null, base: number) {
  if (value === null || !base) return <span>-</span>;
  return (
    <span className={`rel rel--${relativeSign(value, base)}`}>
      {relative(value, base)}
    </span>
  );
}

/* ------------------------------ 총액 계산 ------------------------------ */

interface Projection {
  title: string;
  lead: string;
  head: string;
  rows: Array<{
    count: number;
    countLabel: string;
    median: number;
    min: number;
    max: number;
  }>;
}

/**
 * 회당·하루당 값을 곱해 총액을 미리 보여준다.
 *
 * 도수치료 회당 10만원은 그 자체로 부담이 아니다. 10회를 받으면 100만원이
 * 되는 것이 부담이다. 표에 회당 금액만 적어두면 그 계산을 각자 머릿속에서
 * 해야 하는데, 대부분은 하지 않는다.
 *
 * **곱셈일 뿐이라는 것을 본문에서 밝힌다.** 병원이 실제로 그렇게 받는다는
 * 뜻이 아니다.
 */
function buildProjection(item: ItemStats, note: ItemNote): Projection | null {
  const median = item.median_price;
  if (!median) return null;
  if (note.cadence !== "session" && note.cadence !== "day") return null;

  const counts = note.cadence === "session" ? [1, 5, 10] : [1, 3, 7];
  const word = note.cadence === "session" ? "회" : "일";

  return {
    title: note.cadence === "session" ? "몇 회를 받으면 얼마가 되나" : "며칠을 쓰면 얼마가 되나",
    lead:
      note.cadence === "session"
        ? "한 번으로 끝나는 경우가 드문 항목입니다. 회당 금액에 예정 횟수를 곱하면 실제로 나갈 돈이 보입니다."
        : "하루치 금액입니다. 입원 일수를 곱해야 실제 부담이 나옵니다.",
    head: note.cadence === "session" ? "횟수" : "일수",
    rows: counts.map((n) => ({
      count: n,
      countLabel: `${n}${word}`,
      median: median * n,
      min: (item.min_price ?? 0) * n,
      max: (item.max_price ?? 0) * n,
    })),
  };
}

/* -------------------------------- FAQ -------------------------------- */

/**
 * 자주 묻는 질문.
 *
 * 항목마다 값이 달라지므로 문장에 실제 숫자를 넣는다. 668개가 같은 문장이면
 * 검색엔진이 중복으로 본다. 질문도 항목의 성격에 따라 갈아 끼운다 —
 * 회차가 있는 치료에는 "몇 회"를, 서류에는 "몇 통"을 묻는 사람이 많다.
 */
function buildFaq({
  item,
  label,
  noun,
  note,
  ratio,
  priciestClass,
  cheapestClass,
  priciestRegion,
  cheapestRegion,
  projection,
}: {
  item: ItemStats;
  label: string;
  noun: string;
  note: ItemNote;
  ratio: number | null;
  priciestClass: FeeRow | null;
  cheapestClass: FeeRow | null;
  priciestRegion: FeeRow | null;
  cheapestRegion: FeeRow | null;
  projection: Projection | null;
}): Array<{ q: string; a: string }> {
  const median = formatWon(item.median_price);
  const out: Array<{ q: string; a: string }> = [];

  out.push({
    q: `${label} 비용은 얼마인가요?`,
    a: `${DATA_YEAR}년 건강보험심사평가원 자료 기준으로 전국 중간값은 ${median}입니다. 집계된 범위는 ${formatWon(item.min_price)}부터 ${formatWon(item.max_price)}까지${ratio ? `로, 최고가 최저의 ${ratioText(ratio)}입니다` : "입니다"}. 다만 이 값은 지역·종별로 묶은 집계값이라 특정 병원의 가격이 아닙니다. 최저와 최고는 한 곳만 있어도 잡히는 값이므로 중간값을 기준으로 보시는 편이 실제에 가깝습니다.`,
  });

  out.push(
    priciestClass && cheapestClass && priciestClass !== cheapestClass
      ? {
          q: `${withParticle(label, "은는")} 어디가 더 비싼가요?`,
          a: `병원 종별로 보면 ${priciestClass.scope}의 중간값이 ${formatWon(priciestClass.median_price)}으로 가장 높고, ${cheapestClass.scope}이 ${formatWon(cheapestClass.median_price)}으로 가장 낮습니다. 지역별로는 ${priciestRegion ? `${withParticle(priciestRegion.scope, "이가")} ${formatWon(priciestRegion.median_price)}으로 가장 높고 ${cheapestRegion ? `${withParticle(cheapestRegion.scope, "이가")} ${formatWon(cheapestRegion.median_price)}으로 가장 낮습니다` : "지역마다 다릅니다"}` : "지역마다 다릅니다"}. 다만 종별 차이는 진료 내용과 장비 차이를 함께 반영하므로 단순 비교는 조심해야 합니다.`,
        }
      : {
          q: `${label} 가격이 병원마다 다른가요?`,
          a: `다릅니다. 비급여는 건강보험 수가가 정해져 있지 않아 각 병원이 스스로 값을 매깁니다. 이 자료에서도 집계된 최저 ${formatWon(item.min_price)}와 최고 ${formatWon(item.max_price)} 사이가 크게 벌어져 있습니다.`,
        },
  );

  out.push({
    q: `${withParticle(
      `${label}${item.fee_kind === "certificate" ? " 발급비" : ""}`,
      "은는",
    )} 실비보험이 되나요?`,
    a: note.insurance,
  });

  if (projection) {
    const last = projection.rows[projection.rows.length - 1];
    out.push({
      q:
        note.cadence === "session"
          ? `${withParticle(label, "은는")} 몇 회를 받아야 하나요?`
          : `${withParticle(label, "은는")} 하루에 얼마인가요?`,
      a:
        note.cadence === "session"
          ? `필요한 횟수는 상태에 따라 다르므로 진료한 의사가 정합니다. 이 자료로 말할 수 있는 것은 총액입니다 — 중간값 ${median} 기준으로 ${last.countLabel}이면 ${formatWon(last.median)}이 됩니다. 회당 금액이 낮아 보여도 횟수가 붙으면 총액이 달라지므로, 처음에 몇 회를 예정하는지 함께 물어보세요.`
          : `여기 실린 ${median}은 하루치 금액입니다. ${last.countLabel}을 쓰면 중간값 기준으로 ${formatWon(last.median)}이 됩니다. 입원 일수는 미리 정해지지 않는 경우가 많으니 하루 얼마인지와 함께 며칠을 예상하는지 물어보는 편이 좋습니다.`,
    });
  }

  out.push({
    q: `${label} 값에는 무엇이 포함되나요?`,
    a: `병원마다 다릅니다. 같은 이름의 ${noun}이어도 어디까지 포함하는지가 달라서, ${note.drivers
      .slice(0, 2)
      .map((d) => d.label)
      .join("·")} 같은 요소에 따라 금액이 갈립니다. ${item.fee_kind === "certificate" ? "여러 통이 필요하면 사본 수수료가 따로 붙는지" : "재료비나 판독료가 따로 붙는지"} 미리 확인하고, “오늘 다 해서 얼마 나오나요”로 총액을 묻는 것이 가장 확실합니다.`,
  });

  out.push({
    q: `우리 동네 병원의 ${label} 가격은 어디서 보나요?`,
    a: `이 사이트의 값은 시도와 병원 종별로 묶은 집계값이라 병원 하나하나의 가격이 아닙니다. 병원별 비급여 가격은 건강보험심사평가원 누리집의 비급여 진료비 조회에서 볼 수 있고, 의료기관은 접수창구나 누리집에 비급여 가격을 고지하게 되어 있습니다. 방법은 비급여 진료비 조회 글에 정리해 두었습니다.`,
  });

  out.push({
    q: `${label} 자료는 언제 기준인가요?`,
    a: `건강보험심사평가원이 공개한 「비급여진료비용및제증명수수료통계」의 ${DATA_YEAR}년 자료이며, 통계표는 ${DATA_UPDATED}에 갱신되었습니다. 시도 ${item.scope_count}곳과 병원 종별 ${item.class_count}종에서 ${label} 금액이 집계되었습니다. 병원이 값을 바꾸면 다음 공개 때 반영되므로, 실제 방문 전에는 해당 병원에 다시 확인하는 것이 정확합니다.`,
  });

  return out;
}
