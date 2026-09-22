"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { kanbanStages, leads as baseLeads, type Lead } from "@/lib/mock/leads";
import { extraLeads } from "@/lib/mock/leads-extra";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChips } from "./filter-chips";
import { KanbanBoard } from "./kanban-board";
import { LeadCard } from "./lead-card";
import { ParentDetailDrawer } from "./parent-detail-drawer";
import { ViewToggle, type ViewMode } from "./view-toggle";

/** Demo leadler için chip etiketi türetimi (canlı veride chipTags sunucudan gelir). */
function deriveChipTags(lead: Lead): string[] {
  const tags: string[] = [];
  if (lead.heatLabel?.includes("Sıcak")) tags.push("hot");
  if (/(YKS|TYT|AYT)/i.test(lead.studentClass)) tags.push("yks");
  if (/LGS/i.test(lead.studentClass)) tags.push("lgs");
  return tags;
}

/* Veliler CRM — v2: gerçek kanban (varsayılan, sürükle-bırak) + liste görünümü */
export function VelilerCrm({
  initialQuery = "",
  autoFocusSearch = false,
  leads: liveLeads,
  sourceLabel,
  chipCounts,
}: {
  initialQuery?: string;
  /** Mobil üst bardaki "Ara" ile gelindiyse arama kutusuna odaklan. */
  autoFocusSearch?: boolean;
  /** Canlı veri (Supabase leads+contacts). Verilmazsa demo veri gösterilir. */
  leads?: Lead[];
  sourceLabel?: string;
  /** Canlı filtre chip sayaçları (demo modda mock etiketleri kalır). */
  chipCounts?: Record<string, number>;
}) {
  const allLeads = useMemo<Lead[]>(
    () => liveLeads ?? [...baseLeads, ...extraLeads],
    [liveLeads]
  );
  const [view, setView] = useState<ViewMode>("kanban");
  const [activeChipId, setActiveChipId] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [stageOf, setStageOf] = useState<Record<string, string>>(() =>
    Object.fromEntries(allLeads.map((lead) => [lead.id, lead.stage ?? "yeni"]))
  );
  const [moveError, setMoveError] = useState<string | null>(null);
  const moveErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusSearch) searchInputRef.current?.focus();
  }, [autoFocusSearch]);

  useEffect(() => {
    return () => {
      if (moveErrorTimer.current) clearTimeout(moveErrorTimer.current);
    };
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase("tr");
  const visibleLeads = useMemo(
    () =>
      allLeads
        .map((lead) => ({ ...lead, stage: stageOf[lead.id] ?? lead.stage }))
        .filter((lead) => {
          if (
            activeChipId !== "all" &&
            !(lead.chipTags ?? deriveChipTags(lead)).includes(activeChipId)
          ) {
            return false;
          }
          if (!normalizedQuery) return true;
          return (
            lead.name.toLocaleLowerCase("tr").includes(normalizedQuery) ||
            lead.student.toLocaleLowerCase("tr").includes(normalizedQuery) ||
            (lead.drawer.phone ?? "").includes(normalizedQuery)
          );
        }),
    [allLeads, stageOf, normalizedQuery, activeChipId]
  );

  const selectedLead = visibleLeads.find((lead) => lead.id === selectedLeadId)
    ?? allLeads.map((lead) => ({ ...lead, stage: stageOf[lead.id] ?? lead.stage })).find((lead) => lead.id === selectedLeadId)
    ?? null;

  /** Aşama taşındı: yerel state + /api/leads kalıcılığı (Supabase bağlıysa gerçek, değilse demo). */
  const handleMoveStage = async (leadId: string, stageId: string) => {
    const previousStage = stageOf[leadId];
    setStageOf((prev) => (prev[leadId] === stageId ? prev : { ...prev, [leadId]: stageId }));
    if (previousStage === stageId) return;
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: stageId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMoveError(null);
    } catch {
      // Optimistik taşımayı geri al ve kullanıcıyı bilgilendir.
      setStageOf((prev) => ({ ...prev, [leadId]: previousStage ?? "yeni" }));
      setMoveError("Aşama kaydedilemedi — değişiklik geri alındı.");
      if (moveErrorTimer.current) clearTimeout(moveErrorTimer.current);
      moveErrorTimer.current = setTimeout(() => setMoveError(null), 4500);
    }
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
            ref={searchInputRef}
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

      {visibleLeads.length === 0 ? (
        <EmptyState
          description={
            activeChipId !== "all" || normalizedQuery
              ? "Farklı bir filtre veya arama deneyin."
              : "İlk veli kaydını CRM'e ekleyin ya da demo veriyle devam edin."
          }
          icon="group_search"
          title={
            activeChipId !== "all" || normalizedQuery
              ? "Bu filtreyle eşleşen veli bulunamadı"
              : "Henüz veli kaydı yok"
          }
        />
      ) : view === "kanban" ? (
        /* GERÇEK KANBAN — aşama sütunları + sürükle-bırak */
        <KanbanBoard
          leads={visibleLeads}
          onOpen={(lead) => setSelectedLeadId(lead.id)}
          onMoveStage={handleMoveStage}
        />
      ) : (
        /* LİSTE — tüm leadler, PC'de 2-3 kolon grid */
        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {visibleLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onOpen={(opened: Lead) => setSelectedLeadId(opened.id)} />
          ))}
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
          tanesi &quot;İlgilendi&quot; aşamasında
        </p>
      ) : null}

      {/* VELİ DETAY DRAWER'I */}
      <ParentDetailDrawer lead={selectedLead} onClose={() => setSelectedLeadId(null)} />

      {/* Aşama kaydetme hatası bildirimi */}
      {moveError ? (
        <div
          aria-live="assertive"
          className="fixed inset-x-4 bottom-20 z-50 flex items-center gap-3 rounded-2xl bg-error-container p-4 text-on-error-container shadow-xl"
          role="alert"
        >
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-label-sm text-label-sm font-bold">{moveError}</span>
        </div>
      ) : null}
    </div>
  );
}
