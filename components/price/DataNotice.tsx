import { PRICE_BASE_YEARS, SCOPE_NOTE } from "@/lib/price-data";
import { OFFICIAL_LINKS } from "@/lib/menu";

/**
 * 모든 화면 하단 공통 안내.
 *
 * 이 사이트의 가장 큰 위험은 **10년 전 가격을 현재가로 오해시키는 것**이다.
 * 그래서 기준 연도와 데이터 범위를 페이지마다 반복해 밝히고, 현재 가격은
 * 심평원으로 넘긴다. 이 문구를 빼면 사이트가 거짓말을 하게 된다.
 */
export default function DataNotice() {
  return (
    <div className="notice">
      <p style={{ margin: "0 0 8px" }}>
        <strong>이 숫자를 읽을 때 반드시 알아둘 것</strong>
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <strong>여기 적힌 금액은 {PRICE_BASE_YEARS} 기준입니다.</strong> 지금
          가격이 아닙니다. 이 사이트는 &ldquo;얼마인가&rdquo;가 아니라{" "}
          <strong>&ldquo;같은 항목인데 병원마다 얼마나 다른가&rdquo;</strong>를
          보여주기 위한 것입니다.
        </li>
        <li>
          <strong>현재 가격은 반드시 따로 확인하세요.</strong>{" "}
          <a
            href={OFFICIAL_LINKS.hira}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            심사평가원
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
          에서 최신 자료를 조회할 수 있고, 해당 병원에 직접 물어보는 것이 가장
          확실합니다.
        </li>
        <li>
          자료 범위는 <strong>{SCOPE_NOTE}</strong>입니다. 동네 의원은 들어 있지
          않습니다.
        </li>
        <li>
          비급여는 건강보험이 적용되지 않아 <strong>병원이 스스로 가격을
          정합니다.</strong> 그래서 같은 항목도 몇 배씩 차이가 납니다. 이 사실
          자체는 지금도 그대로입니다.
        </li>
      </ul>
    </div>
  );
}
