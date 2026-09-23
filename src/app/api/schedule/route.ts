import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

const SURELER = new Set([30, 40, 45, 60, 90, 120]);

function esit(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLocaleLowerCase("tr-TR") === b.trim().toLocaleLowerCase("tr-TR");
}

function dakika(hhmm: string): number {
  const [s, d] = hhmm.split(":").map(Number);
  return s * 60 + d;
}

/**
 * POST /api/schedule — sabit haftalık programa ders slotu ekle.
 * Gövde: { name, subject?, classLevel?, teacher?, room?, dayOfWeek (1-7), startTime ("HH:MM"), durationMinutes }
 * Çakışma kontrolü: AYNI GÜNde kesişen saatte, aynı öğretmen / derslik /
 * sınıf kullanılıyorsa 409 + Türkçe açıklama döner.
 */
export async function POST(request: Request) {
  let body: {
    name?: string;
    subject?: string;
    classLevel?: string;
    teacher?: string;
    room?: string;
    dayOfWeek?: number;
    startTime?: string;
    durationMinutes?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const name = body.name?.trim();
  const dayOfWeek = Number(body.dayOfWeek);
  const duration = Number(body.durationMinutes);
  const startTime = body.startTime?.trim();
  if (!name || !startTime || !SURELER.has(duration) || !(dayOfWeek >= 1 && dayOfWeek <= 7)) {
    return NextResponse.json(
      { error: "name, dayOfWeek (1-7), startTime ve süre (30-120 dk) zorunlu" },
      { status: 422 }
    );
  }
  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    return NextResponse.json({ error: "startTime formatı HH:MM olmalı" }, { status: 422 });
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: dershane } = await db
    .from("dershaneler")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!dershane) {
    return NextResponse.json({ ok: false, error: "Dershane kaydı bulunamadı" }, { status: 409 });
  }

  // Çakışma kontrolü: aynı gün + kesişen saat aralığı
  const { data: mevcut } = await db
    .from("schedule_slots")
    .select("id,name,class_level,teacher,room,day_of_week,start_time,duration_minutes")
    .eq("day_of_week", dayOfWeek);
  const yeniBas = dakika(startTime);
  const yeniSon = yeniBas + duration;
  for (const slot of mevcut ?? []) {
    const slotBas = dakika(slot.start_time);
    const slotSon = slotBas + slot.duration_minutes;
    const kesisir = slotBas < yeniSon && yeniBas < slotSon;
    if (!kesisir) continue;
    const aralik = `${slot.start_time}-${String(Math.floor(slotSon / 60)).padStart(2, "0")}:${String(slotSon % 60).padStart(2, "0")}`;
    if (esit(slot.teacher, body.teacher)) {
      return NextResponse.json(
        { ok: false, error: `Çakışma: ${slot.teacher} aynı gün aynı saatte '${slot.name}' dersinde (${aralik})` },
        { status: 409 }
      );
    }
    if (esit(slot.room, body.room)) {
      return NextResponse.json(
        { ok: false, error: `Çakışma: ${slot.room} dersliği aynı gün aynı saatte '${slot.name}' dersine ait (${aralik})` },
        { status: 409 }
      );
    }
    if (esit(slot.class_level, body.classLevel)) {
      return NextResponse.json(
        { ok: false, error: `Çakışma: ${slot.class_level} sınıfının aynı gün aynı saatte '${slot.name}' dersi var (${aralik})` },
        { status: 409 }
      );
    }
  }

  const { data: created, error } = await db
    .from("schedule_slots")
    .insert({
      dershane_id: dershane.id,
      name,
      subject: body.subject?.trim() || null,
      class_level: body.classLevel?.trim() || null,
      teacher: body.teacher?.trim() || null,
      room: body.room?.trim() || null,
      day_of_week: dayOfWeek,
      start_time: startTime,
      duration_minutes: duration,
    })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live", id: created?.id });
}

/**
 * DELETE /api/schedule?id=<uuid> — programdan ders slotunu kaldır.
 */
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id zorunlu" }, { status: 422 });
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const { error } = await db.from("schedule_slots").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live" });
}

/**
 * PATCH /api/schedule?id=<uuid> — mevcut slotu güncelle (POST ile aynı
 * doğrulama; çakışma denetiminde slotun kendisi hariç tutulur).
 */
export async function PATCH(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id zorunlu" }, { status: 422 });
  }

  let body: {
    name?: string;
    subject?: string;
    classLevel?: string;
    teacher?: string;
    room?: string;
    dayOfWeek?: number;
    startTime?: string;
    durationMinutes?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const name = body.name?.trim();
  const dayOfWeek = Number(body.dayOfWeek);
  const duration = Number(body.durationMinutes);
  const startTime = body.startTime?.trim();
  if (!name || !startTime || !SURELER.has(duration) || !(dayOfWeek >= 1 && dayOfWeek <= 7)) {
    return NextResponse.json(
      { error: "name, dayOfWeek (1-7), startTime ve süre (30-120 dk) zorunlu" },
      { status: 422 }
    );
  }
  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    return NextResponse.json({ error: "startTime formatı HH:MM olmalı" }, { status: 422 });
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: mevcut } = await db
    .from("schedule_slots")
    .select("id,name,class_level,teacher,room,day_of_week,start_time,duration_minutes")
    .eq("day_of_week", dayOfWeek)
    .neq("id", id);
  const yeniBas = dakika(startTime);
  const yeniSon = yeniBas + duration;
  for (const slot of mevcut ?? []) {
    const slotBas = dakika(slot.start_time);
    const slotSon = slotBas + slot.duration_minutes;
    const kesisir = slotBas < yeniSon && yeniBas < slotSon;
    if (!kesisir) continue;
    const aralik = `${slot.start_time}-${String(Math.floor(slotSon / 60)).padStart(2, "0")}:${String(slotSon % 60).padStart(2, "0")}`;
    if (esit(slot.teacher, body.teacher)) {
      return NextResponse.json(
        { ok: false, error: `Çakışma: ${slot.teacher} aynı gün aynı saatte '${slot.name}' dersinde (${aralik})` },
        { status: 409 }
      );
    }
    if (esit(slot.room, body.room)) {
      return NextResponse.json(
        { ok: false, error: `Çakışma: ${slot.room} dersliği aynı gün aynı saatte '${slot.name}' dersine ait (${aralik})` },
        { status: 409 }
      );
    }
    if (esit(slot.class_level, body.classLevel)) {
      return NextResponse.json(
        { ok: false, error: `Çakışma: ${slot.class_level} sınıfının aynı gün aynı saatte '${slot.name}' dersi var (${aralik})` },
        { status: 409 }
      );
    }
  }

  const { error } = await db
    .from("schedule_slots")
    .update({
      name,
      subject: body.subject?.trim() || null,
      class_level: body.classLevel?.trim() || null,
      teacher: body.teacher?.trim() || null,
      room: body.room?.trim() || null,
      day_of_week: dayOfWeek,
      start_time: startTime,
      duration_minutes: duration,
    })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live" });
}
