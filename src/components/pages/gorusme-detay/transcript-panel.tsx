"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";
import type { TranscriptMeta, TranscriptSegment } from "@/lib/mock/calls";

function AiBubble({
  segment,
  speaker,
}: {
  segment: TranscriptSegment;
  speaker: string;
}) {
  return (
    <div className="flex max-w-[85%] flex-col items-start">
      <div className="mb-1 flex items-center gap-2">
        <span className="font-label-sm text-label-sm font-semibold text-primary">
          {speaker}
        </span>
        <span className="font-mono-data text-[11px] text-on-surface-variant">
          {segment.time}
        </span>
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-surface-container-low px-4 py-3 font-body-md text-body-md leading-relaxed text-on-surface">
        {segment.text}
      </div>
    </div>
  );
}

function ParentBubble({
  segment,
  speaker,
}: {
  segment: TranscriptSegment;
  speaker: string;
}) {
  const playing = segment.playing === true;
  return (
    <div className="flex max-w-[85%] flex-col items-end self-end">
      <div className="mb-1 flex items-center gap-2">
        {playing ? (
          <>
            <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 font-label-xs text-label-xs font-semibold text-on-primary">
              Çalıyor
            </span>
            <span className="font-mono-data text-[11px] font-semibold text-primary">
              {segment.time}
            </span>
          </>
        ) : (
          <span className="font-mono-data text-[11px] text-on-surface-variant">
            {segment.time}
          </span>
        )}
        <span className="font-label-sm text-label-sm font-semibold text-on-surface">
          {speaker}
        </span>
      </div>
      <div
        className={clsx(
          "rounded-2xl rounded-tr-sm px-4 py-3 font-body-md text-body-md leading-relaxed text-on-surface",
          playing ? "bg-primary-fixed" : "bg-primary-fixed/50"
        )}
      >
        {segment.text}
      </div>
    </div>
  );
}

export function TranscriptPanel({
  segments,
  meta,
}: {
  segments: TranscriptSegment[];
  meta: TranscriptMeta;
}) {
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) {
        window.clearTimeout(copyTimer.current);
      }
    };
  }, []);

  /* Tüm segmentleri zaman + konuşmacı etiketiyle birleştirip gerçekten panoya yazar. */
  const handleCopy = () => {
    const text = segments
      .map(
        (segment) =>
          `[${segment.time}] ${
            segment.speaker === "ai" ? meta.aiSpeaker : meta.parentSpeaker
          }: ${segment.text}`
      )
      .join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => setCopyState("ok"))
      .catch(() => setCopyState("fail"));
    if (copyTimer.current !== null) {
      window.clearTimeout(copyTimer.current);
    }
    copyTimer.current = window.setTimeout(() => setCopyState("idle"), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Senkron göstergesi & kopyala */}
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/50 pb-3">
        <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-secondary">
            hearing
          </span>
          {meta.syncLabel}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={clsx(
            "shrink-0 font-label-sm text-label-sm font-semibold hover:underline",
            copyState === "fail" ? "text-error" : "text-primary"
          )}
        >
          {copyState === "ok"
            ? meta.copiedLabel
            : copyState === "fail"
              ? "Kopyalanamadı"
              : meta.copyLabel}
        </button>
      </div>

      {segments.map((segment) =>
        segment.speaker === "ai" ? (
          <AiBubble key={segment.id} segment={segment} speaker={meta.aiSpeaker} />
        ) : (
          <ParentBubble
            key={segment.id}
            segment={segment}
            speaker={meta.parentSpeaker}
          />
        )
      )}
    </div>
  );
}
