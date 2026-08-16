import type { Metadata } from "next";
import { listItems } from "@/lib/price-data";
import { REGIONS } from "@/lib/regions";
import { buildMetadata, SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildMetadata({
    path: "/search",
    title: `검색 | ${SITE.name}`,
    description: "항목과 지역을 검색합니다.",
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

  const items = keyword
    ? (await listItems()).filter(
        (i) =>
          i.item_name.replace(/\s+/g, "").includes(key) ||
          i.item_category.replace(/\s+/g, "").includes(key),
      )
    : [];

  const regions = keyword
    ? REGIONS.filter((r) => r.name.replace(/\s+/g, "").includes(key)).slice(0, 20)
    : [];

  const total = items.length + regions.length;

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
            : "항목 이름이나 지역을 입력해주세요."}
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
                {i.item_name}
              </a>
            ))}
          </div>
        </section>
      )}

      {regions.length > 0 && (
        <section className="sido-block">
          <h2 className="sido-block__title">
            지역
            <span className="sido-block__count">{regions.length}곳</span>
          </h2>
          <div className="region-chips">
            {regions.map((r) => (
              <a target="_self" key={r.slug} href={`/${r.slug}`}>
                {r.name}
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
