import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /김민수/ }).click();
await page.locator('input[type="password"]').fill("0214");
await page.getByRole("button", { name: "로그인" }).click();
await page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 8000 });

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const statusCard = await page
  .locator("section")
  .first()
  .innerText()
  .catch(() => "(no section)");
console.log("=== 홈 출석 카드 ===\n" + statusCard);
await page.screenshot({ path: "scripts/shots/20-home.png", fullPage: true });
await browser.close();
