import {
  formatWon,
  getRegionStats,
  listRegionPrices,
  PRICE_BASE_YEARS,
  type PriceRow,
} from "@/lib/price-data";
import { REGION_HUB_SLUG, type Region } from "@/lib/regions";
import { ITEM_HUB_SLUG } from "@/lib/menu";
import { breadcrumbJsonLd, datasetJsonLd } from "@/lib/seo";
import StatTile from "@/components/price/StatTile";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/** 항목별로 묶어 최저·중간·최고를 낸다 */
function summarize(rows: PriceRow[]) {
  const map = new Map<string, { name: string; category: string; v: number[] }>();
  for (const r of rows) {
    if (r.price_max === null) continue;
    const e = map.get(r.item_slug) ?? {
      name: r.item_name,
      category: r.item_category,
      v: [],
    };
    e.v.push(r.price_max);
    map.set(r.item_slug, e);
  }
  return [...map.entries()]
    .map(([slug, e]) => {
      const sorted = [...e.v].sort((a, b) => a - b);
      return {
        slug,
        name: e.name,
        category: e.category,
        count: sorted.length,
        min: sorted[0],
        median: sorted[Math.floor(sorted.length / 2)],
        max: sorted[sorted.length - 1],
      };
    })
    .sort((a, b) => b.count - a.count);
}

export default async function RegionView({ region }: { region: Region }) {
  const [stats, rows] = await Promise.all([
    getRegionStats(region.slug),
    listRegionPrices(region.slug),
  ]);

  if (!stats || rows.length === 0) return <EmptyRegion region={region} />;

  const items = summarize(rows);
  const hospitals = [...new Set(rows.map((r) => r.hospital))];

  const description = `${region.name} 병원 ${stats.hospital_count}곳의 비급여 진료비입니다. ${stats.item_count}개 항목, ${PRICE_BASE_YEARS} 기준.`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datasetJsonLd({
              name: `${region.name} 비급여 진료비`,
              path: `/${region.slug}`,
              description,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "홈", path: "/" },
              { name: "지역별", path: `/${REGION_HUB_SLUG}` },
              { name: region.name, path: `/${region.slug}` },
            ]),
          ),
        }}
      />

      <div className="page-head">
        <span className="cat-badge cat-badge--region">{region.sidoName}</span>
        <h1>{region.name} 비급여 진료비</h1>
        <p>
          {region.name} 병원 {stats.hospital_count}곳의 비급여 항목 가격입니다.
          {PRICE_BASE_YEARS} 기준이며 병원급 이상만 들어 있습니다.
        </p>
      </div>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.top} />
      </div>

      <section className="stat-grid">
        <StatTile label="병원" value={`${stats.hospital_count}곳`} />
        <StatTile label="공개 항목" value={`${stats.item_count}개`} />
        <StatTile label="가격 자료" value={`${stats.price_rows}건`} />
        <StatTile label="기준 시점" value={PRICE_BASE_YEARS} sub="현재가 아님" />
      </section>

      <section className="panel">
        <h2 className="panel__title">항목별 가격 ({items.length}개)</h2>
        <p className="panel__desc">
          같은 항목이라도 {region.name} 안에서 병원마다 다릅니다. 항목 이름을
          누르면 전국 병원과 견줄 수 있습니다.
        </p>
        <div className="table-scroll">
          <table className="pr-table">
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col" className="is-num">최저</th>
                <th scope="col" className="is-num">중간</th>
                <th scope="col" className="is-num">최고</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.slug}>
                  <td>
                    <a
                      target="_self"
                      href={`/${it.slug}`}
                      className="pr-table__name pr-table__link"
                    >
                      {it.name}
                    </a>
                    <span className="pr-table__meta">
                      {it.category} · {it.count}곳
                    </span>
                  </td>
                  <td className="is-num">{formatWon(it.min)}</td>
                  <td className="is-num">{formatWon(it.median)}</td>
                  <td className="is-num">{formatWon(it.max)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.middle} />
      </div>

      <section className="panel">
        <h2 className="panel__title">자료에 포함된 병원 ({hospitals.length}곳)</h2>
        <p className="panel__desc">
          병원급 이상만 들어 있습니다. 동네 의원은 이 자료에 없습니다.
        </p>
        <div className="region-chips">
          {hospitals.map((h) => (
            <span key={h} style={{ padding: "6px 12px", fontSize: 13 }}>
              {h}
            </span>
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

function EmptyRegion({ region }: { region: Region }) {
  return (
    <>
      <div className="page-head">
        <span className="cat-badge cat-badge--region">{region.sidoName}</span>
        <h1>{region.name} 비급여 진료비</h1>
        <p>{region.name}에는 공개된 자료가 없습니다.</p>
      </div>
      <div className="empty-box">
        이 자료는 병원급 이상만 담고 있어 의원만 있는 지역은 비어 있습니다.
        <br />
        <a target="_self" href={`/${ITEM_HUB_SLUG}`} style={{ textDecoration: "underline" }}>
          항목별로 전국 가격 보기
        </a>
      </div>
      <DataNotice />
    </>
  );
}
