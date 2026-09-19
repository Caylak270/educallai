"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";
import { batchCallBanner } from "@/lib/mock/installments";

type BatchPhase = "idle" | "dialing" | "started";

export function BatchCallTrigger() {
  const [phase, setPhase] = useState<BatchPhase>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const startBatchCall = () => {
    if (phase !== "idle") return;
    setPhase("dialing");
    timers.current.push(
      window.setTimeout(() => {
        setPhase("started");
        timers.current.push(
          window.setTimeout(() => setPhase("idle"), 2500)
        );
      }, 1200)
    );
  };

  return (
    <aside
      aria-label="Toplu İşlemler"
      className="pointer-events-none sticky bottom-2 z-30 mt-space-lg w-full px-margin-mobile"
    >
      <div className="pointer-events-auto flex items-center justify-between gap-2.5 rounded-2xl bg-inverse-surface p-3 text-inverse-on-surface shadow-xl">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <span className="material-symbols-outlined animate-pulse text-[20px] text-on-secondary">
              record_voice_over
            </span>
          </div>
          <div className="min-w-0">
            {/* Tasarımdaki label-lg karşılığı */}
            <div className="truncate font-label-md text-label-md font-bold text-inverse-on-surface">
              {batchCallBanner.title}
            </div>
            <p className="font-label-sm text-[11px] text-inverse-on-surface/80">
              {batchCallBanner.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={startBatchCall}
          disabled={phase !== "idle"}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 font-label-sm text-label-sm font-bold text-on-primary shadow-md transition-transform active:scale-95 disabled:opacity-80"
        >
          {phase === "idle" && (
            <span className="material-symbols-outlined text-[16px]">
              play_arrow
            </span>
          )}
          {phase === "dialing" && (
            <span className="material-symbols-outlined animate-spin text-[16px]">
              sync
            </span>
          )}
          {phase === "started" && (
            <span className="material-symbols-outlined text-[16px]">check</span>
          )}
          <span>
            {phase === "idle" && batchCallBanner.startLabel}
            {phase === "dialing" && batchCallBanner.dialingLabel}
            {phase === "started" && batchCallBanner.startedLabel}
          </span>
        </button>
      </div>
    </aside>
  );
}
