import Link from "next/link";
import { getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { seoulToday } from "@/lib/date";
import Uploader from "./Uploader";

export default async function CheckInPage() {
  const uid = await getUserId();
  const today = seoulToday();

  const supabase = await createClient();
  const { data: attendance } = await supabase
    .from("attendances")
    .select("method, photo_path")
    .eq("student_id", uid)
    .eq("attend_date", today)
    .maybeSingle();

  let photoUrl: string | null = null;
  if (attendance?.photo_path) {
    const { data } = await supabase.storage
      .from("attendance-photos")
      .createSignedUrl(attendance.photo_path, 60 * 60);
    photoUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="px-6 py-8">
      <h1 className="mb-1 text-xl font-bold">오늘의 출석</h1>
      <p className="mb-6 text-sm text-gray-500">
        묵주기도 후 인증샷을 올리거나,{" "}
        <Link href="/rosary" className="text-primary underline">
          가상 묵주기도
        </Link>
        를 끝까지 마치면 출석 완료!
      </p>

      {attendance ? (
        <div className="space-y-5">
          {photoUrl && (
            <div className="overflow-hidden rounded-2xl border border-primary-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="오늘의 인증샷" className="w-full" />
            </div>
          )}
          <div className="rounded-xl bg-primary-soft p-4 text-center font-semibold text-primary">
            ✅ 오늘 출석 완료! 🙏
            {attendance.method === "rosary" && (
              <p className="mt-1 text-sm font-normal">
                가상 묵주기도를 마쳐서 출석했어요 📿
              </p>
            )}
          </div>
          <Link
            href="/calendar"
            className="block text-center text-sm text-primary underline"
          >
            출석 도장판 보기 →
          </Link>
        </div>
      ) : (
        <Uploader />
      )}
    </div>
  );
}
