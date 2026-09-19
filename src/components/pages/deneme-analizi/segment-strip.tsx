import { clsx } from "@/lib/clsx";
import { examSegments } from "@/lib/mock/exams";

/**
 * Segment kartları: Düşüş Alarmı, Yükselenler, Zirve, Plato, İlk Deneme.
 * Mobilde yatay kaydırma; PC'de (xl+) tam genişlik 5 kolon grid.
 */
export function SegmentStrip() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
          Öğrenci Segmentleri
        </h2>
        <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          5 Dinamik Küme
        </span>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:-mx-gutter lg:px-gutter xl:mx-0 xl:grid xl:snap-none xl:grid-cols-5 xl:overflow-visible xl:px-0 xl:pb-0">
        {examSegments.map((segment) => (
          <article
            key={segment.id}
            className="flex w-64 shrink-0 snap-start flex-col rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 transition-colors hover:border-outline-variant xl:w-auto"
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
                <span className="font-headline-lg text-headline-lg font-extrabold tracking-tight text-on-surface">
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
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                arrow_forward
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
