import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/** POST /api/event-invites — etkinliğe davetli ekle. */
export async function POST(request: Request) {
  let body: { eventId?: string; contactId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  if (!body.eventId || !body.contactId) {
    return NextResponse.json({ error: "eventId ve contactId zorunlu" }, { status: 422 });
  }
  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data: event } = await db.from("events").select("dershane_id").eq("id", body.eventId).maybeSingle();
  if (!event) return NextResponse.json({ ok: false, error: "Etkinlik yok" }, { status: 404 });
  const { data: created, error } = await db
    .from("event_invites")
    .upsert(
      { event_id: body.eventId, contact_id: body.contactId, dershane_id: event.dershane_id, status: "davetli" },
      { onConflict: "event_id,contact_id" }
    )
    .select("*")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, persisted: true, mode: "live", invite: created });
}
