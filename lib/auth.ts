import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * 현재 사용자 id를 반환한다.
 * 쿠키에서 세션을 로컬로 읽기만 한다(네트워크 왕복 없음). 서명 검증은 하지 않지만,
 * 미들웨어가 게이트를 담당하고 실제 데이터는 Supabase가 쿼리 시점에 JWT를 검증(RLS)하므로
 * 위조 쿠키로는 타인 데이터를 읽을 수 없다.
 * 미로그인 시 /login 으로 이동.
 */
export async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) redirect("/login");
  return uid;
}

/**
 * 현재 로그인한 사용자의 프로필을 반환한다.
 * - 미로그인 또는 프로필 없음: /login 으로 이동
 */
export async function requireProfile(): Promise<Profile> {
  const uid = await getUserId();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .maybeSingle();

  if (!profile) redirect("/login");
  return profile as Profile;
}

/** 교사 전용 페이지 가드 */
export async function requireTeacher(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "teacher") redirect("/");
  return profile;
}
