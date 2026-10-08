-- 가상 묵주기도를 끝까지 마친 경우에도 출석으로 인정한다.
-- 출석 방식(method)을 기록하고, 묵주기도 출석은 사진이 없으므로 photo_path 를 선택값으로 바꾼다.
alter table public.attendances
  add column if not exists method text not null default 'photo';

alter table public.attendances
  drop constraint if exists attendances_method_check;
alter table public.attendances
  add constraint attendances_method_check
  check (method in ('photo', 'rosary'));

alter table public.attendances
  alter column photo_path drop not null;

-- 사진 출석은 반드시 사진 경로가 있어야 한다.
alter table public.attendances
  drop constraint if exists attendances_photo_required;
alter table public.attendances
  add constraint attendances_photo_required
  check (method <> 'photo' or photo_path is not null);
