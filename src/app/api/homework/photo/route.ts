import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";
import {
  buildHomeworkPhotoPath,
  MAX_PHOTO_BYTES,
  signedHomeworkPhotoUrl,
  uploadHomeworkPhoto,
} from "@/lib/server/homework-storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/homework/photo — öğrenci ödev fotoğrafı yükler (multipart form).
 * Alanlar: assignmentId, contactId, file (image/*, ≤5 MB), note? (kısa not)
 * photo_path + submitted_at upsert edilir; öğretmenin status işaretine
 * dokunulmaz. Demo modda kalıcı yazma yapılmaz.
 *
 * DEVİR NOTU: yetki kontrolü (bu öğrenci bu ödevi yükleyebilir mi) rol
 * sistemiyle birlikte homework-storage.ts'e eklenecek.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz form gövdesi" }, { status: 400 });
  }

  const assignmentId = (form.get("assignmentId") as string | null)?.trim();
  const contactId = (form.get("contactId") as string | null)?.trim();
  const note = (form.get("note") as string | null)?.trim() || null;
  const file = form.get("file");

  if (!assignmentId || !contactId || !(file instanceof File)) {
    return NextResponse.json(
      { error: "assignmentId, contactId ve file zorunlu" },
      { status: 422 }
    );
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Yalnızca resim dosyası yüklenebilir" }, { status: 422 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Fotoğraf en fazla 5 MB olabilir" }, { status: 422 });
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

  try {
    const path = buildHomeworkPhotoPath(assignmentId, contactId);
    await uploadHomeworkPhoto(path, file);
    const now = new Date().toISOString();
    // status kolonu NOT NULL olduğundan yeni satırda varsayılan 'missing'
    // yazılır; mevcut satırda öğretmenin işareti korunur (upsert yalnız
    // verilen kolonları günceller).
    const { error } = await db.from("homework_submissions").upsert(
      {
        assignment_id: assignmentId,
        contact_id: contactId,
        dershane_id: assignment.dershane_id,
        status: "missing",
        photo_path: path,
        student_note: note,
        submitted_at: now,
      },
      { onConflict: "assignment_id,contact_id" }
    );
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      persisted: true,
      mode: "live",
      submittedAt: now,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Yükleme başarısız" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/homework/photo?path=<storage yolu> — özel bucket olduğu için
 * kısa süreli (60 dk) imzalı okuma URL'i üretir.
 */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path")?.trim();
  if (!path || path.includes("..")) {
    return NextResponse.json({ error: "path zorunlu" }, { status: 422 });
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: false, error: "Demo modda fotoğraf yok" }, { status: 409 });
  }
  try {
    const url = await signedHomeworkPhotoUrl(path);
    return NextResponse.json({ ok: true, url });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "URL üretilemedi" },
      { status: 500 }
    );
  }
}
