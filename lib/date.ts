// 모든 날짜 계산은 한국 시간(Asia/Seoul) 기준으로 통일한다.
const TZ = "Asia/Seoul";

/** 서울 기준 오늘 날짜를 'YYYY-MM-DD'로 반환 */
export function seoulToday(): string {
  return seoulDateString(new Date());
}

/** 임의 Date를 서울 기준 'YYYY-MM-DD'로 변환 */
export function seoulDateString(d: Date): string {
  // en-CA 로캘은 YYYY-MM-DD 형식을 보장한다.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** 서울 기준 요일 (0=일 ~ 6=토) */
export function seoulWeekday(d: Date = new Date()): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(d);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

/** 'YYYY-MM-DD' 문자열에서 '일(day)' 숫자만 추출 */
export function dayOfMonth(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

/** 특정 연/월의 일 수 (month: 1~12) */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
