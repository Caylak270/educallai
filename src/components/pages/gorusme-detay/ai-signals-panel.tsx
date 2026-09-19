import type { AiSignals } from "@/lib/mock/calls";

/**
 * AI sinyalleri — sekme kartının içinde düz içerik:
 * skor bloğu + ayırıcılarla ayrılmış sinyal satırları + devir aksiyonu.
 */
export function AiSignalsPanel({ signals }: { signals: AiSignals }) {
  return (
    <div className="flex flex-col">
      {/* Dönüşüm skoru */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">
              insights
            </span>
            <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">
              {signals.score.title}
            </h3>
          </div>
          <span className="shrink-0 rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary">
            {signals.score.badge}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
            {signals.score.value}
          </span>
          <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">
            {signals.score.regionAverage}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${signals.score.percent}%` }}
          />
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          {signals.score.note}
        </p>
      </div>

      {/* Sinyal satırları */}
      <div className="mt-5 divide-y divide-outline-variant/50 border-t border-outline-variant/50">
        {/* Duygu & yaklaşım */}
        <div className="flex items-start justify-between gap-3 py-4">
          <div className="min-w-0">
            <p className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {signals.sentiment.title}
            </p>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface">
              {signals.sentiment.detail}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary">
            {signals.sentiment.badge}
          </span>
        </div>

        {/* Temel niyet */}
        <div className="py-4">
          <p className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {signals.intent.label}
          </p>
          <p className="mt-0.5 font-title-sm text-title-sm font-semibold text-on-surface">
            {signals.intent.title}
          </p>
          <span className="mt-2 inline-flex items-center rounded bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
            {signals.intent.tag}
          </span>
        </div>

        {/* Fiyat hassasiyeti & ödeme itirazı */}
        <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
          <div>
            <p className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {signals.priceSensitivity.label}
            </p>
            <p className="mt-0.5 font-title-sm text-title-sm font-semibold text-on-surface">
              {signals.priceSensitivity.value}
            </p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              {signals.priceSensitivity.detail}
            </p>
          </div>
          <div>
            <p className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {signals.objection.label}
            </p>
            <p className="mt-0.5 font-title-sm text-title-sm font-semibold text-secondary">
              {signals.objection.value}
            </p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              {signals.objection.detail}
            </p>
          </div>
        </div>

        {/* Hedef program */}
        <div className="py-4">
          <p className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {signals.targetProgram.label}
          </p>
          <p className="mt-0.5 font-title-sm text-title-sm font-semibold text-on-surface">
            {signals.targetProgram.value}
          </p>
        </div>
      </div>

      {/* Yetkiliye devir */}
      <div className="mt-5">
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-title-sm text-title-sm font-semibold text-on-primary transition-colors hover:bg-primary active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-[20px]">
            headset_mic
          </span>
          <span>{signals.handoff.button}</span>
        </button>
        <p className="mt-2 text-center font-label-sm text-label-sm text-on-surface-variant">
          {signals.handoff.captionPrefix}{" "}
          <strong className="font-semibold text-on-surface">
            {signals.handoff.counselor}
          </strong>
        </p>
      </div>
    </div>
  );
}
