"use client";

import { clsx } from "@/lib/clsx";
import { portfolioChips } from "@/lib/mock/leads";

/* Kaydırılabilir filtre chip'leri — aktif chip görsel state ile değişir */
export function FilterChips({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="-mx-gutter-mobile flex items-center gap-1.5 overflow-x-auto px-gutter-mobile py-0.5 no-scrollbar">
      {portfolioChips.map((chip) => {
        const active = chip.id === activeId;
        return (
          <button
            key={chip.id}
            className={clsx(
              "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-label-md text-label-md shadow-sm transition-all active:scale-95",
              active && "bg-primary-container text-on-primary",
              !active && chip.dot && "bg-error-container text-on-error-container",
              !active &&
                !chip.dot &&
                chip.emoji &&
                "bg-surface-container-lowest text-on-surface hover:bg-surface-container",
              !active &&
                !chip.dot &&
                !chip.emoji &&
                "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
            )}
            onClick={() => onSelect(chip.id)}
            type="button"
          >
            {chip.emoji && <span className="text-sm">{chip.emoji}</span>}
            {chip.dot && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error" />
            )}
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
}
