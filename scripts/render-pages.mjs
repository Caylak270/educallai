// Tam sayfa render aracı — gerçek viewport kontrolüyle (headless sistem Chrome'u)
// Kullanım: node scripts/render-pages.mjs [baseUrl]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:3000";
const OUT = "docs/render";
mkdirSync(OUT, { recursive: true });

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const PAGES = [
  { url: "/", w: 1440, file: "01-genel-bakis-desktop.png" },
  { url: "/ayarlar", w: 1440, file: "02-ayarlar-desktop.png" },
  { url: "/kampanyalar", w: 1440, file: "09-kampanyalar-desktop.png" },
  { url: "/gorusmeler", w: 1440, file: "10-gorusmeler-desktop.png" },
  { url: "/randevular", w: 1440, file: "11-randevular-desktop.png" },
  { url: "/raporlar", w: 1440, file: "12-raporlar-desktop.png" },
  { url: "/veliler", w: 1440, file: "15-veliler-desktop.png" },
  { url: "/deneme-analizi", w: 1440, file: "16-deneme-desktop.png" },
  { url: "/tahsilat", w: 1440, file: "17-tahsilat-desktop.png" },
  { url: "/veliler", w: 390, file: "03-veliler-mobile.png" },
  { url: "/tahsilat", w: 390, file: "04-tahsilat-mobile.png" },
  { url: "/deneme-analizi", w: 390, file: "05-deneme-analizi-mobile.png" },
  { url: "/kampanyalar", w: 390, file: "06-kampanyalar-mobile.png" },
  { url: "/gorusmeler/deneme-1", w: 390, file: "07-gorusme-detay-mobile.png" },
  { url: "/", w: 390, file: "08-genel-bakis-mobile.png" },
  { url: "/randevular", w: 390, file: "13-randevular-mobile.png" },
  { url: "/raporlar", w: 390, file: "14-raporlar-mobile.png" },
];

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1"],
});

for (const p of PAGES) {
  const ctx = await browser.newContext({
    viewport: { width: p.w, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(BASE + p.url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800); // fontlar + ikonlar
  const h = await page.evaluate(
    () => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
  );
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.screenshot({ path: `${OUT}/${p.file}`, fullPage: true });
  console.log(`${p.file} viewport=${p.w} contentH=${h} scrollW=${sw}${sw > p.w ? "  ← YATAY TAŞMA!" : ""}`);
  await ctx.close();
}

await browser.close();
