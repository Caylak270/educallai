import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

const VALID = new Set(["done", "partial", "missing"]);

/**
 * POST /api/homework/marks — bir ödevin teslim işaretlerini kaydet (toplu).
 * Gövde: { assignmentId, entries: [{ contactId, status }], markedBy? }
 * Mevcut işaretler silinip yenileri yazılır (ödev bazlı tam güncelleme) —
 * /api/attendance deseni.
 */
export async function POST(request: Request) {
  let body: {
    assignmentId?: string;
    entries?: Array<{ contactId: string; status: string }>;
    markedBy?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const { assignmentId, entries, markedBy } = body;
  if (!assignmentId || !Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json(
      { error: "assignmentId ve en az bir entry gerekli" },
      { status: 422 }
    );
  }
  for (const e of entries) {
    if (!VALID.has(e.status)) {
      return NextResponse.json(
        { error: `Geçersiz durum: ${e.status} (done | partial | missing)` },
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

  const { data: assignment } = await db
    .from("assignments")
    .select("id,dershane_id")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!assignment) {
    return NextResponse.json({ ok: false, error: "Ödev bulunamadı" }, { status: 404 });
  }

  // Ödev bazlı güncelleme: upsert — yalnız status/marked_by/checked_at
  // alanlarını yazar; öğrenci fotoğraf alanlarını (photo_path, submitted_at,
  // student_note) korur.
  const now = new Date().toISOString();
  const rows = entries.map((e) => ({
    assignment_id: assignmentId,
    contact_id: e.contactId,
    dershane_id: assignment.dershane_id,
    status: e.status,
    marked_by: markedBy?.trim() || "Panel",
    checked_at: now,
  }));
  const { error: upError } = await db
    .from("homework_submissions")
    .upsert(rows, { onConflict: "assignment_id,contact_id" });
  if (upError) {
    return NextResponse.json({ ok: false, error: upError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    persisted: true,
    mode: "live",
    assignmentId,
    saved: rows.length,
    missing: entries.filter((e) => e.status === "missing").length,
  });
}
