// 실제 브라우저(Playwright)로 로그인 UI를 조작한다.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const PIN = process.env.TEST_PIN || "0214";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

const logs = [];
page.on("console", (m) => logs.push(`[console.${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.screenshot({ path: "scripts/shots/01-login.png" });

// 명단(list_students RPC) 로드 대기 → 김민수 선택
await page.getByRole("button", { name: /김민수/ }).waitFor({ timeout: 10000 });
console.log("✅ 명단에 김민수 버튼 표시됨");
await page.getByRole("button", { name: /김민수/ }).click();

// PIN 입력 화면
await page.locator('input[type="password"]').waitFor({ timeout: 5000 });
await page.screenshot({ path: "scripts/shots/02-pin.png" });
await page.locator('input[type="password"]').fill(PIN);
console.log(`✅ PIN ${PIN} 입력`);

await page.getByRole("button", { name: "로그인" }).click();

// 홈 이동 or 에러 메시지 대기
await page
  .waitForURL((u) => new URL(u).pathname === "/", { timeout: 8000 })
  .catch(() => {});
await page.waitForTimeout(1500);

const url = page.url();
const pathname = new URL(url).pathname;
const errText = await page
  .getByText(/올바르지 않아요|PIN/)
  .allInnerTexts()
  .catch(() => []);

await page.screenshot({ path: "scripts/shots/03-after-login.png" });

console.log("\n--- 결과 ---");
console.log("최종 URL   :", url);
if (pathname === "/") {
  console.log("🎉 로그인 성공 → 홈 진입");
  const greet = await page.locator("h1").first().innerText().catch(() => "");
  console.log("홈 인사말  :", greet);
} else {
  console.log("❌ 로그인 실패 — 여전히", pathname);
  console.log("화면 메시지:", errText.join(" | ") || "(없음)");
}
if (logs.length) console.log("\n[브라우저 콘솔]\n" + logs.join("\n"));

await browser.close();
