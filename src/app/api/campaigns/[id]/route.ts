import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["running", "paused", "completed", "draft", "scheduled"]);

/**
 * PATCH /api/campaigns/[id] — kampanya durumu güncelle (durdur/devam).
 * Gövde: { status: "running" | "paused" | ... }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }
  const status = body.status;
  if (!status || !ALLOWED.has(status)) {
    return NextResponse.json(
      { error: `status şunlardan biri olmalı: ${[...ALLOWED].join(", ")}` },
      { status: 422 }
    );
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo", id, status });
  }

  const db = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const patch: Record<string, unknown> = { status };
  if (status === "running") patch.started_at = new Date().toISOString();
  if (status === "completed") patch.completed_at = new Date().toISOString();

  const { error } = await db.from("campaigns").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json(
      { ok: false, persisted: false, error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, persisted: true, mode: "live", id, status });
}
