import {
  getRegionStats,
  listItemPrices,
  listRegionPrices,
  relative,
  relativeSign,
  SCOPE_NOTE,
  type PriceRow,
} from "@/lib/price-data";
import { REGION_HUB_SLUG, type Region } from "@/lib/regions";
import { ITEM_HUB_SLUG } from "@/lib/menu";
import { breadcrumbJsonLd, datasetJsonLd } from "@/lib/seo";
import StatTile from "@/components/price/StatTile";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/**
 * 이 지역의 항목별 위치를 **전국 평균 대비**로 낸다.
 *
 * 원 단위 금액은 화면에 싣지 않는다. 대신 항목마다 전국 평균을 100으로 놓고
 * 이 지역이 어느 쪽에 있는지만 보여준다. 전국 평균은 항목별로 따로 구해야
 * 하므로 항목 수만큼 조회가 필요한데, 지역 하나에 항목이 많아야 수십 개이고
 * 그 조회들은 모두 캐시된다.
 */
async function summarize(rows: PriceRow[]) {
  const byItem = new Map<
    string,
    { name: string; category: string; v: number[] }
  >();
  for (const r of rows) {
    if (r.price_max === null) continue;
    const e = byItem.get(r.item_slug) ?? {
      name: r.item_name,
      category: r.item_category,
      v: [],
    };
    e.v.push(r.price_max);
    byItem.set(r.item_slug, e);
  }

  const out = await Promise.all(
    [...byItem.entries()].map(async ([slug, e]) => {
      const mine = e.v.reduce((a, b) => a + b, 0) / e.v.length;
      const national = (await listItemPrices(slug))
        .map((x) => x.price_max)
        .filter((x): x is number => x !== null);
      const base = national.length
        ? national.reduce((a, b) => a + b, 0) / national.length
        : 0;
      return {
        slug,
        name: e.name,
        category: e.category,
        count: e.v.length,
        diff: base ? relative(mine, base) : "-",
        sign: base ? relativeSign(mine, base) : ("flat" as const),
        index: base ? mine / base : 1,
      };
    }),
  );

  return out.sort((a, b) => b.index - a.index);
}

export default async function RegionView({ region }: { region: Region }) {
  const [stats, rows] = await Promise.all([
    getRegionStats(region.slug),
    listRegionPrices(region.slug),
  ]);

  if (!stats || rows.length === 0) return <EmptyRegion region={region} />;

  const items = await summarize(rows);
  const hospitals = [...new Set(rows.map((r) => r.hospital))];

  const description = `${region.name} 병원 ${stats.hospital_count}곳이 공개한 비급여 ${stats.item_count}개 항목이 전국 평균과 견주어 어느 쪽인지 정리했습니다.`;

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
          {region.name} 병원 {stats.hospital_count}곳이 공개한 비급여 항목이
          전국 평균과 견주어 어느 쪽인지 정리했습니다. {SCOPE_NOTE}.
        </p>
      </div>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.top} />
      </div>

      <section className="stat-grid">
        <StatTile label="병원" value={`${stats.hospital_count}곳`} />
        <StatTile label="공개 항목" value={`${stats.item_count}개`} />
        <StatTile label="가격 자료" value={`${stats.price_rows}건`} />
        <StatTile label="금액 표기" value="없음" sub="차이만 보여줍니다" />
      </section>

      <section className="panel">
        <h2 className="panel__title">항목별 가격 ({items.length}개)</h2>
        <p className="panel__desc">
          항목마다 전국 평균을 기준으로 {region.name}이 어느 쪽에 있는지입니다.
          금액이 아니라 상대적인 위치입니다. 항목 이름을 누르면 전국 병원과
          견줄 수 있습니다.
        </p>
        <div className="table-scroll">
          <table className="pr-table">
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col" className="is-num">병원</th>
                <th scope="col" className="is-num">전국 평균 대비</th>
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
                    <span className="pr-table__meta">{it.category}</span>
                  </td>
                  <td className="is-num">{it.count}곳</td>
                  <td className="is-num">
                    <span className={`rel rel--${it.sign}`}>{it.diff}</span>
                  </td>
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
