import {
  groupByCategory,
  listItems,
  priceRatio,
  ratioText,
  SCOPE_NOTE,
} from "@/lib/price-data";
import StatTile from "@/components/price/StatTile";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/** `/항목` — 대분류별로 묶은 전체 항목 목록 */
export default async function ItemHubView() {
  const items = await listItems();
  const groups = groupByCategory(items);

  const ranked = items
    .map((i) => ({ item: i, ratio: priceRatio(i) }))
    .filter((x) => x.ratio !== null && x.item.hospital_count >= 20)
    .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0))
    .slice(0, 10);

  const totalHospitals = Math.max(...items.map((i) => i.hospital_count), 0);

  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>📋</span>
          비급여 항목별 가격 차이
        </h1>
        <p>
          건강보험이 적용되지 않는 항목은 병원이 가격을 스스로 정합니다.
          항목을 고르면 어느 정도까지 벌어지는지 볼 수 있습니다.
        </p>
      </div>

      <section className="stat-grid">
        <StatTile label="공개 항목" value={`${items.length}개`} />
        <StatTile label="병원" value={`${totalHospitals}곳`} sub={SCOPE_NOTE} />
        <StatTile label="분류" value={`${groups.length}개`} />
        <StatTile label="금액 표기" value="없음" sub="차이만 보여줍니다" />
      </section>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.top} />
      </div>

      {ranked.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">가격 차이가 가장 큰 항목</h2>
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
                    <td className="is-num">
                      <strong>{ratioText(ratio)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.middle} />
      </div>

      {groups.map((g) => (
        <section className="sido-block" key={g.category}>
          <h2 className="sido-block__title">
            {g.category}
            <span className="sido-block__count">{g.items.length}개 항목</span>
          </h2>
          <div className="region-chips">
            {g.items.map((it) => (
              <a target="_self" key={it.item_slug} href={`/${it.item_slug}`}>
                {it.item_name}
                <span style={{ fontSize: 11, color: "#8b9184" }}>
                  {it.hospital_count}
                </span>
              </a>
            ))}
          </div>
        </section>
      ))}

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.bottom} />
      </div>
    </>
  );
}
