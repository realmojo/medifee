import { relative, relativeSign, type FeeRow } from "@/lib/fee-data";

/**
 * 항목 화면과 주제 화면이 함께 쓰는 표 도우미.
 */

/** 정해 둔 순서대로 늘어놓는다. 금액순으로 두면 페이지마다 순서가 달라진다. */
export function orderRows(rows: FeeRow[], order: string[]): FeeRow[] {
  const rank = new Map(order.map((s, i) => [s, i]));
  return [...rows].sort(
    (a, b) => (rank.get(a.scope) ?? 99) - (rank.get(b.scope) ?? 99),
  );
}

export function highest(rows: FeeRow[]): FeeRow | null {
  const withValue = rows.filter((r) => r.median_price !== null);
  if (withValue.length === 0) return null;
  return withValue.reduce((a, b) =>
    (b.median_price ?? 0) > (a.median_price ?? 0) ? b : a,
  );
}

export function lowest(rows: FeeRow[]): FeeRow | null {
  const withValue = rows.filter((r) => r.median_price !== null);
  if (withValue.length === 0) return null;
  return withValue.reduce((a, b) =>
    (b.median_price ?? 0) < (a.median_price ?? 0) ? b : a,
  );
}

export function diffCell(value: number | null, base: number) {
  if (value === null || !base) return <span>-</span>;
  return (
    <span className={`rel rel--${relativeSign(value, base)}`}>
      {relative(value, base)}
    </span>
  );
}
