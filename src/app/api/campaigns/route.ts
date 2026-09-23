import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/** POST /api/campaigns — sihirbazdan yeni kampanya oluştur. */
export async function POST(request: Request) {
  // targets: sihirbazdaki CSV'den ayrıştırılan {name, phone} listesi.
  // Not: campaigns tablosunda hedef listesi kolonu yoktur; campaign_targets ise
  // contacts FK (contact_id) ister (bkz. supabase/migrations/0001_core.sql 8.1-8.2).
  // Bu yüzden payload'daki targets burada YOK SAYILIR; kalıcı hedef listesi
  // contacts+campaign_targets eşlemesi kurulunca yazılacaktır. Sihirbaz arayüzü
  // ayrıştırılan kişileri önizlemeyle zaten kullanıcıya gösterir.
  let body: {
    name?: string;
    channel?: string;
    totalTargets?: number;
    script?: string;
    targets?: Array<{ name?: string; phone?: string }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name zorunlu" }, { status: 422 });
  }
  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { data: dershane } = await db.from("dershaneler").select("id").limit(1).maybeSingle();
  if (!dershane) return NextResponse.json({ ok: false, error: "Dershane yok" }, { status: 409 });
  const { data: created, error } = await db
    .from("campaigns")
    .insert({
      dershane_id: dershane.id,
      name: body.name.trim(),
      channel: body.channel || "voice",
      status: "draft",
      total_targets: Number(body.totalTargets) || 0,
      script: body.script?.trim() || null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, persisted: true, mode: "live", campaign: created });
}
