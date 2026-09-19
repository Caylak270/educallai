"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";
import {
  type AccentTone,
  type AmountTone,
  type InstallmentRecord,
  type StatusPillTone,
} from "@/lib/mock/installments";

const amountTone: Record<AmountTone, string> = {
  neutral: "text-on-surface",
  error: "text-error",
  tertiary: "text-tertiary",
};

const infoTone: Record<AmountTone, string> = {
  neutral: "text-on-surface-variant",
  error: "text-error",
  tertiary: "text-tertiary",
};

/** Tek durum pill'i — hafif konteyner zeminleri, tek ton. */
const statusPillTone: Record<StatusPillTone, string> = {
  ai: "bg-secondary-container text-on-secondary-container",
  due: "bg-secondary-container text-on-secondary-container",
  critical: "bg-error-container text-on-error-container",
  pre: "bg-surface-container text-on-surface-variant",
  warn: "bg-surface-container text-on-surface-variant",
};

/** AI özet kutusu düz zemin kullanır; vurgu yalnızca ikon/başlık renginde. */
const accentTone: Record<AccentTone, { icon: string; title: string }> = {
  secondary: { icon: "text-secondary", title: "text-secondary" },
  primary: { icon: "text-primary", title: "text-on-surface" },
  error: { icon: "text-error", title: "text-error" },
  tertiary: { icon: "text-tertiary", title: "text-tertiary" },
};

export function InstallmentCard({ record }: { record: InstallmentRecord }) {
  const [paid, setPaid] = useState(false);
  const [reminded, setReminded] = useState(false);
  const reminderTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (reminderTimer.current !== null) {
        window.clearTimeout(reminderTimer.current);
      }
    };
  }, []);

  const handleRemind = () => {
    setReminded(true);
    if (reminderTimer.current !== null) {
      window.clearTimeout(reminderTimer.current);
    }
    reminderTimer.current = window.setTimeout(() => setReminded(false), 2500);
  };

  const tone = accentTone[record.context.tone];

  return (
    <article
      className={clsx(
        "flex flex-col gap-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 transition-opacity",
        paid && "opacity-60"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-headline-sm text-headline-sm text-on-surface">
              {record.studentName}
            </h3>
            <span className="shrink-0 rounded bg-surface-container px-1.5 py-0.5 font-label-xs text-label-xs text-on-surface-variant">
              {record.gradeTag}
            </span>
          </div>
          <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
            Veli:{" "}
            <span className="font-semibold text-on-surface">
              {record.parentName}
            </span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span
            className={clsx(
              "font-headline-md text-headline-md font-bold tracking-tight",
              amountTone[record.amountTone]
            )}
          >
            {record.amount}
          </span>
          <p
            className={clsx(
              "font-label-sm text-label-sm",
              record.infoBold ? "font-bold" : "font-medium",
              infoTone[record.infoTone]
            )}
          >
            {record.installmentInfo}
          </p>
        </div>
      </div>

      {/* Tek durum pill'i + hatırlatma sayısı (düz metin) */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label-xs text-label-xs font-semibold",
            statusPillTone[record.statusPill.tone]
          )}
        >
          {record.statusPill.icon && (
            <span className="material-symbols-outlined text-[13px]">
              {record.statusPill.icon}
            </span>
          )}
          {record.statusPill.text}
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {record.reminderPill}
        </span>
      </div>

      {/* AI konuşma özeti / bağlam kutusu — düz zemin */}
      <div className="flex items-start gap-2.5 rounded-xl bg-surface-container-low p-3">
        <span
          className={clsx(
            "material-symbols-outlined mt-0.5 shrink-0 text-[18px]",
            tone.icon
          )}
        >
          {record.context.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={clsx(
                "truncate font-label-sm text-label-sm font-semibold",
                tone.title
              )}
            >
              {record.context.title}
            </span>
            <span className="shrink-0 font-label-xs text-label-xs text-on-surface-variant">
              {record.context.meta}
            </span>
          </div>
          <p
            className={clsx(
              "mt-0.5 font-body-sm text-body-sm text-on-surface-variant",
              record.context.clamp2 && "line-clamp-2"
            )}
          >
            {record.context.body}
          </p>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex items-center gap-2 pt-0.5">
        {paid ? (
          <div className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary/10 font-label-sm text-label-sm font-semibold text-secondary">
            <span className="material-symbols-outlined text-[16px]">
              check_circle
            </span>
            Ödendi olarak işaretlendi
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRemind}
              disabled={reminded}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-70"
            >
              <span
                className={clsx(
                  "material-symbols-outlined text-[16px]",
                  tone.icon
                )}
              >
                {reminded ? "check" : record.action.icon}
              </span>
              {reminded ? "Hatırlatma Gönderildi" : record.action.label}
            </button>
            <button
              type="button"
              onClick={() => setPaid(true)}
              className="flex h-9 items-center justify-center gap-1 rounded-lg bg-primary px-3.5 font-label-sm text-label-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
            >
              <span className="material-symbols-outlined text-[16px]">
                check
              </span>
              Ödendi
            </button>
          </>
        )}
      </div>
    </article>
  );
}
