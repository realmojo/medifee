import { SITE_LINKS, OFFICIAL_LINKS, ITEM_HUB_SLUG } from "@/lib/menu";
import { REGION_HUB_SLUG, SIDOS } from "@/lib/regions";
import { PRICE_BASE_YEARS } from "@/lib/price-data";
import { GUIDES } from "@/lib/guides";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <div className="site-footer__logo">
              <span aria-hidden>🩺</span> 비급여 진료비
            </div>
            <p className="site-footer__desc">
              건강보험이 적용되지 않는 비급여 진료비를 항목별·지역별로
              정리했습니다. 같은 항목도 병원마다 몇 배씩 다릅니다.
            </p>
          </div>

          <div className="site-footer__col">
            <h3>항목별</h3>
            <ul>
              <li>
                <a target="_self" href={`/${ITEM_HUB_SLUG}`}>
                  전체 항목 보기
                </a>
              </li>
              <li>
                <a target="_self" href="/일반진단서">
                  일반진단서
                </a>
              </li>
              <li>
                <a target="_self" href="/1인실">
                  상급병실 1인실
                </a>
              </li>
              <li>
                <a target="_self" href="/사망진단서">
                  사망진단서
                </a>
              </li>
            </ul>
          </div>

          <div className="site-footer__col">
            <h3>알아두기</h3>
            <ul>
              {GUIDES.map((g) => (
                <li key={g.slug}>
                  <a target="_self" href={`/${g.slug}`}>
                    {g.title.split(" — ")[0].split(",")[0]}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer__col">
            <h3>지역별</h3>
            <ul>
              <li>
                <a target="_self" href={`/${REGION_HUB_SLUG}`}>
                  전체 지역 보기
                </a>
              </li>
              {SIDOS.slice(0, 5).map((s) => (
                <li key={s.short}>
                  <a target="_self" href={`/${REGION_HUB_SLUG}#${s.short}`}>
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer__col">
            <h3>사이트</h3>
            <ul>
              {SITE_LINKS.map((item) => (
                <li key={item.href}>
                  <a target="_self" href={item.href}>
                    {item.name}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={OFFICIAL_LINKS.dataset}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  데이터 원본
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© {new Date().getFullYear()} 비급여 진료비. All rights reserved.</p>
          <p className="site-footer__note">
            여기 적힌 금액은 건강보험심사평가원이 공개한{" "}
            <strong>{PRICE_BASE_YEARS} 기준</strong> 자료입니다. 현재 가격이
            아닙니다. 이 사이트는 병원 간 가격 차이의 구조를 보여주기 위한
            것이며, 실제 부담액은 심사평가원 조회와 해당 병원 문의로 확인하시기
            바랍니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
