import { NextResponse } from "next/server";
import { getIntegrations, isLiveMode } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/** Demo modda arama kayıtları (sunucu belleğinde; Supabase bağlıysa DB'ye yazılır). */
export type CallRecord = {
  id: string;
  leadId?: string;
  phone: string;
  name: string;
  context?: string;
  status: "queued" | "ringing" | "in_progress" | "completed" | "failed" | "demo";
  channel: "voice";
  direction: "outbound";
  createdAt: string;
  provider?: "livekit" | "demo";
  detail?: string;
};

const demoCalls = new Map<string, CallRecord>();

/**
 * POST /api/calls — giden AI araması başlat.
 *
 * Canlı mod (LIVEKIT + NETGSM env dolu): LiveKit odası açılıp SIP katılımcısı ile
 * numara çevrilir; agent odaya katılır (agent/scripts/agent_main.py pipeline'ı).
 * Demo mod: çağrı kaydı oluşturulup simülasyon durum döngüsü döner.
 *
 * Gövde: { leadId?, phone, name, context? }
 */
export async function POST(request: Request) {
  let body: { leadId?: string; phone?: string; name?: string; context?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi" }, { status: 400 });
  }

  const phone = body.phone?.trim();
  const name = body.name?.trim() || "Bilinmeyen veli";
  if (!phone || !/^[+\d][\d\s()-]{9,}$/.test(phone)) {
    return NextResponse.json(
      { error: "Geçerli bir telefon numarası gerekli (örn. +905321234567)" },
      { status: 422 }
    );
  }

  const id = `call_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const record: CallRecord = {
    id,
    leadId: body.leadId,
    phone,
    name,
    context: body.context,
    status: "queued",
    channel: "voice",
    direction: "outbound",
    createdAt: new Date().toISOString(),
  };

  const integrations = getIntegrations();

  // ── CANLI MOD: LiveKit üzerinden gerçek SIP araması ──
  if (isLiveMode()) {
    try {
      const { SipClient } = await import("livekit-server-sdk");
      const sip = new SipClient(
        process.env.LIVEKIT_URL!.replace(/^https?:\/\//, "wss://"),
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!
      );
      const roomName = `call-${id}`;
      // Netgsm SIP trunk'ı LiveKit'te "trunk" olarak tanımlı olmalı (bkz. agent/README.md)
      await sip.createSipParticipant(
        process.env.LIVEKIT_SIP_TRUNK_ID ?? "netgsm-trunk",
        phone.replace(/[^\d+]/g, ""),
        roomName,
        {
          participantIdentity: `veli-${id}`,
          participantName: name,
          // Not: velipilot agent, "call-" önekli odalara katılmak üzere yapılandırılır
          // (agent/scripts/agent_main.py → AGENT_ROOM_PREFIX)
        }
      );
      record.status = "ringing";
      record.provider = "livekit";
      record.detail = `Oda ${roomName} oluşturuldu, SIP çevirisi başladı.`;
      demoCalls.set(id, record);
      return NextResponse.json({ ok: true, mode: "live", record }, { status: 201 });
    } catch (error) {
      record.status = "failed";
      record.provider = "livekit";
      record.detail = error instanceof Error ? error.message : "LiveKit hatası";
      demoCalls.set(id, record);
      return NextResponse.json({ ok: false, mode: "live", record }, { status: 502 });
    }
  }

  // ── DEMO MOD: simülasyon kaydı ──
  record.status = "demo";
  record.provider = "demo";
  record.detail =
    "Demo mod: çağrı kaydı oluşturuldu. Gerçek arama için LIVEKIT + NETGSM anahtarlarını .env'e ekle.";
  demoCalls.set(id, record);

  return NextResponse.json(
    { ok: true, mode: "demo", record, integrations },
    { status: 201 }
  );
}

/** GET /api/calls — son arama kayıtları (demo belleği). */
export async function GET() {
  return NextResponse.json({
    calls: [...demoCalls.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50),
    mode: isLiveMode() ? "live" : "demo",
  });
}
