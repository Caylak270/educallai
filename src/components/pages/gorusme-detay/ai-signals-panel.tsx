import type { AiSignals } from "@/lib/mock/calls";

export function AiSignalsPanel({ signals }: { signals: AiSignals }) {
  return (
    <div className="flex flex-col gap-space-md">
      {/* Ana dönüşüm skoru kartı */}
      <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">
              insights
            </span>
            <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">
              {signals.score.title}
            </h3>
          </div>
          <span className="rounded-full bg-secondary-fixed px-2.5 py-1 font-label-sm text-label-sm font-bold text-on-secondary-fixed">
            {signals.score.badge}
          </span>
        </div>
        {/* Progress meter */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            {/* Tasarımdaki headline-lg-mobile (24px) karşılığı */}
            <span className="font-headline-lg text-headline-lg font-semibold text-primary">
              {signals.score.value}
            </span>
            <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">
              {signals.score.regionAverage}
            </span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${signals.score.percent}%` }}
            />
          </div>
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          {signals.score.note}
        </p>
      </div>

      {/* Yapılandırılmış sinyaller grid'i */}
      <div className="grid grid-cols-1 gap-space-xs">
        {/* Duygu analizi */}
        <div className="flex items-start justify-between rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
          <div className="flex items-start gap-space-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed">
              <span className="material-symbols-outlined text-[20px]">mood</span>
            </div>
            <div>
              <h4 className="font-label-md text-label-md font-semibold text-on-surface">
                {signals.sentiment.title}
              </h4>
              <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                {signals.sentiment.detail}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-container">
            {signals.sentiment.badge}
          </span>
        </div>

        {/* Temel niyet */}
        <div className="flex items-start gap-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
            <span className="material-symbols-outlined text-[20px]">target</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">
              {signals.intent.label}
            </span>
            <p className="mt-0.5 font-title-sm text-title-sm font-semibold text-on-surface">
              {signals.intent.title}
            </p>
            <span className="mt-2 inline-block rounded bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
              {signals.intent.tag}
            </span>
          </div>
        </div>

        {/* Fiyat hassasiyeti & ödeme itirazı */}
        <div className="grid grid-cols-2 gap-space-xs">
          <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-tertiary">
                payments
              </span>
              <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">
                {signals.priceSensitivity.label}
              </span>
            </div>
            <span className="font-title-sm text-title-sm font-semibold text-on-surface">
              {signals.priceSensitivity.value}
            </span>
            <p className="mt-1 font-body-sm text-body-sm text-[11px] leading-tight text-on-surface-variant">
              {signals.priceSensitivity.detail}
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                gavel
              </span>
              <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">
                {signals.objection.label}
              </span>
            </div>
            <span className="font-title-sm text-title-sm font-semibold text-secondary">
              {signals.objection.value}
            </span>
            <p className="mt-1 font-body-sm text-body-sm text-[11px] leading-tight text-on-surface-variant">
              {signals.objection.detail}
            </p>
          </div>
        </div>

        {/* Hedef program kartı */}
        <div className="flex items-center justify-between rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface">
              <span className="material-symbols-outlined text-[20px]">
                school
              </span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm font-medium text-on-surface-variant">
                {signals.targetProgram.label}
              </span>
              <p className="font-title-sm text-title-sm font-semibold text-on-surface">
                {signals.targetProgram.value}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Yetkiliye devir aksiyonu */}
      <div className="pt-space-xs">
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-container font-title-sm text-title-sm font-semibold text-on-primary shadow-md transition-all hover:bg-primary active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-[20px]">
            headset_mic
          </span>
          <span>{signals.handoff.button}</span>
        </button>
        <p className="mt-2 text-center font-label-sm text-label-sm text-on-surface-variant">
          {signals.handoff.captionPrefix}{" "}
          <strong>{signals.handoff.counselor}</strong>
        </p>
      </div>
    </div>
  );
}
