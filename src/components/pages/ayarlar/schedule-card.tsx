"use client";

import { CardHeader } from "./card-header";
import { ToggleSwitch } from "./toggle-switch";
import { scheduleRows, smartTimingRules, type ScheduleRowState } from "@/lib/mock/settings";
import { clsx } from "@/lib/clsx";

const sublabelToneClasses = {
  secondary: "text-secondary",
  variant: "text-on-surface-variant",
  outline: "text-outline",
} as const;

const timeInputClass =
  "w-20 rounded-lg bg-surface-container-lowest px-space-sm py-space-xs text-center font-mono-data text-mono-data text-on-surface outline-none transition-all focus:bg-surface-container-high";

type ScheduleCardProps = {
  rows: ScheduleRowState[];
  retryHours: number;
  dailyCallLimit: number;
  onRowChange: (id: string, patch: Partial<ScheduleRowState>) => void;
  onRuleChange: (patch: { retryHours?: number; dailyCallLimit?: number }) => void;
};

export function ScheduleCard({
  rows,
  retryHours,
  dailyCallLimit,
  onRowChange,
  onRuleChange,
}: ScheduleCardProps) {
  return (
    <section className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
      <CardHeader
        icon="schedule"
        className="pb-space-xs"
        title="Arama & İletişim Saatleri"
        description="AI robotunun velileri arayabileceği yasal ve şube tarafından izin verilen zaman pencereleri."
        right={
          <div className="flex items-center gap-1 rounded-lg bg-surface-container px-space-sm py-space-xs font-body-sm text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">info</span>
            <span>İstanbul (UTC+3)</span>
          </div>
        }
      />

      <div className="flex flex-col gap-space-xs">
        {scheduleRows.map((row) => {
          const state = rows.find((item) => item.id === row.id);
          const enabled = state?.enabled ?? row.defaultEnabled;

          return (
            <div
              key={row.id}
              className={clsx(
                "flex flex-col justify-between gap-space-sm rounded-lg bg-surface-container-low p-space-md sm:flex-row sm:items-center",
                !enabled && "opacity-75"
              )}
            >
              <div className="flex items-center gap-space-md">
                <ToggleSwitch
                  size="sm"
                  checked={enabled}
                  onChange={(value) => onRowChange(row.id, { enabled: value })}
                  ariaLabel={row.label}
                />
                <div className="flex flex-col">
                  <span
                    className={clsx(
                      "font-title-sm text-title-sm text-on-surface",
                      row.titleSemibold && "font-semibold"
                    )}
                  >
                    {row.label}
                  </span>
                  <span
                    className={clsx(
                      "font-body-sm text-body-sm font-medium",
                      sublabelToneClasses[row.sublabelTone]
                    )}
                  >
                    {row.sublabel}
                  </span>
                </div>
              </div>

              {enabled ? (
                <div className="flex items-center gap-space-xs self-end font-mono-data text-mono-data sm:self-center">
                  <span className="mr-1 font-label-sm text-label-sm text-on-surface-variant">Aralık:</span>
                  <input
                    type="text"
                    value={state?.start ?? ""}
                    onChange={(event) => onRowChange(row.id, { start: event.target.value })}
                    aria-label={`${row.label} başlangıç saati`}
                    className={timeInputClass}
                  />
                  <span className="text-on-surface-variant">—</span>
                  <input
                    type="text"
                    value={state?.end ?? ""}
                    onChange={(event) => onRowChange(row.id, { end: event.target.value })}
                    aria-label={`${row.label} bitiş saati`}
                    className={timeInputClass}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-space-xs self-end sm:self-center">
                  <span className="rounded-full bg-surface-variant px-space-md py-1 font-label-sm text-label-sm font-medium text-on-surface-variant">
                    Kapalı
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-space-xs flex flex-col gap-space-sm rounded-xl bg-surface-container p-space-md">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[20px] text-primary">tune</span>
          <span className="font-title-sm text-title-sm text-on-surface">{smartTimingRules.title}</span>
        </div>
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg bg-surface-container-lowest p-space-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {smartTimingRules.retry.label}
            </span>
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                {smartTimingRules.retry.question}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={retryHours}
                  onChange={(event) => onRuleChange({ retryHours: Number(event.target.value) })}
                  aria-label={smartTimingRules.retry.label}
                  className="w-14 rounded-sm bg-surface-container-low px-2 py-1 text-center font-mono-data text-mono-data font-bold text-primary outline-none"
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {smartTimingRules.retry.unit}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-surface-container-lowest p-space-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {smartTimingRules.frequency.label}
            </span>
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                {smartTimingRules.frequency.question}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={dailyCallLimit}
                  onChange={(event) => onRuleChange({ dailyCallLimit: Number(event.target.value) })}
                  aria-label={smartTimingRules.frequency.label}
                  className="w-14 rounded-sm bg-surface-container-low px-2 py-1 text-center font-mono-data text-mono-data font-bold text-primary outline-none"
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {smartTimingRules.frequency.unit}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{smartTimingRules.note}</p>
      </div>
    </section>
  );
}
