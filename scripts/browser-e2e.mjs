// 실제 브라우저(Playwright)로 전체 학생 플로우를 조작한다.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const PIN = "0214";

// 업로드용 1x1 PNG 파일 생성
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
fs.writeFileSync("/tmp/rosary-test.png", PNG);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const step = (n, m) => console.log(`\n[${n}] ${m}`);

// 1) 로그인
step(1, "로그인");
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /김민수/ }).click();
await page.locator('input[type="password"]').fill(PIN);
await page.getByRole("button", { name: "로그인" }).click();
await page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 8000 });
console.log("  ✅ 홈 진입:", await page.locator("h1").first().innerText());

// 2) 출석 체크 (업로드 or 이미 완료)
step(2, "출석 체크 (/check-in)");
await page.goto(`${BASE}/check-in`, { waitUntil: "networkidle" });
const fileInput = page.locator('input[name="photo"]');
if ((await fileInput.count()) > 0) {
  await fileInput.setInputFiles("/tmp/rosary-test.png");
  await page.getByRole("button", { name: "출석 체크하기" }).click();
  await page.getByText("출석 완료").waitFor({ timeout: 15000 });
  console.log("  ✅ 사진 업로드 → 출석 완료 표시");
} else {
  console.log("  ℹ️ 오늘은 이미 출석 완료 상태");
}
await page.screenshot({ path: "scripts/shots/10-checkin.png" });

// 3) 홈에 출석 완료 반영
step(3, "홈 반영 확인");
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const home = await page.locator("body").innerText();
console.log("  출석 상태:", home.includes("출석 완료") ? "✅ 출석 완료" : "❌ 미반영");

// 4) 도장판
step(4, "도장판 (/calendar)");
await page.goto(`${BASE}/calendar`, { waitUntil: "networkidle" });
const stamps = await page.getByText("🙏").count();
console.log(`  ✅ 출석 도장 ${stamps}개 표시`);
await page.screenshot({ path: "scripts/shots/11-calendar.png" });

// 5) 가상 묵주
step(5, "가상 묵주 (/rosary)");
await page.goto(`${BASE}/rosary`, { waitUntil: "networkidle" });
const first = await page.locator("body").innerText();
console.log("  첫 단계 표시:", first.includes("성호경") ? "✅ 성호경" : "⚠️ 확인필요");
await page.getByRole("button", { name: "다음" }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: "scripts/shots/12-rosary.png" });

// 6) 관리자 페이지 접근 (teacher면 매트릭스, student면 홈으로 리다이렉트)
step(6, "교사 대시보드 (/admin)");
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
const adminPath = new URL(page.url()).pathname;
if (adminPath === "/admin") {
  console.log("  ✅ 교사 권한 — 대시보드 접근됨");
} else {
  console.log("  ℹ️ 학생 권한 — 홈으로 리다이렉트 (role=teacher 승격 SQL 필요)");
}
await page.screenshot({ path: "scripts/shots/13-admin.png" });

console.log("\n🎉 브라우저 e2e 완료");
await browser.close();
