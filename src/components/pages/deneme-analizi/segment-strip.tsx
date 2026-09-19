import { clsx } from "@/lib/clsx";
import { examSegments } from "@/lib/mock/exams";

/** Segment yatay şeridi: Düşüş Alarmı, Yükselenler, Zirve, Plato, İlk Deneme metrik kartları. */
export function SegmentStrip() {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Öğrenci Segmentleri</span>
        <span className="font-label-xs text-label-xs text-on-surface-variant">5 Dinamik Küme</span>
      </div>

      {/* Yatay kaydırmalı aciliyet şeridi */}
      <div className="no-scrollbar -mx-space-md flex snap-x gap-3 overflow-x-auto px-space-md pb-2">
        {examSegments.map((segment) => (
          <div
            key={segment.id}
            className="flex w-64 shrink-0 snap-start flex-col justify-between rounded-2xl bg-surface-container-lowest p-3.5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div
                className={clsx(
                  "flex h-7 w-7 items-center justify-center rounded-lg",
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

            <div className="my-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="font-headline-lg text-headline-lg font-extrabold text-on-surface">
                  {segment.count}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{segment.unit}</span>
              </div>
              <span className={clsx("font-headline-sm text-headline-sm font-bold", segment.statusClass)}>
                {segment.statusLabel}
              </span>
              <p className="mt-1 line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">
                {segment.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span
                className={clsx(
                  "flex items-center gap-1 font-label-xs text-label-xs font-semibold",
                  segment.footerClass
                )}
              >
                {segment.pulseDot ? (
                  <span className="h-2 w-2 animate-ping rounded-full bg-error" />
                ) : null}
                {segment.footerLabel}
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                arrow_forward
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
