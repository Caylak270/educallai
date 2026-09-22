"use client";

import { useState } from "react";

import { clsx } from "@/lib/clsx";
import { FAQS } from "./faq-data";


export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div
            key={faq.question}
            className="overflow-hidden rounded-xl border border-surface-container bg-surface-container-lowest"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-title-md text-title-md text-on-surface"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              <span>{faq.question}</span>
              <span
                className={`material-symbols-outlined text-[20px] text-outline-variant transition-transform duration-300 ${
                  open ? "rotate-180" : ""
                }`}
              >
                expand_more
              </span>
            </button>
            {/* Yumuşak açılma: grid-rows 0fr→1fr geçişi */}
            <div
              className={clsx(
                "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-4 font-body-sm text-body-sm text-on-surface-variant">
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
