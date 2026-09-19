"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";

export interface AiCallMessage {
  title: string;
  description: string;
}

const AI_CALL_EVENT = "educallai:ai-call";

/** AI görüşme toast'unu tetikler (istemci bileşenlerden çağrılır). */
export function triggerAiCall(message: AiCallMessage) {
  window.dispatchEvent(new CustomEvent<AiCallMessage>(AI_CALL_EVENT, { detail: message }));
}

/** Stitch tasarımındaki triggerAICall() / triggerBatchCall() karşılığı: alttan yükselen toast. */
export function CallToast() {
  const [message, setMessage] = useState<AiCallMessage>({
    title: "AI Görüşme Başlatılıyor...",
    description: "Özdebir TYT-4 analizi ve etüt daveti aktarılıyor",
  });
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onAiCall(event: Event) {
      const detail = (event as CustomEvent<AiCallMessage>).detail;
      setMessage(detail);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 4500);
    }

    window.addEventListener(AI_CALL_EVENT, onAiCall);
    return () => {
      window.removeEventListener(AI_CALL_EVENT, onAiCall);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className={clsx(
        "pointer-events-none fixed inset-x-4 bottom-20 z-50 flex transform items-center justify-between rounded-2xl bg-inverse-surface p-4 text-inverse-on-surface shadow-xl transition-transform duration-300",
        visible ? "translate-y-0" : "translate-y-32"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 animate-spin items-center justify-center rounded-full bg-secondary">
          <span className="material-symbols-outlined text-[20px] text-on-secondary">sync</span>
        </div>
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm font-bold">{message.title}</span>
          <span className="font-body-sm text-body-sm text-inverse-primary">{message.description}</span>
        </div>
      </div>
      <span className="material-symbols-outlined text-[20px] text-secondary-fixed">check_circle</span>
    </div>
  );
}
