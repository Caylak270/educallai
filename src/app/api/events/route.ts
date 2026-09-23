import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/** POST /api/events — yeni etkinlik oluştur. */
export async function POST(request: Request) {
  let body: { name?: string; eventType?: string; date?: string; time?: string; capacity?: number; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  if (!body.name?.trim() || !body.date) {
    return NextResponse.json({ error: "name ve date zorunlu" }, { status: 422 });
  }
  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data: dershane } = await db.from("dershaneler").select("id").limit(1).maybeSingle();
  if (!dershane) return NextResponse.json({ ok: false, error: "Dershane yok" }, { status: 409 });

  const scheduledAt = new Date(`${body.date}T${body.time || "18:00"}:00`).toISOString();
  const { data: created, error } = await db
    .from("events")
    .insert({
      dershane_id: dershane.id,
      name: body.name.trim(),
      event_type: body.eventType || "diger",
      event_date: scheduledAt,
      capacity: body.capacity ? Number(body.capacity) : null,
      notes: body.notes?.trim() || null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, persisted: true, mode: "live", event: created });
}
