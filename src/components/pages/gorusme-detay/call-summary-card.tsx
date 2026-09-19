import type { CallSummary } from "@/lib/mock/calls";

/**
 * Veli & çağrı özeti — tek yüzey: kimlik bloğu + telefon/süre meta satırları.
 * Kanal/durum badge'leri sayfa başlığına (PageHeader actions) taşındı.
 */
export function CallSummaryCard({ summary }: { summary: CallSummary }) {
  return (
    <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5">
      {/* Öğrenci & veli kimliği */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-primary-fixed font-headline-md text-headline-md font-bold text-primary">
            {summary.initials}
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-container text-on-primary">
            <span className="material-symbols-outlined text-[12px]">
              record_voice_over
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="truncate font-title-sm text-title-sm font-semibold text-on-surface">
              {summary.parentName}
            </h2>
            <span className="shrink-0 font-mono-data text-mono-data text-on-surface-variant">
              {summary.callTime}
            </span>
          </div>
          <p className="mt-0.5 truncate font-body-sm text-body-sm text-on-surface-variant">
            {summary.studentLabel}{" "}
            <strong className="font-semibold text-on-surface">
              {summary.studentName}
            </strong>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-medium text-on-surface">
              {summary.classTag}
            </span>
            <span className="inline-flex items-center rounded bg-primary-fixed px-2 py-0.5 font-label-sm text-label-sm font-semibold text-primary">
              {summary.programTag}
            </span>
          </div>
        </div>
      </div>

      {/* Telefon & süre */}
      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-outline-variant/50 pt-4 sm:grid-cols-2">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined shrink-0 text-[18px] text-primary">
            call
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="font-label-md text-label-md text-on-surface-variant">
              {summary.phoneLabel}
            </span>
            <span className="truncate font-mono-data text-mono-data font-medium text-on-surface">
              {summary.phone}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined shrink-0 text-[18px] text-primary">
            timer
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="font-label-md text-label-md text-on-surface-variant">
              {summary.durationLabel}
            </span>
            <span className="truncate font-mono-data text-mono-data font-medium text-on-surface">
              {summary.duration}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
