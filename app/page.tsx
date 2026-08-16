import {
  groupByCategory,
  listItems,
  priceRatio,
  ratioText,
  SCOPE_NOTE,
  getAllRegionStats,
} from "@/lib/price-data";
import { ITEM_HUB_SLUG, OFFICIAL_LINKS } from "@/lib/menu";
import { GUIDES } from "@/lib/guides";
import { REGION_HUB_SLUG, SIDOS } from "@/lib/regions";
import StatTile from "@/components/price/StatTile";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

export const revalidate = 300;

export default async function HomePage() {
  const [items, regionStats] = await Promise.all([
    listItems(),
    getAllRegionStats(),
  ]);

  const groups = groupByCategory(items);
  const hospitals = Math.max(...items.map((i) => i.hospital_count), 0);
  const regions = [...regionStats.values()].filter((r) => r.price_rows > 0).length;

  const ranked = items
    .map((i) => ({ item: i, ratio: priceRatio(i) }))
    .filter((x) => x.ratio !== null && x.item.hospital_count >= 20)
    .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0))
    .slice(0, 8);

  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>🩺</span>
          같은 진단서가 2천원, 그리고 5만원
        </h1>
        <p>
          건강보험이 적용되지 않는 <strong>비급여</strong>는 병원이 가격을
          스스로 정합니다. 심사평가원이 공개한 자료로 그 차이가 얼마나 큰지
          정리했습니다.
        </p>
      </div>

      <section className="stat-grid">
        <StatTile label="공개 항목" value={`${items.length}개`} />
        <StatTile label="병원" value={`${hospitals}곳`} sub={SCOPE_NOTE} />
        <StatTile label="지역" value={`${regions}곳`} />
        <StatTile label="금액 표기" value="없음" sub="차이만 보여줍니다" />
      </section>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.home} />
      </div>

      {ranked.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div className="sec-head">
            <h2 className="sec-title">차이가 가장 큰 항목</h2>
            <a target="_self" href={`/${ITEM_HUB_SLUG}`} className="sec-more">
              전체 항목 보기
            </a>
          </div>
          <div className="panel">
            <p className="panel__desc">
              가장 싼 병원과 가장 비싼 병원이 몇 배 벌어지는지입니다.
              병원 20곳 이상 자료가 있는 항목만 넣었습니다.
            </p>
            <div className="table-scroll">
              <table className="pr-table">
                <thead>
                  <tr>
                    <th scope="col">항목</th>
                    <th scope="col" className="is-num">병원</th>
                    <th scope="col" className="is-num">차이</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map(({ item, ratio }) => (
                    <tr key={item.item_slug}>
                      <td>
                        <a
                          target="_self"
                          href={`/${item.item_slug}`}
                          className="pr-table__name pr-table__link"
                        >
                          {item.item_name}
                        </a>
                        <span className="pr-table__meta">{item.item_category}</span>
                      </td>
                      <td className="is-num">{item.hospital_count}곳</td>
                      <td className="is-num"><strong>{ratioText(ratio)}</strong></td>
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
          <h2 className="sec-title">분류로 찾기</h2>
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
                  .map((i) => i.item_name)
                  .join(", ")}
              </p>
            </a>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 36 }}>
        <div className="sec-head">
          <h2 className="sec-title">지역으로 찾기</h2>
          <a target="_self" href={`/${REGION_HUB_SLUG}`} className="sec-more">
            전체 지역 보기
          </a>
        </div>
        <div className="sido-block">
          <div className="region-chips">
            {SIDOS.map((s) => (
              <a target="_self" key={s.short} href={`/${REGION_HUB_SLUG}#${s.short}`}>
                <span aria-hidden>{s.emoji}</span>
                {s.name}
              </a>
            ))}
          </div>
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
          급여 항목은 나라가 수가를 정해두지만 비급여는 각 병원이 스스로
          가격을 매깁니다. 그래서 같은 이름의 진료·서류인데도 금액이 몇 배씩
          벌어집니다.
        </p>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          <strong>가격 차이가 곧 품질 차이는 아닙니다.</strong> 다만 미리
          물어보지 않으면 생각보다 많이 나올 수 있습니다. 현재 가격은{" "}
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
