"use client";

import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";
import { triggerAiCall, type AiCallMessage } from "./call-toast";

/**
 * Tıklandığında AI görüşme toast'unu tetikleyen buton.
 * Stitch onclick="triggerAICall(...)" karşılığı.
 */
export function AiCallToastButton({
  message,
  className,
  children,
  ariaLabel,
}: {
  message: AiCallMessage;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button aria-label={ariaLabel} className={clsx(className)} type="button" onClick={() => triggerAiCall(message)}>
      {children}
    </button>
  );
}

/** "İncele" butonu: vurgulanan öğrenci detay kartına yumuşak kaydırır. */
export function ScrollToDetailButton({
  targetId,
  className,
  children,
}: {
  targetId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      className={clsx(className)}
      type="button"
      onClick={() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      {children}
    </button>
  );
}
