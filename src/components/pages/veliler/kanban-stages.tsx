"use client";

import { clsx } from "@/lib/clsx";
import { kanbanStages } from "@/lib/mock/leads";

/* Kanban aşama şeridi — yatay kaydırılabilir, tıklanabilir */
export function KanbanStages({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-1 w-full">
      <div className="flex items-center gap-2 overflow-x-auto bg-surface-container-low px-gutter-mobile py-2.5 no-scrollbar">
        {kanbanStages.map((stage) => {
          const active = stage.id === activeId;
          return (
            <button
              key={stage.id}
              className={clsx(
                "flex shrink-0 items-center gap-1.5 rounded-xl font-label-md text-label-md shadow-sm",
                active
                  ? "bg-primary px-3.5 py-1.5 text-on-primary shadow-md"
                  : "bg-surface-container-lowest px-3 py-1.5 text-on-surface-variant"
              )}
              onClick={() => onSelect(stage.id)}
              type="button"
            >
              <span
                className={clsx(
                  "h-2 w-2 rounded-full",
                  active ? "animate-ping bg-secondary-fixed" : stage.dotClass
                )}
              />
              <span className={active ? "font-semibold" : undefined}>{stage.name}</span>
              <span
                className={clsx(
                  "rounded-md px-1.5 py-0.2 font-mono-data text-label-sm",
                  active ? "bg-white/20 text-on-primary" : "bg-surface-container text-on-surface"
                )}
              >
                {stage.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
