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

/** Tek durum satırı — nokta + metin; rozet/arka plan yok (v2). */
const statusDotTone: Record<StatusPillTone, string> = {
  ai: "bg-secondary",
  due: "bg-secondary",
  critical: "bg-error",
  pre: "bg-outline",
  warn: "bg-tertiary-fixed-dim",
};

const statusTextTone: Record<StatusPillTone, string> = {
  ai: "text-secondary",
  due: "text-secondary",
  critical: "text-error",
  pre: "text-on-surface-variant",
  warn: "text-on-surface-variant",
};

/** AI özet kutusu düz zemin kullanır; vurgu yalnızca ikon/başlık renginde. */
const accentTone: Record<AccentTone, { icon: string; title: string }> = {
  secondary: { icon: "text-secondary", title: "text-secondary" },
  primary: { icon: "text-primary", title: "text-on-surface" },
  error: { icon: "text-error", title: "text-error" },
  tertiary: { icon: "text-tertiary", title: "text-tertiary" },
};

export function InstallmentCard({
  record,
  initialPaid = false,
  onPaid,
  onRemind,
  onUnpaid,
  onDelete,
}: {
  record: InstallmentRecord;
  /** Canlı veride zaten PAID olan taksitler için başlangıç durumu. */
  initialPaid?: boolean;
  /** Panelden Ödendi: hata mesajı (null = başarılı). Verilmezse yalnız yerel efekt. */
  onPaid?: (id: string) => Promise<string | null>;
  /** Panelden Hatırlat: hata mesajı (null = başarılı). */
  onRemind?: (id: string) => Promise<string | null>;
  /** Panelden ödemeyi geri al. */
  onUnpaid?: (id: string) => Promise<string | null>;
  /** Panelden sil (scope: yalnız taksit ya da tüm plan). */
  onDelete?: (id: string, scope: "row" | "plan") => Promise<string | null>;
}) {
  const [paid, setPaid] = useState(initialPaid);
  // Başarı notu: canlıda "kayıt oluşturuldu + WhatsApp kuyruğu", demoda dürüst kısa not.
  const [reminderNote, setReminderNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Silme onayı: null kapalı, "row" tek taksit, "plan" tüm plan soruluyor
  const [confirmDelete, setConfirmDelete] = useState<"row" | "plan" | null>(null);
  const reminderTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (reminderTimer.current !== null) {
        window.clearTimeout(reminderTimer.current);
      }
    };
  }, []);

  const handleRemind = () => {
    if (busy) return;
    if (!onRemind) {
      // Demo: yalnız yerel geri bildirim — dürüst metinle
      setReminderNote("Demo modda kayıt oluşturuldu");
      if (reminderTimer.current !== null) window.clearTimeout(reminderTimer.current);
      reminderTimer.current = window.setTimeout(() => setReminderNote(null), 3000);
      return;
    }
    void (async () => {
      setBusy(true);
      setError(null);
      const err = await onRemind(record.id);
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      setReminderNote("Hatırlatma kaydı oluşturuldu — WhatsApp kuyruğa alındı");
      if (reminderTimer.current !== null) window.clearTimeout(reminderTimer.current);
      reminderTimer.current = window.setTimeout(() => setReminderNote(null), 3000);
    })();
  };

  const handlePaid = () => {
    if (busy) return;
    if (!onPaid) {
      setPaid(true);
      return;
    }
    void (async () => {
      setBusy(true);
      setError(null);
      const err = await onPaid(record.id);
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      setPaid(true);
    })();
  };

  const handleUnpaid = () => {
    if (busy || !onUnpaid) return;
    void (async () => {
      setBusy(true);
      setError(null);
      const err = await onUnpaid(record.id);
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      setPaid(false);
    })();
  };

  const handleDelete = (scope: "row" | "plan") => {
    if (busy || !onDelete) return;
    void (async () => {
      setBusy(true);
      setError(null);
      const err = await onDelete(record.id, scope);
      setBusy(false);
      setConfirmDelete(null);
      if (err) setError(err);
    })();
  };

  const planSize = record.installmentCount ?? 1;

  const tone = accentTone[record.context.tone];

  return (
    <article
      className={clsx(
        "flex flex-col gap-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 transition-opacity",
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

      {/* Tek durum satırı (nokta + metin) + hatırlatma sayısı */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 font-label-sm text-label-sm font-medium",
            statusTextTone[record.statusPill.tone]
          )}
        >
          <span
            className={clsx(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              statusDotTone[record.statusPill.tone]
            )}
          />
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
          <>
            <div className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary/10 font-label-sm text-label-sm font-semibold text-secondary">
              <span className="material-symbols-outlined text-[16px]">
                check_circle
              </span>
              Ödendi
              {record.paidAt
                ? ` · ${new Date(record.paidAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "short",
                  })}`
                : ""}
            </div>
            {onUnpaid ? (
              <button
                type="button"
                onClick={handleUnpaid}
                disabled={busy}
                title="Ödemeyi geri al"
                className="flex h-9 items-center justify-center gap-1 rounded-lg border border-outline-variant/60 px-3 font-label-sm text-label-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-70"
              >
                <span className="material-symbols-outlined text-[16px]">undo</span>
                Geri Al
              </button>
            ) : null}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRemind}
              disabled={Boolean(reminderNote) || busy}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/60 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-70"
            >
              <span
                className={clsx(
                  "material-symbols-outlined text-[16px]",
                  tone.icon,
                  busy && "animate-spin"
                )}
              >
                {reminderNote ? "check" : busy ? "refresh" : "notifications_active"}
              </span>
              {reminderNote
                ? "Hatırlatma Oluşturuldu"
                : busy
                  ? "Oluşturuluyor..."
                  : "Hatırlatma Oluştur"}
            </button>
            <button
              type="button"
              onClick={handlePaid}
              disabled={busy}
              className="flex h-9 items-center justify-center gap-1 rounded-lg bg-primary-container px-3.5 font-label-sm text-label-sm font-semibold text-on-primary transition-colors hover:bg-primary disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[16px]">
                check
              </span>
              Ödendi
            </button>
            {onDelete ? (
              <button
                type="button"
                aria-label="Taksiti sil"
                title="Taksiti sil"
                onClick={() =>
                  setConfirmDelete((prev) => (prev ? null : planSize > 1 ? "plan" : "row"))
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant/60 text-on-surface-variant transition-colors hover:bg-error-container/50 hover:text-error"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* Silme onayı — tek taksit ya da tüm plan */}
      {confirmDelete && onDelete ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-error/30 bg-error-container/30 p-3">
          <span className="font-label-sm text-label-sm font-medium text-on-surface">
            {confirmDelete === "plan" && planSize > 1
              ? `Tüm plan silinsin mi? (${planSize} taksit)`
              : "Bu taksit silinsin mi?"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {confirmDelete === "plan" && planSize > 1 ? (
              <button
                type="button"
                onClick={() => handleDelete("row")}
                disabled={busy}
                className="h-8 rounded-lg border border-outline-variant/60 px-3 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-70"
              >
                Yalnız bu taksit
              </button>
            ) : null}
            <button
              type="button"
              onClick={() =>
                handleDelete(confirmDelete === "plan" && planSize > 1 ? "plan" : "row")
              }
              disabled={busy}
              className="flex h-8 items-center gap-1 rounded-lg bg-error px-3 font-label-sm text-label-sm font-semibold text-on-error transition-colors hover:opacity-90 disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              {busy ? "Siliniyor..." : "Sil"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              disabled={busy}
              className="h-8 rounded-lg px-2 font-label-sm text-label-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low disabled:opacity-70"
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : null}
      {reminderNote ? (
        <p className="font-label-sm text-label-sm font-semibold text-secondary" role="status">
          {reminderNote}
        </p>
      ) : null}
      {error ? (
        <p className="font-label-sm text-label-sm font-semibold text-error" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}
