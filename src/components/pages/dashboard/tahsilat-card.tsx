import { tahsilatAiNote, tahsilatSegments } from "@/lib/mock/kpis";

const DONUT_PATH =
  "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";

/* Tahsilat & Taksit Özeti (5 kolon, donut grafik) */
export function TahsilatCard() {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm lg:col-span-5">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Tahsilat Durumu</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Ekim 2024 Veli Taksitleri
          </p>
        </div>
        <button
          className="rounded-lg bg-surface-container px-3 py-1.5 font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container-high"
          type="button"
        >
          Tahsilat Raporu
        </button>
      </div>

      {/* Donut grafik & metrikler */}
      <div className="flex flex-col items-center gap-space-md py-3 sm:flex-row">
        {/* SVG Donut */}
        <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
          <svg className="-rotate-90 h-full w-full" viewBox="0 0 36 36">
            {/* Arka plan */}
            <path
              className="text-surface-container"
              d={DONUT_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
            />
            {/* Ödenen: %62 */}
            <path
              className="text-secondary"
              d={DONUT_PATH}
              fill="none"
              stroke="currentColor"
              strokeDasharray="62, 100"
              strokeLinecap="round"
              strokeWidth="4.5"
            />
            {/* Vadesi Yaklaşan: %25 */}
            <path
              className="text-tertiary-fixed-dim"
              d={DONUT_PATH}
              fill="none"
              stroke="currentColor"
              strokeDasharray="25, 100"
              strokeDashoffset="-62"
              strokeLinecap="round"
              strokeWidth="4.5"
            />
            {/* Gecikmiş: %13 */}
            <path
              className="text-error"
              d={DONUT_PATH}
              fill="none"
              stroke="currentColor"
              strokeDasharray="13, 100"
              strokeDashoffset="-87"
              strokeLinecap="round"
              strokeWidth="4.5"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-label-xs text-label-xs font-semibold text-on-surface-variant">
              Toplam
            </span>
            <span className="font-headline-sm text-headline-sm font-extrabold leading-none text-on-surface">
              ₺840K
            </span>
          </div>
        </div>

        {/* Metrik detayları */}
        <div className="w-full flex-1 space-y-2">
          {tahsilatSegments.map((segment) => (
            <div
              key={segment.id}
              className="flex items-center justify-between rounded-lg bg-surface p-2"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${segment.dotClass}`} />
                <span className="font-body-sm text-body-sm text-on-surface">{segment.label}</span>
              </div>
              <span className={`font-label-md text-label-md font-bold ${segment.amountClass}`}>
                {segment.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI bildirim hapı */}
      <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-secondary-container/30 p-3">
        <span className="material-symbols-outlined shrink-0 text-[20px] text-secondary">
          smart_toy
        </span>
        <p className="font-body-sm text-body-sm text-on-surface">
          <strong>{tahsilatAiNote.strong}</strong>
          {tahsilatAiNote.rest}
        </p>
      </div>
    </div>
  );
}
