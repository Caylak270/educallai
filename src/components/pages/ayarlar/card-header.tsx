import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

type CardHeaderProps = {
  icon: string;
  iconFilled?: boolean;
  iconTone?: "primary" | "secondary";
  title: string;
  description: string;
  right?: ReactNode;
  className?: string;
};

export function CardHeader({
  icon,
  iconFilled = false,
  iconTone = "primary",
  title,
  description,
  right,
  className,
}: CardHeaderProps) {
  return (
    <div className={clsx("flex items-center justify-between gap-space-sm", className)}>
      <div className="flex items-center gap-space-sm">
        <div
          className={clsx(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            iconTone === "primary"
              ? "bg-primary-fixed text-primary"
              : "bg-secondary-container text-on-secondary-container"
          )}
        >
          <span
            className="material-symbols-outlined text-[22px]"
            style={iconFilled ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {icon}
          </span>
        </div>
        <div>
          <h2 className="font-title-sm text-title-sm text-on-surface">{title}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      {right}
    </div>
  );
}
