"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import type { AiSignals } from "@/lib/mock/calls";

type HandoffState =
  | { status: "idle" }
  | { status: "busy" }
  | { status: "done" }
  | { status: "fail"; note: string };

/**
 * AI sinyalleri — sekme kartının içinde düz içerik:
 * skor bloğu + ayırıcılarla ayrılmış sinyal satırları + devir aksiyonu.
 * Devir: POST /api/handoffs → handoff_logs'a 'pending' kayıt düşer;
 * /api/notifications bu kaydı okuduğu için topbar zilinde görünür.
 */
export function AiSignalsPanel({
  signals,
  callId,
  contactId,
}: {
  signals: AiSignals;
  /** Görüşme sinyal kaydının id'si */
  callId: string;
  /** Kontak kaydı (canlı veride mevcut; demo kayıtta null) */
  contactId: string | null;
}) {
  const [handoff, setHandoff] = useState<HandoffState>({ status: "idle" });

  const handleHandoff = async () => {
    if (handoff.status === "busy" || handoff.status === "done") return;
    setHandoff({ status: "busy" });
    try {
      const res = await fetch("/api/handoffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, contactId, reason: "manual-handoff" }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setHandoff({ status: "done" });
      } else {
        setHandoff({ status: "fail", note: data.error ?? "Devir kaydı oluşturulamadı" });
      }
    } catch {
      setHandoff({ status: "fail", note: "Sunucuya ulaşılamadı" });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Dönüşüm skoru */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">
              insights
            </span>
            <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">
              {signals.score.title}
            </h3>
          </div>
          <span className="shrink-0 rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary">
            {signals.score.badge}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
            {signals.score.value}
          </span>
          <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">
            {signals.score.regionAverage}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
          <div
            className="anim-bar h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${signals.score.percent}%` }}
          />
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          {signals.score.note}
        </p>
      </div>

      {/* Sinyal satırları */}
      <div className="mt-5 divide-y divide-outline-variant/50 border-t border-outline-variant/50">
        {/* Duygu & yaklaşım */}
        <div className="flex items-start justify-between gap-3 py-4">
          <div className="min-w-0">
            <p className="font-label-md text-label-md text-on-surface-variant">
              {signals.sentiment.title}
            </p>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface">
              {signals.sentiment.detail}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary">
            {signals.sentiment.badge}
          </span>
        </div>

        {/* Temel niyet */}
        <div className="py-4">
          <p className="font-label-md text-label-md text-on-surface-variant">
            {signals.intent.label}
          </p>
          <p className="mt-0.5 font-title-sm text-title-sm font-semibold text-on-surface">
            {signals.intent.title}
          </p>
          <span className="mt-2 inline-flex items-center rounded bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
            {signals.intent.tag}
          </span>
        </div>

        {/* Fiyat hassasiyeti & ödeme itirazı */}
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">
              {signals.priceSensitivity.label}
            </p>
            <p className="mt-0.5 font-title-sm text-title-sm font-semibold text-on-surface">
              {signals.priceSensitivity.value}
            </p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              {signals.priceSensitivity.detail}
            </p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">
              {signals.objection.label}
            </p>
            <p className="mt-0.5 font-title-sm text-title-sm font-semibold text-secondary">
              {signals.objection.value}
            </p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              {signals.objection.detail}
            </p>
          </div>
        </div>

        {/* Hedef program */}
        <div className="py-4">
          <p className="font-label-md text-label-md text-on-surface-variant">
            {signals.targetProgram.label}
          </p>
          <p className="mt-0.5 font-title-sm text-title-sm font-semibold text-on-surface">
            {signals.targetProgram.value}
          </p>
        </div>
      </div>

      {/* Yetkiliye devir — gerçek devir kaydı (POST /api/handoffs) */}
      <div className="mt-5">
        <button
          type="button"
          onClick={handleHandoff}
          disabled={handoff.status === "busy" || handoff.status === "done"}
          aria-busy={handoff.status === "busy"}
          className={clsx(
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl font-title-sm text-title-sm font-semibold transition-colors active:scale-[0.99]",
            handoff.status === "done"
              ? "bg-secondary-container text-on-secondary-container"
              : handoff.status === "fail"
                ? "bg-error-container text-on-error-container"
                : "bg-primary-container text-on-primary hover:bg-primary disabled:opacity-70"
          )}
        >
          <span
            className={clsx(
              "material-symbols-outlined text-[20px]",
              handoff.status === "busy" && "animate-spin"
            )}
          >
            {handoff.status === "busy"
              ? "progress_activity"
              : handoff.status === "done"
                ? "check_circle"
                : handoff.status === "fail"
                  ? "error"
                  : "headset_mic"}
          </span>
          <span>
            {handoff.status === "busy"
              ? "Devrediliyor..."
              : handoff.status === "done"
                ? "Devredildi"
                : handoff.status === "fail"
                  ? "Tekrar Dene"
                  : signals.handoff.button}
          </span>
        </button>
        {handoff.status === "done" ? (
          <p className="mt-2 text-center font-label-sm text-label-sm text-secondary">
            Danışman bildirimi topbar zilinde görünür.
          </p>
        ) : handoff.status === "fail" ? (
          <p className="mt-2 text-center font-label-sm text-label-sm font-semibold text-error" role="alert">
            {handoff.note}
          </p>
        ) : (
          <p className="mt-2 text-center font-label-sm text-label-sm text-on-surface-variant">
            {signals.handoff.captionPrefix}{" "}
            <strong className="font-semibold text-on-surface">
              {signals.handoff.counselor}
            </strong>
          </p>
        )}
      </div>
    </div>
  );
}
