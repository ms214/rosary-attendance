import { getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { seoulToday, daysInMonth, dayOfMonth } from "@/lib/date";

export default async function CalendarPage() {
  const uid = await getUserId();
  const today = seoulToday();
  const [year, month] = today.split("-").map(Number); // month: 1~12
  const todayDay = dayOfMonth(today);

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const total = daysInMonth(year, month);
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${total}`;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("attendances")
    .select("attend_date, photo_path")
    .eq("student_id", uid)
    .gte("attend_date", monthStart)
    .lte("attend_date", monthEnd);

  const attendances = rows ?? [];

  // 썸네일용 서명 URL 일괄 생성
  const thumbByDay = new Map<number, string>();
  if (attendances.length > 0) {
    const { data: signed } = await supabase.storage
      .from("attendance-photos")
      .createSignedUrls(
        attendances.map((a) => a.photo_path),
        60 * 60,
      );
    const urlByPath = new Map(
      (signed ?? []).map((s) => [s.path, s.signedUrl]),
    );
    for (const a of attendances) {
      const url = urlByPath.get(a.photo_path);
      if (url) thumbByDay.set(dayOfMonth(a.attend_date), url);
    }
  }

  const attendedDays = new Set(
    attendances.map((a) => dayOfMonth(a.attend_date)),
  );

  // 달력 그리드 구성 (1일의 요일만큼 앞쪽 공백)
  const seoulFirstWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(new Date(`${monthStart}T12:00:00+09:00`));
  const offset = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    seoulFirstWeekday,
  );

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  return (
    <div className="px-6 py-8">
      <h1 className="mb-1 text-xl font-bold">나의 출석 도장판</h1>
      <p className="mb-6 text-sm text-gray-500">
        {year}년 {month}월 · 총 <b className="text-primary">{attendedDays.size}</b>
        일 출석
      </p>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-gray-400">
        {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
          <div key={w} className="pb-1 font-semibold">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const attended = attendedDays.has(d);
          const thumb = thumbByDay.get(d);
          const isToday = d === todayDay;
          return (
            <div
              key={d}
              className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-lg ${
                attended
                  ? "text-white"
                  : "bg-white text-gray-500 border border-primary-soft"
              } ${isToday ? "ring-2 ring-primary" : ""}`}
              style={
                attended && !thumb ? { backgroundColor: "var(--primary)" } : undefined
              }
            >
              {attended && thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <span
                className={`relative z-10 ${
                  attended && thumb
                    ? "rounded bg-black/40 px-1 text-[10px]"
                    : ""
                }`}
              >
                {attended ? "🙏" : d}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
