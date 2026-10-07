/**
 * 주제 글의 모양.
 *
 * 이 파일과 같은 폴더의 데이터 파일은 `@/` 경로를 쓰지 않는다. 적재 스크립트와
 * 점검 스크립트(scripts/check-topics.mjs)가 esbuild 로 바로 읽기 때문이다.
 */

export type TopicGroup =
  | "예방접종"
  | "치과"
  | "눈"
  | "MRI"
  | "초음파"
  | "시술·치료"
  | "검사"
  | "서류·병실";

export interface Topic {
  /** URL 경로. 항목·지역·종별·가이드 슬러그와 겹치면 안 된다 */
  slug: string;
  group: TopicGroup;
  /** 목록과 본문에서 부르는 짧은 이름. "임플란트", "무릎 MRI" */
  name: string;
  /** <h1> 과 검색 결과 제목 */
  title: string;
  /** 메타 설명. 130~160자 */
  description: string;
  /** 이 글이 덮으려는 검색어 (네이버 검색광고 키워드 도구로 확인한 것) */
  keywords: string[];
  emoji: string;
  /**
   * 이 주제에 넣을 항목. item_slug 에 대해 검사한다.
   * 여러 항목을 묶는 것이 주제 글의 존재 이유다 — 항목 하나뿐이면 항목
   * 페이지와 같은 내용이 되므로 주제로 만들지 않는다.
   */
  match: RegExp;
  /**
   * 표에 쓸 이름에서 떼어 낼 앞부분. 비우면 묶인 항목들의 공통 앞말을 자동으로
   * 뗀다. 원본 이름이 괄호 안에서 끊기는 등 자동으로 안 되는 경우에만 쓴다.
   */
  trim?: RegExp;
  /** 지역·종별 표의 기준 항목. 비우면 가장 넓게 집계된 항목 */
  primary?: string;
  /** 첫 문단. 무엇인지, 왜 값이 갈리는지 */
  intro: string[];
  /** "알아둘 것" 목록. 제도·조건처럼 표로는 말할 수 없는 것 */
  points: Array<{ title: string; body: string }>;
  /** 손으로 쓴 질문. 금액 질문은 화면에서 자료로 하나 더 만든다 */
  faq: Array<{ q: string; a: string }>;
  /**
   * 이 주제에 묶인 항목 화면 위쪽에 띄울 안내. 제도가 바뀌어 2025년 금액이
   * 지금과 다를 때 쓴다(도수치료 관리급여처럼). 한 문장으로.
   */
  itemNotice?: string;
  /** 본문 내용을 마지막으로 확인한 날 (YYYY-MM-DD) */
  checked: string;
  /** 출처가 필요한 제도 설명을 했을 때 */
  sources?: Array<{ name: string; url: string }>;
}
