import { clsx } from "@/lib/clsx";
import { kpis, type KpiBadgeTone } from "@/lib/mock/kpis";

const DELTA_TONE: Record<KpiBadgeTone, "positive" | "negative" | "neutral"> = {
  positive: "positive",
  neutral: "neutral",
  urgent: "negative",
};

/**
 * KPI şeridi (v2) — altı metrik TEK yüzeyde, bölücü çizgilerle.
 * Rozet/progress kalabalığı yok: etiket + büyük değer + yönü gösteren delta.
 */
export function KpiCards() {
  return (
    <section className="grid grid-cols-2 divide-y divide-outline-variant/50 rounded-xl border border-outline-variant/60 bg-surface-container-lowest md:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
      {kpis.map((kpi, i) => (
        <div
          key={kpi.id}
          className={clsx(
            "p-5",
            i > 0 && "md:border-l md:border-outline-variant/50",
            // md 3 kolonlu düzende 4. hücre (index 3) satır başı: sol çizgiyi kaldır
            i === 3 && "md:border-l-0 lg:border-l",
            i === 0 && "md:border-l-0"
          )}
        >
          <p className="truncate font-label-md text-label-md text-on-surface-variant">
            {kpi.label}
          </p>
          <p
            className={clsx(
              "mt-1 font-headline-lg text-headline-lg font-bold tracking-tight",
              kpi.urgent ? "text-error" : "text-on-surface"
            )}
          >
            {kpi.value}
            {kpi.suffix ? (
              <span className="font-headline-sm text-headline-sm font-medium text-on-surface-variant">
                {" "}
                {kpi.suffix}
              </span>
            ) : null}
          </p>
          <p
            className={clsx(
              "mt-1 inline-flex items-center gap-1 font-label-sm text-label-sm font-medium",
              DELTA_TONE[kpi.badgeTone] === "positive" && "text-secondary",
              DELTA_TONE[kpi.badgeTone] === "negative" && "text-error",
              DELTA_TONE[kpi.badgeTone] === "neutral" && "text-on-surface-variant"
            )}
          >
            {kpi.badgeTone === "positive" && (
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
            )}
            {kpi.badgeTone === "urgent" && (
              <span className="material-symbols-outlined text-[14px]">priority_high</span>
            )}
            {kpi.badge}
          </p>
          <p className="mt-0.5 truncate font-body-sm text-body-sm text-on-surface-variant">
            {kpi.note}
          </p>
        </div>
      ))}
    </section>
  );
}
