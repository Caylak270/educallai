"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";

/**
 * Sınav seçici: iki ve daha fazla sınav varsa açılır menü gösterir,
 * tek sınav varsa hiç render edilmez. Elimizdeki tek veri seti aktif sınav
 * olduğu için seçim yalnızca başlıkta gösterilir ve veri tazelenir —
 * sahte filtreleme yapılmaz.
 */
export function ExamSelector({
  exams,
  activeExam,
}: {
  exams: string[];
  activeExam: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Menü dışına tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Tek sınav varsa seçici anlamsızdır — gizle.
  if (exams.length < 2) return null;

  const current = selected ?? (exams.includes(activeExam) ? activeExam : exams[0]);

  function select(name: string) {
    setSelected(name);
    setOpen(false);
    // force-dynamic sayfa: seçim başlıkta güncellenir, veri sunucudan tazelenir.
    router.refresh();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3.5 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
        <span>{current}</span>
        <span
          className={clsx(
            "material-symbols-outlined text-[16px] text-on-surface-variant transition-transform",
            open && "rotate-180"
          )}
        >
          expand_more
        </span>
      </button>

      {open ? (
        <ul
          aria-label="Sınav seç"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-1 shadow-lg"
        >
          {exams.map((exam) => {
            const active = exam === current;
            return (
              <li key={exam}>
                <button
                  aria-pressed={active}
                  className={clsx(
                    "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left font-label-md text-label-md transition-colors hover:bg-surface-container-low",
                    active ? "font-bold text-primary" : "text-on-surface"
                  )}
                  type="button"
                  onClick={() => select(exam)}
                >
                  <span className="truncate">{exam}</span>
                  {active ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
