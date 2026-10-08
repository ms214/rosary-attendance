import Link from "next/link";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { seoulToday, daysInMonth, dayOfMonth } from "@/lib/date";
import type { Profile } from "@/lib/types";

export default async function AdminPage() {
  await requireTeacher();
  const today = seoulToday();
  const [year, month] = today.split("-").map(Number);
  const todayDay = dayOfMonth(today);
  const total = daysInMonth(year, month);
  const mm = String(month).padStart(2, "0");

  const supabase = await createClient();

  // 학생 목록·출석을 병렬 조회
  const [studentRes, attRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, baptismal_name, age, role, created_at")
      .eq("role", "student")
      .order("name"),
    supabase
      .from("attendances")
      .select("student_id, attend_date, method, photo_path")
      .gte("attend_date", `${year}-${mm}-01`)
      .lte("attend_date", `${year}-${mm}-${total}`),
  ]);
  const students = (studentRes.data ?? []) as Profile[];
  const attendances = attRes.data ?? [];

  // 서명 URL 일괄 생성 (묵주기도 출석은 사진이 없으므로 제외)
  const urlByPath = new Map<string, string>();
  const photoPaths = attendances
    .map((a) => a.photo_path)
    .filter((p): p is string => !!p);
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("attendance-photos")
      .createSignedUrls(photoPaths, 60 * 60);
    for (const s of signed ?? []) {
      if (s.signedUrl) urlByPath.set(s.path!, s.signedUrl);
    }
  }

  // student_id → (day → 출석 정보)
  type Cell = { rosary: boolean; url?: string };
  const byStudent = new Map<string, Map<number, Cell>>();
  for (const a of attendances) {
    if (!byStudent.has(a.student_id)) byStudent.set(a.student_id, new Map());
    byStudent.get(a.student_id)!.set(dayOfMonth(a.attend_date), {
      rosary: a.method === "rosary",
      url: a.photo_path ? urlByPath.get(a.photo_path) : undefined,
    });
  }

  const todayCount = students.filter((s) =>
    byStudent.get(s.id)?.has(todayDay),
  ).length;

  const days = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="px-5 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">교사 대시보드</h1>
        <Link href="/" className="text-xs text-gray-400 underline">
          홈으로
        </Link>
      </div>

      {/* 요약 */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Stat label="오늘 출석" value={`${todayCount} / ${students.length}명`} />
        <Stat label="이번 달" value={`${year}년 ${month}월`} />
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-gray-500">아직 등록된 학생이 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-soft bg-white">
          <table className="border-collapse text-center text-xs">
            <thead>
              <tr className="bg-primary-soft text-primary">
                <th className="sticky left-0 z-10 bg-primary-soft px-3 py-2 text-left">
                  학생
                </th>
                <th className="px-2 py-2">계</th>
                {days.map((d) => (
                  <th
                    key={d}
                    className={`w-8 px-1 py-2 font-medium ${
                      d === todayDay ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const dayMap = byStudent.get(s.id);
                const count = dayMap?.size ?? 0;
                return (
                  <tr key={s.id} className="border-t border-primary-soft">
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 text-left font-medium">
                      {s.name} {s.baptismal_name}
                    </td>
                    <td className="px-2 py-2 font-bold text-primary">{count}</td>
                    {days.map((d) => {
                      const cell = dayMap?.get(d);
                      return (
                        <td key={d} className="px-1 py-2">
                          {cell ? (
                            cell.rosary ? (
                              "📿"
                            ) : cell.url ? (
                              <a href={cell.url} target="_blank" rel="noreferrer">
                                🙏
                              </a>
                            ) : (
                              "🙏"
                            )
                          ) : (
                            <span className="text-gray-200">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400">
        🙏 사진 출석(탭하면 인증샷) · 📿 가상 묵주기도 출석. 가로로 스크롤하면 날짜별로 확인할 수 있어요.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary-soft bg-white p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-primary">{value}</p>
    </div>
  );
}
