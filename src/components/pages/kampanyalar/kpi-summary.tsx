import { Stat } from "@/components/ui/page-shell";
import { campaignKpis } from "@/lib/mock/campaigns";

/** Üst KPI özet şeridi — tek yüzey, üç hücre; PC'de yan yana, mobilde alt alta. */
export function KpiSummary() {
  const { reached, response, appointment } = campaignKpis;
  return (
    <section className="grid grid-cols-1 divide-y divide-outline-variant/50 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className="p-5">
        <Stat
          label={reached.label}
          value={
            <>
              {reached.value}{" "}
              <span className="font-headline-sm text-headline-sm font-semibold text-outline">
                {reached.total}
              </span>
            </>
          }
          hint={<>Hedefin %{reached.percent}'ine ulaşıldı</>}
        />
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
          <div
            className="h-full rounded-full bg-primary-container"
            style={{ width: `${reached.percent}%` }}
          />
        </div>
      </div>
      <div className="p-5">
        <Stat label={response.label} value={response.value} accent="secondary" hint={response.delta} />
      </div>
      <div className="p-5">
        <Stat
          label={appointment.label}
          value={
            <>
              {appointment.value}{" "}
              <span className="font-headline-sm text-headline-sm font-semibold text-outline">
                {appointment.unit}
              </span>
            </>
          }
          accent="primary"
          hint={appointment.note}
        />
      </div>
    </section>
  );
}
