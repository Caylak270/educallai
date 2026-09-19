import { clsx } from "@/lib/clsx";
import {
  pipelineHeader,
  pipelineStages,
  type StageVariant,
} from "@/lib/mock/installments";

/** Aktif (AI) ve kritik (error) aşamalar ince vurgu alır; diğerleri nötr çerçeve. */
const stageAccent: Record<StageVariant, { border: string; amount: string }> = {
  primary: { border: "border-outline-variant/60", amount: "text-on-surface" },
  secondary: { border: "border-outline-variant/60", amount: "text-on-surface" },
  tertiary: { border: "border-outline-variant/60", amount: "text-on-surface" },
  ai: { border: "border-secondary/50", amount: "text-secondary" },
  error: { border: "border-error/40", amount: "text-error" },
};

/** 5 aşamalı eskalasyon rayı — mobilde yatay kaydırma, PC'de tam genişlik 5 kolon. */
export function PipelineStepper() {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {pipelineHeader.title}
          </h2>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            {pipelineHeader.subtitle}
          </p>
        </div>
        <span className="shrink-0 font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {pipelineHeader.badge}
        </span>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {pipelineStages.map((stage) => {
          const accent = stageAccent[stage.variant];
          const isAi = stage.variant === "ai";
          return (
            <div
              key={stage.id}
              className={clsx(
                "flex w-56 shrink-0 flex-col rounded-2xl border bg-surface-container-lowest p-4 lg:w-auto lg:shrink",
                accent.border
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  {stage.badge}
                </span>
                {isAi && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
                )}
              </div>
              <h3 className="mt-2 font-label-md text-label-md font-semibold text-on-surface">
                {stage.title}
              </h3>
              <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                {stage.subtitle}
              </p>
              <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-outline-variant/50 pt-3">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {stage.count}
                </span>
                <span className={clsx("font-label-sm text-label-sm font-bold", accent.amount)}>
                  {stage.amount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
