"use client";

import { useState } from "react";
import { leads, kanbanStages, type Lead } from "@/lib/mock/leads";
import { FilterChips } from "./filter-chips";
import { KanbanStages } from "./kanban-stages";
import { LeadCard } from "./lead-card";
import { ParentDetailDrawer } from "./parent-detail-drawer";
import { ViewToggle, type ViewMode } from "./view-toggle";

/* Veliler CRM — arama, filtre, kanban/liste görünümü ve veli detay drawer'ı */
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
    <div className="relative flex w-full flex-col gap-3">
      {/* Arama & hızlı filtre */}
      <div className="flex items-center gap-2">
        <div className="relative flex flex-1 items-center">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 text-[19px] text-outline">
            search
          </span>
          <input
            className="h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-9 pr-3 font-body-md text-body-md text-on-surface transition-colors placeholder:text-outline focus:border-primary focus:outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Veli, öğrenci adı veya telefon..."
            type="text"
            value={query}
          />
        </div>
        <button
          aria-label="Gelişmiş Filtrele"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant transition-colors hover:text-on-surface"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
        </button>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Filtre chip'leri */}
      <FilterChips activeId={activeChipId} onSelect={setActiveChipId} />

      {/* KANBAN AŞAMA ŞERİDİ (yalnızca Pano görünümünde) */}
      {view === "kanban" && <KanbanStages activeId={activeStageId} onSelect={setActiveStageId} />}

      {/* AKTİF AŞAMA METRİKLERİ */}
      {view === "kanban" && (
        <div className="flex items-center justify-between pt-1 text-on-surface-variant">
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

      {/* LEAD KARTLARI — tek kolon mobil, PC'de 2-3 kolon grid */}
      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {visibleLeads.length === 0 ? (
          <div className="col-span-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-8 text-center font-body-md text-body-md text-on-surface-variant">
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
