import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { todaysMystery } from "@/lib/rosary";
import { seoulToday } from "@/lib/date";
import type { Profile } from "@/lib/types";
import { signOut } from "./actions";

export default async function Home() {
  const uid = await getUserId();
  const today = seoulToday();
  const mystery = todaysMystery();

  const supabase = await createClient();
  // 프로필·오늘출석·총개수를 한 번에 병렬 조회 (직렬 왕복 제거)
  const [profileRes, todayRes, countRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase
      .from("attendances")
      .select("id")
      .eq("student_id", uid)
      .eq("attend_date", today)
      .maybeSingle(),
    supabase
      .from("attendances")
      .select("id", { count: "exact", head: true })
      .eq("student_id", uid),
  ]);

  const profile = profileRes.data as Profile | null;
  if (!profile) redirect("/login");
  const todayAttendance = todayRes.data;
  const count = countRes.count;

  const done = !!todayAttendance;
  const prettyDate = formatKoreanDate(today);

  return (
    <div className="px-6 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{prettyDate}</p>
          <h1 className="text-xl font-bold">
            {profile.baptismal_name} {profile.name}님
          </h1>
        </div>
        <form action={signOut}>
          <button className="text-xs text-gray-400 underline">로그아웃</button>
        </form>
      </header>

      {/* 오늘 출석 상태 */}
      <section
        className={`mb-5 rounded-2xl p-5 text-white ${
          done ? "bg-primary" : "bg-gradient-to-br from-primary to-[#8a6fd0]"
        }`}
      >
        <p className="text-sm opacity-90">오늘의 출석</p>
        <p className="mt-1 text-2xl font-bold">
          {done ? "출석 완료! 🙏" : "아직 전이에요"}
        </p>
        {!done && (
          <Link
            href="/check-in"
            className="mt-4 inline-block rounded-xl bg-white px-5 py-2.5 font-semibold text-primary"
          >
            📷 인증샷 올리기
          </Link>
        )}
        {done && (
          <p className="mt-2 text-sm opacity-90">오늘도 묵주기도 바쳤어요.</p>
        )}
      </section>

      {/* 오늘의 신비 */}
      <Link
        href="/mystery"
        className="mb-4 block rounded-2xl border border-primary-soft bg-white p-5"
      >
        <p className="text-sm text-gray-400">오늘의 추천 신비</p>
        <p className="mt-1 text-lg font-bold" style={{ color: mystery.color }}>
          {mystery.name}
        </p>
        <p className="mt-1 text-sm text-gray-500">탭하여 5단 묵상 보기 →</p>
      </Link>

      {/* 바로가기 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/rosary"
          className="rounded-2xl border border-primary-soft bg-white p-5 text-center"
        >
          <div className="text-3xl">📿</div>
          <p className="mt-1 text-sm font-semibold">가상 묵주로 기도</p>
        </Link>
        <Link
          href="/calendar"
          className="rounded-2xl border border-primary-soft bg-white p-5 text-center"
        >
          <div className="text-3xl">📅</div>
          <p className="mt-1 text-sm font-semibold">
            출석 도장 {count ?? 0}개
          </p>
        </Link>
      </div>

      {profile.role === "teacher" && (
        <Link
          href="/admin"
          className="mt-4 block rounded-2xl bg-accent/20 p-4 text-center text-sm font-semibold text-[#8a6a1a]"
        >
          👩‍🏫 교사 대시보드 열기
        </Link>
      )}
    </div>
  );
}

function formatKoreanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(new Date(`${iso}T12:00:00+09:00`));
  return `${y}년 ${m}월 ${d}일 (${wd})`;
}
