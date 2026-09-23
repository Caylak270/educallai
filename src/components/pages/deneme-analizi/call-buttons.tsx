"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { triggerAiCall, type AiCallMessage } from "./call-toast";

/**
 * Tıklandığında AI görüşme toast'unu tetikleyen buton.
 * phone verilirse önce POST /api/calls çağrılır — canlı modda gerçek arama,
 * demo modda simülasyon kaydı; sonuç toast'a yazılır.
 * phone yoksa ve fallbackHref verilirse buton yerine bağlantı render edilir
 * (sahte toast yerine veli CRM araması gibi gerçek bir aksiyona yönlendirir).
 */
export function AiCallToastButton({
  message,
  className,
  children,
  ariaLabel,
  phone,
  name,
  leadId,
  fallbackHref,
}: {
  message: AiCallMessage;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  phone?: string;
  name?: string;
  leadId?: string;
  /** phone yoksa kullanılacak yedek bağlantı (örn. /veliler?q=<öğrenci adı>) */
  fallbackHref?: string;
}) {
  const [busy, setBusy] = useState(false);

  // Telefon yoksa arama sahte toast'la simüle edilmez; yedek bağlantıya düş.
  if (!phone && fallbackHref) {
    return (
      <Link aria-label={ariaLabel} className={clsx(className)} href={fallbackHref}>
        {children}
      </Link>
    );
  }

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
