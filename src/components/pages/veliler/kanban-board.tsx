"use client";

import { clsx } from "@/lib/clsx";
import { kanbanStages, type Lead } from "@/lib/mock/leads";

/**
 * Gerçek kanban panosu (v2): aşama sütunları, sürükle-bırak ile aşama değiştirme.
 * Kart tıklaması drawer'ı açar, sürükleme aşama taşır (HTML5 DnD, ek bağımlılık yok).
 */
export function KanbanBoard({
  leads,
  onOpen,
  onMoveStage,
}: {
  leads: Lead[];
  onOpen: (lead: Lead) => void;
  onMoveStage: (leadId: string, stageId: string) => void;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0">
      {kanbanStages.map((stage) => {
        const stageLeads = leads.filter((lead) => (lead.stage ?? "yeni") === stage.id);
        return (
          <div
            key={stage.id}
            className="flex w-[272px] shrink-0 flex-col rounded-xl border border-outline-variant/60 bg-surface-container-low/60"
            data-stage={stage.id}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => {
              event.preventDefault();
              const leadId = event.dataTransfer.getData("text/lead-id");
              if (leadId) onMoveStage(leadId, stage.id);
            }}
          >
            {/* Sütun başlığı */}
            <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className={clsx("h-2 w-2 shrink-0 rounded-full", stage.dotClass)} />
                <span className="truncate font-label-md text-label-md font-semibold text-on-surface">
                  {stage.name}
                </span>
                <span className="rounded-full bg-surface-container px-1.5 font-mono-data text-[11px] font-medium text-on-surface-variant">
                  {stageLeads.length}
                </span>
              </div>
            </div>

            {/* Sütun kartları */}
            <div className="no-scrollbar flex max-h-[560px] min-h-[120px] flex-col gap-2.5 overflow-y-auto px-2.5 pb-3">
              {stageLeads.length === 0 ? (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-outline-variant/50 text-[12px] text-outline">
                  Kart yok — sürükleyip bırakın
                </div>
              ) : (
                stageLeads.map((lead) => (
                  <article
                    key={lead.id}
                    className="group cursor-grab rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3.5 transition-colors hover:border-outline-variant active:cursor-grabbing"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/lead-id", lead.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={() => onOpen(lead)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={clsx(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-label-sm text-label-sm font-semibold",
                            lead.avatarClass
                          )}
                        >
                          {lead.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-label-md text-label-md font-semibold text-on-surface">
                            {lead.name}
                          </p>
                          <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                            {lead.student}
                          </p>
                        </div>
                      </div>
                      <span
                        className={clsx(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant/50 font-label-xs text-[11px] font-bold",
                          lead.ringClass
                        )}
                        title="Lead puanı"
                      >
                        {lead.score}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <span className="truncate font-body-sm text-body-sm text-on-surface-variant">
                        {lead.studentClass}
                      </span>
                      <span
                        className={clsx(
                          "inline-flex shrink-0 items-center gap-1 font-label-xs text-label-xs font-medium",
                          lead.heatPillClass
                        )}
                      >
                        {lead.heatIcon ? (
                          <span className={clsx("material-symbols-outlined text-[13px]", lead.heatIconClass)}>
                            {lead.heatIcon}
                          </span>
                        ) : null}
                        {lead.heatLabel}
                      </span>
                    </div>

                    <p className="mt-2 truncate font-body-sm text-body-sm text-outline">
                      {lead.time} · {lead.channelLabel}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
