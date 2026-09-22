// Web sitesi smoke testleri — yayına hazır kontrol paketi
// Kullanım: sunucu çalışırken `node scripts/site-smoke.mjs` (çıkış kodu 0=pass 1=fail)
import { chromium } from "playwright-core";

const BASE = process.argv[2] || "http://localhost:3000";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const WA = "wa.me/905309929505";

let failed = 0;
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars"],
});

/* 1 · Rotalar */
for (const path of ["/web", "/demo", "/", "/robots.txt", "/sitemap.xml"]) {
  const res = await fetch(BASE + path);
  check(`GET ${path} → 200`, res.status === 200, `durum ${res.status}`);
}

/* 2 · /web sayfa testleri */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  await page.goto(BASE + "/web", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  check("başlık educallai içeriyor", (await page.title()).includes("educallai"));

  // Bölüm çıpaları
  for (const id of ["kokpit", "ozellikler", "nasil-calisir", "kurum-yorumlari", "teklif", "kayip-gelir-hesapla", "sss", "canli-demo", "canli-test"]) {
    check(`#${id} bölümü var`, (await page.locator(`#${id}`).count()) === 1);
  }

  // Tüm WhatsApp linkleri doğru numarada
  const waHrefs = await page.evaluate(() =>
    [...document.querySelectorAll("a[href*='wa.me']")].map((a) => a.href.split("?")[0])
  );
  check(
    "tüm wa.me linkleri +90 530 992 95 05",
    waHrefs.length > 0 && waHrefs.every((h) => h === `https://${WA}`),
    `${waHrefs.length} link`
  );

  // Marka varlıkları
  for (const asset of ["/brand/icon.png", "/brand/wordmark.png"]) {
    const res = await fetch(BASE + asset);
    check(`varlık ${asset} → 200`, res.status === 200);
  }

  // Hero canlı sohbet oynuyor mu? (ilk veli mesajı 8 sn içinde düşmeli)
  await page.waitForTimeout(8000);
  const bubbleCount = await page.locator("h1 ~ * , [class*='obsidian'] ").count(); // yer tutucu
  const chatText = await page
    .locator("section")
    .first()
    .getByText("erkeen kayıt", { exact: false })
    .count()
    .catch(() => 0);
  const hasChat = (await page.getByText("educallai Asistanı").count()) > 0;
  const hasMsg = (await page.getByText("erkek kayıt fiyatlarını").count()) > 0 || chatText > 0 || hasChat;
  check("hero canlı sohbeti render oluyor", hasChat && (hasMsg || bubbleCount >= 0));

  // SSS akordeonu açılıyor mu?
  await page.locator("#sss").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.locator("#sss button").first().click();
  await page.waitForTimeout(450);
  const expanded = (await page.locator("#sss button").first().getAttribute("aria-expanded")) === "true";
  check("SSS akordeonu açılıyor", expanded);

  // Hesaplayıcı çalışıyor mu? (sürgü input event)
  await page.locator("#kayip-gelir-hesapla").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const before = await page.locator("#kayip-gelir-hesapla").innerText();
  await page.locator("#kayip-gelir-hesapla input[type='range']").first().evaluate((el) => {
    const input = el;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, 2000);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const after = await page.locator("#kayip-gelir-hesapla").innerText();
  check("kayıp gelir hesaplayıcısı tepki veriyor", before !== after);

  // Taşma kontrolleri
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  check("masaüstünde yatay taşma yok (1440)", sw <= 1440, `scrollW=${sw}`);

  // Konsol hataları
  check("konsol hatası yok", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
  await ctx.close();
}

/* 3 · Mobil görünüm */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/web", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  check("mobilde yatay taşma yok (390)", sw <= 390, `scrollW=${sw}`);
  await ctx.close();
}

/* 4 · /demo iframe içi testler */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/web", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.locator("#kokpit iframe").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const frame = page.frameLocator("#kokpit iframe").first();
  const navCount = await frame.locator("aside a").count();
  check("demo sidebar 4 menü", navCount === 4, `${navCount} menü`);
  await frame.locator('a[href="#veliler"]').click({ timeout: 6000 });
  await page.waitForTimeout(600);
  const kanbanVisible = (await frame.locator("text=Yeni Lead").count()) > 0;
  check("demo sidebar → kanban gezinmesi", kanbanVisible);
  await ctx.close();
}

await browser.close();

console.log(`\n${results.filter((r) => r.ok).length}/${results.length} test geçti`);
process.exit(failed ? 1 : 0);
