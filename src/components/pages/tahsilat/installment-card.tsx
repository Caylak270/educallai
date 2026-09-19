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

const statusPillTone: Record<StatusPillTone, string> = {
  ai: "bg-secondary-fixed text-on-secondary-fixed-variant font-semibold",
  due: "bg-secondary-container text-on-secondary-container font-semibold",
  critical: "bg-error-container text-on-error-container font-bold",
  pre: "bg-primary-fixed text-on-primary-fixed-variant font-semibold",
  warn: "bg-tertiary-fixed text-on-tertiary-fixed font-semibold",
};

const accentTone: Record<
  AccentTone,
  { box: string; icon: string; title: string; actionIcon: string }
> = {
  secondary: {
    box: "bg-surface-container-low",
    icon: "text-secondary",
    title: "text-secondary",
    actionIcon: "text-secondary",
  },
  primary: {
    box: "bg-surface-container-low",
    icon: "text-primary",
    title: "text-on-surface",
    actionIcon: "text-primary",
  },
  error: {
    box: "bg-error-container/30",
    icon: "text-error",
    title: "text-error",
    actionIcon: "text-error",
  },
  tertiary: {
    box: "bg-surface-container-low",
    icon: "text-tertiary",
    title: "text-tertiary",
    actionIcon: "text-tertiary",
  },
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
        "flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-3.5 shadow-[0_1px_4px_rgba(11,28,48,0.05)] transition-opacity",
        paid && "opacity-60"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-headline-sm text-body-lg font-bold text-on-surface">
              {record.studentName}
            </h3>
            <span className="rounded bg-surface-container px-1.5 py-0.5 font-label-sm text-[10px] text-on-surface-variant">
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
              "font-headline-md text-[18px] font-bold leading-6",
              amountTone[record.amountTone]
            )}
          >
            {record.amount}
          </span>
          <p
            className={clsx(
              "font-label-sm text-[11px]",
              record.infoBold ? "font-bold" : "font-medium",
              infoTone[record.infoTone]
            )}
          >
            {record.installmentInfo}
          </p>
        </div>
      </div>

      {/* Status Pill & Reminders */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={clsx(
            "flex items-center gap-1 rounded-full px-2 py-0.5 font-label-sm text-label-sm",
            statusPillTone[record.statusPill.tone]
          )}
        >
          {record.statusPill.icon && (
            <span className="material-symbols-outlined text-[13px]">
              {record.statusPill.icon}
            </span>
          )}
          {record.statusPill.dot && (
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          )}
          {record.statusPill.text}
        </span>
        <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
          {record.reminderPill}
        </span>
      </div>

      {/* AI konuşma özeti / bağlam kutusu */}
      <div
        className={clsx(
          "flex items-start gap-2 rounded-lg p-2.5",
          tone.box
        )}
      >
        <span
          className={clsx(
            "material-symbols-outlined mt-0.5 shrink-0 text-[18px]",
            tone.icon
          )}
        >
          {record.context.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span
              className={clsx(
                "font-label-sm text-label-sm font-semibold",
                tone.title
              )}
            >
              {record.context.title}
            </span>
            <span className="font-label-sm text-[10px] text-on-surface-variant">
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
      <div className="flex items-center gap-2 pt-1">
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
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-surface-container font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-70"
            >
              <span
                className={clsx(
                  "material-symbols-outlined text-[16px]",
                  tone.actionIcon
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
