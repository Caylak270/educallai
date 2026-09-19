import { tahsilatAiNote, tahsilatSegments } from "@/lib/mock/kpis";

const DONUT_PATH =
  "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";

/** Tahsilat özeti (v2) — donut + bölücülü gösterge satırları + tek AI notu. */
export function TahsilatCard() {
  return (
    <section className="anim-rise rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 lg:col-span-5">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Tahsilat Durumu</h2>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            Ekim 2024 veli taksitleri
          </p>
        </div>
        <button
          className="shrink-0 font-label-sm text-label-sm font-medium text-primary transition-colors hover:text-primary-container"
          type="button"
        >
          Rapor
        </button>
      </header>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
          <svg className="-rotate-90 h-full w-full" viewBox="0 0 36 36">
            <path
              className="text-surface-container"
              d={DONUT_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="text-secondary"
              d={DONUT_PATH}
              fill="none"
              stroke="currentColor"
              strokeDasharray="62, 100"
              strokeLinecap="round"
              strokeWidth="4"
            />
            <path
              className="text-tertiary-fixed-dim"
              d={DONUT_PATH}
              fill="none"
              stroke="currentColor"
              strokeDasharray="25, 100"
              strokeDashoffset="-62"
              strokeLinecap="round"
              strokeWidth="4"
            />
            <path
              className="text-error"
              d={DONUT_PATH}
              fill="none"
              stroke="currentColor"
              strokeDasharray="13, 100"
              strokeDashoffset="-87"
              strokeLinecap="round"
              strokeWidth="4"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Toplam</span>
            <span className="font-headline-md text-headline-md font-bold leading-none text-on-surface">
              ₺840K
            </span>
          </div>
        </div>

        <div className="w-full flex-1">
          {tahsilatSegments.map((segment) => (
            <div
              key={segment.id}
              className="flex items-center justify-between border-b border-outline-variant/40 py-2.5 last:border-b-0"
            >
              <span className="flex items-center gap-2.5 font-body-sm text-body-sm text-on-surface">
                <span className={`h-2 w-2 shrink-0 rounded-full ${segment.dotClass}`} />
                {segment.label}
              </span>
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                {segment.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-lg bg-surface-container-low px-3 py-2.5 font-body-sm text-body-sm text-on-surface-variant">
        <span className="material-symbols-outlined shrink-0 text-[16px] text-secondary">
          smart_toy
        </span>
        <span>
          <span className="font-semibold text-on-surface">{tahsilatAiNote.strong}</span>
          {tahsilatAiNote.rest}
        </span>
      </p>
    </section>
  );
}
