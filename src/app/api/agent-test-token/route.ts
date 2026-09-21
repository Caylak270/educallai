import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { AccessToken } from "livekit-server-sdk";

/**
 * GET /api/agent-test-token — Ayarlar sayfasındaki sesli test için
 * kısa ömürlü LiveKit katılımcı token'ı üretir VE ajanı odaya dispatch eder.
 *
 * Test akışı: token üretilir → ajan `agent-test-*` odasına dispatch edilir →
 * tarayıcı odaya katılır → ajan agent-settings.json'daki SON ayarlarla konuşur.
 * Test görüşmesi de diğerleri gibi CRM'e transkript olarak yazılır.
 *
 * NOT-1: ajan AGENT_NAME=velipilot-live ile çalışıyor olmalı (canlı durum).
 * NOT-2: dispatch, python livekit-api üzerinden yapılır
 * (agent/scripts/dispatch_agent.py — voice-e2e.py ile aynı kanıtlanmış yol).
 * Node SDK'nın AgentDispatchClient'ı Cloud-hosted agent servisine gittiği
 * için çağrı "başarılı" dönüp hayali iş yapıyordu — odalar hiç oluşmuyordu.
 */

const execFileAsync = promisify(execFile);

const AGENT_NAME = process.env.AGENT_NAME ?? "velipilot-live";
const LIVEKIT_URL = process.env.LIVEKIT_URL ?? "";
const API_KEY = process.env.LIVEKIT_API_KEY ?? "";
const API_SECRET = process.env.LIVEKIT_API_SECRET ?? "";
const PYTHON = path.join(process.cwd(), "agent", ".venv", "Scripts", "python.exe");
const DISPATCH_SCRIPT = path.join(
  process.cwd(),
  "agent",
  "scripts",
  "dispatch_agent.py",
);

/** Kanıtlanmış python dispatch yolunu çalıştırır. */
async function pythonDispatch(room: string, agentName: string): Promise<void> {
  const { stdout } = await execFileAsync(PYTHON, [DISPATCH_SCRIPT, room, agentName], {
    timeout: 20_000,
  });
  if (!stdout.includes("dispatched")) {
    throw new Error(`dispatch beklenen çıktıyı vermedi: ${stdout.slice(0, 80)}`);
  }
}

export async function GET() {
  if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
    return NextResponse.json(
      { error: "LiveKit anahtarları sunucuda tanımlı değil (.env.local)" },
      { status: 503 },
    );
  }

  const room = `agent-test-${randomUUID().slice(0, 8)}`;
  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: `dashboard-${randomUUID().slice(0, 8)}`,
    name: "Dashboard Sesli Test",
    ttl: 10 * 60, // 10 dakika yeter
  });
  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
  });

  let dispatched = false;
  let dispatchError: string | null = null;
  try {
    await pythonDispatch(room, AGENT_NAME);
    dispatched = true;
  } catch (err) {
    dispatchError = err instanceof Error ? err.message : String(err);
    console.error("agent dispatch başarısız:", dispatchError);
  }

  return NextResponse.json({
    token: await at.toJwt(),
    url: LIVEKIT_URL,
    room,
    agentName: AGENT_NAME,
    dispatched,
    dispatchError,
  });
}
