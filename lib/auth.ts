import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * 현재 로그인한 사용자의 프로필을 반환한다.
 * - 미로그인 또는 프로필 없음: /login 으로 이동
 *   (프로필은 가입 시 함께 생성되므로 정상 흐름에선 항상 존재한다)
 */
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
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
