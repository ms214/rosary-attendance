-- 로그인 화면의 "이름 선택" 명단용 공개 RPC.
-- profiles 는 RLS로 보호되므로, 로그인 전(anon) 상태에서 이름만 조회할 수 있도록
-- SECURITY DEFINER 함수로 이름/세례명만 노출한다. (성당 내부용, 민감정보 없음)
create or replace function public.list_students()
returns table (name text, baptismal_name text)
language sql
security definer
set search_path = public
as $$
  select name, baptismal_name
  from public.profiles
  order by name;
$$;

grant execute on function public.list_students() to anon, authenticated;
