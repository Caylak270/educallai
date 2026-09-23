"use client";

import { clsx } from "@/lib/clsx";
import { examSegments, type ExamSegment } from "@/lib/mock/exams";

/**
 * Segment kartları: Düşüş Alarmı, Yükselenler, Zirve, Plato, İlk Deneme.
 * Her kart bir butondur: tıklanınca öğrenci listesini o segmente filtreler,
 * tekrar tıklanınca filtre kalkar. Mobilde yatay kaydırma; PC'de (xl+) 5 kolon.
 */
export function SegmentStrip({
  segments,
  activeSegment = null,
  onToggle,
}: {
  segments?: ExamSegment[];
  activeSegment?: string | null;
  onToggle?: (segmentId: string) => void;
}) {
  const items = segments ?? examSegments;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
          Öğrenci Segmentleri
        </h2>
        <span className="font-label-md text-label-md text-on-surface-variant">
          {activeSegment ? "Filtre etkin — kartı tekrar tıklayın" : "Karta tıklayın, liste filtrelenir"}
        </span>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:-mx-gutter lg:px-gutter xl:mx-0 xl:grid xl:snap-none xl:grid-cols-5 xl:overflow-visible xl:px-0 xl:pb-0">
        {items.map((segment) => (
          <button
            aria-pressed={activeSegment === segment.id}
            className={clsx(
              "flex w-64 shrink-0 snap-start flex-col rounded-xl border bg-surface-container-lowest p-5 text-left transition-colors xl:w-auto",
              activeSegment === segment.id
                ? "border-primary ring-2 ring-primary/20"
                : "border-outline-variant/60 hover:border-outline-variant"
            )}
            key={segment.id}
            type="button"
            onClick={() => onToggle?.(segment.id)}
          >
            <div className="flex items-start justify-between">
              <div
                className={clsx(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  segment.iconClass
                )}
              >
                <span className="material-symbols-outlined text-[18px]">{segment.icon}</span>
              </div>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 font-label-xs text-label-xs font-bold tracking-tight",
                  segment.badgeClass
                )}
              >
                {segment.badge}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-1.5">
                <span className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
                  {segment.count}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{segment.unit}</span>
              </div>
              <span className={clsx("font-label-sm text-label-sm font-bold", segment.statusClass)}>
                {segment.statusLabel}
              </span>
              <p className="mt-1.5 line-clamp-2 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                {segment.description}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-outline-variant/50 pt-3">
              <span
                className={clsx(
                  "flex items-center gap-1.5 font-label-xs text-label-xs font-semibold",
                  segment.footerClass
                )}
              >
                {segment.pulseDot ? (
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-error" />
                ) : null}
                {segment.footerLabel}
              </span>
              <span
                className={clsx(
                  "material-symbols-outlined text-[16px] transition-transform",
                  activeSegment === segment.id
                    ? "rotate-90 text-primary"
                    : "text-on-surface-variant"
                )}
              >
                arrow_forward
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
