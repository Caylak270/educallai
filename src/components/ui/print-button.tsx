"use client";

import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

/** Sayfayı yazıcı/PDF olarak çıkaran buton (window.print). */
export function PrintButton({
  className,
  children,
  ariaLabel,
}: {
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={clsx(className)}
      type="button"
      onClick={() => window.print()}
    >
      {children}
    </button>
  );
}
