import { type FunnelStep,  funnelSteps } from "@/lib/mock/kpis";

/**
 * Dönüşüm hunisi (v2) — her aşama: sıra no + ad + sayı/sağda oran,
 * altında ince animasyonlu bar. Bar içine gömülü rozet YOK.
 */
export function FunnelCard({ steps }: { steps?: FunnelStep[] }) {
  const items = steps ?? funnelSteps;
  return (
    <section className="anim-rise rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 lg:col-span-7">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            Kayıt Dönüşüm Hunisi
          </h2>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            İlk aramadan kesin kayda dönüşüm oranları
          </p>
        </div>
        <span className="shrink-0 font-body-sm text-body-sm text-on-surface-variant">Ekim</span>
      </header>

      <div className="space-y-5">
        {items.map((step, index) => (
          <div key={step.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2.5">
                <span className="w-4 shrink-0 text-right font-mono-data text-mono-data text-outline">
                  {index + 1}
                </span>
                <span className="truncate font-label-md text-label-md font-medium text-on-surface">
                  {step.name.replace(/^\d+\.\s*/, "")}
                </span>
              </div>
              <span className="shrink-0 font-label-sm text-label-sm">
                <span className="font-semibold text-on-surface">{step.count}</span>{" "}
                <span className="text-on-surface-variant">{step.pct}</span>
              </span>
            </div>
            <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-surface-container-low">
              <div
                className="anim-bar h-full rounded-full bg-primary-container"
                style={{ width: `${step.barPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-center justify-between border-t border-outline-variant/50 pt-4 font-body-sm text-body-sm">
        <span className="text-on-surface-variant">Genel huni verimliliği</span>
        <span className="font-semibold text-secondary">%11,5 uçtan uca satış oranı</span>
      </p>
    </section>
  );
}
