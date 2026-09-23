import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/**
 * POST /api/handoffs — görüşmeyi danışmana manuel devret.
 * Gövde: { contactId?, callId?, reason? }
 * Canlı modda handoff_logs tablosuna status:'pending' kaydı düşer; bu kayıt
 * /api/notifications tarafından okunduğu için topbar zilinde bildirim olur.
 * handoff_logs.lead_id NOT NULL olduğundan devir lead'e bağlanır — kontak
 * verildiyse lead contact_id üzerinden çözümlenir.
 */
export async function POST(request: Request) {
  let body: { contactId?: string; callId?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const contactId = body.contactId?.trim() || null;
  const callId = body.callId?.trim() || null;
  if (!contactId && !callId) {
    return NextResponse.json({ error: "contactId veya callId zorunlu" }, { status: 422 });
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

  let leadId: string | null = null;
  if (contactId) {
    const { data: lead } = await db
      .from("leads")
      .select("id")
      .eq("contact_id", contactId)
      .limit(1)
      .maybeSingle();
    leadId = lead?.id ?? null;
  }
  if (!leadId) {
    return NextResponse.json(
      { ok: false, error: "Bu görüşme için lead kaydı bulunamadı — devir oluşturulamadı" },
      { status: 409 }
    );
  }

  const { error } = await db.from("handoff_logs").insert({
    lead_id: leadId,
    dershane_id: dershane.id,
    trigger_reason: body.reason?.trim() || "manual-handoff",
    status: "pending",
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live" });
}
