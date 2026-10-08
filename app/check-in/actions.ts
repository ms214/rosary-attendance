"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { seoulToday } from "@/lib/date";

export type UploadResult = { ok: true } | { ok: false; error: string };

export async function uploadAttendance(
  _prev: UploadResult | null,
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "사진을 선택해 주세요." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "사진 용량은 10MB 이하여야 해요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };

  const today = seoulToday();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${today}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("attendance-photos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { ok: false, error: "사진 업로드에 실패했어요. 다시 시도해 주세요." };
  }

  const { error: dbError } = await supabase.from("attendances").upsert(
    {
      student_id: user.id,
      attend_date: today,
      method: "photo",
      photo_path: path,
    },
    { onConflict: "student_id,attend_date" },
  );

  if (dbError) {
    return { ok: false, error: "출석 처리에 실패했어요. 다시 시도해 주세요." };
  }

  revalidatePath("/");
  revalidatePath("/check-in");
  revalidatePath("/calendar");
  return { ok: true };
}
