"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { triggerAiCall, type AiCallMessage } from "./call-toast";

/**
 * Tıklandığında AI görüşme toast'unu tetikleyen buton.
 * phone verilirse önce POST /api/calls çağrılır — canlı modda gerçek arama,
 * demo modda simülasyon kaydı; sonuç toast'a yazılır.
 */
export function AiCallToastButton({
  message,
  className,
  children,
  ariaLabel,
  phone,
  name,
  leadId,
}: {
  message: AiCallMessage;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  phone?: string;
  name?: string;
  leadId?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!phone) {
      triggerAiCall(message);
      return;
    }
    if (busy) return;
    setBusy(true);
    // Maskeli mock numaraları geçerli E.164'e çevir (412 ** ** → demo numara)
    const digits = (phone.match(/\d/g) ?? []).join("");
    const clean = digits.length >= 10 ? `+${digits.slice(-12)}` : "+905321234567";
    let note = "";
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean, name, leadId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        note = data.error ?? "Arama başlatılamadı";
      } else {
        note = data.mode === "live" ? "LiveKit ile çevriliyor" : "Demo kaydı oluşturuldu";
      }
    } catch {
      note = "Sunucuya ulaşılamadı";
    }
    setBusy(false);
    triggerAiCall({
      ...message,
      description: `${message.description} · ${note}`,
    });
  }

  return (
    <button
      aria-label={ariaLabel}
      aria-busy={busy}
      className={clsx(className, busy && "opacity-60")}
      disabled={busy}
      type="button"
      onClick={handleClick}
    >
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
