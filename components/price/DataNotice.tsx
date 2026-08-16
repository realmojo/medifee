import { DATA_UPDATED, DATA_YEAR, SCOPE_NOTE } from "@/lib/fee-data";
import { OFFICIAL_LINKS } from "@/lib/menu";

/**
 * 모든 화면 하단 공통 안내.
 *
 * 이 자료는 **집계 통계**다. 병원 하나하나의 가격이 아니라 지역·종별로 묶은
 * 값이다. 이걸 밝히지 않으면 "여기 나온 금액을 그 병원이 받는다"로 읽힌다.
 * 가장 오해하기 쉬운 지점이라 화면마다 반복해서 적는다.
 */
export default function DataNotice() {
  return (
    <div className="notice">
      <p style={{ margin: "0 0 8px" }}>
        <strong>이 금액을 어떻게 읽어야 하나</strong>
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          건강보험심사평가원이 공개한 <strong>{DATA_YEAR}년 기준</strong> 자료를
          그대로 옮긴 것입니다. 통계표 갱신일은 {DATA_UPDATED}입니다.
        </li>
        <li>
          <strong>병원 한 곳의 가격이 아닙니다.</strong> 지역과 병원 종별로 묶어
          낸 최저·최고·평균·중간값입니다. 최저와 최고는 한 곳만 있어도 잡히는
          값이라 <strong>중간값을 기준으로 보시는 편이 실제에 가깝습니다.</strong>
        </li>
        <li>
          자료 범위는 <strong>{SCOPE_NOTE}</strong>입니다. 다만 모든 기관이
          모든 항목을 하는 것은 아니라 항목마다 집계된 종별 수가 다릅니다.
        </li>
        <li>
          <strong>실제로 갈 병원의 값은 따로 확인하세요.</strong>{" "}
          <a
            href={OFFICIAL_LINKS.hira}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            건강보험심사평가원
          </a>
          에서 병원별 비급여 가격을 조회할 수 있고, 해당 병원에 직접 묻는 것이
          가장 확실합니다.
        </li>
      </ul>
    </div>
  );
}
