import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/** POST /api/referrals — yeni arkadaşını-getir kaydı. */
export async function POST(request: Request) {
  let body: { referrerContactId?: string; newLeadName?: string; newLeadPhone?: string; rewardNote?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  if (!body.referrerContactId || !body.newLeadName?.trim()) {
    return NextResponse.json({ error: "referrerContactId ve newLeadName zorunlu" }, { status: 422 });
  }
  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data: dershane } = await db.from("dershaneler").select("id").limit(1).maybeSingle();
  if (!dershane) return NextResponse.json({ ok: false, error: "Dershane yok" }, { status: 409 });
  const { data: created, error } = await db
    .from("referrals")
    .insert({
      dershane_id: dershane.id,
      referrer_contact_id: body.referrerContactId,
      new_lead_name: body.newLeadName.trim(),
      new_lead_phone: body.newLeadPhone?.trim() || null,
      status: "yeni",
      reward_note: body.rewardNote?.trim() || null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, persisted: true, mode: "live", referral: created });
}
