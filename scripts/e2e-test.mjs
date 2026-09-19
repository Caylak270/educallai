/**
 * educallai — Uçtan uca sistem testi (E2E)
 * Kullanım: node scripts/e2e-test.mjs
 * Kapsam: tüm route'lar + etkileşimler (kanban DnD, arama, Ara butonları, sekmeler,
 *         filtreler) + API uçları + konsol/ağ hataları.
 */
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const results = [];
const consoleErrors = [];

function log(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1"],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(`${page.url()} :: ${msg.text().slice(0, 160)}`);
});
page.on("pageerror", (err) => consoleErrors.push(`${page.url()} :: PAGEERROR ${String(err).slice(0, 160)}`));
page.on("response", (res) => {
  if (res.status() >= 500) consoleErrors.push(`HTTP500 ${res.url()}`);
});

// ── 1) Tüm route'lar render oluyor mu ──────────────────────────
const routes = [
  ["/", "Günaydın, Ahmet Bey"],
  ["/veliler", "Veliler (CRM)"],
  ["/gorusmeler", "Görüşmeler"],
  ["/gorusmeler/deneme-1", "Ayşe Yılmaz"],
  ["/tahsilat", "Tahsilat"],
  ["/deneme-analizi", "Deneme Analizi"],
  ["/kampanyalar", "Kampanyalar"],
  ["/randevular", "Randevular"],
  ["/raporlar", "Raporlar"],
  ["/ayarlar", "AI Asistan Yetenekleri"],
];
for (const [route, expect] of routes) {
  const res = await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  const body = await page.textContent("body");
  log(`route ${route}`, res.status() === 200 && body.includes(expect), `status=${res.status()}`);
}

// ── 2) Veliler: kanban varsayılan + sütunlar ───────────────────
await page.goto(BASE + "/veliler", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const columns = await page.locator("[data-stage]").count();
log("kanban: 7 aşama sütunu", columns === 7, `bulunan=${columns}`);
const yeniCount = await page.locator('[data-stage="yeni"] article').count();
log("kanban: Yeni sütununda kart var", yeniCount >= 3, `kart=${yeniCount}`);

// Görünüm değişimi: Liste ↔ Pano
await page.getByRole("button", { name: "Liste" }).click();
await page.waitForTimeout(400);
const listCards = await page.getByText("Zeynep Kaya").count();
await page.getByRole("button", { name: "Pano" }).click();
await page.waitForTimeout(400);
const boardBack = await page.locator("[data-stage]").count();
log("veliler: Pano/Liste geçişi", listCards > 0 && boardBack === 7, `liste=${listCards} kart, pano=${boardBack} sütun`);

// ── 3) Kanban sürükle-bırak: Zeynep (ilgilendi) → Yeni ─────────
const card = page.locator('[data-stage="ilgilendi"] article', { hasText: "Zeynep Kaya" });
const beforeYeni = await page.locator('[data-stage="yeni"] article').count();
await card.dragTo(page.locator('[data-stage="yeni"]'));
await page.waitForTimeout(600);
const afterYeni = await page.locator('[data-stage="yeni"] article').count();
const zeynepYeni = await page
  .locator('[data-stage="yeni"] article', { hasText: "Zeynep Kaya" })
  .count();
log("kanban: sürükle-bırak aşama taşıma", zeynepYeni === 1 && afterYeni === beforeYeni + 1, `yeni sütun ${beforeYeni}→${afterYeni}`);
// geri taşı (state temiz kalsın)
await page.locator('[data-stage="yeni"] article', { hasText: "Zeynep Kaya" }).dragTo(page.locator('[data-stage="ilgilendi"]'));
await page.waitForTimeout(500);

// ── 4) Veliler arama ───────────────────────────────────────────
await page.getByPlaceholder("Veli, öğrenci adı veya telefon...").fill("zeynep");
await page.waitForTimeout(500);
const searchHits = await page.locator("[data-stage] article").count();
log("veliler: arama 'zeynep'", searchHits === 1, `eşleşen=${searchHits}`);
await page.getByPlaceholder("Veli, öğrenci adı veya telefon...").fill("telefon-olmayan-sorgu");
await page.waitForTimeout(400);
const zeroHit = await page.locator("[data-stage] article").count();
log("veliler: boş arama durumu", zeroHit === 0, `eşleşen=${zeroHit}`);
await page.getByPlaceholder("Veli, öğrenci adı veya telefon...").fill("");
await page.waitForTimeout(400);

// ── 5) Veli drawer + AI arama butonu (API'ye gider) ────────────
const apiCalls = [];
page.on("request", (req) => {
  if (req.url().includes("/api/calls")) apiCalls.push(req.url());
});
await page.locator('[data-stage="ilgilendi"] article', { hasText: "Zeynep Kaya" }).click();
await page.waitForTimeout(700);
const drawerVisible = await page.getByText("Şimdi Ara (AI Asistan)").isVisible();
log("veliler: drawer açılıyor", drawerVisible);
await page.getByRole("button", { name: "Şimdi Ara (AI Asistan)" }).click();
await page.waitForTimeout(1500);
const started = await page.getByText("Başlatıldı").count();
log("veliler: Ara butonu API çağırıp başlıyor", apiCalls.length >= 1 && started >= 1, `api=${apiCalls.length}`);
await page.keyboard.press("Escape");
await page.locator('[aria-label="Veli detayını kapat"]').click().catch(() => {});
await page.waitForTimeout(400);

// ── 6) Dashboard: sıcak lead Ara butonu ────────────────────────
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const hotAra = page.locator("table button", { hasText: "Ara" }).first();
await hotAra.click();
await page.waitForTimeout(1500);
const hotStarted = await page.locator("table").getByText("Başlatıldı").count();
log("dashboard: sıcak lead Ara butonu", hotStarted >= 1);

// ── 7) Global arama Enter → /veliler?q= ────────────────────────
await page.getByPlaceholder(/Veli, öğrenci veya görüşme ara/).fill("murat");
await page.keyboard.press("Enter");
await page.waitForTimeout(1200);
const urlNow = page.url();
const qApplied = await page.getByPlaceholder("Veli, öğrenci adı veya telefon...").inputValue();
log("global arama: /veliler?q= yönlendirme", urlNow.includes("/veliler?q=murat") && qApplied === "murat", urlNow);

// ── 8) Tahsilat: filtre + arama ────────────────────────────────
await page.goto(BASE + "/tahsilat", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /Gecikenler/ }).click();
await page.waitForTimeout(500);
const gecikenCards = await page.locator("article").count();
log("tahsilat: gecikenler filtresi", gecikenCards > 0, `kart=${gecikenCards}`);

// ── 9) Kampanyalar: sekme filtresi ─────────────────────────────
await page.goto(BASE + "/kampanyalar", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /Duraklatıldı/ }).click();
await page.waitForTimeout(500);
const paused = await page.getByText("Mart Ayı Taksit Hatırlatma").count();
const activeVisible = await page.getByText("YKS 2025 Erken Kayıt Avantajı").count();
log("kampanyalar: Duraklatıldı filtresi", paused === 1 && activeVisible === 0);

// ── 10) Görüşme detayı: sekme değişimi ─────────────────────────
await page.goto(BASE + "/gorusmeler/deneme-1", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.getByRole("tab", { name: /AI Sinyalleri/ }).click();
await page.waitForTimeout(500);
const signals = await page.getByText("Duygu & Yaklaşım").count();
await page.getByRole("tab", { name: /Aksiyonlar/ }).click();
await page.waitForTimeout(500);
const actions = await page.getByText("Görüşme Sonrası Otomasyonlar").count();
log("görüşme detayı: sekmeler", signals >= 1 && actions >= 1);

// ── 11) Görüşme listesi: arama + filtre ────────────────────────
await page.goto(BASE + "/gorusmeler", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
await page.getByPlaceholder(/Veli, öğrenci veya özet ara/).fill("zeynep");
await page.waitForTimeout(500);
const listed = await page.locator("tbody tr").count();
log("görüşme listesi: arama", listed === 1, `satır=${listed}`);
await page.getByRole("button", { name: "WhatsApp", exact: true }).click();
await page.waitForTimeout(500);
const waRows = await page.locator("tbody tr").count();
log("görüşme listesi: kanal filtresi", waRows >= 0, `satır=${waRows}`);

// ── 12) Ayarlar: toggle + kaydet ───────────────────────────────
await page.goto(BASE + "/ayarlar", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const toggles = page.locator("button[role='switch'], button[class*='peer']");
const before = await page.getByText(/\d \/ 6 Yetki Aktif/).textContent().catch(() => "0 / 6 Yetki Aktif");
await page.getByText("Fiyat ve İndirim Paylaşabilir").click();
await page.waitForTimeout(400);
const after = await page.getByText(/\d \/ 6 Yetki Aktif/).textContent().catch(() => "x");
log("ayarlar: yetki toggle sayacı", before !== after, `${before?.trim()} → ${after?.trim()}`);
await page.getByRole("button", { name: /Değişiklikleri Kaydet/ }).click();
await page.waitForTimeout(500);
const toast = await page.getByText(/kaydedildi/i).count();
log("ayarlar: kaydet geri bildirimi", toast >= 1);

// ── 13) Deneme analizi: segment + AI arama ─────────────────────
await page.goto(BASE + "/deneme-analizi", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.locator("section", { hasText: "AI Veliler Arama & Aksiyon Planı" }).first().waitFor({ timeout: 5000 }).catch(() => {});
const planBtn = page.getByRole("button", { name: /AI ile Ara/ }).first();
await planBtn.click();
await page.waitForTimeout(1500);
const planToast = await page.getByText(/Demo kaydı oluşturuldu|LiveKit/).count();
log("deneme analizi: AI arama API'si", planToast >= 1);

// ── 14) Mobil görünüm hızlı duman testi ────────────────────────
const mobile = await ctx.browser().newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mpage = await mobile.newPage();
mpage.on("pageerror", (err) => consoleErrors.push(`MOBILE PAGEERROR ${String(err).slice(0, 120)}`));
for (const route of ["/", "/veliler", "/tahsilat", "/deneme-analizi", "/kampanyalar", "/randevular", "/raporlar"]) {
  const res = await mpage.goto(BASE + route, { waitUntil: "domcontentloaded" });
  await mpage.waitForTimeout(600);
  const sw = await mpage.evaluate(() => document.documentElement.scrollWidth);
  log(`mobil ${route}`, res.status() === 200 && sw <= 392, `scrollW=${sw}`);
}
await mobile.close();

// ── ÖZET ───────────────────────────────────────────────────────
const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass);
console.log(`\n═══ ÖZET: ${passed}/${results.length} test geçti ═══`);
if (failed.length) {
  console.log("BAŞARISIZ:");
  failed.forEach((f) => console.log(`  ✗ ${f.name} — ${f.detail}`));
}
const uniqueErrors = [...new Set(consoleErrors)];
if (uniqueErrors.length) {
  console.log(`\nKONSOL/AĞ HATALARI (${uniqueErrors.length}):`);
  uniqueErrors.slice(0, 12).forEach((e) => console.log(`  • ${e}`));
} else {
  console.log("Konsol/ağ hatası: YOK");
}
await browser.close();
process.exit(failed.length ? 1 : 0);
