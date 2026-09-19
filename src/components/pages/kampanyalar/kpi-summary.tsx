import { campaignKpis } from "@/lib/mock/campaigns";

/** Üst KPI özet satırı: Ulaşılan Veli / Cevaplama / Randevu Alındı. */
export function KpiSummary() {
  const { reached, response, appointment } = campaignKpis;
  return (
    <section className="grid grid-cols-3 gap-2.5">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm">
        <p className="text-[11px] font-medium text-on-surface-variant">{reached.label}</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-xl font-extrabold text-on-surface">{reached.value}</span>
          <span className="text-[10px] font-bold text-outline">{reached.total}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
          <div className="h-1.5 rounded-full bg-primary-container" style={{ width: `${reached.percent}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm">
        <p className="text-[11px] font-medium text-on-surface-variant">{response.label}</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-xl font-extrabold text-secondary">{response.value}</span>
        </div>
        <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-secondary">
          {response.delta}
        </span>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm">
        <p className="text-[11px] font-medium text-on-surface-variant">{appointment.label}</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-xl font-extrabold text-primary-container">{appointment.value}</span>
          <span className="text-[10px] font-bold text-outline">{appointment.unit}</span>
        </div>
        <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-primary-container">
          {appointment.note}
        </span>
      </div>
    </section>
  );
}
