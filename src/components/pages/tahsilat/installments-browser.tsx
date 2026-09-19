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
    <section className="flex flex-col gap-4">
      {/* Arama girişi */}
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
          search
        </span>
        <input
          className="h-11 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-11 pr-11 font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/70 focus:border-outline-variant focus:outline-none"
          placeholder="Öğrenci veya veli adı ara..."
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="button"
          aria-label="Gelişmiş filtre"
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
        </button>
      </div>

      {/* Yatay pill filtre rayı */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
        {installmentFilterPills.map((pill) => {
          const isActive = pill.id === activeFilter;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setActiveFilter(pill.id)}
              className={clsx(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-label-sm text-label-sm transition-colors",
                isActive
                  ? "bg-primary-container font-semibold text-on-primary"
                  : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
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

      {/* Kayıt listesi */}
      <div className="flex items-center justify-between">
        <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          {installmentListHeader.title}
        </h3>
        <span className="font-label-sm text-label-sm font-medium text-primary">
          {installmentListHeader.sortLabel}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleRecords.map((record) => (
          <InstallmentCard key={record.id} record={record} />
        ))}
        {visibleRecords.length === 0 && (
          <div className="rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container-lowest p-8 text-center lg:col-span-2">
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
  );
}
