import { PRICE_BASE_YEARS, SCOPE_NOTE } from "@/lib/price-data";
import { OFFICIAL_LINKS } from "@/lib/menu";

/**
 * 모든 화면 하단 공통 안내.
 *
 * 이 사이트는 금액을 싣지 않는다. 왜 그런지를 여기서 한 번 분명히 밝힌다.
 * 이 설명이 없으면 "가격 비교 사이트인데 가격이 없다"로만 읽힌다.
 */
export default function DataNotice() {
  return (
    <div className="notice">
      <p style={{ margin: "0 0 8px" }}>
        <strong>이 사이트가 금액을 알려주지 않는 이유</strong>
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          공개된 비급여 가격 자료의 기준이 <strong>{PRICE_BASE_YEARS}</strong>
          입니다. 그대로 실으면 이미 맞지 않는 숫자를 현재 가격처럼 보이게
          만듭니다. 그래서 <strong>원 단위 금액은 한 글자도 싣지 않습니다.</strong>
        </li>
        <li>
          대신 <strong>병원 간 차이의 크기와 상대적인 순서</strong>만
          보여줍니다. 비급여를 병원이 자율로 정한다는 구조와 그로 인한 격차는
          시간이 지나도 크게 뒤집히지 않습니다.
        </li>
        <li>
          <strong>실제 금액은 여기서 확인하세요.</strong>{" "}
          <a
            href={OFFICIAL_LINKS.hira}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            건강보험심사평가원
          </a>
          이나{" "}
          <a
            href={OFFICIAL_LINKS.nhis}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            비급여 정보 포털
          </a>
          에서 최신 자료를 조회할 수 있고, 해당 병원에 직접 묻는 것이 가장
          확실합니다.
        </li>
        <li>
          자료 범위는 <strong>{SCOPE_NOTE}</strong>입니다. 동네 의원은 들어 있지
          않습니다.
        </li>
      </ul>
    </div>
  );
}
