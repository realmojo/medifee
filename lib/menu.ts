import { CLASS_HUB_SLUG, REGION_HUB_SLUG } from "./scopes";

export interface MenuItem {
  name: string;
  href: string;
}

/** 항목 허브 경로 */
export const ITEM_HUB_SLUG = "항목";

export const NAV: MenuItem[] = [
  { name: "홈", href: "/" },
  { name: "항목별", href: `/${ITEM_HUB_SLUG}` },
  { name: "지역별", href: `/${REGION_HUB_SLUG}` },
  { name: "종별", href: `/${CLASS_HUB_SLUG}` },
];

export const SITE_LINKS: MenuItem[] = [
  { name: "사이트 소개", href: "/about" },
  { name: "문의하기", href: "/contact" },
  { name: "개인정보처리방침", href: "/privacy" },
  { name: "이용약관", href: "/terms" },
];

/**
 * 공식 창구.
 *
 * 이 사이트가 보여주는 것은 지역·종별로 묶은 **집계값**이라 특정 병원의
 * 가격이 아니다. 실제로 갈 병원의 값은 아래에서 확인하도록 넘긴다.
 */
export const OFFICIAL_LINKS = {
  /** 심평원 — 병원별 비급여 진료비 조회 */
  hira: "https://www.hira.or.kr/",
  /** 공단 비급여 정보 포털 */
  nhis: "https://www.nhis.or.kr/nbinfo/index.do",
  /** 데이터 원본 (KOSIS 통계표 — 서울 비급여진료비용) */
  dataset:
    "https://kosis.kr/statHtml/statHtml.do?orgId=354&tblId=DT_354006_2021A022",
} as const;
