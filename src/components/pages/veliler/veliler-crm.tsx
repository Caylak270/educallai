"use client";

import { useMemo, useState } from "react";
import { kanbanStages, leads as baseLeads, type Lead } from "@/lib/mock/leads";
import { extraLeads } from "@/lib/mock/leads-extra";
import { FilterChips } from "./filter-chips";
import { KanbanBoard } from "./kanban-board";
import { LeadCard } from "./lead-card";
import { ParentDetailDrawer } from "./parent-detail-drawer";
import { ViewToggle, type ViewMode } from "./view-toggle";

const allLeads: Lead[] = [...baseLeads, ...extraLeads];

/* Veliler CRM — v2: gerçek kanban (varsayılan, sürükle-bırak) + liste görünümü */
export function VelilerCrm({
  initialQuery = "",
  leads: liveLeads,
  sourceLabel,
  chipCounts,
}: {
  initialQuery?: string;
  /** Canlı veri (Supabase leads+contacts). Verilmazsa demo veri gösterilir. */
  leads?: Lead[];
  sourceLabel?: string;
  /** Canlı filtre chip sayaçları (demo modda mock etiketleri kalır). */
  chipCounts?: Record<string, number>;
}) {
  const allLeads: Lead[] = liveLeads ?? [...baseLeads, ...extraLeads];
  const [view, setView] = useState<ViewMode>("kanban");
  const [activeChipId, setActiveChipId] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [stageOf, setStageOf] = useState<Record<string, string>>(() =>
    Object.fromEntries(allLeads.map((lead) => [lead.id, lead.stage ?? "yeni"]))
  );

  const normalizedQuery = query.trim().toLocaleLowerCase("tr");
  const visibleLeads = useMemo(
    () =>
      allLeads
        .map((lead) => ({ ...lead, stage: stageOf[lead.id] ?? lead.stage }))
        .filter((lead) => {
          if (!normalizedQuery) return true;
          return (
            lead.name.toLocaleLowerCase("tr").includes(normalizedQuery) ||
            lead.student.toLocaleLowerCase("tr").includes(normalizedQuery) ||
            (lead.drawer.phone ?? "").includes(normalizedQuery)
          );
        }),
    [stageOf, normalizedQuery]
  );

  const selectedLead = visibleLeads.find((lead) => lead.id === selectedLeadId) ?? null;

  /** Aşama taşındı: yerel state + /api/leads kalıcılığı (Supabase bağlıysa gerçek, değilse demo). */
  const handleMoveStage = (leadId: string, stageId: string) => {
    setStageOf((prev) => (prev[leadId] === stageId ? prev : { ...prev, [leadId]: stageId }));
    void fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: stageId }),
    }).catch(() => undefined);
  };

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
      <FilterChips activeId={activeChipId} onSelect={setActiveChipId} counts={chipCounts} />

      {sourceLabel ? (
        <p className="-mt-1 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}

      {view === "kanban" ? (
        /* GERÇEK KANBAN — aşama sütunları + sürükle-bırak */
        <KanbanBoard
          leads={visibleLeads}
          onOpen={(lead) => setSelectedLeadId(lead.id)}
          onMoveStage={handleMoveStage}
        />
      ) : (
        /* LİSTE — tüm leadler, PC'de 2-3 kolon grid */
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
      )}

      {/* Aşama özeti (kanban altı) */}
      {view === "kanban" ? (
        <p className="pt-1 font-body-sm text-body-sm text-on-surface-variant">
          İpucu: Kartları sürükleyerek aşama değiştirebilirsin · Toplam{" "}
          {visibleLeads.length} veli,{" "}
          {
            kanbanStages.filter((s) => s.id === "ilgilendi").length
              ? visibleLeads.filter((l) => l.stage === "ilgilendi").length
              : 0
          }{" "}
          tanesi "İlgilendi" aşamasında
        </p>
      ) : null}

      {/* VELİ DETAY DRAWER'I */}
      <ParentDetailDrawer lead={selectedLead} onClose={() => setSelectedLeadId(null)} />
    </div>
  );
}
