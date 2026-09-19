"use client";

import { clsx } from "@/lib/clsx";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  size?: "md" | "sm";
  className?: string;
};

export function ToggleSwitch({ checked, onChange, ariaLabel, size = "md", className }: ToggleSwitchProps) {
  const isMd = size === "md";
  return (
    <label className={clsx("relative inline-flex shrink-0 cursor-pointer items-center", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only peer"
        aria-label={ariaLabel}
      />
      <div
        className={clsx(
          "rounded-full bg-surface-variant peer-checked:bg-primary peer-focus:outline-none",
          "after:absolute after:left-[2px] after:top-[2px] after:rounded-full after:bg-surface-container-lowest after:transition-all after:content-['']",
          "peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest",
          isMd ? "h-6 w-11 after:h-5 after:w-5" : "h-5 w-9 after:h-4 after:w-4"
        )}
      />
    </label>
  );
}
