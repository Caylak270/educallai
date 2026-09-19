import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isLiveMode } from "@/lib/server/config";

export const dynamic = "force-dynamic";

const VALID_STAGES = [
  "yeni",
  "iletisim",
  "ilgilendi",
  "randevu",
  "ziyaret",
  "kayit",
  "kaybedildi",
];

/**
 * PATCH /api/leads/[id] — lead aşaması güncelle (kanban sürükle-bırak).
 * Supabase bağlıysa leads.stage gerçekten güncellenir; bağlı değilse
 * demo onayı döner (UI yerel state'ini zaten güncel tutuyor).
 *
 * Mock lead id'leri (zeynep-kaya vb.) Supabase UUID'si olmadığından
 * canlı modda 404 döner — UI demo veriden gerçek veriye geçtiğinde çözülür.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { stage?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const stage = body.stage;
  if (!stage || !VALID_STAGES.includes(stage)) {
    return NextResponse.json(
      { error: `stage alanı şunlardan biri olmalı: ${VALID_STAGES.join(", ")}` },
      { status: 422 }
    );
  }

  if (!isLiveMode()) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo", id, stage });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const stageMap: Record<string, string> = {
    yeni: "new",
    iletisim: "contacted",
    ilgilendi: "interested",
    randevu: "appointment_set",
    ziyaret: "visited",
    kayit: "enrolled",
    kaybedildi: "lost",
  };

  const { error } = await supabase
    .from("leads")
    .update({ stage: stageMap[stage], updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, persisted: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, persisted: true, mode: "live", id, stage });
}
