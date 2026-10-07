import { chromium } from "playwright";
const BASE = "https://rosary-eight.vercel.app";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();

// 로그인
let t = Date.now();
await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p.getByPlaceholder(/이름/).fill("김민수");
await p.getByPlaceholder(/세례명/).fill("브루노");
await p.getByPlaceholder(/PIN/).fill("0214");
await p.getByRole("button", { name: "로그인" }).click();
await p.waitForURL((u) => new URL(u).pathname === "/", { timeout: 15000 });
await p.waitForLoadState("networkidle");
console.log(`로그인→홈            : ${Date.now() - t}ms`);

// 하단 탭 이동 (클라이언트 네비게이션 체감 속도)
async function nav(label, name, expect) {
  const t = Date.now();
  await p.getByRole("link", { name }).first().click();
  await p.getByText(expect).first().waitFor({ timeout: 15000 });
  console.log(`${label.padEnd(18)}: ${Date.now() - t}ms`);
}
await nav("홈→출석",     /출석/,     /오늘의 출석/);
await nav("출석→묵주기도", /묵주기도/, /성호경|제1단/);
await nav("묵주기도→도장판", /도장판/, /출석 도장판/);
await nav("도장판→홈",   /홈/,       /오늘의 출석/);

await b.close();
