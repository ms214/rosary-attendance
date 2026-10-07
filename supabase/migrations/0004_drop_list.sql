-- 로그인 방식을 "명단 선택"에서 "이름+세례명+PIN 직접 입력"으로 변경.
-- 더 이상 전체 명단을 공개할 필요가 없으므로, 이름을 anon 에게 노출하던
-- list_students() RPC 를 제거한다(프라이버시 강화).
drop function if exists public.list_students();
