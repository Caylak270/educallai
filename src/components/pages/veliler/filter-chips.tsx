"use client";

import { clsx } from "@/lib/clsx";
import { portfolioChips } from "@/lib/mock/leads";

/* Kaydırılabilir filtre chip'leri — aktif chip dolu, diğerleri çerçeveli sade */
export function FilterChips({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
      {portfolioChips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <button
            key={chip.id}
            className={clsx(
              "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-label-md text-label-md transition-colors",
              active && "bg-primary-container text-on-primary",
              !active && chip.dot && "bg-error-container text-on-error-container",
              !active &&
                !chip.dot &&
                "border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            )}
            onClick={() => onSelect(chip.id)}
            type="button"
          >
            {chip.icon && (
              <span
                className={clsx("material-symbols-outlined text-[15px]", chip.iconClass)}
              >
                {chip.icon}
              </span>
            )}
            {chip.dot && (
              <span className="h-1.5 w-1.5 rounded-full bg-error" />
            )}
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
}
