-- visit_notes: 방문 소감 저장 테이블
-- 규칙(CLAUDE.md):
--  - user_id는 auth.users 참조
--  - (user_id, place_name, address) 유일 → 같은 사람의 같은 장소 기록 1개만
--  - RLS ENABLE + 본인 행만 select/insert/update 정책

create table if not exists public.visit_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  place_name  text not null,
  address     text not null,
  lat         double precision,
  lng         double precision,
  visited     boolean not null default false,
  impression  text,
  updated_at  timestamptz not null default now(),
  -- 동일 사용자 + 동일 장소(이름+주소)는 1개만
  constraint visit_notes_user_place_unique unique (user_id, place_name, address)
);

-- RLS 반드시 켜기 (정책 없이 켜기만 하면 아무도 접근 못 하므로 아래 정책까지 함께 생성)
alter table public.visit_notes enable row level security;

-- 본인 행만 조회
create policy "visit_notes_select_own"
  on public.visit_notes
  for select
  using (auth.uid() = user_id);

-- 본인 user_id로만 추가
create policy "visit_notes_insert_own"
  on public.visit_notes
  for insert
  with check (auth.uid() = user_id);

-- 본인 행만 수정 (USING과 WITH CHECK 둘 다 — 수정 후에도 본인 소유 유지)
create policy "visit_notes_update_own"
  on public.visit_notes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
