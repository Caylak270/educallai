"use client";

import { useMemo, useState } from "react";
import { clsx } from "@/lib/clsx";
import {
  installmentFilterPills,
  installmentListHeader,
  installmentRecords,
  type InstallmentFilterId,
} from "@/lib/mock/installments";
import { InstallmentCard } from "./installment-card";

export function InstallmentsBrowser() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<InstallmentFilterId>("all");

  const visibleRecords = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return installmentRecords.filter((record) => {
      const matchesFilter =
        activeFilter === "all" || record.filters.includes(activeFilter);
      const haystack = `${record.studentName} ${record.parentName}`
        .toLocaleLowerCase("tr-TR");
      const matchesQuery = q.length === 0 || haystack.includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [query, activeFilter]);

  return (
    <section className="mt-space-lg flex flex-col gap-2.5 px-margin-mobile">
      {/* Arama girişi */}
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-3 top-3 text-[20px] text-on-surface-variant">
          search
        </span>
        <input
          className="h-11 w-full rounded-xl bg-surface-container-lowest pl-10 pr-10 font-body-md text-body-md text-on-surface shadow-[0_1px_3px_rgba(11,28,48,0.04)] placeholder:text-on-surface-variant/70 transition-colors focus:bg-surface-container-low focus:outline-none"
          placeholder="Öğrenci veya veli adı ara..."
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="button"
          aria-label="Gelişmiş filtre"
          className="absolute right-2.5 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
        </button>
      </div>

      {/* Yatay pill filtre rayı */}
      <div className="no-scrollbar -mx-margin-mobile flex gap-1.5 overflow-x-auto px-margin-mobile py-1">
        {installmentFilterPills.map((pill) => {
          const isActive = pill.id === activeFilter;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setActiveFilter(pill.id)}
              className={clsx(
                "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-label-sm text-label-sm transition-colors",
                pill.id !== "all" && "font-semibold",
                isActive
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
              )}
            >
              {pill.dotClass && (
                <span className={clsx("h-1.5 w-1.5 rounded-full", pill.dotClass)} />
              )}
              {pill.icon && (
                <span className="material-symbols-outlined text-[14px]">
                  {pill.icon}
                </span>
              )}
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Yüksek yoğunluklu kayıt kartları */}
      <section className="mt-space-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            {installmentListHeader.title}
          </span>
          <span className="font-label-sm text-label-sm font-medium text-primary">
            {installmentListHeader.sortLabel}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {visibleRecords.map((record) => (
            <InstallmentCard key={record.id} record={record} />
          ))}
          {visibleRecords.length === 0 && (
            <div className="rounded-xl bg-surface-container-lowest p-6 text-center shadow-[0_1px_4px_rgba(11,28,48,0.05)]">
              <span className="material-symbols-outlined text-[24px] text-on-surface-variant">
                search_off
              </span>
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                Filtreye uygun taksit kaydı bulunamadı.
              </p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
