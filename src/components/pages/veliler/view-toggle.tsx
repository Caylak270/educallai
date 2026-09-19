"use client";

import { clsx } from "@/lib/clsx";

export type ViewMode = "kanban" | "list";

const OPTIONS: { id: ViewMode; icon: string; label: string }[] = [
  { id: "kanban", icon: "view_kanban", label: "Pano" },
  { id: "list", icon: "format_list_bulleted", label: "Liste" },
];

/* Pano / Liste segment kontrolü */
export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-surface-container-high inset-shadow-sm">
      {OPTIONS.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            className={clsx(
              "flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-label-md text-label-md transition-all",
              active
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
            onClick={() => onChange(option.id)}
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
