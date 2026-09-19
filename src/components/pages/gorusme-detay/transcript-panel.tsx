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
    <div className="flex max-w-[92%] items-start gap-2.5">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm">
        <span className="material-symbols-outlined text-[16px]">smart_toy</span>
      </div>
      <div className="flex flex-col">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-label-sm text-label-sm font-semibold text-primary">
            {speaker}
          </span>
          <span className="font-mono-data text-mono-data text-on-surface-variant">
            {segment.time}
          </span>
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-surface-container-low p-space-md font-body-md text-body-md leading-relaxed text-on-surface shadow-sm">
          {segment.text}
        </div>
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
    <div className="flex max-w-[92%] items-start justify-end gap-2.5 self-end">
      <div className="flex flex-col items-end">
        <div className="mb-1 flex items-center gap-2">
          {playing ? (
            <>
              <span className="inline-flex items-center rounded bg-primary px-1.5 py-0.5 font-mono-data text-[10px] text-on-primary">
                Çalıyor
              </span>
              <span className="font-mono-data text-mono-data font-bold text-primary">
                {segment.time}
              </span>
            </>
          ) : (
            <span className="font-mono-data text-mono-data text-on-surface-variant">
              {segment.time}
            </span>
          )}
          <span className="font-label-sm text-label-sm font-semibold text-on-surface">
            {speaker}
          </span>
        </div>
        <div
          className={clsx(
            "rounded-2xl rounded-tr-sm p-space-md font-body-md text-body-md leading-relaxed text-on-surface shadow-sm",
            playing ? "bg-surface-container-high" : "bg-surface-container-lowest"
          )}
        >
          {segment.text}
        </div>
      </div>
      <div
        className={clsx(
          "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm",
          playing
            ? "bg-primary-fixed text-primary"
            : "bg-surface-container-highest text-on-surface"
        )}
      >
        <span className="material-symbols-outlined text-[16px]">person</span>
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
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) {
        window.clearTimeout(copyTimer.current);
      }
    };
  }, []);

  const handleCopy = () => {
    setCopied(true);
    if (copyTimer.current !== null) {
      window.clearTimeout(copyTimer.current);
    }
    copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-space-md">
      {/* Hızlı transkript bağlam göstergesi */}
      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-secondary">
            hearing
          </span>
          {meta.syncLabel}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="font-label-sm text-label-sm font-semibold text-primary hover:underline"
        >
          {copied ? meta.copiedLabel : meta.copyLabel}
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
