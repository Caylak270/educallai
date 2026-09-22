"use client";

import { useRef, useState } from "react";
import { clsx } from "@/lib/clsx";

type RecallState =
  | { status: "idle" }
  | { status: "busy" }
  | { status: "ok"; note: string }
  | { status: "fail"; note: string };

/**
 * Görüşme detayındaki "Tekrar Ara": POST /api/calls ile AI araması başlatır.
 * Canlı modda LiveKit SIP çevirisi, demo modda simülasyon kaydı oluşur;
 * sonuç butonun yanındaki durum metnine yazılır.
 */
export function RecallButton({
  phone,
  name,
  className,
}: {
  phone: string;
  name: string;
  className?: string;
}) {
  const [state, setState] = useState<RecallState>({ status: "idle" });
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleClick() {
    if (state.status === "busy") return;
    setState({ status: "busy" });
    // Maskeli demo numaralarını da geçerli E.164'e çevir (mevcut çağrı butonlarıyla aynı kural)
    const digits = (phone.match(/\d/g) ?? []).join("");
    const clean = digits.length >= 10 ? `+${digits.slice(-12)}` : "";
    let next: RecallState;
    if (!clean) {
      next = { status: "fail", note: "Kayıtta geçerli telefon numarası yok" };
    } else {
      try {
        const res = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: clean, name, context: "Görüşme detayından tekrar arama" }),
        });
        const data = await res.json();
        next =
          res.ok && data.ok
            ? {
                status: "ok",
                note:
                  data.mode === "live"
                    ? "LiveKit ile çevriliyor — arama başladı"
                    : "Demo arama kaydı oluşturuldu",
              }
            : { status: "fail", note: data.error ?? "Arama başlatılamadı" };
      } catch {
        next = { status: "fail", note: "Sunucuya ulaşılamadı" };
      }
    }
    setState(next);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setState({ status: "idle" }), 6000);
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        aria-busy={state.status === "busy"}
        className={clsx(
          "flex h-10 items-center gap-1.5 rounded-xl bg-primary-container px-4 font-label-md text-label-md font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.98]",
          state.status === "busy" && "opacity-60",
          className
        )}
        disabled={state.status === "busy"}
        type="button"
        onClick={handleClick}
      >
        <span className="material-symbols-outlined text-[18px]">
          {state.status === "busy" ? "sync" : "call"}
        </span>
        <span>{state.status === "busy" ? "Aranıyor..." : "Tekrar Ara"}</span>
      </button>
      {state.status === "ok" || state.status === "fail" ? (
        <span
          aria-live="polite"
          className={clsx(
            "font-label-sm text-label-sm font-semibold",
            state.status === "ok" ? "text-secondary" : "text-error"
          )}
        >
          {state.note}
        </span>
      ) : null}
    </span>
  );
}
