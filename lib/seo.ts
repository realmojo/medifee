import type { Metadata } from "next";

export const SITE = {
  name: "비급여 진료비",
  nameEn: "MediFee",
  url: "https://medifee.keywordegg.com",
  locale: "ko_KR",
  ogImage: "/opengraph-image",
  description:
    "도수치료 중간값 10만원, 상급종합병원은 얼마일까. 심평원이 공개한 2025년 비급여 진료비를 항목별·지역별·병원 종별로 정리했습니다.",
} as const;

export function absoluteUrl(path: string): string {
  if (!path || path === "/") return SITE.url;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${p.split("/").map(encodeURIComponent).join("/")}`;
}

export interface BuildMetadataInput {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  type?: "website" | "article";
  image?: string;
}

export function buildMetadata({
  path, title, description, keywords, type = "website", image,
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const socialImage = image ?? SITE.ogImage;
  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      title, description, url,
      siteName: SITE.name, locale: SITE.locale, type,
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${SITE.name} - ${title}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
  };
}

export function breadcrumbJsonLd(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem", position: i + 1, name: item.name, item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ko-KR",
    mainEntity: items.map((i) => ({
      "@type": "Question", name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

/** 공개 데이터를 집계한 화면이므로 Article 이 아니라 Dataset 으로 표기한다 */
export function datasetJsonLd({
  name, path, description,
}: { name: string; path: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name, description,
    url: absoluteUrl(path),
    inLanguage: "ko-KR",
    creator: { "@type": "Organization", name: "건강보험심사평가원" },
    isBasedOn:
      "https://kosis.kr/statHtml/statHtml.do?orgId=354&tblId=DT_354006_2021A022",
    temporalCoverage: "2025",
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}
