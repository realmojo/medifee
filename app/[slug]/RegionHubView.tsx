import { regionsBySido } from "@/lib/regions";
import { getAllRegionStats, PRICE_BASE_YEARS } from "@/lib/price-data";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/**
 * `/지역` — 시도별 시군구.
 *
 * 자료가 병원급 이상만 담고 있어서 조리원·요양기관과 달리 **자료가 없는 지역이
 * 많다.** 없는 곳도 목록에는 남기되 흐리게 표시한다.
 */
export default async function RegionHubView() {
  const stats = await getAllRegionStats();
  const groups = regionsBySido();

  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>📍</span>
          지역별 비급여 진료비
        </h1>
        <p>
          시군구를 고르면 그 지역 병원들의 비급여 항목 가격을 볼 수 있습니다.
          {PRICE_BASE_YEARS} 기준이며 병원급 이상만 들어 있습니다.
        </p>
      </div>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.top} />
      </div>

      {groups.map(({ sido, regions }) => {
        const filled = regions.filter(
          (r) => (stats.get(r.slug)?.price_rows ?? 0) > 0,
        ).length;
        return (
          <section className="sido-block" key={sido.short} id={sido.short}>
            <h2 className="sido-block__title">
              <span aria-hidden>{sido.emoji}</span>
              {sido.name}
              <span className="sido-block__count">
                {filled > 0 ? `${filled}개 지역` : "자료 없음"}
              </span>
            </h2>
            <div className="region-chips">
              {regions.map((region) => {
                const n = stats.get(region.slug)?.hospital_count ?? 0;
                return (
                  <a
                    target="_self"
                    key={region.slug}
                    href={`/${region.slug}`}
                    data-empty={n === 0 ? "true" : undefined}
                  >
                    {region.sigungu || region.name}
                    {n > 0 && (
                      <span style={{ fontSize: 11, color: "#8b9184" }}>{n}</span>
                    )}
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.bottom} />
      </div>
    </>
  );
}
