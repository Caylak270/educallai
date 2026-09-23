import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/** PATCH ile kabul edilen durumlar — DB check'i ve UI eşlemesiyle aynı kelime seti. */
const VALID_STATUSES = ["scheduled", "confirmed", "cancelled"];

/**
 * POST /api/appointments — yeni veli randevusu oluştur.
 * Gövde: { contactId, date: "2026-09-25", time: "14:30", durationMinutes, topic }
 * Canlı modda appointments tablosuna insert; demo modda kayıt simüle edilir.
 */
export async function POST(request: Request) {
  let body: {
    contactId?: string;
    date?: string;
    time?: string;
    durationMinutes?: number;
    topic?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const { contactId, date, time, durationMinutes, topic } = body;
  if (!contactId || !date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json(
      { error: "contactId, date (YYYY-AA-GG) ve time (SS:DD) zorunlu" },
      { status: 422 }
    );
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Tek kiracı: ilk dershane kaydı
  const { data: dershane } = await db
    .from("dershaneler")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!dershane) {
    return NextResponse.json(
      { ok: false, error: "Dershane kaydı bulunamadı" },
      { status: 409 }
    );
  }

  const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
  const { data: created, error } = await db
    .from("appointments")
    .insert({
      contact_id: contactId,
      dershane_id: dershane.id,
      scheduled_at: scheduledAt,
      duration_minutes: Number(durationMinutes) || 30,
      status: "scheduled",
      created_by: "manual",
      notes: topic?.trim() || null,
      calendar_synced: false,
      staff_notified: false,
      parent_reminder_sent: false,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, persisted: false, error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({
    ok: true,
    persisted: true,
    mode: "live",
    id: created.id,
  });
}

/**
 * PATCH /api/appointments — randevu durumu güncelle (Onayla / İptal).
 * Gövde: { id, status } — status: scheduled | confirmed | cancelled
 * Canlı modda appointments.status gerçekten güncellenir; demo modda
 * persisted:false ile onay döner (UI yerel state'ini zaten güncel tutuyor).
 */
export async function PATCH(request: Request) {
  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const { id, status } = body;
  if (!id || !status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `id ve status zorunlu — status şunlardan biri olmalı: ${VALID_STATUSES.join(", ")}` },
      { status: 422 }
    );
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      mode: "demo",
      id,
      status,
    });
  }

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: updated, error } = await db
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, persisted: false, error: error.message },
      { status: 500 }
    );
  }
  if (!updated) {
    return NextResponse.json(
      { ok: false, persisted: false, error: "Randevu kaydı bulunamadı" },
      { status: 404 }
    );
  }
  return NextResponse.json({
    ok: true,
    persisted: true,
    mode: "live",
    id,
    status,
  });
}
