import type { Metadata } from "next";
import { buildMetadata, SITE } from "@/lib/seo";
import { ITEM_HUB_SLUG, OFFICIAL_LINKS } from "@/lib/menu";
import { DATA_UPDATED, DATA_YEAR, SCOPE_NOTE } from "@/lib/fee-data";
import { CLASSES, REGIONS } from "@/lib/scopes";

export const metadata: Metadata = buildMetadata({
  path: "/about",
  title: `사이트 소개 | ${SITE.name}`,
  description:
    "비급여 진료비는 심사평가원이 공개한 자료로 항목별·지역별·병원 종별 비급여 금액을 정리하는 사이트입니다. 자료의 기준 시점과 한계를 분명히 밝힙니다.",
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
          &ldquo;이 시술 얼마예요?&rdquo;에 답이 하나가 아니라는 것부터 알아야
          합니다.
        </p>
      </div>

      <section className="panel">
        <h2 className="panel__title">무엇을 보여주나</h2>
        <p className="panel__desc">
          건강보험이 적용되지 않는 <strong>비급여</strong> 항목은 병원이 값을
          스스로 정합니다. 그래서 같은 이름의 진료·서류인데도 금액이 몇 배씩
          벌어집니다. 이 사이트는 건강보험심사평가원이 공개한 {DATA_YEAR}년
          자료로 <strong>항목마다 대체로 얼마인지</strong>, 그리고{" "}
          <strong>지역과 병원 종별에 따라 얼마나 갈리는지</strong>를 정리합니다.
        </p>
        <p className="panel__desc" style={{ marginBottom: 0 }}>
          항목별 페이지에는 전국 중간값과 함께 {REGIONS.length}개 시도,{" "}
          {CLASSES.length}개 병원 종별의 금액이 들어 있습니다.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">이 자료의 한계</h2>
        <p className="panel__desc">
          가장 오해하기 쉬운 부분이라 먼저 적습니다.{" "}
          <strong>여기 적힌 금액은 특정 병원의 가격이 아닙니다.</strong>
        </p>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>
            원본이 <strong>집계 통계</strong>입니다. 한 항목에 대해 그 지역·종별의
            최저·최고·평균·중간값 네 값만 있습니다. &ldquo;서울 A병원 도수치료
            얼마&rdquo;는 이 자료로 알 수 없습니다.
          </li>
          <li>
            그래서 화면에서 <strong>중간값을 앞세웁니다.</strong> 최저·최고는 한
            곳만 있어도 잡히는 값이라 예산을 잡는 기준이 되지 못합니다.
          </li>
          <li>
            지역 단위가 <strong>시도(17개)</strong>입니다. 시군구로는 나뉘어
            있지 않아 그보다 잘게 쪼갤 수 없습니다.
          </li>
          <li>
            실제로 갈 병원의 금액은{" "}
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
          국가통계포털(KOSIS)에 공개된{" "}
          <a
            href={OFFICIAL_LINKS.dataset}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            건강보험심사평가원 「비급여진료비용및제증명수수료통계」
          </a>
          를 그대로 집계했습니다. 원본에 없는 값을 추정해서 채우지 않습니다.
        </p>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>제공 기관: 건강보험심사평가원</li>
          <li>
            범위: <strong>{SCOPE_NOTE}</strong>
          </li>
          <li>
            기준: {DATA_YEAR}년 · 통계표 갱신 {DATA_UPDATED}
          </li>
          <li>공공저작물 제1유형(출처표시)</li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">하지 않는 것</h2>
        <ul className="panel__desc" style={{ paddingLeft: 18, marginBottom: 0 }}>
          <li>
            <strong>병원을 추천하거나 순위를 매기지 않습니다.</strong> 값이
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
          항목별 진료비 보러 가기
        </a>
      </div>
    </>
  );
}
