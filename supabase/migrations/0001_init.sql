-- 묵주기도 성월 출석체크 — 초기 스키마
-- Supabase SQL Editor 에서 전체 실행하세요.

-- ─────────────────────────────────────────────
-- 1) profiles : auth.users 와 1:1 로 연결되는 프로필
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  name           text not null,
  baptismal_name text not null,
  age            integer not null check (age between 5 and 25),
  role           text not null default 'student' check (role in ('student', 'teacher')),
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2) attendances : 하루 1건 출석(사진 업로드 시 자동 생성)
-- ─────────────────────────────────────────────
create table if not exists public.attendances (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  attend_date date not null,
  photo_path  text not null,
  created_at  timestamptz not null default now(),
  unique (student_id, attend_date)
);

-- ─────────────────────────────────────────────
-- 3) 교사 여부 헬퍼 (RLS 재귀 방지를 위해 SECURITY DEFINER)
-- ─────────────────────────────────────────────
create or replace function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- ─────────────────────────────────────────────
-- 4) RLS
-- ─────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.attendances enable row level security;

-- profiles: 본인 행 조회/수정/삽입, 교사는 전체 조회
drop policy if exists "profiles_select_self"   on public.profiles;
drop policy if exists "profiles_select_teacher" on public.profiles;
drop policy if exists "profiles_insert_self"   on public.profiles;
drop policy if exists "profiles_update_self"   on public.profiles;

create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_select_teacher" on public.profiles
  for select using (public.is_teacher());
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- attendances: 본인 삽입/조회, 교사는 전체 조회
drop policy if exists "att_select_self"    on public.attendances;
drop policy if exists "att_select_teacher" on public.attendances;
drop policy if exists "att_insert_self"    on public.attendances;

create policy "att_select_self" on public.attendances
  for select using (auth.uid() = student_id);
create policy "att_select_teacher" on public.attendances
  for select using (public.is_teacher());
create policy "att_insert_self" on public.attendances
  for insert with check (auth.uid() = student_id);

-- ─────────────────────────────────────────────
-- 5) Storage : 인증샷 버킷 (비공개)
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('attendance-photos', 'attendance-photos', false)
on conflict (id) do nothing;

-- 파일 경로 규칙: `${auth.uid()}/${날짜}.jpg`
drop policy if exists "photos_insert_own"  on storage.objects;
drop policy if exists "photos_select_own"  on storage.objects;
drop policy if exists "photos_select_teacher" on storage.objects;

create policy "photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attendance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attendance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_select_teacher" on storage.objects
  for select to authenticated
  using (bucket_id = 'attendance-photos' and public.is_teacher());

-- ─────────────────────────────────────────────
-- 교사 지정 예시 (로그인/온보딩 후 실행):
--   update public.profiles set role = 'teacher'
--   where name = '홍길동' and baptismal_name = '베드로';
-- ─────────────────────────────────────────────
