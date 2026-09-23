/**
 * Tahsilat modülü odaklı E2E test (yeni borç girişi + borçlular + silme/geri al).
 * Kullanım: node scripts/tahsilat-e2e.mjs   (dev sunucusu localhost:3000 ayakta olmalı)
 * Canlı modda gerçek kayıt oluşturur; test sonunda (normal ya da crash çıkışta)
 * finally bloğu oluşturduğu satırları Supabase REST ile siler (self-cleanup).
 */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TEST_TOTAL = 30000;
const TEST_COUNT = 3;
const results = [];
const consoleErrors = [];

function log(name, pass, detail = "") {
  results.push({ name, pass });
  console.log(`${pass ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

// Self-cleanup: .env.local'den anahtarları oku, test imzasındaki satırları sil
async function cleanupTestRows() {
  try {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
    const url = get("SUPABASE_URL");
    const key = get("SUPABASE_SERVICE_KEY") ?? get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
    const q = `installment_tracker?select=id&total_amount=eq.${TEST_TOTAL}&installment_count=eq.${TEST_COUNT}&created_at=gte.${since}`;
    const res = await fetch(`${url}/rest/v1/${q}`, { headers });
    const rows = (await res.json()) ?? [];
    if (rows.length === 0) return;
    // PostgREST'te tekrarlı id=eq. parametreleri AND sayılır — OR için in.() gerekli
    const idList = `id=in.(${rows.map((r) => r.id).join(",")})`;
    await fetch(`${url}/rest/v1/installment_tracker?${idList}`, { method: "DELETE", headers });
    console.log(`🧹 cleanup: ${rows.length} test satırı silindi`);
  } catch (e) {
    console.log(`cleanup hatası: ${String(e).slice(0, 120)}`);
  }
}

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1"],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 } });
const page = await ctx.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(`${msg.text().slice(0, 160)}`);
});
page.on("pageerror", (err) => consoleErrors.push(`PAGEERROR ${String(err).slice(0, 160)}`));
page.on("response", (res) => {
  if (res.status() >= 500) consoleErrors.push(`HTTP500 ${res.url()}`);
});

try {
  // ── 0) API doğrulama testleri ────────────────────────────────
  {
    const res = await page.request.post(`${BASE}/api/installments`, {
      data: { contactId: "not-a-uuid", totalAmount: 100, installmentCount: 1, firstDueDate: "2026-10-01" },
    });
    log("api: geçersiz contactId → 422", res.status() === 422, `status=${res.status()}`);

    const res2 = await page.request.post(`${BASE}/api/installments`, {
      data: { contactId: "00000000-0000-0000-0000-000000000000", totalAmount: 0, installmentCount: 1, firstDueDate: "2026-10-01" },
    });
    log("api: tutar 0 → 422", res2.status() === 422, `status=${res2.status()}`);

    const res3 = await page.request.post(`${BASE}/api/installments`, {
      data: { contactId: "00000000-0000-0000-0000-000000000000", totalAmount: 100, installmentCount: 99, firstDueDate: "2026-10-01" },
    });
    log("api: taksit sayısı 99 → 422", res3.status() === 422, `status=${res3.status()}`);

    const res4 = await page.request.post(`${BASE}/api/installments`, {
      data: { contactId: "00000000-0000-0000-0000-000000000000", totalAmount: 100, installmentCount: 1, firstDueDate: "geçersiz" },
    });
    log("api: geçersiz tarih → 422", res4.status() === 422, `status=${res4.status()}`);

    const res5 = await page.request.patch(`${BASE}/api/installments/00000000-0000-0000-0000-000000000000`, {
      data: { action: "bilinmeyen" },
    });
    log("api: bilinmeyen PATCH action → 422", res5.status() === 422, `status=${res5.status()}`);
  }

  // ── 1) Sayfa render: yeni bölümler ───────────────────────────
  await page.goto(BASE + "/tahsilat", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const body = await page.textContent("body");
  log("sayfa: Borç / Taksit Girişi bölümü", body.includes("Borç / Taksit Girişi"));
  log("sayfa: Borçlular tablosu", body.includes("Borçlular"));
  log("sayfa: Taksit listesi", body.includes("Taksit Listesi"));

  const isLive = body.includes("Supabase canlı veri");
  log("mod tespiti", true, isLive ? "canlı (Supabase)" : "demo");

  const baseCount = await page.locator("article").count();
  log("mevcut taksit kartları", baseCount > 0, `kart=${baseCount}`);

  // ── 2) Borç girişi formu ─────────────────────────────────────
  await page.getByRole("button", { name: "Yeni Borç Kaydı" }).click();
  await page.waitForTimeout(300);

  const studentInput = page.getByPlaceholder("Öğrenci veya veli adı yazın…");
  log("form: combobox görünür", (await studentInput.count()) === 1);

  await studentInput.click();
  await page.waitForTimeout(200);
  // İlk öneriye tıkla (canlıda contacts, demoda mock).
  // NOT: yalnız ilk metin düğümü alınır — sınıf etiketi span'ı isme karışmasın.
  const firstOption = page.locator("ul li button").first();
  const studentName =
    (await firstOption
      .locator("span")
      .first()
      .evaluate((el) => el.childNodes[0]?.textContent?.trim() ?? "")) ?? "";
  await firstOption.click();
  await page.waitForTimeout(200);
  log("form: öğrenci seçildi", studentName.length > 0, `seçilen=${studentName}`);

  // Öğrencinin test öncesi kart sayısı (sonraki göreli doğrulamalar için)
  const studentCard = page.locator("article", {
    has: page.getByRole("heading", { name: studentName }),
  });
  const studentBase = await studentCard.count();
  log("öğrenci: test öncesi kart sayısı", true, `kart=${studentBase}`);

  await page.getByPlaceholder("Örn. 48000").fill(String(TEST_TOTAL));
  const countInput = page.locator('input[type="number"][min="1"][max="24"]');
  await countInput.fill(String(TEST_COUNT));

  // Önizleme: 3 x ₺10.000
  const previewText = (await page.textContent("body")) ?? "";
  log("form: plan önizleme 3 x ₺10.000", previewText.includes("3 x") && previewText.includes("10.000"));

  await page.getByRole("button", { name: "Borç Kaydını Oluştur" }).click();
  await page.waitForTimeout(2500);

  const bodyAfterCreate = (await page.textContent("body")) ?? "";
  const createOk =
    bodyAfterCreate.includes("borç kaydı oluşturuldu") ||
    bodyAfterCreate.includes("Demo mod");
  log("form: kayıt sonrası başarı notu", createOk);

  // Yeni taksitler listede mi (canlıda +3 kart; demoda kart eklenmez)
  const afterCreateCount = await page.locator("article").count();
  log(
    "liste: yeni taksit kartları geldi",
    isLive ? afterCreateCount === baseCount + TEST_COUNT : true,
    `önce=${baseCount} sonra=${afterCreateCount}`
  );

  if (isLive && createOk && !bodyAfterCreate.includes("Demo mod")) {
    // ── 3) Ödendi işaretle → geri al ────────────────────────────
    // Tüm etkileşimler testin oluşturduğu 1. taksit kartına sabitlenir
    // ("Taksit 1/3" metni + öğrenci adı) — lokatör kayması olmasın.
    const newCard1 = studentCard
      .filter({ hasText: "Taksit 1/3" })
      .first();
    await newCard1.waitFor({ state: "visible", timeout: 10000 });

    await newCard1.getByRole("button", { name: /Ödendi/ }).click();
    await page.waitForTimeout(1500);
    const paidVisible = (await newCard1.textContent())?.includes("Ödendi ·") ?? false;
    log("kart: Ödendi işaretle + tarih", paidVisible);

    const undoBtn = newCard1.getByRole("button", { name: /Geri Al/ });
    if (paidVisible && (await undoBtn.count()) === 1) {
      await undoBtn.click();
      await page.waitForTimeout(1500);
      const undone = (await newCard1.textContent())?.includes("Hatırlatma Oluştur") ?? false;
      log("kart: ödemeyi geri al", undone);
    }

    // ── 4) Borçlular tablosu → öğrenci süzmesi ────────────────
    const debtorRow = page.locator("tbody tr", { hasText: studentName }).first();
    await debtorRow.click();
    await page.waitForTimeout(400);
    const chipVisible = (await page.textContent("body"))?.includes("Süzme:") ?? false;
    log("borçlular: satır tıkla → süzme çipi", chipVisible);

    const focusedCount = await page.locator("article").count();
    log(
      "süzme: yalnız seçili öğrencinin kartları",
      focusedCount === studentBase + TEST_COUNT,
      `kart=${focusedCount} beklenen=${studentBase + TEST_COUNT}`
    );

    await page.getByRole("button", { name: /Süzme:/ }).click();
    await page.waitForTimeout(300);
    const chipGone = !((await page.textContent("body"))?.includes("Süzme:") ?? false);
    log("süzme: çip ile temizle", chipGone);

    // ── 5) Planı sil (self-cleanup) ───────────────────────────
    await newCard1.getByRole("button", { name: "Taksiti sil" }).click();
    await page.waitForTimeout(300);
    const confirmText = (await newCard1.textContent())?.includes("Tüm plan silinsin mi? (3 taksit)") ?? false;
    log("silme: plan onay şeridi", confirmText);

    await newCard1.getByRole("button", { name: /Sil$/ }).click();
    await page.waitForTimeout(2500);
    const finalCount = await page.locator("article").count();
    const studentAfter = await studentCard.count();
    log(
      "silme: plan kartları kaldırıldı",
      studentAfter === studentBase && finalCount === baseCount,
      `son=${finalCount} beklenen=${baseCount}`
    );
  }
} finally {
  await browser.close();
  await cleanupTestRows();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} test geçti`);
if (consoleErrors.length > 0) {
  console.log(`\nKonsol/ağ hataları (${consoleErrors.length}):`);
  for (const e of [...new Set(consoleErrors)].slice(0, 10)) console.log(`  ${e}`);
} else {
  console.log("Konsol/ağ hatası yok");
}
process.exit(failed.length === 0 ? 0 : 1);
