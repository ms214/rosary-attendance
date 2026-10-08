"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { seoulToday } from "@/lib/date";

export type CompleteResult =
  | { ok: true; alreadyDone: boolean }
  | { ok: false; error: string };

/** 가상 묵주기도를 끝까지 마치면 오늘 출석으로 인정한다. */
export async function completeRosary(): Promise<CompleteResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return { ok: false, error: "로그인이 필요해요." };

  // 이미 사진 등으로 출석했다면 그 기록(사진)을 덮어쓰지 않는다.
  const { data, error } = await supabase
    .from("attendances")
    .upsert(
      { student_id: uid, attend_date: seoulToday(), method: "rosary" },
      { onConflict: "student_id,attend_date", ignoreDuplicates: true },
    )
    .select("id");

  if (error) {
    return { ok: false, error: "출석 처리에 실패했어요. 다시 시도해 주세요." };
  }

  revalidatePath("/");
  revalidatePath("/check-in");
  revalidatePath("/calendar");
  return { ok: true, alreadyDone: (data ?? []).length === 0 };
}
