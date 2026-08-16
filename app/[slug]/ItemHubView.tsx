import {
  DATA_YEAR,
  featuredItems,
  formatWon,
  formatWonShort,
  groupByCategory,
  itemLabel,
  listItems,
  priceRatio,
  ratioText,
  SCOPE_NOTE,
} from "@/lib/fee-data";
import { CLASS_HUB_SLUG, REGION_HUB_SLUG } from "@/lib/scopes";
import StatTile from "@/components/price/StatTile";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/** `/항목` — 대분류별로 묶은 전체 항목 목록 */
export default async function ItemHubView() {
  const items = await listItems();
  const groups = groupByCategory(items);
  const featured = featuredItems(items);

  // 폭넓게 집계된 항목 중에서 최고÷최저가 큰 것. 표본이 얇으면 배수가 튄다.
  const widest = items
    .filter((i) => i.scope_count >= 15 && i.class_count >= 5)
    .map((i) => ({ item: i, ratio: priceRatio(i) }))
    .filter((x) => x.ratio !== null)
    .sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0))
    .slice(0, 10);

  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>📋</span>
          비급여 항목별 진료비
        </h1>
        <p>
          건강보험이 적용되지 않는 항목은 병원이 값을 스스로 정합니다. 항목을
          고르면 지역별·병원 종별 금액을 볼 수 있습니다. {DATA_YEAR}년
          건강보험심사평가원 자료입니다.
        </p>
      </div>

      <section className="stat-grid">
        <StatTile label="공개 항목" value={`${items.length}개`} />
        <StatTile label="분류" value={`${groups.length}가지`} />
        <StatTile label="기준" value={`${DATA_YEAR}년`} />
        <StatTile label="자료 범위" value="전 종별" sub={SCOPE_NOTE} />
      </section>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.top} />
      </div>

      {featured.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">많이 찾는 항목</h2>
          <p className="panel__desc">
            사람들이 자주 묻는 항목입니다. 금액은 전국 중간값입니다.
          </p>
          <div className="table-scroll">
            <table className="pr-table">
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col" className="is-num">
                    중간값
                  </th>
                  <th scope="col" className="is-num">
                    최저~최고
                  </th>
                </tr>
              </thead>
              <tbody>
                {featured.map((i) => (
                  <tr key={i.item_slug}>
                    <td>
                      <a
                        target="_self"
                        href={`/${i.item_slug}`}
                        className="pr-table__name pr-table__link"
                      >
                        {itemLabel(i)}
                      </a>
                      <span className="pr-table__meta">{i.category}</span>
                    </td>
                    <td className="is-num">
                      <strong>{formatWon(i.median_price)}</strong>
                    </td>
                    <td className="is-num">
                      {formatWonShort(i.min_price)} ~{" "}
                      {formatWonShort(i.max_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {widest.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">차이가 가장 큰 항목</h2>
          <p className="panel__desc">
            집계된 최저와 최고가 몇 배 벌어지는지입니다. 폭넓게 집계된 항목만
            넣었습니다. 값이 크게 갈리는 항목일수록 미리 물어보는 편이 낫습니다.
          </p>
          <div className="table-scroll">
            <table className="pr-table">
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col" className="is-num">
                    중간값
                  </th>
                  <th scope="col" className="is-num">
                    차이
                  </th>
                </tr>
              </thead>
              <tbody>
                {widest.map(({ item, ratio }) => (
                  <tr key={item.item_slug}>
                    <td>
                      <a
                        target="_self"
                        href={`/${item.item_slug}`}
                        className="pr-table__name pr-table__link"
                      >
                        {itemLabel(item)}
                      </a>
                      <span className="pr-table__meta">{item.category}</span>
                    </td>
                    <td className="is-num">{formatWon(item.median_price)}</td>
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

      <section className="panel">
        <h2 className="panel__title">다른 방향으로 찾기</h2>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          <a target="_self" href={`/${REGION_HUB_SLUG}`}>
            지역별로 보기
          </a>{" "}
          ·{" "}
          <a target="_self" href={`/${CLASS_HUB_SLUG}`}>
            병원 종별로 보기
          </a>{" "}
          — 같은 항목이라도 어디서 받느냐에 따라 값이 갈립니다.
        </p>
      </section>

      {groups.map((g) => (
        <section className="sido-block" key={g.category}>
          <h2 className="sido-block__title">
            {g.category}
            <span className="sido-block__count">{g.items.length}개 항목</span>
          </h2>
          <div className="region-chips">
            {g.items.map((it) => (
              <a target="_self" key={it.item_slug} href={`/${it.item_slug}`}>
                {itemLabel(it)}
                <span style={{ fontSize: 11, color: "#8b9184" }}>
                  {formatWonShort(it.median_price)}
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
