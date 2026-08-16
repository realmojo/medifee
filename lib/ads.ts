/**
 * 애드센스 광고 단위.
 * 퍼블리셔는 keywordegg 계열과 같은 계정이라 재승인이 필요 없다.
 * 슬롯은 이 사이트용으로 새로 만들어 채운다. 비어 있으면 아무것도 그리지 않는다.
 */
export const AD_CLIENT = "ca-pub-9130836798889522";

export const AD_SLOTS = {
  home: "",
  top: "",
  middle: "",
  bottom: "",
} as const;
