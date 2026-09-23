import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

function supabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

/**
 * PATCH /api/installments/[id] — taksit durumunu değiştir.
 * Gövde: { action: "paid" }   → Ödendi olarak işaretle
 * Gövdede: { action: "unpaid" } → ödemeyi geri al (yanlış işaretleme düzeltmesi)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }
  if (body.action !== "paid" && body.action !== "unpaid") {
    return NextResponse.json(
      { error: "action alanı 'paid' veya 'unpaid' olmalı" },
      { status: 422 }
    );
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const now = new Date().toISOString();
  const db = supabase();
  const { data: row } = await db
    .from("installment_tracker")
    .select("id,installment_amount,state")
    .eq("id", id)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ ok: false, error: "Taksit bulunamadı" }, { status: 404 });
  }

  const nextState =
    body.action === "paid" ? "PAID" : row.state === "PAID" ? "UPCOMING" : row.state;
  const { error } = await db
    .from("installment_tracker")
    .update(
      body.action === "paid"
        ? {
            state: "PAID",
            paid_at: now,
            paid_amount: row.installment_amount,
            last_action_at: now,
          }
        : {
            state: nextState,
            paid_at: null,
            paid_amount: null,
            last_action_at: now,
          }
    )
    .eq("id", id);

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
    id,
    state: body.action === "paid" ? "PAID" : nextState,
  });
}

/**
 * POST /api/installments/[id] — hatırlatma kaydı (collection_actions'a yaz).
 * Gövde: { action: "remind" }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }
  if (body.action !== "remind") {
    return NextResponse.json(
      { error: "action alanı 'remind' olmalı" },
      { status: 422 }
    );
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const db = supabase();
  const { data: row } = await db
    .from("installment_tracker")
    .select("id,dershane_id,state,whatsapp_sent_count")
    .eq("id", id)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ ok: false, error: "Taksit bulunamadı" }, { status: 404 });
  }

  // State → eskalasyon aşaması (1-5); agent/agent/collections.py ile aynı mantık
  const stageByState: Record<string, number> = {
    UPCOMING: 1,
    DUE_TODAY: 2,
    OVERDUE_3D: 3,
    OVERDUE_7D: 3,
    OVERDUE_14D: 4,
    OVERDUE_21D: 5,
    OVERDUE_30D: 5,
    ESCALATED: 5,
  };
  const now = new Date().toISOString();
  const { error: actionError } = await db.from("collection_actions").insert({
    installment_id: row.id,
    dershane_id: row.dershane_id,
    stage: stageByState[row.state] ?? 1,
    channel: "whatsapp",
    tone: "panel-manual",
    result: "Panelden manuel hatırlatma talebi",
    occurred_at: now,
  });
  if (actionError) {
    return NextResponse.json(
      { ok: false, persisted: false, error: actionError.message },
      { status: 500 }
    );
  }

  const { error } = await db
    .from("installment_tracker")
    .update({
      last_action_at: now,
      whatsapp_sent_count: (row.whatsapp_sent_count ?? 0) + 1,
    })
    .eq("id", id);
  if (error) {
    // collection_actions yazıldı; sayaç güncellemesi kritik değil
    return NextResponse.json({ ok: true, persisted: true, mode: "live", id, note: error.message });
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live", id });
}

/**
 * DELETE /api/installments/[id]?scope=row|plan
 * scope=row  (varsayılan) — yalnız bu taksit satırını siler
 *                             (collection_actions FK cascade ile silinir)
 * scope=plan — aynı anda oluşturulan tüm plan taksitlerini siler
 *                             (aynı contact_id + aynı created_at kümesi)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scope = new URL(request.url).searchParams.get("scope") === "plan" ? "plan" : "row";

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const db = supabase();
  const { data: row } = await db
    .from("installment_tracker")
    .select("id,contact_id,created_at,installment_count")
    .eq("id", id)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ ok: false, error: "Taksit bulunamadı" }, { status: 404 });
  }

  if (scope === "plan") {
    // Tek INSERT'te oluşan satırlar aynı created_at'i taşır (now() statement-stable)
    const { error } = await db
      .from("installment_tracker")
      .delete()
      .eq("contact_id", row.contact_id)
      .eq("created_at", row.created_at);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, persisted: true, mode: "live", scope: "plan" });
  }

  const { error } = await db.from("installment_tracker").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live", scope: "row" });
}
