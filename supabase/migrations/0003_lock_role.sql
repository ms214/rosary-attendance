-- 보안: 학생이 자기 role 을 teacher 로 바꾸는 자가 승격을 차단한다.
-- profiles 의 "본인 행 수정" 정책에는 role 도 포함되므로, 트리거로 role 변경을 막는다.
-- 규칙: JWT 를 가진 사용자(auth.uid() 존재 = 앱에서 로그인한 학생/교사)는 role 변경 불가.
--       role 승격은 Supabase SQL Editor(관리자, auth.uid() = NULL) 또는 service_role 로만 가능.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    new.role := old.role; -- 앱에서의 role 변경 시도는 조용히 무시(원래 값 유지)
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();
