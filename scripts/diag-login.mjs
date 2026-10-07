import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const name = "김민수";
const baptismal = "브루노";
const PIN = "0214";
const key = `${name.trim().normalize("NFC")} ${baptismal.trim().normalize("NFC")}`;

// 방식 A: Node createHash
const hexA = crypto.createHash("sha256").update(key).digest("hex").slice(0, 40);
const emailA = `u${hexA}@rosary.local`;

// 방식 B: Web Crypto (브라우저 lib와 동일 경로)
const digest = await crypto.webcrypto.subtle.digest(
  "SHA-256",
  new TextEncoder().encode(key),
);
const hexB = Array.from(new Uint8Array(digest).slice(0, 20))
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");
const emailB = `u${hexB}@rosary.local`;

console.log("key         :", JSON.stringify(key));
console.log("email(Node) :", emailA);
console.log("email(Web)  :", emailB);
console.log("두 방식 일치 :", emailA === emailB);
console.log("password    :", `rosary-pin-${PIN}`);

const supa = createClient(URL, KEY);
const { data, error } = await supa.auth.signInWithPassword({
  email: emailB,
  password: `rosary-pin-${PIN}`,
});
console.log("\n--- signInWithPassword 결과 ---");
if (error) {
  console.log("status:", error.status);
  console.log("code  :", error.code);
  console.log("name  :", error.name);
  console.log("msg   :", error.message);
} else {
  console.log("✅ 로그인 성공, uid:", data.user.id);
}
