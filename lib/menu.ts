import { REGION_HUB_SLUG } from "./regions";

export interface MenuItem { name: string; href: string }

/** 항목 허브 경로 */
export const ITEM_HUB_SLUG = "항목";

export const NAV: MenuItem[] = [
  { name: "홈", href: "/" },
  { name: "항목별", href: `/${ITEM_HUB_SLUG}` },
  { name: "지역별", href: `/${REGION_HUB_SLUG}` },
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
 * 이 사이트의 가격은 2015~2016년 기준이라 현재가가 아니다.
 * 지금 가격은 반드시 아래에서 확인하도록 넘긴다.
 */
export const OFFICIAL_LINKS = {
  /** 심평원 비급여 진료비 조회 (현재 가격) */
  hira: "https://www.hira.or.kr/",
  /** 공단 비급여 정보 포털 */
  nhis: "https://www.nhis.or.kr/nbinfo/index.do",
  /** 데이터 원본 */
  dataset: "https://www.data.go.kr/data/15001700/openapi.do",
} as const;
