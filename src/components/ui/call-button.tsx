"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";

type CallState = "idle" | "calling" | "started" | "error";

/**
 * AI arama butonu (v2 işlevsel) — POST /api/calls çağırır.
 * Canlı modda LiveKit+SIP ile gerçek arama başlar; demo modda simülasyon kaydı
 * oluşturulur ve buton bunu açıkça bildirir.
 */
export function CallButton({
  phone,
  name,
  leadId,
  context,
  label = "Ara (AI)",
  className,
  size = "sm",
  variant = "tonal",
}: {
  phone: string;
  name: string;
  leadId?: string;
  context?: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
  /** tonal: yeşil küçük buton · primary: mavi dolgu (drawer ana aksiyonu) */
  variant?: "tonal" | "primary";
}) {
  const [state, setState] = useState<CallState>("idle");
  const [detail, setDetail] = useState<string | null>(null);

  async function startCall() {
    if (state === "calling") return;
    setState("calling");
    setDetail(null);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, leadId, context }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setDetail(data.record?.detail ?? data.error ?? "Arama başlatılamadı");
        setState("error");
      } else if (data.mode === "live") {
        setDetail("LiveKit üzerinden çevriliyor");
        setState("started");
      } else {
        setDetail("Demo: kayıt oluşturuldu (canlı arama için LIVEKIT + NETGSM ekle)");
        setState("started");
      }
    } catch {
      setDetail("Sunucuya ulaşılamadı");
      setState("error");
    }
    setTimeout(() => {
      setState("idle");
      setDetail(null);
    }, 3500);
  }

  return (
    <span className="relative inline-flex flex-col items-start">
      <button
        className={clsx(
          "flex items-center justify-center gap-1.5 rounded-lg font-label-sm font-semibold transition-colors disabled:opacity-60",
          size === "sm" ? "h-8 px-3 text-label-sm" : "h-10 px-4 text-label-md",
          variant === "primary" &&
            "w-full bg-primary text-on-primary hover:bg-primary-container",
          variant === "tonal" &&
            (state === "error"
              ? "bg-error-container text-on-error-container"
              : state === "started"
                ? "bg-secondary-container text-on-secondary-container"
                : "bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary"),
          state === "error" && variant === "primary" && "bg-error-container text-on-error-container",
          className
        )}
        disabled={state === "calling"}
        onClick={startCall}
        type="button"
      >
        {state === "calling" ? (
          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-[16px]">
            {state === "started" ? "check" : state === "error" ? "error" : "call"}
          </span>
        )}
        {state === "calling" ? "Bağlanıyor..." : state === "started" ? "Başlatıldı" : state === "error" ? "Hata" : label}
      </button>
      {detail ? (
        <span className="absolute top-full left-0 z-30 mt-1 w-max max-w-64 rounded-lg bg-inverse-surface px-2.5 py-1.5 font-body-xs text-[11px] leading-snug text-inverse-on-surface shadow-lg">
          {detail}
        </span>
      ) : null}
    </span>
  );
}
