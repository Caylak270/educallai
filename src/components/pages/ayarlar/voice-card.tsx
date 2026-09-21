"use client";

import { useCallback, useEffect, useState } from "react";
import { CardHeader } from "./card-header";
import { AGENT_VOICES, findAgentVoice } from "@/lib/agent-voices";
import { clsx } from "@/lib/clsx";

type VoiceCardProps = {
  /** AyarlarView'in global toast'ı */
  showToast: (message: string) => void;
};

interface SavedSettings {
  mode: "natural" | "fast" | "hybrid" | null;
  voice: "female" | "male" | null;
  speech_speed: number | null;
  turn_close_ms: number | null;
  realtime_voice: string | null;
}

const DEFAULTS = {
  mode: "fast" as const,
  voice: "female" as const,
  speech_speed: 1,
  turn_close_ms: 180,
  realtime_voice: "marin",
};

/** Ses seçim id'sinden motor/çözümleme */
function resolve(id: string) {
  const v = findAgentVoice(id);
  return { engine: v.engine, cartVoice: v.cartVoice, realtimeVoice: v.realtimeVoice };
}

/** Ajan canlı ses & gecikme kartı — agent-settings.json'a yazar.
 *  Ajan bu dosyayı her görüşme başında taze okur; restart gerekmez. */
export function VoiceCard({ showToast }: VoiceCardProps) {
  const [voiceId, setVoiceId] = useState("realtime-marin");
  const [speed, setSpeed] = useState(1);
  const [turnMs, setTurnMs] = useState(180);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/agent-settings", { cache: "no-store" });
        const data = (await res.json()) as { settings: SavedSettings };
        const s = data.settings;
        const engine = s.mode ?? DEFAULTS.mode;
        const id =
          engine === "natural"
            ? `cartesia-${s.voice ?? DEFAULTS.voice}`
            : engine === "hybrid"
              ? `hybrid-${s.voice ?? DEFAULTS.voice}`
              : `realtime-${s.realtime_voice ?? DEFAULTS.realtime_voice}`;
        if (!alive) return;
        setVoiceId(id);
        setSpeed(s.speech_speed ?? DEFAULTS.speech_speed);
        setTurnMs(s.turn_close_ms ?? DEFAULTS.turn_close_ms);
      } catch {
        // ajan dosyası yoksa UI varsayılanlarında kalır
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selected = findAgentVoice(voiceId);
  const speedLabel = speed === 1 ? "1.00x (Normal)" : `${speed.toFixed(2)}x`;

  const handleApply = useCallback(async () => {
    setSaving(true);
    try {
      const { engine, cartVoice, realtimeVoice } = resolve(voiceId);
      const res = await fetch("/api/agent-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: engine,
          voice: cartVoice,
          speech_speed: engine !== "fast" ? speed : null,
          turn_close_ms: turnMs,
          realtime_voice: realtimeVoice,
        }),
      });
      if (!res.ok) {
        showToast("Ajan ayarları kaydedilemedi — tekrar deneyin.");
        return;
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 4000);
      showToast("Ajan ayarları kaydedildi — bir sonraki görüşmede geçerli.");
    } catch {
      showToast("Ajan ayarları kaydedilemedi — bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }, [voiceId, speed, turnMs, showToast]);

  return (
    <section className="flex flex-col gap-space-md rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
      <CardHeader
        icon="record_voice_over"
        className="pb-space-xs"
        title="AI Ses ve Ton Seçimi"
        description="Canlı ajan sesi ve gecikme tercihi — kaydettiğinde bir sonraki görüşmede geçerli."
        right={
          <span className="inline-flex items-center gap-1 rounded-lg bg-secondary-container/40 px-space-sm py-space-xs font-label-sm text-label-sm font-medium text-on-secondary-container">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
            Canlı Ajan
          </span>
        }
      />

      {/* Seçili profil özeti */}
      <div className="flex flex-col gap-space-sm rounded-xl bg-linear-to-br from-primary-fixed to-surface-container p-space-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-title-sm text-title-sm font-bold text-on-primary">
                {selected.cartVoice === "male" ? "E" : selected.cartVoice === "female" ? "K" : "H"}
              </div>
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-secondary ring-2 ring-surface-container-lowest" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-title-sm text-title-sm font-bold text-on-surface">
                  {selected.name}
                </span>
                <span className="rounded-sm bg-surface-container-lowest px-1.5 py-0.5 font-label-sm text-label-sm font-semibold text-primary">
                  {loading ? "Yükleniyor…" : "Seçili"}
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {selected.description}
              </span>
            </div>
          </div>
          <span
            className={clsx(
              "rounded-md px-2 py-1 font-label-sm text-label-sm font-semibold",
              selected.engine === "fast"
                ? "bg-primary-fixed text-primary"
                : "bg-tertiary-container/30 text-tertiary-container"
            )}
          >
            {selected.tag}
          </span>
        </div>
        <p className="font-body-sm text-body-sm italic text-on-surface-variant">
          {selected.engine === "natural"
            ? "En doğal Türkçe ses — cevaplar ~1,4 sn'de başlar."
            : selected.engine === "hybrid"
              ? "Doğal TR sesi + hızlı zekâ — cevaplar ~0,6-0,8 sn'de başlar."
              : "En hızlı yanıt — cevaplar ~0,4 sn'de başlar, ses OpenAI motorundan gelir."}
        </p>
      </div>

      {/* Ses seçimi */}
      <div className="flex flex-col gap-space-xs">
        <span className="font-label-md text-label-md text-on-surface-variant">
          Ses Seçenekleri
        </span>
        {AGENT_VOICES.map((voice) => (
          <label
            key={voice.id}
            className="flex cursor-pointer items-center justify-between rounded-lg bg-surface-container-low p-space-sm transition-colors hover:bg-surface-container"
          >
            <div className="flex items-center gap-space-sm">
              <input
                type="radio"
                name="agent_voice"
                checked={voiceId === voice.id}
                onChange={() => setVoiceId(voice.id)}
                className="accent-primary"
                aria-label={voice.name}
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-title-sm text-title-sm text-on-surface">
                    {voice.name}
                  </span>
                  <span
                    className={clsx(
                      "rounded-sm px-1.5 py-0.5 font-label-xs text-label-xs font-semibold",
                      voice.engine === "fast"
                        ? "bg-primary-fixed text-primary"
                        : "bg-tertiary-container/25 text-tertiary-container"
                    )}
                  >
                    {voice.tag}
                  </span>
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  {voice.description}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Konuşma hızı — yalnız doğal (Cartesia) modda etkin */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between font-label-md text-label-md">
          <span className={clsx("text-on-surface", !selected.cartVoice && "opacity-50")}>
            Konuşma Hızı
          </span>
          <span
            className={clsx(
              "font-mono-data text-mono-data font-bold",
              selected.cartVoice ? "text-primary" : "text-outline"
            )}
          >
            {selected.engine === "natural" ? speedLabel : "—"}
          </span>
        </div>
        <input
          type="range"
          min={0.85}
          max={1.15}
          step={0.05}
          value={speed}
          disabled={!selected.cartVoice}
          onChange={(event) => setSpeed(Number(event.target.value))}
          aria-label="Konuşma Hızı"
          className="w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
        />
        <span className="font-body-sm text-body-sm text-[11px] text-on-surface-variant">
          Doğal ses modlarında konuşma temposu (0.95 = daha sakin ve sıcak).
        </span>
      </div>

      {/* Tur kapatma ms — her iki modda etkin */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between font-label-md text-label-md">
          <span className="text-on-surface">Tur Kapatma Beklemesi</span>
          <span className="font-mono-data text-mono-data font-bold text-primary">
            {turnMs} ms
          </span>
        </div>
        <input
          type="range"
          min={120}
          max={300}
          step={10}
          value={turnMs}
          onChange={(event) => setTurnMs(Number(event.target.value))}
          aria-label="Tur Kapatma Beklemesi"
          className="w-full cursor-pointer accent-primary"
        />
        <span className="font-body-sm text-body-sm text-[11px] text-on-surface-variant">
          Veli sustuktan sonra ajanın ne kadar bekleyip cevaba başlayacağı. Kısa =
          daha hızlı; ama 120 ms altında cümle aralarında erken kesme riski artar.
        </span>
      </div>

      {/* Uygula */}
      <button
        type="button"
        onClick={handleApply}
        disabled={loading || saving}
        className="mt-space-xs flex items-center justify-center gap-space-xs rounded-xl bg-primary-container px-space-lg py-space-sm font-title-sm text-title-sm font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.98] disabled:opacity-50"
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {savedFlash ? "check_circle" : "graphic_eq"}
        </span>
        <span>{saving ? "Uygulanıyor…" : savedFlash ? "Uygulandı" : "Ajan'a Uygula"}</span>
      </button>
      <p className="text-center font-body-sm text-body-sm text-[11px] text-on-surface-variant">
        Ayar ajan dosyasına yazılır ve <strong>bir sonraki görüşmede</strong> otomatik
        geçerli olur.
      </p>
    </section>
  );
}
