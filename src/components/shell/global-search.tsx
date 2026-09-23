"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Üst bar araması — Enter, sorguyu Veliler CRM'e taşır (?q=). */
export function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex w-full items-center">
      <span className="material-symbols-outlined absolute left-3 text-[20px] text-on-surface-variant">
        search
      </span>
      <input
        className="h-10 w-full rounded-lg bg-surface pl-10 pr-16 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder="Veli, öğrenci veya görüşme ara... (Enter)"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && value.trim()) {
            router.push(`/veliler?q=${encodeURIComponent(value.trim())}`);
          }
        }}
        ref={inputRef}
      />
      <div className="absolute right-2.5 rounded bg-surface-container-high px-1.5 py-0.5 font-label-xs text-label-xs text-on-surface-variant">
        ⌘K
      </div>
    </div>
  );
}
