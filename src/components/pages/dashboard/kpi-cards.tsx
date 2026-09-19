import { clsx } from "@/lib/clsx";
import { kpis, type KpiBadgeTone } from "@/lib/mock/kpis";

const BADGE_TONE_CLASSES: Record<KpiBadgeTone, string> = {
  positive: "bg-secondary-container text-on-secondary-container",
  neutral: "bg-surface-container-high text-on-surface",
  urgent: "bg-error-container text-on-error-container animate-pulse",
};

/* 6 KPI metrik kartı */
export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className={clsx(
            "flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-md shadow-sm transition-shadow hover:shadow-md",
            kpi.urgent && "relative overflow-hidden"
          )}
        >
          {kpi.urgent && <div className="absolute left-0 right-0 top-0 h-1 bg-error" />}
          <div className="flex items-start justify-between">
            <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {kpi.label}
            </span>
            <span
              className={clsx(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-xs text-label-xs font-semibold",
                BADGE_TONE_CLASSES[kpi.badgeTone]
              )}
            >
              {kpi.badgeTone === "urgent" && (
                <span className="h-1.5 w-1.5 rounded-full bg-error" />
              )}
              {kpi.badge}
            </span>
          </div>
          <div className="my-3">
            <div
              className={clsx(
                "font-display-kpi text-display-kpi-mobile font-extrabold tracking-tight xl:text-[40px]",
                kpi.valueClass
              )}
            >
              {kpi.value}
              {kpi.suffix && (
                <span className="font-headline-sm text-headline-sm font-medium text-on-surface-variant">
                  {" "}
                  {kpi.suffix}
                </span>
              )}
            </div>
            <div
              className={clsx(
                "mt-2 h-1.5 w-full overflow-hidden rounded-full",
                kpi.barTrackClass
              )}
            >
              <div
                className={clsx("h-full rounded-full", kpi.barFillClass)}
                style={{ width: `${kpi.barPct}%` }}
              />
            </div>
          </div>
          <p className="truncate font-body-sm text-body-sm text-on-surface-variant">{kpi.note}</p>
        </div>
      ))}
    </div>
  );
}
