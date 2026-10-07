// 새 로그인(이름·세례명·PIN 직접 입력) 실제 브라우저 테스트
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });

// 명단이 더 이상 노출되지 않아야 함
const hasList = await page.getByText("명단에서").count();
console.log("명단 노출 여부:", hasList === 0 ? "✅ 없음(프라이버시 OK)" : "❌ 아직 보임");
await page.screenshot({ path: "scripts/shots/30-login-new.png" });

// 이름/세례명/PIN 입력
await page.getByPlaceholder(/이름/).fill("김민수");
await page.getByPlaceholder(/세례명/).fill("브루노");
await page.getByPlaceholder(/PIN/).fill("0214");
await page.getByRole("button", { name: "로그인" }).click();

await page
  .waitForURL((u) => new URL(u).pathname === "/", { timeout: 8000 })
  .catch(() => {});
const path = new URL(page.url()).pathname;
if (path === "/") {
  console.log("🎉 로그인 성공 → 홈:", await page.locator("h1").first().innerText());
} else {
  const err = await page.getByText(/올바르지 않아요|입력/).allInnerTexts().catch(() => []);
  console.log("❌ 로그인 실패 —", path, "|", err.join(" "));
}

// 오입력 시 실패하는지도 확인
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByPlaceholder(/이름/).fill("김민수");
await page.getByPlaceholder(/세례명/).fill("브루노");
await page.getByPlaceholder(/PIN/).fill("0000");
await page.getByRole("button", { name: "로그인" }).click();
await page.waitForTimeout(1500);
const wrongErr = await page.getByText(/올바르지 않아요/).count();
console.log("틀린 PIN 거부:", wrongErr > 0 ? "✅ 거부됨" : "❌ 통과돼버림");

await browser.close();
