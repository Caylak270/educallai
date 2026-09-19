import { NextResponse } from "next/server";
import { getIntegrations, isLiveMode } from "@/lib/server/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/config — entegrasyon durumu.
 * Ayarlar sayfası ve çağrı simülatörü "hangi sistem canlı" bilgisini buradan alır.
 */
export async function GET() {
  return NextResponse.json({
    mode: isLiveMode() ? "live" : "demo",
    integrations: getIntegrations(),
    needed: [
      {
        key: "SUPABASE_URL + SUPABASE_SERVICE_KEY",
        what: "Gerçek veri (veliler, aramalar, taksitler)",
        where: "supabase.com → Settings → API",
      },
      {
        key: "LIVEKIT_URL + LIVEKIT_API_KEY + LIVEKIT_API_SECRET",
        what: "Sesli arama köprüsü (oda + SIP katılımcı)",
        where: "livekit.io → Settings → Keys",
      },
      {
        key: "DEEPGRAM_API_KEY",
        what: "Türkçe konuşmayı yazıya çevirme (STT)",
        where: "deepgram.com — $200 ücretsiz kredi",
      },
      {
        key: "ANTHROPIC_API_KEY",
        what: "Konuşma beyni (Claude Haiku 4.5)",
        where: "console.anthropic.com",
      },
      {
        key: "CARTESIA_API_KEY",
        what: "Türkçe ses sentezi (TTS)",
        where: "cartesia.ai",
      },
      {
        key: "NETGSM_USERCODE + NETGSM_PASSWORD",
        what: "Telefon hattı (SIP trunk) + SMS",
        where: "netgsm.com.tr — SIP aboneliği",
      },
    ],
  });
}
