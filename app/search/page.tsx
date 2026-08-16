import type { Metadata } from "next";
import { formatWonShort, itemLabel, listItems } from "@/lib/fee-data";
import { CLASSES, REGIONS } from "@/lib/scopes";
import { buildMetadata, SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildMetadata({
    path: "/search",
    title: `검색 | ${SITE.name}`,
    description: "항목·지역·병원 종별을 검색합니다.",
  }),
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const keyword = (q ?? "").trim();
  const key = keyword.replace(/\s+/g, "");
  const strip = (v: string) => v.replace(/\s+/g, "");

  const items = keyword
    ? (await listItems())
        .filter(
          (i) =>
            strip(i.item_full_name).includes(key) ||
            strip(i.category).includes(key),
        )
        .slice(0, 60)
    : [];

  const scopes = keyword
    ? [...REGIONS, ...CLASSES].filter(
        (s) => strip(s.name).includes(key) || strip(s.slug).includes(key),
      )
    : [];

  const total = items.length + scopes.length;

  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>🔍</span>
          검색
        </h1>
        <p>
          {keyword
            ? `"${keyword}" 검색 결과 ${total}건`
            : "항목 이름이나 지역, 병원 종별을 입력해주세요."}
        </p>
      </div>

      {items.length > 0 && (
        <section className="sido-block">
          <h2 className="sido-block__title">
            항목
            <span className="sido-block__count">{items.length}개</span>
          </h2>
          <div className="region-chips">
            {items.map((i) => (
              <a target="_self" key={i.item_slug} href={`/${i.item_slug}`}>
                {itemLabel(i)}
                <span style={{ fontSize: 11, color: "#8b9184" }}>
                  {formatWonShort(i.median_price)}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {scopes.length > 0 && (
        <section className="sido-block">
          <h2 className="sido-block__title">
            지역·병원 종별
            <span className="sido-block__count">{scopes.length}곳</span>
          </h2>
          <div className="region-chips">
            {scopes.map((s) => (
              <a target="_self" key={s.slug} href={`/${s.slug}`}>
                <span aria-hidden>{s.emoji}</span>
                {s.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {keyword && total === 0 && (
        <div className="empty-box">검색 결과가 없습니다.</div>
      )}
    </>
  );
}
