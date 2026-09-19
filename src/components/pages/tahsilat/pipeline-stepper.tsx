import { clsx } from "@/lib/clsx";
import {
  pipelineHeader,
  pipelineStages,
  type StageVariant,
} from "@/lib/mock/installments";

const stageStyles: Record<
  StageVariant,
  { badge: string; icon: string; footer: string; count: string; amount: string }
> = {
  primary: {
    badge: "bg-primary-fixed text-on-primary-fixed-variant",
    icon: "text-primary",
    footer: "bg-surface-container-low",
    count: "text-on-surface",
    amount: "text-primary",
  },
  secondary: {
    badge: "bg-secondary-container text-on-secondary-container",
    icon: "text-secondary",
    footer: "bg-surface-container-low",
    count: "text-on-surface",
    amount: "text-secondary",
  },
  tertiary: {
    badge: "bg-tertiary-fixed text-on-tertiary-fixed",
    icon: "text-tertiary",
    footer: "bg-surface-container-low",
    count: "text-on-surface",
    amount: "text-tertiary",
  },
  ai: {
    badge: "bg-secondary-fixed text-on-secondary-fixed-variant",
    icon: "text-secondary",
    footer: "bg-secondary-container/40",
    count: "text-on-secondary-container",
    amount: "text-on-secondary-container",
  },
  error: {
    badge: "bg-error-container text-on-error-container font-bold",
    icon: "text-error",
    footer: "bg-error-container/30",
    count: "text-error",
    amount: "text-error",
  },
};

export function PipelineStepper() {
  return (
    <section className="mt-space-lg">
      <div className="mb-2.5 flex items-center justify-between px-margin-mobile">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {pipelineHeader.title}
          </h2>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {pipelineHeader.subtitle}
          </p>
        </div>
        <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-semibold text-primary">
          {pipelineHeader.badge}
        </span>
      </div>

      {/* Stepper snap rail */}
      <div className="no-scrollbar snap-x snap-mandatory flex gap-2.5 overflow-x-auto px-margin-mobile pb-1">
        {pipelineStages.map((stage) => {
          const s = stageStyles[stage.variant];
          return (
            <div
              key={stage.id}
              className="flex w-[184px] shrink-0 snap-start flex-col justify-between rounded-xl bg-surface-container-lowest p-3 shadow-[0_1px_3px_rgba(11,28,48,0.05)]"
            >
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={clsx(
                      "flex items-center gap-1 rounded px-1.5 py-0.5 font-label-sm text-label-sm",
                      stage.variant === "ai" && "font-semibold",
                      s.badge
                    )}
                  >
                    {stage.variant === "ai" && (
                      <span className="h-1.5 w-1.5 animate-ping rounded-full bg-secondary" />
                    )}
                    {stage.badge}
                  </span>
                  <span
                    className={clsx(
                      "material-symbols-outlined text-[17px]",
                      s.icon
                    )}
                  >
                    {stage.icon}
                  </span>
                </div>
                {/* Tasarımdaki label-lg (14px/20px/600) karşılığı */}
                <div className="font-label-md text-label-md font-semibold text-on-surface">
                  {stage.title}
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {stage.subtitle}
                </p>
              </div>
              <div
                className={clsx(
                  "-mx-3 -mb-3 mt-3 flex items-center justify-between rounded-b-xl px-3 py-2 pt-2",
                  s.footer
                )}
              >
                <span
                  className={clsx(
                    "font-label-sm text-label-sm font-semibold",
                    s.count
                  )}
                >
                  {stage.count}
                </span>
                <span
                  className={clsx("font-label-sm text-label-sm font-bold", s.amount)}
                >
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
