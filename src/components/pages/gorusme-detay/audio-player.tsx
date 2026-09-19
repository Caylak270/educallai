"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import type { AudioPlayerData } from "@/lib/mock/calls";

/* Tailwind tarayıcısının yakalayabilmesi için bar yükseklikleri literal class */
const barHeight: Record<number, string> = {
  3: "h-3",
  4: "h-4",
  5: "h-5",
  6: "h-6",
  7: "h-7",
  8: "h-8",
  9: "h-9",
  10: "h-10",
  11: "h-11",
  12: "h-12",
  13: "h-13",
  14: "h-14",
};

export function AudioPlayer({ audio }: { audio: AudioPlayerData }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(audio.defaultSpeed);

  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      {/* Kanal bilgisi & indirme */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-secondary-fixed-dim" />
          <div className="flex flex-col">
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              {audio.channelTitle}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {audio.channelSubtitle}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Ses Kaydını İndir"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[20px]">
            download
          </span>
        </button>
      </div>

      {/* Waveform görselleştirici */}
      <div className="relative w-full overflow-hidden rounded-lg bg-surface-container-low px-3 py-2">
        <div className="flex h-14 items-center justify-between gap-1">
          {audio.playedBars.map((height, index) => (
            <span
              key={`played-${index}`}
              className={clsx("w-1 rounded-full bg-primary-container", barHeight[height])}
            />
          ))}
          {/* Oynatma konumu işaretçisi */}
          <div className="relative flex items-center justify-center">
            <span
              className={clsx(
                "w-1 rounded-full bg-primary-container",
                barHeight[audio.markerBar]
              )}
            />
            <div className="absolute -top-1 h-2.5 w-2.5 rounded-full bg-primary shadow" />
          </div>
          {audio.upcomingBars.map((height, index) => (
            <span
              key={`upcoming-${index}`}
              className={clsx("w-1 rounded-full bg-outline-variant", barHeight[height])}
            />
          ))}
        </div>
        {/* Scrubber & sayaç */}
        <div className="mt-1 flex items-center justify-between font-mono-data text-mono-data text-on-surface-variant">
          <span className="font-semibold text-primary">{audio.elapsed}</span>
          <span>{audio.total}</span>
        </div>
      </div>

      {/* Oynatıcı kontrolleri */}
      <div className="flex items-center justify-between pt-1">
        {/* Hız seçici */}
        <div className="flex items-center rounded-lg bg-surface-container p-0.5">
          {audio.speeds.map((option) => {
            const isActive = option === speed;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSpeed(option)}
                className={clsx(
                  "rounded-sm px-2.5 py-1 font-label-sm text-label-sm transition-colors",
                  isActive
                    ? "bg-surface-container-lowest font-semibold text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Medya aksiyonları */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="10 saniye geriye sar"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[24px]">
              replay_10
            </span>
          </button>
          <button
            type="button"
            aria-label="Oynat / Duraklat"
            onClick={() => setIsPlaying((playing) => !playing)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-md transition-all hover:opacity-90 active:scale-95"
          >
            <span className="material-symbols-outlined text-[28px]">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>
          <button
            type="button"
            aria-label="10 saniye ileri sar"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[24px]">
              forward_10
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
