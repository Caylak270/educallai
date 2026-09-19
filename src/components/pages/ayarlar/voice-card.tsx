"use client";

import { useEffect, useState } from "react";
import { CardHeader } from "./card-header";
import {
  activeVoice,
  alternativeVoices,
  waveformBars,
} from "@/lib/mock/settings";
import { clsx } from "@/lib/clsx";

type VoiceCardProps = {
  selectedVoiceId: string;
  speechSpeed: number;
  latencyMs: number;
  onVoiceChange: (id: string) => void;
  onSpeedChange: (value: number) => void;
  onLatencyChange: (value: number) => void;
};

export function VoiceCard({
  selectedVoiceId,
  speechSpeed,
  latencyMs,
  onVoiceChange,
  onSpeedChange,
  onLatencyChange,
}: VoiceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => setIsPlaying(false), 4000);
    return () => clearTimeout(timer);
  }, [isPlaying]);

  const speedLabel = speechSpeed === 1 ? "1.00x (Normal)" : `${speechSpeed.toFixed(2)}x`;

  return (
    <section className="flex flex-col gap-space-md rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
      <CardHeader
        icon="record_voice_over"
        className="pb-space-xs"
        title="AI Ses ve Ton Seçimi"
        description="Veliye hitap edecek asistan ses profili"
      />

      <div className="flex flex-col gap-space-sm rounded-xl bg-linear-to-br from-primary-fixed to-surface-container p-space-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-title-sm text-title-sm font-bold text-on-primary">
                {activeVoice.initial}
              </div>
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-secondary ring-2 ring-surface-container-lowest" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-title-sm text-title-sm font-bold text-on-surface">
                  {activeVoice.name}
                </span>
                <span className="rounded-sm bg-surface-container-lowest px-1.5 py-0.5 font-label-sm text-label-sm font-semibold text-primary">
                  Aktif
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {activeVoice.description}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-mono-data text-mono-data font-bold text-secondary">
              {activeVoice.score}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Doğallık Skoru</span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm rounded-lg bg-surface-container-lowest/90 p-space-sm backdrop-blur">
          <button
            type="button"
            onClick={() => setIsPlaying((playing) => !playing)}
            aria-label={isPlaying ? "Ses önizlemeyi durdur" : "Ses önizlemeyi oynat"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-transform hover:bg-primary-container active:scale-95"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>
          <div className="flex h-8 flex-1 items-center gap-0.5 px-1">
            {waveformBars.map((bar, index) => (
              <span
                key={index}
                className={clsx(
                  "w-1 rounded-full",
                  bar.height,
                  bar.color,
                  (isPlaying || index === 0) && "animate-pulse"
                )}
              />
            ))}
          </div>
          <span className="shrink-0 font-mono-data text-mono-data text-[11px] text-on-surface-variant">
            {activeVoice.previewDuration}
          </span>
        </div>

        <p className="font-body-sm text-body-sm italic text-on-surface-variant">{activeVoice.quote}</p>
      </div>

      <div className="flex flex-col gap-space-xs">
        <span className="font-label-md text-label-md text-on-surface-variant">
          Alternatif Ses Modelleri
        </span>
        {alternativeVoices.map((voice) => (
          <label
            key={voice.id}
            className="flex cursor-pointer items-center justify-between rounded-lg bg-surface-container-low p-space-sm transition-colors hover:bg-surface-container"
          >
            <div className="flex items-center gap-space-sm">
              <input
                type="radio"
                name="voice_select"
                checked={selectedVoiceId === voice.id}
                onChange={() => onVoiceChange(voice.id)}
                className="accent-primary"
                aria-label={voice.name}
              />
              <div>
                <div className="font-title-sm text-title-sm text-on-surface">{voice.name}</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">{voice.description}</div>
              </div>
            </div>
            <button
              type="button"
              aria-label={`${voice.name} sesini dinle`}
              className="rounded-md p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">volume_up</span>
            </button>
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-space-sm pt-space-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-label-md text-label-md">
            <span className="text-on-surface">Konuşma Hızı</span>
            <span className="font-mono-data text-mono-data font-bold text-primary">{speedLabel}</span>
          </div>
          <input
            type="range"
            min={0.8}
            max={1.3}
            step={0.05}
            value={speechSpeed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            aria-label="Konuşma Hızı"
            className="w-full cursor-pointer accent-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-label-md text-label-md">
            <span className="text-on-surface">Yapay Zeka Yanıt Bekleme</span>
            <span className="font-mono-data text-mono-data font-bold text-primary">{latencyMs} ms</span>
          </div>
          <input
            type="range"
            min={400}
            max={1200}
            step={50}
            value={latencyMs}
            onChange={(event) => onLatencyChange(Number(event.target.value))}
            aria-label="Yapay Zeka Yanıt Bekleme"
            className="w-full cursor-pointer accent-primary"
          />
          <span className="font-body-sm text-body-sm text-[11px] text-on-surface-variant">
            Veli sözünü bitirdiğinde AI yanıt başlatma gecikmesi.
          </span>
        </div>
      </div>
    </section>
  );
}
