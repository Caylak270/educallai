import { Stat } from "@/components/ui/page-shell";
import {
  installmentStats,
  tahsilatHeader,
  type StatTone,
} from "@/lib/mock/installments";

/** Mock tone → Stat accent eşlemesi. */
const statAccent: Record<StatTone, "primary" | "secondary" | "error" | undefined> = {
  neutral: undefined,
  error: "error",
  secondary: "secondary",
  primary: "primary",
};

/** Üst metrik şeridi — tek bordered kart, 4 hücre; PC'de yan yana, mobilde 2x2. */
export function StatsSection() {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {tahsilatHeader.statusLabel}
        </p>
        <span className="flex items-center gap-1 font-label-sm text-label-sm font-medium text-secondary">
          <span className="material-symbols-outlined text-[14px]">
            {tahsilatHeader.statusIcon}
          </span>
          {tahsilatHeader.statusValue}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-y divide-outline-variant/50 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {installmentStats.map((stat) => (
          <div key={stat.id} className="p-5">
            <Stat
              label={stat.label}
              value={stat.value}
              accent={statAccent[stat.tone]}
              hint={stat.sub.text}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
