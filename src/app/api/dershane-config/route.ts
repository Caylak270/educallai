import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getIntegrations } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/dershane-config — Ayarlar sayfasının kalıcı yapılandırması.
 * `dershaneler` satırındaki capabilities + working_hours.ui alanlarını okur.
 */
export async function GET() {
  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ mode: "demo", persisted: false });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error } = await supabase
    .from("dershaneler")
    .select("id,capabilities,working_hours")
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { mode: "live", persisted: false, error: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ mode: "live", persisted: false, note: "Dershane kaydı yok" });
  }

  const workingHours = (data.working_hours ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    mode: "live",
    persisted: true,
    id: data.id,
    capabilities: data.capabilities ?? {},
    ui: (workingHours.ui ?? null) as Record<string, unknown> | null,
  });
}

/**
 * POST /api/dershane-config — Ayarlar "Değişiklikleri Kaydet".
 * Gövde: { capabilities?, schedule?, retryHours?, dailyCallLimit? }
 * - capabilities → dershaneler.capabilities (mevcut anahtarlar korunarak)
 * - schedule/retryHours/dailyCallLimit → dershaneler.working_hours.ui
 *   (agent'ın working_hours.py beklediği diğer anahtarlar korunur)
 */
export async function POST(request: Request) {
  let body: {
    capabilities?: Record<string, boolean>;
    schedule?: Array<{ id: string; enabled: boolean; start: string; end: string }>;
    retryHours?: number;
    dailyCallLimit?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const { supabase: supabaseLive } = getIntegrations();
  if (!supabaseLive) {
    return NextResponse.json({ ok: true, persisted: false, mode: "demo" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: rows, error: readError } = await supabase
    .from("dershaneler")
    .select("id,capabilities,working_hours")
    .limit(1);

  if (readError || !rows || rows.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        error: readError?.message ?? "Dershane kaydı bulunamadı",
      },
      { status: readError?.message.includes("does not exist") ? 409 : 500 }
    );
  }

  const row = rows[0];
  const existingCaps = (row.capabilities ?? {}) as Record<string, unknown>;
  const existingHours = (row.working_hours ?? {}) as Record<string, unknown>;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.capabilities) {
    patch.capabilities = { ...existingCaps, ...body.capabilities };
  }
  if (body.schedule || body.retryHours !== undefined || body.dailyCallLimit !== undefined) {
    patch.working_hours = {
      ...existingHours,
      ui: {
        ...(existingHours.ui as Record<string, unknown> | undefined),
        ...(body.schedule ? { schedule: body.schedule } : {}),
        ...(body.retryHours !== undefined ? { retryHours: body.retryHours } : {}),
        ...(body.dailyCallLimit !== undefined
          ? { dailyCallLimit: body.dailyCallLimit }
          : {}),
      },
    };
  }

  const { error } = await supabase
    .from("dershaneler")
    .update(patch)
    .eq("id", row.id);

  if (error) {
    return NextResponse.json(
      { ok: false, persisted: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, persisted: true, mode: "live", id: row.id });
}
