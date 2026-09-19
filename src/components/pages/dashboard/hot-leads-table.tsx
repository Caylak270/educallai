"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { hotLeadClassFilters, hotLeads } from "@/lib/mock/kpis";

/* Aranmayı Bekleyen Sıcak Leadler tablosu — filtreler görsel state ile çalışır */
export function HotLeadsTable() {
  const [classFilter, setClassFilter] = useState<string>("Tüm Sınıflar");
  const [hotOnly, setHotOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);

  const rows = hotLeads.filter(
    (lead) =>
      (classFilter === "Tüm Sınıflar" || lead.classFilterKey === classFilter) &&
      (!hotOnly || lead.heat === "hot")
  );

  return (
    <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      {/* Başlık & kontroller */}
      <div className="mb-space-md flex flex-col items-start justify-between gap-space-md lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Aranmayı Bekleyen Sıcak Leadler
            </h2>
            <span className="rounded-full bg-error-container px-2.5 py-0.5 font-label-xs text-label-xs font-semibold text-on-error-container">
              Müdür &amp; Danışman Müdahalesi Bekleyen 5 Veli
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            AI görüşmesinde net ilgi ve randevu niyeti beyan eden öncelikli veliler
          </p>
        </div>
        {/* Tablo filtre barı */}
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          <div className="relative flex-1 sm:w-48">
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-on-surface-variant">
              filter_alt
            </span>
            <select
              className="h-9 w-full cursor-pointer appearance-none rounded-lg bg-surface pl-8 pr-6 font-label-sm text-label-sm text-on-surface focus:bg-surface-container-low focus:outline-none"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
            >
              {hotLeadClassFilters.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-[16px] text-on-surface-variant">
              expand_more
            </span>
          </div>
          <button
            className={clsx(
              "flex h-9 items-center gap-1.5 rounded-lg px-3 font-label-sm text-label-sm transition-colors",
              hotOnly
                ? "bg-error-container text-on-error-container"
                : "bg-surface text-on-surface hover:bg-surface-container"
            )}
            onClick={() => setHotOnly((value) => !value)}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-error">
              local_fire_department
            </span>
            <span>Sadece Çok Sıcak</span>
          </button>
          <button
            className={clsx(
              "flex h-9 items-center gap-1.5 rounded-lg px-3 font-label-sm text-label-sm transition-colors",
              recentOnly
                ? "bg-surface-container-high text-on-surface"
                : "bg-surface text-on-surface-variant hover:bg-surface-container"
            )}
            onClick={() => setRecentOnly((value) => !value)}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Son 24 Saat</span>
          </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container-low font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">
              <th className="rounded-l-lg py-3 px-space-md">Veli / Öğrenci</th>
              <th className="py-3 px-space-md">Sınıf &amp; Hedef</th>
              <th className="py-3 px-space-md">Sıcaklık</th>
              <th className="py-3 px-space-md">AI Görüşme Özeti / Veli Talebi</th>
              <th className="py-3 px-space-md">Bekleme</th>
              <th className="rounded-r-lg py-3 px-space-md text-right">Hızlı Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {rows.length === 0 && (
              <tr>
                <td
                  className="py-6 text-center font-body-md text-body-md text-on-surface-variant"
                  colSpan={6}
                >
                  Filtreyle eşleşen lead bulunamadı.
                </td>
              </tr>
            )}
            {rows.map((lead) => (
              <tr
                key={lead.id}
                className={clsx(
                  "transition-colors",
                  lead.urgentRow
                    ? "bg-tertiary-fixed/20 hover:bg-tertiary-fixed/30"
                    : "hover:bg-surface-container-low"
                )}
              >
                <td className="py-3.5 px-space-md">
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        "flex h-9 w-9 items-center justify-center rounded-full font-semibold text-label-sm",
                        lead.avatarClass
                      )}
                    >
                      {lead.initials}
                    </div>
                    <div>
                      <div className="font-label-md text-label-md font-semibold text-on-surface">
                        {lead.parent}
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant">
                        {lead.detail}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-space-md">
                  <span
                    className={clsx(
                      "inline-flex rounded-md px-2.5 py-1 font-label-xs text-label-xs font-medium",
                      lead.classTagClass
                    )}
                  >
                    {lead.classTag}
                  </span>
                </td>
                <td className="py-3.5 px-space-md">
                  {lead.heat === "hot" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-2.5 py-0.5 font-label-xs text-label-xs font-bold text-on-error-container shadow-sm">
                      <span>🔥</span> Çok Sıcak
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-0.5 font-label-xs text-label-xs font-semibold text-on-secondary-container">
                      Ilık Lead
                    </span>
                  )}
                </td>
                <td className="max-w-sm py-3.5 px-space-md">
                  <p className={clsx("font-body-sm text-body-sm leading-snug", lead.summaryClass)}>
                    {lead.summary}
                  </p>
                </td>
                <td className="py-3.5 px-space-md">
                  <span className={clsx("font-label-sm text-label-sm", lead.waitClass)}>
                    {lead.wait}
                  </span>
                </td>
                <td className="py-3.5 px-space-md text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      className={clsx(
                        "flex h-8 items-center gap-1 rounded-md px-3 font-label-sm text-label-sm font-semibold",
                        lead.cta === "hot"
                          ? "bg-secondary text-on-secondary hover:opacity-90"
                          : "bg-surface-container-highest text-on-surface hover:bg-surface-container"
                      )}
                      onClick={() => console.log(`Arama başlatılıyor: ${lead.parent}`)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      <span>{lead.cta === "hot" ? "Hemen Ara" : "Ara"}</span>
                    </button>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-container text-secondary transition-colors hover:bg-surface-container-high"
                      onClick={() => console.log(`WhatsApp Mesajı Aç: ${lead.parent}`)}
                      title="WhatsApp Mesajı Aç"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </button>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high"
                      onClick={() => console.log(`Detaylı CRM Kaydı: ${lead.parent}`)}
                      title="Detaylı CRM Kaydı"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tablo alt notu */}
      <div className="mt-2 flex flex-col items-center justify-between gap-2 border-t border-surface-container-low pt-4 sm:flex-row">
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          Toplam 14 öncelikli arama talebi listelendi.
        </span>
        <button
          className="flex items-center gap-1 font-label-sm text-label-sm font-semibold text-primary-container hover:underline"
          type="button"
        >
          <span>Tüm Bekleyen Leadleri Görüntüle</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
