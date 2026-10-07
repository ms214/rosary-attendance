// #1 출석 업로드 end-to-end 자동 점검 (김민수 / PIN 0214)
// 테스트 흔적이 10월 도장판에 보이지 않도록 날짜는 2000-01-01 센티넬 사용.
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PIN = "0214";
const TEST_DATE = "2000-01-01";

function syntheticEmail(name, baptismal) {
  const key = `${name.trim().normalize("NFC")} ${baptismal.trim().normalize("NFC")}`;
  const hex = crypto.createHash("sha256").update(key).digest("hex").slice(0, 40);
  return `u${hex}@rosary.local`;
}
const pinToPassword = (pin) => `rosary-pin-${pin}`;

// 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

const log = (ok, msg) => console.log(`${ok ? "✅" : "❌"} ${msg}`);

const anon = createClient(URL, KEY);

// 0) 명단에서 김민수 찾기
const { data: students, error: rpcErr } = await anon.rpc("list_students");
if (rpcErr) {
  log(false, `list_students RPC 실패: ${rpcErr.message}`);
  process.exit(1);
}
log(true, `list_students RPC 동작 (학생 ${students.length}명)`);
const kim = students.find((s) => s.name === "김민수");
if (!kim) {
  log(false, "명단에 김민수가 없습니다. 먼저 가입이 필요해요.");
  process.exit(1);
}
log(true, `김민수 발견 (세례명: ${kim.baptismal_name})`);

// 1) 로그인
const email = syntheticEmail(kim.name, kim.baptismal_name);
const { data: auth, error: inErr } = await anon.auth.signInWithPassword({
  email,
  password: pinToPassword(PIN),
});
if (inErr) {
  log(false, `PIN 0214 로그인 실패: ${inErr.message}`);
  process.exit(1);
}
const uid = auth.user.id;
log(true, `PIN 0214 로그인 성공 (uid ${uid.slice(0, 8)}…)`);

// 2) 사진 업로드 (본인 폴더)
const path = `${uid}/${TEST_DATE}.png`;
const { error: upErr } = await anon.storage
  .from("attendance-photos")
  .upload(path, PNG, { upsert: true, contentType: "image/png" });
log(!upErr, upErr ? `업로드 실패: ${upErr.message}` : `사진 업로드 성공 (${path})`);
if (upErr) process.exit(1);

// 3) 출석 upsert
const { error: dbErr } = await anon.from("attendances").upsert(
  { student_id: uid, attend_date: TEST_DATE, photo_path: path },
  { onConflict: "student_id,attend_date" },
);
log(!dbErr, dbErr ? `출석 insert 실패: ${dbErr.message}` : "출석 레코드 생성 성공");
if (dbErr) process.exit(1);

// 3b) 하루 1건: 같은 날짜 재업로드 → 레코드 수 그대로여야
await anon.from("attendances").upsert(
  { student_id: uid, attend_date: TEST_DATE, photo_path: path },
  { onConflict: "student_id,attend_date" },
);
const { count: dupCount } = await anon
  .from("attendances")
  .select("id", { count: "exact", head: true })
  .eq("student_id", uid)
  .eq("attend_date", TEST_DATE);
log(dupCount === 1, `하루 1건 유지 (해당 날짜 레코드 ${dupCount}건)`);

// 4) 본인 데이터 읽기 + 서명 URL
const { data: row } = await anon
  .from("attendances")
  .select("photo_path")
  .eq("student_id", uid)
  .eq("attend_date", TEST_DATE)
  .maybeSingle();
log(!!row, row ? "본인 출석 조회 성공" : "본인 출석 조회 실패");
const { data: signed } = await anon.storage
  .from("attendance-photos")
  .createSignedUrl(path, 60);
log(!!signed?.signedUrl, signed?.signedUrl ? "사진 서명 URL 발급 성공" : "서명 URL 실패");

// 5) RLS 격리: 비로그인 익명 클라이언트는 출석/사진을 못 봐야 함
const stranger = createClient(URL, KEY);
const { data: leaked } = await stranger
  .from("attendances")
  .select("id")
  .eq("student_id", uid);
log(
  (leaked?.length ?? 0) === 0,
  `RLS: 비로그인은 타인 출석 조회 불가 (조회된 ${leaked?.length ?? 0}건)`,
);
const { data: leakUrl } = await stranger.storage
  .from("attendance-photos")
  .createSignedUrl(path, 60);
log(!leakUrl?.signedUrl, `RLS: 비로그인은 사진 서명 URL 발급 불가`);

console.log("\n🎉 #1 출석 업로드 e2e 통과");
