import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/**
 * POST /api/bordro/oran — öğretmen saat ücretini kaydet (upsert).
 * Gövde: { teacher, hourlyRate } — teacher, schedule_slots.teacher ile eşleşir.
 *
 * DEVİR NOTU: yetki kontrolü yok — rol sistemi bağlandığında yalnız müdür
 * düzenleyebilecek şekilde buraya eklenecek.
 */
export async function POST(request: Request) {
  let body: { teacher?: string; hourlyRate?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const teacher = body.teacher?.trim();
  const rate = Number(body.hourlyRate);
  if (!teacher || Number.isNaN(rate) || rate < 0) {
    return NextResponse.json(
      { error: "teacher ve geçerli hourlyRate zorunlu" },
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

  const { data: dershane } = await db
    .from("dershaneler")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!dershane) {
    return NextResponse.json({ ok: false, error: "Dershane kaydı bulunamadı" }, { status: 409 });
  }

  const { error } = await db.from("teacher_rates").upsert(
    {
      dershane_id: dershane.id,
      teacher,
      hourly_rate: rate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "dershane_id,teacher" }
  );
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live" });
}

/**
 * DELETE /api/bordro/oran?teacher=<ad> — öğretmen ücret kaydını siler
 * (test temizliği / sıfırlama için).
 */
export async function DELETE(request: Request) {
  const teacher = new URL(request.url).searchParams.get("teacher")?.trim();
  if (!teacher) {
    return NextResponse.json({ error: "teacher zorunlu" }, { status: 422 });
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const { error } = await db.from("teacher_rates").delete().eq("teacher", teacher);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live" });
}
