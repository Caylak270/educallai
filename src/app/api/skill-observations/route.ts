import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

const SKILLS = new Set([
  "critical_thinking", "communication", "collaboration",
  "self_management", "digital_literacy",
]);

/** GET /api/skill-observations?contactId= — öğrencinin beceri gözlemleri. */
export async function GET(request: Request) {
  const contactId = new URL(request.url).searchParams.get("contactId");
  if (!contactId) {
    return NextResponse.json({ error: "contactId zorunlu" }, { status: 422 });
  }
  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) return NextResponse.json({ mode: "demo", observations: [] });
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data, error } = await db
    .from("skill_observations")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mode: "live", observations: data ?? [] });
}

/** POST /api/skill-observations — yeni beceri gözlemi. */
export async function POST(request: Request) {
  let body: {
    contactId?: string;
    skill?: string;
    score?: number;
    note?: string;
    period?: string;
    observedBy?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }
  const { contactId, skill, score, note, period, observedBy } = body;
  if (!contactId || !skill || !SKILLS.has(skill) || !score || score < 1 || score > 5) {
    return NextResponse.json(
      { error: "contactId, geçerli skill ve 1-5 puan zorunlu" },
      { status: 422 }
    );
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data: dershane } = await db.from("dershaneler").select("id").limit(1).maybeSingle();
  if (!dershane) {
    return NextResponse.json({ ok: false, error: "Dershane kaydı yok" }, { status: 409 });
  }

  const { data: created, error } = await db
    .from("skill_observations")
    .insert({
      contact_id: contactId,
      dershane_id: dershane.id,
      skill,
      score,
      note: note?.trim() || null,
      period: period?.trim() || null,
      observed_by: observedBy?.trim() || "Danışman",
    })
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live", observation: created });
}
