import type { CallSummary } from "@/lib/mock/calls";

export function CallSummaryCard({ summary }: { summary: CallSummary }) {
  return (
    <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      {/* Durum & yön */}
      <div className="flex items-center justify-between gap-space-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed px-2.5 py-1 text-on-secondary-fixed">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">
            {summary.directionPill}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-2.5 py-1 text-on-secondary-container">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          <span className="font-label-sm text-label-sm font-semibold">
            {summary.outcomePill}
          </span>
        </div>
      </div>

      {/* Öğrenci & veli bloğu */}
      <div className="flex items-start gap-space-md">
        <div className="relative shrink-0">
          <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-primary-fixed font-headline-md text-headline-md font-bold text-primary inset-shadow-sm">
            {summary.initials}
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[12px]">
              record_voice_over
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
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
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="inline-flex items-center rounded bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-medium text-on-surface">
              {summary.classTag}
            </span>
            <span className="inline-flex items-center rounded bg-primary-fixed px-2 py-0.5 font-label-sm text-label-sm font-semibold text-primary">
              {summary.programTag}
            </span>
          </div>
        </div>
      </div>

      {/* Çağrı metadata çubuğu */}
      <div className="grid grid-cols-2 gap-space-xs rounded-lg bg-surface-container-low p-2.5 pt-space-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-primary-container shadow-sm">
            <span className="material-symbols-outlined text-[16px]">call</span>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-label-sm text-label-sm leading-none text-on-surface-variant">
              {summary.phoneLabel}
            </span>
            <span className="mt-1 truncate font-mono-data text-mono-data font-medium text-on-surface">
              {summary.phone}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-tertiary shadow-sm">
            <span className="material-symbols-outlined text-[16px]">timer</span>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-label-sm text-label-sm leading-none text-on-surface-variant">
              {summary.durationLabel}
            </span>
            <span className="mt-1 truncate font-mono-data text-mono-data font-medium text-on-surface">
              {summary.duration}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
