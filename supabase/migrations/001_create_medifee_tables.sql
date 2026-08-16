-- medifee.keywordegg.com 기본 테이블 (KOSIS 354_001 기준)
--
--   medifee_fees   : 항목 × (시도 | 병원 종별) 금액 — 원자료를 접은 것
--   medifee_items  : 항목 집계 — 이 사이트의 주축
--   medifee_scopes : 축(시도·종별) 집계
--
-- 원본은 KOSIS 「비급여진료비용및제증명수수료통계」(심평원, orgId 354) 54개 표.
-- 2025년 기준이라 화면에 금액을 그대로 싣는다. 다만 **집계 통계**라 병원별
-- 가격이 아니다 — 지역·종별로 묶은 최저·최고·평균·중간값 네 값뿐이다.
--
-- 함정: 같은 항목 코드가 표 종류마다 다른 뜻이다. A0101 이 비급여진료비용
-- 표에서는 1인실, 제증명수수료 표에서는 일반(진단서)이다. 16개 코드가 이렇게
-- 겹친다. 그래서 고유키에 fee_kind 가 반드시 들어간다.

create table if not exists public.medifee_fees (
  id             bigserial primary key,
  fee_kind       text not null,        -- treatment | certificate
  item_code      text not null,        -- KOSIS ITM 코드. fee_kind 와 함께 써야 유일
  item_slug      text not null,        -- URL 경로
  item_name      text not null,
  item_full_name text not null,        -- 상위 분류를 앞에 붙인 표시용 이름
  category       text not null,        -- 최상위 대분류
  scope_type     text not null,        -- region | class
  scope          text not null,        -- 서울 / 의원 …
  year           integer not null,
  min_price      integer,              -- T001
  max_price      integer,              -- T002
  avg_price      integer,              -- T003
  median_price   integer,              -- T004
  surveyed_at    text,                 -- 통계표 갱신일 (LST_CHN_DE)
  created_at     timestamptz not null default now()
);

create unique index if not exists medifee_fees_key
  on public.medifee_fees (fee_kind, item_code, scope_type, scope, year);
create index if not exists medifee_fees_item_idx on public.medifee_fees (item_slug);
create index if not exists medifee_fees_scope_idx
  on public.medifee_fees (scope_type, scope);

create table if not exists public.medifee_items (
  item_slug      text primary key,
  item_name      text not null,
  item_full_name text not null,
  category       text not null,
  fee_kind       text not null,
  scope_count    integer not null default 0,  -- 값이 있는 시도 수 (최대 17)
  class_count    integer not null default 0,  -- 값이 있는 종별 수 (최대 10)
  min_price      integer,
  max_price      integer,
  avg_price      integer,
  median_price   integer,
  region_median  integer,   -- 17개 시도 중간값들의 중간값. 지역 화면의 기준
  class_median   integer,   -- 10개 종별 중간값들의 중간값. 종별 화면의 기준
  year           integer,
  updated_at     timestamptz not null default now()
);

create table if not exists public.medifee_scopes (
  scope_type     text not null,
  scope          text not null,
  item_count     integer not null default 0,
  category_count integer not null default 0,
  year           integer,
  updated_at     timestamptz not null default now(),
  primary key (scope_type, scope)
);

-- 적재가 끝난 뒤 한 번 호출한다.
-- delete 에 where true 를 붙이는 것은 Supabase 의 pg_safeupdate 때문이다.
-- 조건 없는 delete 를 막아서, 없으면 함수 실행이 통째로 실패한다.
create or replace function public.refresh_medifee_aggregates()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  delete from public.medifee_items where true;
  insert into public.medifee_items (
    item_slug, item_name, item_full_name, category, fee_kind,
    scope_count, class_count, min_price, max_price, avg_price, median_price,
    region_median, class_median, year, updated_at
  )
  select
    item_slug, min(item_name), min(item_full_name), min(category), min(fee_kind),
    count(distinct scope) filter (where scope_type = 'region'),
    count(distinct scope) filter (where scope_type = 'class'),
    min(min_price), max(max_price),
    round(avg(avg_price))::integer,
    -- 중간값의 중간값. 원자료가 집계표라 이보다 정확히는 낼 수 없다
    percentile_disc(0.5) within group (order by median_price)::integer,
    percentile_disc(0.5) within group (
      order by case when scope_type = 'region' then median_price end
    )::integer,
    percentile_disc(0.5) within group (
      order by case when scope_type = 'class' then median_price end
    )::integer,
    max(year), now()
  from public.medifee_fees
  group by item_slug;

  delete from public.medifee_scopes where true;
  insert into public.medifee_scopes (
    scope_type, scope, item_count, category_count, year, updated_at
  )
  select scope_type, scope,
         count(distinct item_slug), count(distinct category),
         max(year), now()
  from public.medifee_fees
  group by scope_type, scope;
end;
$function$;

alter table public.medifee_fees   enable row level security;
alter table public.medifee_items  enable row level security;
alter table public.medifee_scopes enable row level security;

-- 갱신 함수는 적재 스크립트(service_role)만 부르면 된다. 기본 권한 그대로
-- 두면 /rest/v1/rpc/refresh_medifee_aggregates 로 누구나 호출할 수 있고,
-- SECURITY DEFINER 이므로 반복 호출하면 집계 테이블을 계속 다시 쓴다.
revoke execute on function public.refresh_medifee_aggregates()
  from anon, authenticated, public;
