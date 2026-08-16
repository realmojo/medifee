import {
  listItemPrices,
  priceRatio,
  ratioText,
  relativeBy,
  relativeByRegion,
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

/**
 * 항목 상세 — 이 사이트의 주축 화면.
 *
 * **원 단위 금액을 한 글자도 싣지 않는다.** 원본 가격이 2015~2016년 것이라
 * 절대 금액은 이미 틀렸기 때문이다. 대신 배수와 상대 순서만 보여준다.
 * 그건 시간이 지나도 크게 뒤집히지 않는다.
 */
export default async function ItemView({ item }: { item: ItemStats }) {
  const rows = await listItemPrices(item.item_slug);
  const ratio = priceRatio(item);

  const byClass = relativeBy(rows, (r) => r.cl_name, 3);
  const byRegion = relativeByRegion(rows, 3);
  const topRegions = byRegion.slice(0, 10);
  const bottomRegions = [...byRegion].reverse().slice(0, 10);

  const description = `${item.item_name}은 병원에 따라 ${ratioText(ratio)}까지 차이가 납니다. 어떤 종별·지역이 상대적으로 비싼지 정리했습니다. 병원급 이상 ${item.hospital_count}곳 기준.`;

  const faq = [
    {
      q: `${item.item_name} 비용은 얼마인가요?`,
      a: `이 사이트는 금액을 알려드리지 않습니다. 참고할 수 있는 공개 자료가 ${PRICE_BASE_YEARS} 기준이라 지금 가격과 다르기 때문입니다. 대신 말씀드릴 수 있는 것은, 같은 ${item.item_name}인데 병원에 따라 ${ratioText(ratio)}까지 벌어진다는 사실입니다. 현재 금액은 건강보험심사평가원 조회나 해당 병원 문의로 확인하세요.`,
    },
    {
      q: "왜 병원마다 이렇게 다른가요?",
      a: "비급여 항목은 건강보험 수가가 정해져 있지 않아 각 병원이 자율적으로 가격을 책정합니다. 병원 종별, 지역, 포함 범위에 따라 달라지며, 이 차이는 제도 구조에서 나오는 것이라 지금도 마찬가지입니다.",
    },
    {
      q: "그럼 이 페이지는 무엇에 쓰나요?",
      a: `병원에 가기 전에 "이건 병원마다 크게 다를 수 있는 항목"이라는 것을 아는 데 씁니다. ${item.item_name}처럼 ${ratioText(ratio)}까지 벌어지는 항목은 미리 물어보지 않으면 청구서를 받고 놀라게 됩니다.`,
    },
  ];

  return (
    <div className="single-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "홈", path: "/" },
              { name: "항목별", path: `/${ITEM_HUB_SLUG}` },
              { name: item.item_name, path: `/${item.item_slug}` },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetJsonLd({
              name: `${item.item_name} 병원 간 가격 차이`,
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
              {item.item_name}, 병원마다 {ratioText(ratio)} 차이 납니다
            </h1>
            <div className="entry-header__bottom">
              <div className="entry-meta">
                <span>{SITE.name}</span>
                <span className="entry-meta__sep" />
                <span>금액 대신 차이</span>
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
              {withParticle(item.item_name, "은는")} 건강보험이 적용되지 않는
              비급여 항목이라 병원이 가격을 스스로 정합니다. 공개 자료에 들어
              있는 {item.hospital_count}곳을 견주면 가장 싼 곳과 가장 비싼 곳이{" "}
              <strong>{ratioText(ratio)}</strong>까지 벌어집니다.
            </p>

            <div className="cta-row">
              <a
                className="cta-btn"
                href={OFFICIAL_LINKS.hira}
                target="_blank"
                rel="nofollow noopener noreferrer"
              >
                🔎 실제 금액 조회하기 (심평원)
              </a>
              <a
                className="cta-btn cta-btn--ghost"
                href={`/${ITEM_HUB_SLUG}`}
                target="_self"
              >
                📋 다른 항목 보기
              </a>
              <p className="cta-row__note">
                이 사이트는 금액을 싣지 않습니다. 참고할 수 있는 공개 자료가{" "}
                {PRICE_BASE_YEARS} 기준이라 이미 맞지 않기 때문입니다.
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
                  <th scope="row">병원 간 차이</th>
                  <td>
                    <strong>{ratioText(ratio)}</strong>
                  </td>
                </tr>
                <tr>
                  <th scope="row">집계 병원</th>
                  <td>{item.hospital_count}곳</td>
                </tr>
                <tr>
                  <th scope="row">집계 지역</th>
                  <td>{item.region_count}개 시군구</td>
                </tr>
                <tr>
                  <th scope="row">자료 범위</th>
                  <td>{SCOPE_NOTE}</td>
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

            {byClass.length > 0 && (
              <>
                <h2 id="class">병원 종별로 보면</h2>
                <p>
                  전체 평균을 100으로 놓았을 때 종별이 어느 쪽에 있는지입니다.
                  숫자는 <strong>상대적인 위치</strong>이고 금액이 아닙니다.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">종별</th>
                      <th scope="col">전체 평균 대비</th>
                      <th scope="col">집계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byClass.map((r) => (
                      <tr key={r.label}>
                        <th scope="row">{r.label}</th>
                        <td>
                          <span
                            className={`rel rel--${r.sign}`}
                          >
                            {r.diff}
                          </span>
                        </td>
                        <td>{r.count}곳</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {topRegions.length > 0 && (
              <>
                <h2 id="region">상대적으로 비싼 지역</h2>
                <p>
                  전국 평균 대비 높은 순서입니다. 표본이 3곳 이상인 지역만
                  넣었습니다. 지역 이름을 누르면 그 지역의 다른 항목도 볼 수
                  있습니다.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">지역</th>
                      <th scope="col">전국 평균 대비</th>
                      <th scope="col">집계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRegions.map((r) => (
                      <tr key={r.regionSlug}>
                        <th scope="row">
                          <a target="_self" href={`/${r.regionSlug}`}>
                            {r.label}
                          </a>
                        </th>
                        <td>
                          <span className={`rel rel--${r.sign}`}>{r.diff}</span>
                        </td>
                        <td>{r.count}곳</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {bottomRegions.length > 0 && (
              <>
                <h2 id="cheap-region">상대적으로 싼 지역</h2>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">지역</th>
                      <th scope="col">전국 평균 대비</th>
                      <th scope="col">집계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bottomRegions.map((r) => (
                      <tr key={r.regionSlug}>
                        <th scope="row">
                          <a target="_self" href={`/${r.regionSlug}`}>
                            {r.label}
                          </a>
                        </th>
                        <td>
                          <span className={`rel rel--${r.sign}`}>{r.diff}</span>
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
                    심평원에서 현재 금액 조회
                  </a>
                </strong>{" "}
                — 이 사이트가 금액을 싣지 않는 대신 여기로 넘깁니다
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
            <span>금액은 싣지 않습니다</span>
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
