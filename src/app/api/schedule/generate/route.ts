import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/**
 * POST /api/schedule/generate — Program → Yoklama köprüsü.
 * Sabit haftalık programı (schedule_slots) seçilen haftanın ders
 * oturumlarına (lessons) dönüştürür; yoklama modülü lessons üzerinde çalışır.
 *
 * Çift kayıt koruması: ad + sınıf + tam saat anahtarıyla — aynı hafta için
 * tekrar çağrım yalnızca eksikleri üretir (created/skipped sayarıyla döner).
 * Gövde: { weekStart?: "YYYY-MM-DD" } — verilmezse bu haftanın Pazartesi'si
 * (sunucu yerel saati; tek kurulum/yerel dağıtım varsayımı, tz politikası
 * Oğuzhan devri kapsamında netleştirilecek).
 */
export async function POST(request: Request) {
  let body: { weekStart?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  let baslangic: Date;
  if (body.weekStart) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.weekStart)) {
      return NextResponse.json(
        { error: "weekStart formatı YYYY-MM-DD olmalı" },
        { status: 422 }
      );
    }
    const [y, m, d] = body.weekStart.split("-").map(Number);
    baslangic = new Date(y, m - 1, d);
  } else {
    const bugun = new Date();
    const gun = (bugun.getDay() + 6) % 7; // Pazartesi=0
    baslangic = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() - gun);
  }
  const haftaSonu = new Date(baslangic);
  haftaSonu.setDate(haftaSonu.getDate() + 7);
  const weekStartIso = `${baslangic.getFullYear()}-${String(baslangic.getMonth() + 1).padStart(2, "0")}-${String(baslangic.getDate()).padStart(2, "0")}`;

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      mode: "demo",
      created: 0,
      skipped: 0,
      weekStart: weekStartIso,
    });
  }

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: slots } = await db.from("schedule_slots").select("*");
  if (!slots || slots.length === 0) {
    return NextResponse.json({
      ok: true,
      persisted: true,
      mode: "live",
      created: 0,
      skipped: 0,
      weekStart: weekStartIso,
    });
  }

  // Bu haftadaki mevcut oturumlar — normalize edilmiş ISO ile anahtarlanır
  const { data: mevcutDersler } = await db
    .from("lessons")
    .select("id,name,class_level,scheduled_at")
    .gte("scheduled_at", baslangic.toISOString())
    .lt("scheduled_at", haftaSonu.toISOString());
  const mevcutAnahtarlar = new Set(
    (mevcutDersler ?? []).map(
      (l) => `${l.name}|${l.class_level ?? ""}|${new Date(l.scheduled_at).toISOString()}`
    )
  );

  let created = 0;
  let skipped = 0;
  for (const slot of slots) {
    const gun = new Date(baslangic);
    gun.setDate(gun.getDate() + (slot.day_of_week - 1));
    const [s, dk] = slot.start_time.split(":").map(Number);
    gun.setHours(s, dk, 0, 0);
    const scheduledAt = gun.toISOString();
    const anahtar = `${slot.name}|${slot.class_level ?? ""}|${scheduledAt}`;
    if (mevcutAnahtarlar.has(anahtar)) {
      skipped += 1;
      continue;
    }
    const { error } = await db.from("lessons").insert({
      dershane_id: slot.dershane_id,
      name: slot.name,
      subject: slot.subject,
      class_level: slot.class_level,
      teacher: slot.teacher,
      room: slot.room,
      scheduled_at: scheduledAt,
      duration_minutes: slot.duration_minutes,
    });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    mevcutAnahtarlar.add(anahtar);
    created += 1;
  }

  return NextResponse.json({
    ok: true,
    persisted: true,
    mode: "live",
    created,
    skipped,
    weekStart: weekStartIso,
  });
}
