import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * 현재 사용자 id를 반환한다.
 * getClaims()는 JWT를 (JWKS로) 로컬 검증하므로 네트워크 왕복이 없다 — getUser()보다 빠르다.
 * 미로그인 시 /login 으로 이동.
 */
export async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
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
