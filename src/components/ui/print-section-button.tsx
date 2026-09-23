"use client";

import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";

/**
 * Sayfanın yalnızca hedef bölümünü yazdıran buton (window.print).
 * Tıklandığında body.printing-report + hedefe print-target sınıfı verilir;
 * globals.css'teki @media print kuralları diğer içeriği gizler.
 * Yazdırma bitince (afterprint) sınıflar temizlenir.
 */
export function PrintSectionButton({
  targetId,
  className,
  children,
  ariaLabel,
}: {
  /** Yazdırılacak bölümün DOM kimliği (örn. "rapor-0"). */
  targetId: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const printSection = () => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const body = document.body;
    body.classList.add("printing-report");
    target.classList.add("print-target");
    const cleanup = () => {
      body.classList.remove("printing-report");
      target.classList.remove("print-target");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    try {
      window.print();
    } finally {
      // Çoğu tarayıcıda print() iletişim kutusu kapanana dek bloklar;
      // afterprint gelmese de burada temizlenir (çift temizlik zararsızdır).
      cleanup();
    }
  };

  return (
    <button
      aria-label={ariaLabel}
      className={clsx(className)}
      type="button"
      onClick={printSection}
    >
      {children}
    </button>
  );
}
