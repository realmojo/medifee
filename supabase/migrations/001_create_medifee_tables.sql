-- medifee.keywordegg.com 기본 테이블
--
--   medifee_prices  : 병원 × 항목 가격 (심평원 15001700)
--   medifee_items   : 항목 집계 — 이 사이트의 주축
--   medifee_regions : 시군구 집계
--
-- 중요: 이 데이터의 가격 적용일자는 2015년(92%)·2016년(8%)이다.
-- 지금 가격이 아니다. 화면은 절대 금액을 "현재 가격"으로 말하지 않고
-- "같은 항목도 병원·지역마다 몇 배씩 다르다"는 구조를 보여준다.
-- applied_year 를 페이지마다 노출한다.

create table if not exists public.medifee_prices (
  id            bigserial primary key,
  hospital      text not null,
  ykiho         text,                 -- 심평원 병원 암호화 코드
  cl_name       text,                 -- 종별 (상급종합/종합병원/병원…)
  region_slug   text not null,
  sido          text not null,
  item_code     text not null,        -- divCd1-divCd2-divCd3
  item_name     text not null,
  item_slug     text not null,
  item_category text not null,        -- 대분류 (제증명수수료, MRI진단료…)
  item_sub      text,
  price_min     integer,
  price_max     integer,
  applied_year  integer,              -- 가격 적용 연도. 화면에 반드시 노출
  hospital_url  text,
  created_at    timestamptz not null default now()
);

comment on table public.medifee_prices is
  '비급여 진료비 (심평원 15001700). 가격 적용일자가 2015~2016년이라 현재가가 아니다';

create unique index if not exists medifee_prices_key
  on public.medifee_prices (ykiho, item_code) nulls not distinct;
create index if not exists medifee_prices_item_idx
  on public.medifee_prices (item_slug, price_max);
create index if not exists medifee_prices_region_idx
  on public.medifee_prices (region_slug, item_slug);

create table if not exists public.medifee_items (
  item_slug     text primary key,
  item_name     text not null,
  item_category text not null,
  hospital_count integer not null default 0,
  region_count   integer not null default 0,
  min_price     integer,
  max_price     integer,
  avg_price     numeric(12,1),
  median_price  integer,
  applied_year  integer,
  updated_at    timestamptz not null default now()
);

create table if not exists public.medifee_regions (
  region_slug   text primary key,
  sido          text not null,
  hospital_count integer not null default 0,
  item_count     integer not null default 0,
  price_rows     integer not null default 0,
  updated_at     timestamptz not null default now()
);

create or replace function public.refresh_medifee_aggregates()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.medifee_items where true;
  insert into public.medifee_items (
    item_slug, item_name, item_category, hospital_count, region_count,
    min_price, max_price, avg_price, median_price, applied_year, updated_at
  )
  select
    item_slug, min(item_name), min(item_category),
    count(distinct coalesce(ykiho, hospital)),
    count(distinct region_slug),
    min(price_min), max(price_max),
    round(avg(price_max), 1),
    percentile_disc(0.5) within group (order by price_max)::integer,
    max(applied_year),
    now()
  from public.medifee_prices
  where price_max is not null
  group by item_slug;

  delete from public.medifee_regions where true;
  insert into public.medifee_regions (
    region_slug, sido, hospital_count, item_count, price_rows, updated_at
  )
  select
    region_slug, min(sido),
    count(distinct coalesce(ykiho, hospital)),
    count(distinct item_slug),
    count(*),
    now()
  from public.medifee_prices
  group by region_slug;
end;
$$;

alter table public.medifee_prices  enable row level security;
alter table public.medifee_items   enable row level security;
alter table public.medifee_regions enable row level security;
