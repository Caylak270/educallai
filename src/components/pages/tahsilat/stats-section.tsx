import { clsx } from "@/lib/clsx";
import {
  installmentStats,
  tahsilatHeader,
  type StatTone,
} from "@/lib/mock/installments";

const statTone: Record<
  StatTone,
  { chip: string; label: string; value: string; sub: string }
> = {
  neutral: {
    chip: "bg-surface-container text-primary",
    label: "text-on-surface-variant",
    value: "text-on-surface",
    sub: "text-on-surface-variant",
  },
  error: {
    chip: "bg-error-container text-on-error-container",
    label: "text-error",
    value: "text-error",
    sub: "text-on-error-container font-semibold",
  },
  secondary: {
    chip: "bg-secondary-container text-on-secondary-container",
    label: "text-on-surface-variant",
    value: "text-secondary",
    sub: "text-secondary font-semibold",
  },
  primary: {
    chip: "bg-primary-fixed text-on-primary-fixed-variant",
    label: "text-on-surface-variant",
    value: "text-on-surface",
    sub: "text-on-surface-variant",
  },
};

export function StatsSection() {
  return (
    <section className="px-margin-mobile pt-space-md">
      <div className="mb-space-sm flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-secondary" />
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            {tahsilatHeader.statusLabel}
          </span>
        </div>
        <span className="flex items-center gap-1 font-label-sm text-label-sm font-medium text-secondary">
          <span className="material-symbols-outlined text-[14px]">
            {tahsilatHeader.statusIcon}
          </span>
          {tahsilatHeader.statusValue}
        </span>
      </div>

      {/* Metrik kartları grid / carousel */}
      <div className="grid grid-cols-2 gap-space-sm">
        {installmentStats.map((stat) => {
          const tone = statTone[stat.tone];
          return (
            <div
              key={stat.id}
              className="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-3.5 shadow-[0_1px_4px_rgba(11,28,48,0.04)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={clsx("font-label-sm text-label-sm", tone.label)}
                >
                  {stat.label}
                </span>
                <span
                  className={clsx(
                    "flex items-center justify-center rounded-lg p-1",
                    tone.chip
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {stat.icon}
                  </span>
                </span>
              </div>
              <div>
                {/* Tasarımdaki metric-currency (20px/24px/700) karşılığı */}
                <div
                  className={clsx(
                    "font-headline-md text-headline-md font-bold leading-6",
                    tone.value
                  )}
                >
                  {stat.value}
                </div>
                {stat.sub.kind === "plain" && (
                  <p
                    className={clsx(
                      "mt-0.5 font-label-sm text-label-sm",
                      tone.sub
                    )}
                  >
                    {stat.sub.text}
                  </p>
                )}
                {stat.sub.kind === "dot" && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-error" />
                    <span
                      className={clsx("font-label-sm text-label-sm", tone.sub)}
                    >
                      {stat.sub.text}
                    </span>
                  </div>
                )}
                {stat.sub.kind === "trend" && (
                  <p
                    className={clsx(
                      "mt-0.5 flex items-center gap-0.5 font-label-sm text-label-sm",
                      tone.sub
                    )}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      trending_up
                    </span>
                    {stat.sub.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
