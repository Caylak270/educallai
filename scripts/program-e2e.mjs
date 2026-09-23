/**
 * Ders Programı modülü odaklı E2E test (CRUD + çakışma + oturum üretimi).
 * Kullanım: node scripts/program-e2e.mjs   (dev sunucusu localhost:3000 ayakta olmalı)
 * Canlı modda gerçek kayıt açar; finally bloğu (normal ya da crash çıkışta)
 * TEST-PROG-E2E imzalı slotları ve üretilen oturumları Supabase REST ile siler.
 */
import { readFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const IMZA = "TEST-PROG-E2E";
const results = [];

function log(name, pass, detail = "") {
  results.push({ name, pass });
  console.log(`${pass ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

// Self-cleanup: .env.local'den anahtarları oku, imzalı satırları sil
async function cleanupTestRows() {
  try {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
    const url = get("SUPABASE_URL");
    const key = get("SUPABASE_SERVICE_KEY") ?? get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return;
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    const imza = encodeURIComponent(`${IMZA}*`);
    for (const tablo of ["schedule_slots", "lessons"]) {
      const q = `${tablo}?select=id&name=ilike.${imza}`;
      const res = await fetch(`${url}/rest/v1/${q}`, { headers });
      const rows = (await res.json()) ?? [];
      if (rows.length === 0) continue;
      const idList = `id=in.(${rows.map((r) => r.id).join(",")})`;
      await fetch(`${url}/rest/v1/${tablo}?${idList}`, { method: "DELETE", headers });
      console.log(`🧹 cleanup: ${tablo} tablosundan ${rows.length} test satırı silindi`);
    }
  } catch (e) {
    console.log(`cleanup hatası: ${String(e).slice(0, 120)}`);
  }
}

async function j(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* HTML yanıt */
  }
  return { status: res.status, data };
}

/** offset hafta sonraki Pazartesi (YYYY-MM-DD, sunucu değil tarayıcı saati önemli değil) */
function gelecekHaftaPazartesi(offsetHafta) {
  const d = new Date();
  const g = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - g + 7 * offsetHafta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const slotA = {
  name: `${IMZA} Matematik`,
  subject: "test",
  classLevel: "E2E-11",
  teacher: "E2E Hoca A",
  room: "E2E Derslik",
  dayOfWeek: 7,
  startTime: "06:23",
  durationMinutes: 40,
};
const slotB = {
  name: `${IMZA} Fizik`,
  subject: "test",
  classLevel: "E2E-12",
  teacher: "E2E Hoca B",
  room: "E2E Derslik",
  dayOfWeek: 7,
  startTime: "05:30",
  durationMinutes: 30,
};

let ids = { a: null, b: null };
try {
  // 1) Sayfalar ayakta mı
  const sayfa1 = await fetch(`${BASE}/ders-programi`);
  log("GET /ders-programi 200", sayfa1.status === 200, `durum=${sayfa1.status}`);
  const sayfa2 = await fetch(`${BASE}/yoklama`);
  log("GET /yoklama 200", sayfa2.status === 200, `durum=${sayfa2.status}`);

  // 2) Slot A oluştur
  const post = await j("POST", "/api/schedule", slotA);
  ids.a = post.data.id ?? null;
  log("POST slot A", post.status === 200 && post.data.ok === true, `durum=${post.status} persisted=${post.data.persisted}`);
  const canli = post.data.persisted === true;

  // 3) Çakışma reddi (öğretmen / derslik / sınıf)
  const cakOgretmen = await j("POST", "/api/schedule", { ...slotA, name: `${IMZA} Kimya` });
  log("çakışma: aynı öğretmen 409", cakOgretmen.status === 409 && cakOgretmen.data.ok === false);
  const cakDerslik = await j("POST", "/api/schedule", { ...slotB, name: `${IMZA} Biyoloji`, startTime: "06:40" });
  log("çakışma: aynı derslik 409", cakDerslik.status === 409 && cakDerslik.data.ok === false);
  const cakSinif = await j("POST", "/api/schedule", { ...slotA, name: `${IMZA} Geometri`, teacher: "E2E Hoca C", room: "E2E Derslik 2" });
  log("çakışma: aynı sınıf 409", cakSinif.status === 409 && cakSinif.data.ok === false);

  // 4) Slot B oluştur + PATCH çakışma/çözülme
  const postB = await j("POST", "/api/schedule", slotB);
  ids.b = postB.data.id ?? null;
  log("POST slot B", postB.status === 200 && postB.data.ok === true);
  const patchCak = await j("PATCH", `/api/schedule?id=${ids.b}`, { ...slotB, startTime: "06:23" });
  log("PATCH çakışma reddi 409", patchCak.status === 409 && patchCak.data.ok === false);
  const patchOk = await j("PATCH", `/api/schedule?id=${ids.a}`, { ...slotA, startTime: "07:30", durationMinutes: 60 });
  log("PATCH çakışmasız güncelleme", patchOk.status === 200 && patchOk.data.ok === true);

  if (canli) {
    // 5) Oturum üretimi — ileri bir hafta (mevcut dersleri etkilemesin)
    const weekStart = gelecekHaftaPazartesi(8);
    const uret1 = await j("POST", "/api/schedule/generate", { weekStart });
    log(
      "generate: 2 oturum üretildi",
      uret1.status === 200 && uret1.data.created === 2 && uret1.data.skipped === 0,
      `created=${uret1.data.created} skipped=${uret1.data.skipped}`
    );
    const uret2 = await j("POST", "/api/schedule/generate", { weekStart });
    log(
      "generate tekrar: çift kayıt yok",
      uret2.status === 200 && uret2.data.created === 0 && uret2.data.skipped === 2,
      `created=${uret2.data.created} skipped=${uret2.data.skipped}`
    );
  } else {
    log("canlı mod yok — üretim testleri atlandı (demo)", true);
  }

  // 6) Silme
  const del1 = await j("DELETE", `/api/schedule?id=${ids.a}`);
  const del2 = await j("DELETE", `/api/schedule?id=${ids.b}`);
  log("DELETE slot A + B", del1.data.ok === true && del2.data.ok === true);
  ids = { a: null, b: null };
} finally {
  await cleanupTestRows();
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} test geçti`);
process.exit(failed.length === 0 ? 0 : 1);
