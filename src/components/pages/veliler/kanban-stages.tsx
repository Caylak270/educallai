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
    <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
      {kanbanStages.map((stage) => {
        const active = stage.id === activeId;
        return (
          <button
            key={stage.id}
            className={clsx(
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 font-label-md text-label-md transition-colors",
              active
                ? "bg-primary-container text-on-primary"
                : "border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            )}
            onClick={() => onSelect(stage.id)}
            type="button"
          >
            <span
              className={clsx(
                "h-2 w-2 rounded-full",
                active ? "bg-on-primary" : stage.dotClass
              )}
            />
            <span className={active ? "font-semibold" : undefined}>{stage.name}</span>
            <span
              className={clsx(
                "rounded-md px-1.5 py-0.2 font-mono-data text-label-sm",
                active ? "bg-on-primary/15 text-on-primary" : "bg-surface-container text-on-surface"
              )}
            >
              {stage.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
