import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";
import { deleteHomeworkPhotoFolder } from "@/lib/server/homework-storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/homework — yeni ödev ata.
 * Gövde: { title, subject?, classLevel?, dueDate, description?, createdBy? }
 * Canlı modda assignments tablosuna kayıt düşer; demo modda kalıcı yazma
 * yapılmaz ({ ok: true, persisted: false, mode: "demo" }) — arayüz yerel
 * olarak ekleyip kullanıcıyı dürüstçe bilgilendirir.
 */
export async function POST(request: Request) {
  let body: {
    title?: string;
    subject?: string;
    classLevel?: string;
    dueDate?: string;
    description?: string;
    createdBy?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const title = body.title?.trim();
  const dueDate = body.dueDate?.trim();
  if (!title || !dueDate) {
    return NextResponse.json(
      { error: "title ve dueDate zorunlu" },
      { status: 422 }
    );
  }
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) {
    return NextResponse.json(
      { error: "dueDate geçerli bir tarih değil" },
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

  const { data: created, error } = await db
    .from("assignments")
    .insert({
      dershane_id: dershane.id,
      title,
      subject: body.subject?.trim() || null,
      class_level: body.classLevel?.trim() || null,
      due_date: due.toISOString(),
      description: body.description?.trim() || null,
      created_by: body.createdBy?.trim() || "Panel",
    })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live", id: created?.id });
}

/**
 * DELETE /api/homework?id=<uuid> — ödevi ve işaretlerini sil.
 * homework_submissions satırları FK cascade ile birlikte silinir;
 * yüklenmiş teslim fotoğrafları da Storage'dan temizlenir.
 */
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id zorunlu" }, { status: 422 });
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { error } = await db.from("assignments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  // Fotoğraf klasörü DB cascade'ine değil Storage'a gider — hatada yutulur
  // (ödev zaten silindi, tekrar denemeye gerek yok).
  try {
    await deleteHomeworkPhotoFolder(id);
  } catch {}
  return NextResponse.json({ ok: true, persisted: true, mode: "live" });
}
