"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";
import type { NotificationItem } from "@/app/api/notifications/route";

const TONE_CLASS: Record<NotificationItem["tone"], string> = {
  primary: "bg-primary-fixed text-primary",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
  error: "bg-error-container text-on-error-container",
};

const RANGE_OPTIONS = [
  { days: 1, label: "Bugün" },
  { days: 7, label: "Son 7 gün" },
  { days: 30, label: "Son 30 gün" },
  { days: 90, label: "Son 90 gün" },
] as const;

export const RANGE_STORAGE_KEY = "educallai-range";
const RANGE_EVENT = "educallai:range";

export type RangeSelection = { days: number; label: string };

/** Aktif tarih aralığını okur (localStorage); yoksa varsayılan. */
export function readRange(): RangeSelection {
  try {
    const raw = localStorage.getItem(RANGE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as RangeSelection;
  } catch {
    // bozuk kayıt → varsayılan
  }
  return { days: 30, label: "Son 30 gün" };
}

/** Tarih aralığı değiştiğinde haber almak için abonelik. */
export function onRangeChange(handler: (range: RangeSelection) => void): () => void {
  const listener = (event: Event) =>
    handler((event as CustomEvent<RangeSelection>).detail);
  window.addEventListener(RANGE_EVENT, listener);
  return () => window.removeEventListener(RANGE_EVENT, listener);
}

/** Topbar tarih aralığı düğmesi — seçim localStorage + CustomEvent ile yayınlanır. */
export function DateRangeMenu() {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<RangeSelection>(RANGE_OPTIONS[2]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hydration sonrası kayıtlı seçimi uygula (SSR güvenli)
    let alive = true;
    void Promise.resolve().then(() => {
      if (alive) setSelection(readRange());
    });
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      alive = false;
      document.removeEventListener("mousedown", close);
    };
  }, []);

  const pick = (option: (typeof RANGE_OPTIONS)[number]) => {
    setSelection(option);
    try {
      localStorage.setItem(RANGE_STORAGE_KEY, JSON.stringify(option));
    } catch {
      // yalnız bu oturum
    }
    window.dispatchEvent(new CustomEvent<RangeSelection>(RANGE_EVENT, { detail: option }));
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-lg bg-surface font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
          calendar_today
        </span>
        <span>{selection.label}</span>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
          expand_more
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest py-1 shadow-xl">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.days}
              className={clsx(
                "flex w-full items-center justify-between px-3 py-2 text-left font-label-sm text-label-sm transition-colors hover:bg-surface-container",
                option.days === selection.days
                  ? "font-semibold text-primary"
                  : "text-on-surface"
              )}
              type="button"
              onClick={() => pick(option)}
            >
              <span>{option.label}</span>
              {option.days === selection.days ? (
                <span className="material-symbols-outlined text-[16px]">check</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Topbar bildirim çanı — /api/notifications akışını dropdown'da gösterir. */
export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!open || items) return;
    let cancelled = false;
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, items]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-label="Bildirimler"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        <span
          className={clsx(
            "absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest",
            items && items.length === 0 && "hidden"
          )}
        />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest shadow-xl">
          <div className="border-b border-outline-variant/40 px-4 py-2.5 font-label-md text-label-md font-semibold text-on-surface">
            Bildirimler
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items === null ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 font-body-sm text-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-[16px]">
                  sync
                </span>
                Yükleniyor...
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-6 text-center font-body-sm text-body-sm text-on-surface-variant">
                Yeni bildirim yok.
              </div>
            ) : (
              items.map((item) => (
                <a
                  key={item.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-container"
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <span
                    className={clsx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      TONE_CLASS[item.tone]
                    )}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {item.icon}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                      {item.title}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {item.desc}
                    </span>
                    <span className="mt-0.5 font-label-xs text-label-xs text-outline">
                      {item.when}
                    </span>
                  </span>
                </a>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
