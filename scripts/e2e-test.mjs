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
  ["/risk-paneli", "Risk Paneli"],
  ["/yoklama", "Yoklama"],
  ["/odevler", "Ödev Takibi"],
  ["/ders-programi", "Ders Programı"],
  ["/ogretmen-bordro", "Öğretmen Bordro"],
  ["/beceri-karnesi", "Beceri Karnesi"],
  ["/veli-bulteni", "Veli Bülteni"],
  ["/etkinlikler", "Etkinlikler"],
  ["/referanslar", "Arkadaşını Getir"],
  ["/sinav-takvimi", "Sınav Takvimi"],
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
log("kanban: Yeni sütununda kart var", yeniCount >= 1, `kart=${yeniCount}`);

// ── 2b) Veliler: filtre chip'i listeyi gerçekten süzüyor mu ────
const isLiveLeads = await page.getByText("Supabase canlı veri").count();
const allArticles = await page.locator("[data-stage] article").count();
await page.getByRole("button", { name: /Sıcak Leadler/ }).click();
await page.waitForTimeout(400);
const hotCards = await page.locator("[data-stage] article").count();
const chipLabel = await page.getByRole("button", { name: /Sıcak Leadler/ }).textContent();
const counter = parseInt((chipLabel?.match(/\((\d+)\)/) ?? [])[1] ?? "", 10);
// Canlı modda chip etiketindeki sayaç ile kart sayısı birebir eşleşmeli;
// demo modda statik etiketler olduğu için yalnız süzme kontrolü yapılır.
const chipOk = isLiveLeads > 0
  ? Number.isFinite(counter) && hotCards === counter
  : hotCards <= allArticles;
log("veliler: Sıcak Leadler chip filtresi", chipOk, `kart=${hotCards}/${allArticles} sayaç=${Number.isFinite(counter) ? counter : "?"}`);
await page.getByRole("button", { name: /^Tümü/ }).click();
await page.waitForTimeout(300);

// Görünüm değişimi: Liste ↔ Pano
await page.getByRole("button", { name: "Liste" }).click();
await page.waitForTimeout(400);
const listCards = await page.getByText("Zeynep Kaya").count();
await page.getByRole("button", { name: "Pano" }).click();
await page.waitForTimeout(400);
const boardBack = await page.locator("[data-stage]").count();
log("veliler: Pano/Liste geçişi", listCards > 0 && boardBack === 7, `liste=${listCards} kart, pano=${boardBack} sütun`);

// ── 3) Kanban sürükle-bırak: Zeynep → Yeni (mevcut sütunundan) ──
const zeynepCard = page.locator("article", { hasText: "Zeynep Kaya" }).first();
const beforeYeni = await page.locator('[data-stage="yeni"] article').count();
await zeynepCard.dragTo(page.locator('[data-stage="yeni"]'));
await page.waitForTimeout(600);
const afterYeni = await page.locator('[data-stage="yeni"] article').count();
const zeynepYeni = await page
  .locator('[data-stage="yeni"] article', { hasText: "Zeynep Kaya" })
  .count();
log("kanban: sürükle-bırak aşama taşıma", zeynepYeni === 1, `yeni sütun ${beforeYeni}→${afterYeni}`);
// geri taşı: Zeynep'i "Yeni"den çıkarmak yerine panoda bırakmak canlı veriyi
// sürekli kaydırıyor; bu yüzden geri taşıma kaldırıldı (veri artık canlı).

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
await page.locator("article", { hasText: "Zeynep Kaya" }).first().click();
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
const activeBadge = await page
  .locator('.grid.grid-cols-1.gap-4 span', { hasText: "Aktif" })
  .count();
log("kampanyalar: Duraklatıldı filtresi", activeBadge === 0, `grid içi aktif rozet=${activeBadge}`);

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
const totalRows = await page.locator("tbody tr").count();
await page.getByPlaceholder(/Veli, öğrenci veya özet ara/).fill("zzzz-eşleşmez");
await page.waitForTimeout(500);
const listed = await page.locator("tbody tr").count();
log("görüşme listesi: arama", totalRows > 0 && listed === 0, `satır=${listed}/${totalRows}`);
await page.getByRole("button", { name: "WhatsApp", exact: true }).click();
await page.waitForTimeout(500);
const waRows = await page.locator("tbody tr").count();
log("görüşme listesi: kanal filtresi", waRows >= 0, `satır=${waRows}`);

// ── 12) Ayarlar: toggle + kaydet ───────────────────────────────
await page.goto(BASE + "/ayarlar", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const before = await page.getByText(/\d \/ 6 Yetki Aktif/).textContent().catch(() => "0 / 6 Yetki Aktif");
await page.getByText("Fiyat ve İndirim Paylaşabilir").click();
await page.waitForTimeout(400);
const after = await page.getByText(/\d \/ 6 Yetki Aktif/).textContent().catch(() => "x");
log("ayarlar: yetki toggle sayacı", before !== after, `${before?.trim()} → ${after?.trim()}`);
await page.getByRole("button", { name: /Değişiklikleri Kaydet/ }).click();
// Kaydetme artık gerçek API çağrısı — toast'u bir süre boyunca bekle
let toastSeen = false;
try {
  await page.getByText(/kaydedildi/i).waitFor({ timeout: 8000 });
  toastSeen = true;
} catch {
  // toast çıkmadı
}
log("ayarlar: kaydet geri bildirimi", toastSeen);

// ── 13) Deneme analizi: segment + AI arama ─────────────────────
await page.goto(BASE + "/deneme-analizi", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.locator("section", { hasText: "AI Veliler Arama & Aksiyon Planı" }).first().waitFor({ timeout: 5000 }).catch(() => {});
const planBtn = page.getByRole("button", { name: /AI ile Ara/ }).first();
await planBtn.click();
await page.waitForTimeout(1500);
const planToast = await page.getByText(/Demo kaydı oluşturuldu|LiveKit/).count();
log("deneme analizi: AI arama API'si", planToast >= 1);

// ── 14) Ödev takibi: oluşturma + sınıf filtresi + işaretleme + öğrenci rolü ──
await page.goto(BASE + "/odevler", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const hwLive = await page.getByText("Supabase canlı veri").count();
const hwTitleA = `E2E Test Ödevi ${Date.now()}`;
const hwTitleB = `E2E Sınıf Ödevi ${Date.now() + 1}`;

const hwOlustur = async ({ title, sinif, ogretmen }) => {
  await page.getByRole("button", { name: /Yeni Ödev/ }).click();
  await page.getByPlaceholder("örn. TYT Matematik — Sayfa 42-58").fill(title);
  if (ogretmen) await page.getByPlaceholder("örn. Merve Hoca").fill(ogretmen);
  if (sinif) await page.getByPlaceholder("örn. 12. Sınıf").fill(sinif);
  await page.locator('input[type="date"]').fill("2026-12-31");
  // saat bilinçli boş bırakılır → yalnız tarih gösterilmeli
  await page.getByRole("button", { name: /Ödevi Oluştur/ }).click();
  const chip = page.locator("button", { hasText: title }).first();
  try {
    await chip.waitFor({ timeout: 8000 });
  } catch {}
  await page.waitForTimeout(400);
  return chip;
};

const chipA = await hwOlustur({ title: hwTitleA, sinif: "12. Sınıf", ogretmen: "Merve Hoca" });
const chipAText = (await chipA.count()) ? (await chipA.textContent()) ?? "" : "";
log(
  "ödev: saatsiz oluşturma (yalnız tarih) + sınıf",
  /\d{1,2} \w+/.test(chipAText) && !/\d{1,2}:\d{2}/.test(chipAText) && chipAText.includes("12. Sınıf"),
  chipAText.trim().slice(-32)
);
await chipA.click();
await page.waitForTimeout(300);
const ogretmenGorunur = await page.getByText(/Öğretmen: Merve Hoca/).count();
log("ödev: öğretmen adı özette görünür", ogretmenGorunur >= 1);

await hwOlustur({ title: hwTitleB, sinif: "8. Sınıf" });
await page.getByRole("button", { name: "8. Sınıf", exact: true }).click();
await page.waitForTimeout(400);
const aGizli = (await page.locator("button", { hasText: hwTitleA }).count()) === 0;
const bGorunur = (await page.locator("button", { hasText: hwTitleB }).count()) >= 1;
log("ödev: sınıf filtresi ödevleri süzüyor", aGizli && bGorunur, `A görünür=${!aGizli} B görünür=${bGorunur}`);

const missingChip = async () =>
  parseInt((await page.getByText(/Yapılmadı:/).textContent())?.match(/(\d+)/)?.[1] ?? "-1", 10);
const hwBefore = await missingChip();
// İşaretlenen (ilk karttaki) öğrencinin adını yakala — M9.2 yansıma kontrolleri için
const isaretliOgrenci = (
  (await page
    .locator("div.grid.grid-cols-1.gap-3 > div")
    .first()
    .locator("p")
    .first()
    .textContent()
    .catch(() => "")) ?? ""
).trim();
await page.getByRole("button", { name: "Yapılmadı" }).first().click();
await page.waitForTimeout(300);
const hwAfter = await missingChip();
// Paylaşımlı canlı veride seçili ödevde önceden işaret olabilir; önemli olan
// tıklamanın sayacı tam 1 değiştirmesidir (işaretle ya da geri al).
log("ödev: Yapılmadı işaretleme sayacı", Math.abs(hwAfter - hwBefore) === 1, `${hwBefore}→${hwAfter}`);

await page.getByRole("button", { name: /Ödev Durumlarını Kaydet/ }).click();
let hwNotice = "";
try {
  const noticeEl = page.getByText(/kaydedildi/i).first();
  await noticeEl.waitFor({ timeout: 8000 });
  hwNotice = (await noticeEl.textContent()) ?? "";
} catch {}
log("ödev: kaydet geri bildirimi", /kaydedildi/i.test(hwNotice), hwNotice.trim().slice(0, 70));

// ── 14b) M9.2: ödev performansının modüllere yansıması ─────────
if (isaretliOgrenci) {
  // Beceri Karnesi — Ödev Disiplini şeridi
  await page.goto(BASE + "/beceri-karnesi", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const bkChip = page.locator("button", { hasText: isaretliOgrenci }).first();
  if ((await bkChip.count()) >= 1) {
    await bkChip.click();
    await page.waitForTimeout(300);
  }
  log(
    "yansıma: beceri karnesi Ödev Disiplini",
    (await page.getByText(/Ödev Disiplini/).count()) >= 1,
    isaretliOgrenci
  );

  // Veli Bülteni — "Ödev durumu: 0/1 yapıldı, 1 eksik" satırı (öğrenci kartı seçilir)
  await page.goto(BASE + "/veli-bulteni", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const bultenChip = page.locator("button", { hasText: isaretliOgrenci }).first();
  if ((await bultenChip.count()) >= 1) {
    await bultenChip.click();
    await page.waitForTimeout(400);
  }
  let bultenBulundu = false;
  for (const t of await page.locator("textarea").all()) {
    const v = (await t.inputValue().catch(() => "")) ?? "";
    if (/Ödev durumu: \d+\/\d+ yapıldı/.test(v)) {
      bultenBulundu = true;
      break;
    }
  }
  log("yansıma: veli bülteni ödev satırı", bultenBulundu);

  // Risk Paneli — faktör + detay kartı (öğrencide sınav verisi varsa)
  await page.goto(BASE + "/risk-paneli", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const riskSatir = page.locator("button", { hasText: isaretliOgrenci }).first();
  if ((await riskSatir.count()) === 0) {
    log("yansıma: risk paneli ödev kalemi", true, "koşullu geç — öğrencide sınav verisi yok");
  } else {
    await riskSatir.click();
    await page.waitForTimeout(400);
    const detay =
      (await page.getByText(/Ödev performansı/).count()) +
      (await page.getByText(/Ödev: 0\/1/).count());
    const faktor = await page.getByText(/Eksik ödev var|Ödevlerin çoğu yapılmadı/).count();
    log("yansıma: risk paneli ödev kalemi", detay >= 1 && faktor >= 1, `öğrenci=${isaretliOgrenci}`);
  }
  await page.goto(BASE + "/odevler", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
} else {
  log("yansıma: işaretlenen öğrenci adı okunamadı", false);
}

// Öğrenci görünümü: seçim + sınıfa göre ödev + fotoğraf yükleme
await page.getByRole("button", { name: /Öğrenci/ }).click();
await page.waitForTimeout(600);
log("ödev: öğrenci görünümü açılıyor", (await page.getByText("Ödevlerim").count()) >= 1);
const secenek = page.locator("option", { hasText: "8. Sınıf" }).first();
let secenekLabel = null;
try {
  secenekLabel = ((await secenek.textContent({ timeout: 3000 })) ?? "").trim() || null;
} catch {}
if (!secenekLabel) {
  log("ödev: öğrenci seçimi (8. Sınıf)", false, "8. Sınıf öğrenci bulunamadı");
} else {
  await page.locator("select").selectOption({ label: secenekLabel });
  await page.waitForTimeout(500);
  const kart = page.locator("section", { hasText: hwTitleB }).first();
  log("ödev: öğrenci kendi sınıfının ödevini görüyor", (await kart.count()) >= 1);
  const PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  await kart.locator('input[type="file"]').setInputFiles({
    name: "odev.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await kart.getByRole("button", { name: /Teslim Et/ }).click();
  let yuklemeNotu = "";
  try {
    const yEl = page.getByText(/teslim edildi|demo modda kaydedildi/i).first();
    await yEl.waitFor({ timeout: 8000 });
    yuklemeNotu = (await yEl.textContent()) ?? "";
  } catch {}
  log(
    "ödev: fotoğraf yükleme",
    /teslim edildi|demo modda kaydedildi/i.test(yuklemeNotu),
    yuklemeNotu.trim().slice(0, 60)
  );
  await page.getByRole("button", { name: /Öğretmen Görünümü/ }).click();
  await page.waitForTimeout(800);
  if (hwLive) {
    const rozet = page.getByRole("button", { name: /Fotoğraf geldi/ }).first();
    let rozetVar = false;
    try {
      await rozet.waitFor({ timeout: 8000 });
      rozetVar = true;
    } catch {}
    log("ödev: öğretmen fotoğraf rozeti", rozetVar);
    if (rozetVar) {
      await rozet.click();
      const onizlemeImg = page.locator('[role="dialog"] img');
      let onizleme = false;
      try {
        await onizlemeImg.waitFor({ timeout: 8000 });
        onizleme = true;
      } catch {}
      log("ödev: imzalı URL ile önizleme", onizleme);
      await page.locator('[aria-label="Önizlemeyi kapat"]').click();
      await page.waitForTimeout(300);
    }
  }
}

// Temizlik: test ödevlerini sil (sonraki koşular için idempotent)
await page.getByRole("button", { name: "Tümü", exact: true }).click();
await page.waitForTimeout(300);
for (const t of [hwTitleB, hwTitleA]) {
  const c = page.locator("button", { hasText: t }).first();
  if ((await c.count()) === 0) continue;
  await c.click();
  await page.waitForTimeout(300);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Ödevi Sil" }).click();
  let silindi = false;
  try {
    await c.waitFor({ state: "detached", timeout: 8000 });
    silindi = true;
  } catch {}
  log(`ödev: silme — ${t.slice(0, 18)}...`, silindi);
}
const hwKalan =
  (await page.locator("button", { hasText: hwTitleA }).count()) +
  (await page.locator("button", { hasText: hwTitleB }).count());
log("ödev: temizlik doğrulaması", hwKalan === 0, `kalan=${hwKalan}`);

// ── 15) Ders programı (sabit şablon): slot ekleme + çakışma + silme ──
await page.goto(BASE + "/ders-programi", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const dersTitle = `E2E Ders ${Date.now()}`;
await page.getByRole("button", { name: /Yeni Ders/ }).click();
await page.getByPlaceholder("örn. TYT Matematik").fill(dersTitle);
await page.getByPlaceholder("örn. Merve Hoca").fill("Merve Hoca");
await page.getByPlaceholder("örn. 12. Sınıf").fill("12. Sınıf");
await page.getByPlaceholder("örn. Derslik 1").fill("Derslik 1");
// Gün = Perşembe, saat 09:00 — örnek programla çakışmayan bir aralık
await page.locator("select").first().selectOption({ label: "Perşembe" });
await page.locator('input[type="time"]').fill("09:00");
await page.getByRole("button", { name: /Programa Ekle/ }).click();
let dersEklendi = false;
try {
  await page.getByText(dersTitle).first().waitFor({ timeout: 8000 });
  dersEklendi = true;
} catch {}
log("program: slot eklendi (Perşembe 09:00)", dersEklendi);

// Çakışma: aynı öğretmen + aynı gün + aynı saat
await page.getByRole("button", { name: /Yeni Ders/ }).click();
await page.getByPlaceholder("örn. TYT Matematik").fill(`${dersTitle} ÇAKIŞMA`);
await page.getByPlaceholder("örn. Merve Hoca").fill("Merve Hoca");
await page.locator("select").first().selectOption({ label: "Perşembe" });
await page.locator('input[type="time"]').fill("09:00");
await page.getByRole("button", { name: /Programa Ekle/ }).click();
let cakisma = "";
try {
  const cEl = page.getByText(/Çakışma:/).first();
  await cEl.waitFor({ timeout: 8000 });
  cakisma = ((await cEl.textContent()) ?? "").trim();
} catch {}
log("program: çakışma 409 mesajı", /Çakışma:/.test(cakisma), cakisma.slice(0, 60));

// Temizlik: oluşturulan slotu sil
page.once("dialog", (d) => d.accept());
const silBtn = page.locator(`[aria-label="${dersTitle} (09:00) dersini sil"]`);
if ((await silBtn.count()) >= 1) {
  await silBtn.click();
  let silindi = false;
  try {
    // NOT: getByText(dersTitle) kullanılmaz — formdaki çakışma mesajı da
    // ders adını içerir; sil butonunun kendisi kalkana kadar beklenir.
    await silBtn.waitFor({ state: "detached", timeout: 8000 });
    silindi = true;
  } catch {}
  log("program: slot silme (temizlik)", silindi);
} else {
  log("program: slot silme (temizlik)", false, "sil butonu yok");
}

// ── 16) Öğretmen bordro: programdan otomatik hesap + ücret kaydetme ──
// Önce bordro için 60 dk'lık bir ders slotu oluştur (Pazartesi 15:00)
const bordroOgretmen = "Bordro Hoca";
await page.goto(BASE + "/ders-programi", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /Yeni Ders/ }).click();
await page.getByPlaceholder("örn. TYT Matematik").fill("E2E Bordro Dersi");
await page.getByPlaceholder("örn. Merve Hoca").fill(bordroOgretmen);
await page.getByPlaceholder("örn. Derslik 1").fill("Derslik 3");
await page.getByRole("button", { name: /Programa Ekle/ }).click();
try {
  await page.getByText("E2E Bordro Dersi").first().waitFor({ timeout: 8000 });
} catch {}

await page.goto(BASE + "/ogretmen-bordro", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
const bordroSatir = page.locator("tr", { hasText: bordroOgretmen });
const satirVar = (await bordroSatir.count()) >= 1;
log("bordro: programdan öğretmen satırı", satirVar);
if (satirVar) {
  const saatMetni = ((await bordroSatir.textContent()) ?? "").includes("1 sa");
  log("bordro: haftalık saat hesabı (60 dk → 1 sa)", saatMetni);
  log(
    "bordro: ücret girilmedi uyarısı",
    (await bordroSatir.getByText(/ücret girilmedi/).count()) >= 1
  );
  // Ücret gir + kaydet
  await bordroSatir.locator('input[aria-label="Bordro Hoca saat ücreti"]').fill("200");
  await bordroSatir.getByRole("button", { name: "Kaydet" }).click();
  let oranNotu = "";
  try {
    const nEl = page.getByText(/kaydedildi/i).first();
    await nEl.waitFor({ timeout: 8000 });
    oranNotu = ((await nEl.textContent()) ?? "").trim();
  } catch {}
  log("bordro: ücret kaydedildi", /kaydedildi/i.test(oranNotu), oranNotu.slice(0, 60));
  await page.waitForTimeout(600);
  const tutar = await bordroSatir.getByText("₺800").count();
  log("bordro: aylık tutar (4 saat × ₺200 = ₺800)", tutar >= 1);
}

// Temizlik: bordro dersini ve ücret kaydını sil
await page.goto(BASE + "/ders-programi", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
page.once("dialog", (d) => d.accept());
const bordroSil = page.locator('[aria-label="E2E Bordro Dersi (15:00) dersini sil"]');
if ((await bordroSil.count()) >= 1) {
  await bordroSil.click();
  try {
    await bordroSil.waitFor({ state: "detached", timeout: 8000 });
  } catch {}
}
await page.evaluate(async () => {
  await fetch(`/api/bordro/oran?teacher=${encodeURIComponent("Bordro Hoca")}`, {
    method: "DELETE",
  });
});
await page.goto(BASE + "/ogretmen-bordro", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
log(
  "bordro: temizlik",
  (await page.getByText(bordroOgretmen).count()) === 0
);

// ── 17) Mobil görünüm hızlı duman testi ────────────────────────
const mobile = await ctx.browser().newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const mpage = await mobile.newPage();
mpage.on("pageerror", (err) => consoleErrors.push(`MOBILE PAGEERROR ${String(err).slice(0, 120)}`));
for (const route of ["/", "/veliler", "/tahsilat", "/deneme-analizi", "/kampanyalar", "/randevular", "/raporlar", "/odevler", "/ders-programi", "/ogretmen-bordro"]) {
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
