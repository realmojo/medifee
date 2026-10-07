import { DATA_YEAR, formatWonShort, listItems } from "@/lib/fee-data";
import { ITEM_HUB_SLUG } from "@/lib/menu";
import { groupTopics, TOPICS, topicItems } from "@/lib/topics";
import StatTile from "@/components/price/StatTile";
import DataNotice from "@/components/price/DataNotice";
import Adsense from "@/components/Adsense";
import { AD_SLOTS } from "@/lib/ads";

/** `/주제` — 검색어 단위로 묶은 글 목록 */
export default async function TopicHubView() {
  const items = await listItems();
  const groups = groupTopics();
  const covered = new Set(
    TOPICS.flatMap((t) => topicItems(t, items).map((i) => i.item_slug)),
  );

  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>🗂️</span>
          주제별 비급여 비용
        </h1>
        <p>
          임플란트, 무릎 MRI, 독감 예방접종처럼 사람들이 실제로 찾는 말로
          항목을 묶었습니다. 재료·제품·촬영 방식별 값을 한 번에 비교하고,
          건강보험이 되는 조건도 함께 정리했습니다. {DATA_YEAR}년
          건강보험심사평가원 자료입니다.
        </p>
      </div>

      <section className="stat-grid">
        <StatTile label="주제" value={`${TOPICS.length}개`} />
        <StatTile label="묶은 항목" value={`${covered.size}개`} />
        <StatTile label="분류" value={`${groups.length}가지`} />
        <StatTile label="기준" value={`${DATA_YEAR}년`} />
      </section>

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.top} />
      </div>

      {groups.slice(0, 3).map((g) => (
        <GroupPanel key={g.group} group={g} items={items} />
      ))}

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.middle} />
      </div>

      {groups.slice(3).map((g) => (
        <GroupPanel key={g.group} group={g} items={items} />
      ))}

      <section className="panel">
        <h2 className="panel__title">찾는 주제가 없다면</h2>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          <a target="_self" href={`/${ITEM_HUB_SLUG}`}>
            전체 항목 목록
          </a>
          에서 {items.length}개 비급여 항목을 분류별로 볼 수 있습니다.
        </p>
      </section>

      <DataNotice />

      <div className="ad-slot">
        <Adsense slotId={AD_SLOTS.bottom} />
      </div>
    </>
  );
}

function GroupPanel({
  group,
  items,
}: {
  group: ReturnType<typeof groupTopics>[number];
  items: Awaited<ReturnType<typeof listItems>>;
}) {
  return (
    <section className="panel">
      <h2 className="panel__title">{group.group}</h2>
      <div className="table-scroll">
        <table className="pr-table">
          <thead>
            <tr>
              <th scope="col">주제</th>
              <th scope="col" className="is-num">
                중간값 범위
              </th>
            </tr>
          </thead>
          <tbody>
            {group.topics.map((t) => {
              const list = topicItems(t, items).filter(
                (i) => i.median_price !== null,
              );
              const hi = list[0]?.median_price ?? null;
              const lo = list[list.length - 1]?.median_price ?? null;
              return (
                <tr key={t.slug}>
                  <td>
                    <a
                      target="_self"
                      href={`/${t.slug}`}
                      className="pr-table__name pr-table__link"
                    >
                      <span aria-hidden>{t.emoji} </span>
                      {t.title.split(" — ")[0]}
                    </a>
                    <span className="pr-table__meta">
                      항목 {list.length}개
                    </span>
                  </td>
                  <td className="is-num">
                    {hi === null
                      ? "-"
                      : hi === lo
                        ? formatWonShort(hi)
                        : `${formatWonShort(lo)} ~ ${formatWonShort(hi)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
