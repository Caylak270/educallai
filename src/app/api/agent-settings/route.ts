import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * GET/POST /api/agent-settings — sesli ajanın canlı tercihleri.
 * Dosya: agent/agent-settings.json. Ajan bu dosyayı HER GÖRÜŞME BAŞINDA
 * taze okur → dashboard'dan kaydetmek yeterli, ajan restart gerekmez.
 * Şifre/anahtar içermez; yalnızca kullanıcı tercihi taşır.
 */

const SETTINGS_PATH = path.join(process.cwd(), "agent", "agent-settings.json");

const MODES = ["fast", "natural", "hybrid"] as const;
const VOICES = ["female", "male"] as const;
const REALTIME_VOICES = [
  "marin",
  "verse",
  "coral",
  "ash",
  "sage",
  "ballad",
] as const;

type AgentSettingsPayload = {
  mode: (typeof MODES)[number] | null;
  voice: (typeof VOICES)[number] | null;
  speech_speed: number | null;
  turn_close_ms: number | null;
  realtime_voice: (typeof REALTIME_VOICES)[number] | null;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function sanitize(body: Record<string, unknown>): AgentSettingsPayload {
  const mode = MODES.includes(body.mode as (typeof MODES)[number])
    ? (body.mode as AgentSettingsPayload["mode"])
    : null;
  const voice = VOICES.includes(body.voice as (typeof VOICES)[number])
    ? (body.voice as AgentSettingsPayload["voice"])
    : null;
  const rtVoice = REALTIME_VOICES.includes(
    body.realtime_voice as (typeof REALTIME_VOICES)[number]
  )
    ? (body.realtime_voice as AgentSettingsPayload["realtime_voice"])
    : null;
  const speed =
    typeof body.speech_speed === "number" && Number.isFinite(body.speech_speed)
      ? clamp(Math.round(body.speech_speed * 100) / 100, 0.7, 1.3)
      : null;
  const turn =
    typeof body.turn_close_ms === "number" && Number.isFinite(body.turn_close_ms)
      ? Math.round(clamp(body.turn_close_ms, 80, 400))
      : null;
  return {
    mode,
    voice,
    speech_speed: speed,
    turn_close_ms: turn,
    realtime_voice: rtVoice,
  };
}

async function readSettings(): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(SETTINGS_PATH, "utf-8"));
  } catch {
    return {};
  }
}

export async function GET() {
  const raw = await readSettings();
  return NextResponse.json({
    settings: sanitize(raw),
    defaults: Object.keys(raw).length === 0,
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const clean = sanitize(body);
  try {
    await mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
    await writeFile(SETTINGS_PATH, JSON.stringify(clean, null, 2), "utf-8");
  } catch (err) {
    return NextResponse.json(
      {
        error: "Ayar dosyasına yazılamadı",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    settings: clean,
    note: "Ajan ayarları bir sonraki görüşmede otomatik geçerli olur.",
  });
}
