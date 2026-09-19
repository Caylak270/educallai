/**
 * Entegrasyon durumu — hangi sağlayıcılar .env ile bağlı?
 * Hiçbiri bağlı değilse uygulama "demo modda" çalışır (mock veri + simülasyon).
 */
export type Integrations = {
  supabase: boolean;
  livekit: boolean;
  deepgram: boolean;
  cartesia: boolean;
  anthropic: boolean;
  openai: boolean;
  netgsm: boolean;
};

export function getIntegrations(): Integrations {
  return {
    supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
    livekit: !!(
      process.env.LIVEKIT_URL &&
      process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET
    ),
    deepgram: !!process.env.DEEPGRAM_API_KEY,
    cartesia: !!process.env.CARTESIA_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    netgsm: !!(process.env.NETGSM_USERCODE && process.env.NETGSM_PASSWORD),
  };
}

export function isLiveMode(): boolean {
  const i = getIntegrations();
  return i.supabase && i.livekit && i.netgsm;
}
