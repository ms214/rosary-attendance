// #3 보안 테스트: 학생이 자기 role 을 teacher 로 바꿀 수 있는가?
import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 매 실행마다 새 계정을 만들어 판정이 깨끗하도록 한다.
const NAME = `보안테스트${Date.now().toString().slice(-6)}`;
const BAPT = "test";
const PIN = "9999";

const key = `${NAME.normalize("NFC")} ${BAPT.normalize("NFC")}`;
const email = `u${crypto.createHash("sha256").update(key).digest("hex").slice(0, 40)}@rosary.local`;
const password = `rosary-pin-${PIN}`;

const supa = createClient(URL, KEY);

// 1) 테스트 학생 준비 (없으면 가입, 있으면 로그인)
await supa.auth.signUp({ email, password });
const { error: inErr } = await supa.auth.signInWithPassword({ email, password });
if (inErr) {
  console.log("❌ 테스트 학생 로그인 실패:", inErr.message);
  process.exit(1);
}
const { data: { user } } = await supa.auth.getUser();
await supa.from("profiles").upsert({
  id: user.id, name: NAME, baptismal_name: BAPT, age: 15,
});
console.log(`테스트 학생 준비 완료 (uid ${user.id.slice(0, 8)}…)`);

// 2) 현재 role 확인
const before = await supa.from("profiles").select("role").eq("id", user.id).single();
console.log("승격 시도 전 role:", before.data?.role);

// 3) 자가 승격 시도
const { error: upErr } = await supa
  .from("profiles")
  .update({ role: "teacher" })
  .eq("id", user.id);
console.log("update 에러:", upErr?.message ?? "(없음 — RLS는 통과)");

// 4) 결과 확인
const after = await supa.from("profiles").select("role").eq("id", user.id).single();
console.log("승격 시도 후 role:", after.data?.role);

console.log(
  after.data?.role === "teacher"
    ? "\n🚨 취약: 학생이 스스로 teacher 로 승격됨 (0003 마이그레이션 필요)"
    : "\n🔒 안전: role 변경이 차단됨 (student 유지)",
);
