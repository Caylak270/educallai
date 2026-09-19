"use client";

import { clsx } from "@/lib/clsx";
import { type Lead } from "@/lib/mock/leads";
import { ScoreRing } from "./score-ring";

/* Lead kartı — karta tıklayınca veli detay drawer'ı açılır */
export function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (lead: Lead) => void }) {
  return (
    <div
      className={clsx(
        "flex h-full cursor-pointer flex-col rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 transition-colors hover:border-outline-variant",
        lead.focus && "group relative"
      )}
      onClick={() => onOpen(lead)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(lead);
        }
      }}
    >
      {/* Kart başlığı: veli bilgisi + skor halkası */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={clsx(
              "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-headline-md text-headline-md",
              lead.avatarClass
            )}
          >
            {lead.initials}
            <span
              className={clsx(
                "absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-surface-container-lowest",
                lead.badgeClass
              )}
            >
              <span className={clsx("material-symbols-outlined text-[10px]", lead.badgeIconClass)}>
                {lead.badgeIcon}
              </span>
            </span>
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-title-sm text-title-sm font-semibold text-on-surface">
                {lead.name}
              </h3>
              <span className="shrink-0 rounded-md bg-surface-container px-1.5 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                {lead.role}
              </span>
            </div>
            <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
              {lead.student} ·{" "}
              <span className={clsx("font-medium", lead.studentClassClass)}>
                {lead.studentClass}
              </span>
            </p>
          </div>
        </div>
        <ScoreRing value={lead.score} ringClass={lead.ringClass} labelClass={lead.scoreLabelClass} />
      </div>

      {/* Sıcaklık & aktivite meta bilgisi */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-sm text-label-sm font-semibold",
            lead.heatPillClass
          )}
        >
          <span
            className={clsx("material-symbols-outlined text-[13px]", lead.heatIconClass)}
          >
            {lead.heatIcon}
          </span>
          {lead.heatLabel}
        </span>
        <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
          <span
            className={clsx("material-symbols-outlined text-[14px]", lead.channelIconClass)}
          >
            {lead.channelIcon}
          </span>
          {lead.channelLabel}
        </span>
        <span className="text-label-sm text-outline">·</span>
        <span className="font-mono-data text-label-sm text-outline">{lead.time}</span>
      </div>

      {/* AI insight özeti — düz zemin, tek küçük ikon */}
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface-container-low p-2.5">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-primary-container">
          auto_awesome
        </span>
        <p className="line-clamp-2 font-body-sm text-body-sm leading-snug text-on-surface-variant">
          {lead.insight}
        </p>
      </div>

      {/* Hızlı aksiyon butonları — kart dibine hizalı, bölümü çizgiyle ayır */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant/50 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {lead.actions.map((action) => (
            <button
              key={action.label}
              className={clsx(
                "flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-label-md text-label-md transition-colors",
                action.style === "primary"
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-container text-on-surface"
              )}
              onClick={(event) => {
                event.stopPropagation();
                console.log(`${lead.name} → ${action.message}`);
              }}
              type="button"
            >
              <span
                className={clsx("material-symbols-outlined text-[15px]", action.iconClass)}
              >
                {action.icon}
              </span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        <span
          className={clsx(
            "material-symbols-outlined shrink-0 text-[18px] text-outline",
            lead.focus && "transition-transform group-hover:translate-x-0.5"
          )}
        >
          chevron_right
        </span>
      </div>
    </div>
  );
}
