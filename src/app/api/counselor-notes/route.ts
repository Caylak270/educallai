import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/** GET /api/counselor-notes?contactId= — öğrencinin rehberlik notları. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const contactId = new URL(request.url).searchParams.get("contactId");
  if (!contactId) {
    return NextResponse.json({ error: "contactId zorunlu" }, { status: 422 });
  }
  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ mode: "demo", notes: [] });
  }
  // Geçersiz uuid canlıda Postgres hatası (500) üretir; boş liste dürüst sonuçtur.
  if (!UUID_RE.test(contactId)) {
    return NextResponse.json({ mode: "live", notes: [] });
  }
  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const { data, error } = await db
    .from("counselor_notes")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ mode: "live", notes: data ?? [] });
}

/** POST /api/counselor-notes — yeni rehberlik notu. */
export async function POST(request: Request) {
  let body: { contactId?: string; note?: string; author?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }
  const { contactId, note, author } = body;
  if (!contactId || !note?.trim()) {
    return NextResponse.json(
      { error: "contactId ve note zorunlu" },
      { status: 422 }
    );
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }
  if (!UUID_RE.test(contactId)) {
    return NextResponse.json(
      { ok: false, error: "contactId geçerli bir uuid değil" },
      { status: 422 }
    );
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
    return NextResponse.json({ ok: false, error: "Dershane kaydı yok" }, { status: 409 });
  }

  const { data: created, error } = await db
    .from("counselor_notes")
    .insert({
      contact_id: contactId,
      dershane_id: dershane.id,
      author: author?.trim() || "Danışman",
      note: note.trim(),
    })
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live", note: created });
}
