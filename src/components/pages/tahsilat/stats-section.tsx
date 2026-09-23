import { Stat } from "@/components/ui/page-shell";
import {
  installmentStats,
  tahsilatHeader,
  type InstallmentStat,
  type StatTone,
} from "@/lib/mock/installments";

/** Mock tone → Stat valueTone eşlemesi. */
const statToneMap: Record<StatTone, "primary" | "secondary" | "error" | "default"> = {
  neutral: "default",
  error: "error",
  secondary: "secondary",
  primary: "primary",
};

/** Üst metrik şeridi — tek bordered kart, 4 hücre; PC'de yan yana, mobilde 2x2. */
export function StatsSection({ stats }: { stats?: InstallmentStat[] }) {
  const items = stats ?? installmentStats;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-label-md text-label-md text-on-surface-variant">
          {tahsilatHeader.statusLabel}
        </p>
        <span className="flex items-center gap-1 font-label-sm text-label-sm font-medium text-secondary">
          <span className="material-symbols-outlined text-[14px]">
            {tahsilatHeader.statusIcon}
          </span>
          {tahsilatHeader.statusValue}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-y divide-outline-variant/50 rounded-xl border border-outline-variant/60 bg-surface-container-lowest lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {items.map((stat) => (
          <div key={stat.id} className="p-5">
            <Stat
              label={stat.label}
              value={stat.value}
              valueTone={statToneMap[stat.tone]}
              hint={stat.sub.text}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
