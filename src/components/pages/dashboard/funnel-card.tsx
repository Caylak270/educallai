import { funnelSteps } from "@/lib/mock/kpis";

/* Veli İletişim & Kayıt Dönüşüm Hunisi (7 kolon) */
export function FunnelCard() {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm lg:col-span-7">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Veli İletişim &amp; Kayıt Dönüşüm Hunisi
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Çağrı merkezinden kesin kayda öğrenci yaşam döngüsü dönüşüm oranları
          </p>
        </div>
        <span className="rounded-lg bg-surface-container px-2.5 py-1 font-label-xs text-label-xs text-on-surface-variant">
          Ekim Dönemi
        </span>
      </div>

      {/* Çok aşamalı dönüşüm akışı */}
      <div className="my-2 space-y-4">
        {funnelSteps.map((step) => (
          <div key={step.id} className="space-y-1.5">
            <div className="flex items-center justify-between font-label-sm text-label-sm">
              <span
                className={`flex items-center gap-1.5 font-semibold ${step.nameClass}`}
              >
                <span className={`h-2 w-2 rounded-full ${step.dotClass}`} />
                {step.name}
              </span>
              <span className={`font-bold ${step.countClass}`}>
                {step.count} <span className={step.pctClass}>{step.pct}</span>
              </span>
            </div>
            <div className="flex h-6 w-full overflow-hidden rounded-lg bg-surface-container-low">
              <div
                className={`flex h-full items-center pl-3 font-label-xs text-label-xs font-semibold ${step.barFillClass}`}
                style={{ width: `${step.barPct}%` }}
              >
                {step.barLabel}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-container-low/60 px-space-md py-2.5 pt-3">
        <span className="font-body-sm text-body-sm text-on-surface">
          Genel Funnel Verimliliği:
        </span>
        <span className="font-label-md text-label-md font-bold text-secondary">
          %11,5 Uçtan Uca Satış Oranı
        </span>
      </div>
    </div>
  );
}
