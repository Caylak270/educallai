import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["yeni", "iletisim", "kayit", "iptal"]);

/** PATCH /api/referrals/[id] — referans durumu güncelle. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }
  if (!body.status || !ALLOWED.has(body.status)) {
    return NextResponse.json({ error: "Geçersiz status" }, { status: 422 });
  }
  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo", id, status: body.status });
  }
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { error } = await db.from("referrals").update({ status: body.status }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, persisted: true, mode: "live", id, status: body.status });
}
