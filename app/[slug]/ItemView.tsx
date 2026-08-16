import {
  averageByRegion,
  formatWon,
  listItemPrices,
  priceRatio,
  PRICE_BASE_YEARS,
  SCOPE_NOTE,
  withParticle,
  type ItemStats,
} from "@/lib/price-data";
import { ITEM_HUB_SLUG, OFFICIAL_LINKS } from "@/lib/menu";
import { REGION_HUB_SLUG } from "@/lib/regions";
import { breadcrumbJsonLd, datasetJsonLd, faqJsonLd, SITE } from "@/lib/seo";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/** 병원 표에 한 번에 보여줄 수. 싼 쪽·비싼 쪽을 양끝에서 보여준다. */
const EDGE = 10;

/**
 * 항목 상세 — 이 사이트의 주축 화면.
 *
 * 절대 금액이 아니라 **격차**를 앞세운다. "일반진단서 2천원 ~ 5만원, 25배"가
 * 이 페이지가 전하려는 사실이고, 그건 2015년 자료로도 유효하다.
 */
export default async function ItemView({ item }: { item: ItemStats }) {
  const rows = await listItemPrices(item.item_slug);
  const priced = rows.filter((r) => r.price_max !== null);
  const ratio = priceRatio(item);

  const cheapest = priced.slice(0, EDGE);
  const priciest = [...priced].reverse().slice(0, EDGE);
  const byRegion = averageByRegion(rows).slice(0, 20);

  const description = `${item.item_name} 비급여 가격은 병원에 따라 ${formatWon(item.min_price)}부터 ${formatWon(item.max_price)}까지 차이가 납니다${ratio ? ` (최대 ${ratio}배)` : ""}. 병원급 이상 ${item.hospital_count}곳 기준, ${PRICE_BASE_YEARS} 자료.`;

  const faq = [
    {
      q: `${item.item_name} 비용은 얼마인가요?`,
      a: `하나로 답할 수 없습니다. 비급여는 건강보험이 적용되지 않아 병원이 스스로 가격을 정하기 때문입니다. 공개 자료를 보면 ${formatWon(item.min_price)}부터 ${formatWon(item.max_price)}까지${ratio ? ` 최대 ${ratio}배` : ""} 차이가 났습니다. 중간값은 ${formatWon(item.median_price)}입니다.`,
    },
    {
      q: "왜 병원마다 이렇게 다른가요?",
      a: "비급여 항목은 건강보험 수가가 정해져 있지 않아 각 병원이 자율적으로 가격을 책정합니다. 병원 종별, 지역, 포함 범위에 따라 달라지며, 이 차이는 제도 구조에서 나오는 것이라 지금도 마찬가지입니다.",
    },
    {
      q: "이 금액이 지금 가격인가요?",
      a: `아닙니다. 여기 수치는 ${PRICE_BASE_YEARS} 기준 공개 자료입니다. 현재 가격은 건강보험심사평가원 조회 서비스나 해당 병원에 직접 확인하셔야 합니다. 이 페이지는 금액 자체보다 병원 간 격차의 크기를 보여주기 위한 것입니다.`,
    },
  ];

  const crumbs = breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "항목별", path: `/${ITEM_HUB_SLUG}` },
    { name: item.item_name, path: `/${item.item_slug}` },
  ]);

  return (
    <div className="single-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetJsonLd({
              name: `${item.item_name} 비급여 진료비`,
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
            <span>{item.item_category}</span>
          </nav>

          <header className="entry-header">
            <h1 className="entry-title">
              {item.item_name} 가격, 병원마다 얼마나 다를까
            </h1>
            <div className="entry-header__bottom">
              <div className="entry-meta">
                <span>{SITE.name}</span>
                <span className="entry-meta__sep" />
                <span>{PRICE_BASE_YEARS} 기준</span>
              </div>
              <span className="entry-cat cat-badge cat-badge--region">
                {item.item_category}
              </span>
            </div>
          </header>

          <div className="entry-content">
            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.top} />
            </div>

            <p className="entry-lead">
              {withParticle(item.item_name, "은는")} 건강보험이 적용되지 않는 비급여 항목이라
              병원이 가격을 스스로 정합니다. 공개 자료에 들어 있는{" "}
              {item.hospital_count}곳을 보면{" "}
              <strong>
                {formatWon(item.min_price)}부터 {formatWon(item.max_price)}
              </strong>
              까지{ratio ? ` 최대 ${ratio}배` : ""} 벌어집니다.
            </p>

            <div className="cta-row">
              <a
                className="cta-btn"
                href={OFFICIAL_LINKS.hira}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                🔎 현재 가격 조회하기 (심평원)
              </a>
              <a
                className="cta-btn cta-btn--ghost"
                href={`/${ITEM_HUB_SLUG}`}
                target="_self"
              >
                📋 다른 항목 보기
              </a>
              <p className="cta-row__note">
                이 페이지의 금액은 {PRICE_BASE_YEARS} 기준입니다. 현재 가격은
                심평원 조회나 병원 문의로 확인하세요.
              </p>
            </div>

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.middle} />
            </div>

            <h2 id="summary">한눈에 보기</h2>
            <table>
              <tbody>
                <tr>
                  <th scope="row">항목</th>
                  <td>
                    {item.item_name}
                    {item.item_category !== item.item_name &&
                      ` (${item.item_category})`}
                  </td>
                </tr>
                <tr>
                  <th scope="row">가장 싼 곳</th>
                  <td>{formatWon(item.min_price)}</td>
                </tr>
                <tr>
                  <th scope="row">중간값</th>
                  <td>{formatWon(item.median_price)}</td>
                </tr>
                <tr>
                  <th scope="row">가장 비싼 곳</th>
                  <td>{formatWon(item.max_price)}</td>
                </tr>
                <tr>
                  <th scope="row">최고 ÷ 최저</th>
                  <td>{ratio ? `${ratio}배` : "-"}</td>
                </tr>
                <tr>
                  <th scope="row">자료 범위</th>
                  <td>
                    병원 {item.hospital_count}곳 · {item.region_count}개 지역 ·{" "}
                    {PRICE_BASE_YEARS}
                  </td>
                </tr>
              </tbody>
            </table>

            <h2 id="why">왜 이렇게 차이가 날까</h2>

            <div className="ad-slot">
              <Adsense slotId={AD_SLOTS.bottom} />
            </div>

            <p>
              비급여는 건강보험이 적용되지 않는 항목입니다. 급여 항목은 나라가
              수가를 정해두지만, 비급여는{" "}
              <strong>각 병원이 스스로 가격을 매깁니다.</strong> 그래서 같은
              이름의 진료·서류인데도 금액이 몇 배씩 벌어집니다.
            </p>
            <ul>
              <li>
                <strong>병원 종별</strong> — 상급종합병원과 병원급은 원가 구조가
                다릅니다
              </li>
              <li>
                <strong>지역</strong> — 임대료와 인건비가 가격에 반영됩니다
              </li>
              <li>
                <strong>포함 범위</strong> — 같은 이름이어도 무엇까지 포함하는지
                병원마다 다를 수 있습니다
              </li>
            </ul>
            <p>
              <strong>가격 차이가 곧 품질 차이는 아닙니다.</strong> 비싸다고 더
              좋은 것도, 싸다고 부실한 것도 아닙니다. 다만 미리 물어보지 않으면
              생각보다 많이 나올 수 있다는 뜻입니다.
            </p>

            {cheapest.length > 0 && (
              <>
                <h2 id="cheap">가장 저렴한 병원</h2>
                <p>
                  공개 자료 기준으로 이 항목의 금액이 낮은 순서입니다.{" "}
                  {PRICE_BASE_YEARS} 자료이므로 현재는 달라졌을 수 있습니다.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">병원</th>
                      <th scope="col">종별</th>
                      <th scope="col">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cheapest.map((r) => (
                      <tr key={r.id}>
                        <th scope="row">{r.hospital}</th>
                        <td>{r.cl_name ?? "-"}</td>
                        <td>{formatWon(r.price_max)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {priciest.length > 0 && (
              <>
                <h2 id="expensive">가장 비싼 병원</h2>
                <p>
                  같은 항목인데 위 표의 몇 배입니다. 이 격차가 이 페이지가
                  전하려는 것입니다.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">병원</th>
                      <th scope="col">종별</th>
                      <th scope="col">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priciest.map((r) => (
                      <tr key={r.id}>
                        <th scope="row">{r.hospital}</th>
                        <td>{r.cl_name ?? "-"}</td>
                        <td>{formatWon(r.price_max)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {byRegion.length > 0 && (
              <>
                <h2 id="region">지역별 평균</h2>
                <p>
                  표본이 3곳 이상인 지역만 넣었습니다. 지역 이름을 누르면 그
                  지역의 다른 비급여 항목도 볼 수 있습니다.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">지역</th>
                      <th scope="col">평균</th>
                      <th scope="col">최저~최고</th>
                      <th scope="col">병원</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byRegion.map((r) => (
                      <tr key={r.regionSlug}>
                        <th scope="row">
                          <a target="_self" href={`/${r.regionSlug}`}>
                            {r.regionName}
                          </a>
                        </th>
                        <td>{formatWon(r.avg)}</td>
                        <td>
                          {formatWon(r.min)} ~ {formatWon(r.max)}
                        </td>
                        <td>{r.count}곳</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>
                  <a target="_self" href={`/${REGION_HUB_SLUG}`}>
                    지역별로 전체 보기
                  </a>
                </p>
              </>
            )}

            <h2 id="check">병원에 가기 전에</h2>
            <p>
              비급여는 미리 물어보면 대부분 알려줍니다. 나중에 놀라지 않으려면
              아래 세 가지를 확인하세요.
            </p>
            <ol>
              <li>
                <strong>이 항목이 비급여인지 먼저 확인</strong> — 같은 진료라도
                조건에 따라 급여가 되기도 합니다
              </li>
              <li>
                <strong>총액을 묻기</strong> — 검사료 외에 판독료·재료비가 따로
                붙는 경우가 있습니다
              </li>
              <li>
                <strong>
                  <a
                    href={OFFICIAL_LINKS.hira}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    심평원에서 현재 가격 조회
                  </a>
                </strong>{" "}
                — 자료 범위는 {SCOPE_NOTE}입니다
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
            <span>출처: 건강보험심사평가원 비급여진료비정보</span>
            <span>{PRICE_BASE_YEARS} 기준</span>
          </footer>
        </div>
      </article>

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.bottom} />
      </div>
    </div>
  );
}
