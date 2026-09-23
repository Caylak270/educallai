import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

const VALID = new Set(["present", "late", "absent"]);

/**
 * POST /api/attendance — bir dersin yoklamasını kaydet (toplu upsert).
 * Gövde: { lessonId, entries: [{ contactId, status }], markedBy? }
 * Mevcut işaretler silinip yenileri yazılır (ders bazlı tam güncelleme).
 */
export async function POST(request: Request) {
  let body: {
    lessonId?: string;
    entries?: Array<{ contactId: string; status: string }>;
    markedBy?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const { lessonId, entries, markedBy } = body;
  if (!lessonId || !Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json(
      { error: "lessonId ve en az bir entry gerekli" },
      { status: 422 }
    );
  }
  for (const e of entries) {
    if (!VALID.has(e.status)) {
      return NextResponse.json(
        { error: `Geçersiz durum: ${e.status} (present | late | absent)` },
        { status: 422 }
      );
    }
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: lesson } = await db
    .from("lessons")
    .select("id,dershane_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) {
    return NextResponse.json({ ok: false, error: "Ders bulunamadı" }, { status: 404 });
  }

  // Ders bazlı tam güncelleme: eski işaretleri sil, yenilerini yaz
  const { error: delError } = await db
    .from("attendance")
    .delete()
    .eq("lesson_id", lessonId);
  if (delError) {
    return NextResponse.json({ ok: false, error: delError.message }, { status: 500 });
  }

  const rows = entries.map((e) => ({
    lesson_id: lessonId,
    contact_id: e.contactId,
    dershane_id: lesson.dershane_id,
    status: e.status,
    marked_by: markedBy?.trim() || "Panel",
  }));
  const { error: insError } = await db.from("attendance").insert(rows);
  if (insError) {
    return NextResponse.json({ ok: false, error: insError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    persisted: true,
    mode: "live",
    lessonId,
    saved: rows.length,
    absent: entries.filter((e) => e.status === "absent").length,
  });
}
