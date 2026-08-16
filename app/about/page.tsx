import type { Metadata } from "next";
import { buildMetadata, SITE } from "@/lib/seo";
import { ITEM_HUB_SLUG, OFFICIAL_LINKS } from "@/lib/menu";
import { PRICE_BASE_YEARS, SCOPE_NOTE } from "@/lib/price-data";

export const metadata: Metadata = buildMetadata({
  path: "/about",
  title: `사이트 소개 | ${SITE.name}`,
  description:
    "비급여 진료비는 심사평가원이 공개한 자료로 병원 간 가격 차이를 보여주는 사이트입니다. 자료의 기준 시점과 한계를 분명히 밝힙니다.",
});

export default function AboutPage() {
  return (
    <>
      <div className="page-head">
        <h1>
          <span aria-hidden>🩺</span>
          사이트 소개
        </h1>
        <p>
          &ldquo;이 검사 얼마예요?&rdquo;에 답이 하나가 아니라는 것부터 알아야
          합니다.
        </p>
      </div>

      <section className="panel">
        <h2 className="panel__title">무엇을 보여주나</h2>
        <p className="panel__desc">
          건강보험이 적용되지 않는 <strong>비급여</strong> 항목은 병원이 가격을
          스스로 정합니다. 그래서 같은 이름의 진료·서류인데도 금액이 몇 배씩
          벌어집니다. 이 사이트는 심사평가원이 공개한 자료로{" "}
          <strong>그 격차가 얼마나 큰지</strong>를 항목별·지역별로 정리합니다.
        </p>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          예를 들어 소견서 한 장이 어디는 1천원, 어디는 30만원입니다. 이런 사실을
          모르고 가면 청구서를 받고 놀라게 됩니다.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">이 사이트가 말하지 않는 것</h2>
        <p className="panel__desc">
          가장 중요한 부분이라 먼저 적습니다.{" "}
          <strong>여기 적힌 금액은 지금 가격이 아닙니다.</strong>
        </p>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>
            원본 자료의 가격 적용일자가 <strong>{PRICE_BASE_YEARS}</strong>
            입니다. 그 사이 대부분 바뀌었을 것입니다.
          </li>
          <li>
            그래서 이 사이트는 &ldquo;얼마인가&rdquo;가 아니라{" "}
            <strong>&ldquo;병원마다 얼마나 다른가&rdquo;</strong>를 보여줍니다.
            비급여를 병원이 자율로 정한다는 구조는 지금도 그대로이고, 격차의
            크기도 크게 달라지지 않았을 것입니다.
          </li>
          <li>
            현재 가격은{" "}
            <a
              href={OFFICIAL_LINKS.hira}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              건강보험심사평가원
            </a>
            에서 조회하거나 해당 병원에 직접 물어보셔야 합니다.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">데이터 출처와 범위</h2>
        <p className="panel__desc">
          공공데이터포털에 공개된{" "}
          <a
            href={OFFICIAL_LINKS.dataset}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            건강보험심사평가원 비급여진료비정보
          </a>
          를 그대로 집계했습니다. 원본에 없는 값을 추정해서 채우지 않습니다.
        </p>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>제공 기관: 건강보험심사평가원</li>
          <li>
            범위: <strong>{SCOPE_NOTE}</strong> — 동네 의원은 들어 있지 않습니다
          </li>
          <li>가격 기준: {PRICE_BASE_YEARS}</li>
          <li>공공저작물 제1유형(출처표시)</li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">하지 않는 것</h2>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>
            <strong>병원을 추천하거나 순위를 매기지 않습니다.</strong> 가격이
            싸다고 좋은 병원도, 비싸다고 나쁜 병원도 아닙니다.
          </li>
          <li>
            <strong>의학적 판단을 돕지 않습니다.</strong> 어떤 검사가 필요한지는
            의사와 상의할 문제입니다.
          </li>
          <li>
            <strong>진료를 중개하지 않습니다.</strong>
          </li>
        </ul>
      </section>

      <div className="empty-box">
        <a
          target="_self"
          href={`/${ITEM_HUB_SLUG}`}
          style={{ textDecoration: "underline" }}
        >
          항목별 가격 차이 보러 가기
        </a>
      </div>
    </>
  );
}
