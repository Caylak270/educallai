"use client";

import { useState } from "react";
import { leads, kanbanStages, type Lead } from "@/lib/mock/leads";
import { FilterChips } from "./filter-chips";
import { KanbanStages } from "./kanban-stages";
import { LeadCard } from "./lead-card";
import { ParentDetailDrawer } from "./parent-detail-drawer";
import { ViewToggle, type ViewMode } from "./view-toggle";

/* Veliler Portföyü — mobil CRM panosu (kanban) + veli detay drawer'ı */
export function VelilerCrm() {
  const [view, setView] = useState<ViewMode>("kanban");
  const [activeChipId, setActiveChipId] = useState("all");
  const [activeStageId, setActiveStageId] = useState("ilgilendi");
  const [query, setQuery] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLocaleLowerCase("tr");
  const visibleLeads = normalizedQuery
    ? leads.filter(
        (lead) =>
          lead.name.toLocaleLowerCase("tr").includes(normalizedQuery) ||
          lead.student.toLocaleLowerCase("tr").includes(normalizedQuery)
      )
    : leads;

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? null;
  const activeStage = kanbanStages.find((stage) => stage.id === activeStageId) ?? kanbanStages[2];

  return (
    <div className="relative flex w-full flex-col pb-20">
      {/* ÜST KONTROL PANELİ (arama, görünüm toggle, filtre chip'leri) */}
      <div className="flex flex-col gap-3 px-gutter-mobile pb-2 pt-3">
        {/* Görünüm anahtarı & sayaç özeti */}
        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-headline-md tracking-tight text-on-surface">
              Veliler Portföyü
            </span>
            <span className="rounded-full bg-surface-container px-2 py-0.5 font-mono-data text-label-sm font-medium text-on-surface-variant">
              142
            </span>
          </div>
          <ViewToggle value={view} onChange={setView} />
        </div>
        {/* Arama & hızlı filtre */}
        <div className="flex items-center gap-2">
          <div className="relative flex flex-1 items-center">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[19px] text-outline">
              search
            </span>
            <input
              className="h-10 w-full rounded-xl bg-surface-container-lowest pl-9 pr-3 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Veli, öğrenci adı veya telefon..."
              type="text"
              value={query}
            />
          </div>
          <button
            aria-label="Gelişmiş Filtrele"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-lowest text-on-surface-variant shadow-sm transition-all hover:text-on-surface active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>
        {/* Filtre chip'leri */}
        <FilterChips activeId={activeChipId} onSelect={setActiveChipId} />
      </div>

      {/* KANBAN AŞAMA ŞERİDİ (yalnızca Pano görünümünde) */}
      {view === "kanban" && <KanbanStages activeId={activeStageId} onSelect={setActiveStageId} />}

      {/* AKTİF AŞAMA METRİKLERİ */}
      {view === "kanban" && (
        <div className="flex items-center justify-between px-gutter-mobile pb-1 pt-3 text-on-surface-variant">
          <div className="flex items-center gap-1.5 font-label-md text-label-md">
            <span className="font-semibold text-on-surface">&quot;{activeStage.name}&quot; Aşaması</span>
            <span className="text-outline">·</span>
            <span className="font-mono-data text-label-sm">{activeStage.count} Aday Öğrenci</span>
          </div>
          <div className="flex items-center gap-1 font-label-sm text-label-sm font-medium text-secondary">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>{activeStage.conversion}</span>
          </div>
        </div>
      )}

      {/* LEAD KARTLARI */}
      <div className="flex flex-col gap-3 px-gutter-mobile py-2">
        {visibleLeads.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest p-6 text-center font-body-md text-body-md text-on-surface-variant shadow-sm">
            Aramanızla eşleşen veli bulunamadı.
          </div>
        ) : (
          visibleLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onOpen={(opened: Lead) => setSelectedLeadId(opened.id)} />
          ))
        )}
      </div>

      {/* VELİ DETAY DRAWER'I (kapalı başlar, kart tıklamasıyla açılır) */}
      <ParentDetailDrawer lead={selectedLead} onClose={() => setSelectedLeadId(null)} />
    </div>
  );
}
