"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import {
  campaignFilters,
  campaigns,
  type Campaign,
  type CampaignFilterId,
  type CampaignStatus,
} from "@/lib/mock/campaigns";

function StatusBadge({ status, pulse }: { status: CampaignStatus; pulse?: boolean }) {
  if (status === "aktif") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary-container px-2.5 py-1 text-[11px] font-bold text-on-secondary-container">
        <span className={clsx("h-1.5 w-1.5 rounded-full bg-secondary", pulse && "animate-ping")} />
        Aktif
      </span>
    );
  }
  if (status === "duraklatildi") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-tertiary-fixed-dim bg-tertiary-fixed px-2.5 py-1 text-[11px] font-bold text-tertiary-container">
        <span className="h-1.5 w-1.5 rounded-full bg-tertiary-container" />
        Duraklatıldı
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant">
      Tamamlandı
    </span>
  );
}

function ProgressBar({ campaign, status }: { campaign: Campaign; status: CampaignStatus }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-surface-container-low">
      <div
          className={clsx(
            "rounded-full bg-surface-container-low transition-all duration-500",
            status === "tamamlandi"
              ? "h-1.5"
              : status === "duraklatildi"
                ? "h-2"
                : "h-2.5",
            status === "duraklatildi"
              ? "bg-tertiary-fixed-dim"
              : campaign.highlight
                ? "bg-gradient-to-r from-primary-container to-secondary"
                : status === "tamamlandi"
                  ? "bg-secondary"
                  : "bg-primary-container"
          )}
        style={{ width: `${campaign.progress.width}%` }}
      />
    </div>
  );
}

function CampaignCard({
  campaign,
  status,
  onPause,
  onResume,
}: {
  campaign: Campaign;
  status: CampaignStatus;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
}) {
  return (
    <article
      className={clsx(
        "relative overflow-hidden rounded-2xl bg-surface-container-lowest p-4 shadow-sm",
        campaign.highlight
          ? "ring-1 ring-primary-container/20 border border-primary-fixed"
          : "border border-outline-variant"
      )}
    >
      {campaign.highlight ? (
        <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-tr-2xl bg-gradient-to-bl from-primary-fixed to-transparent" />
      ) : null}

      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-base font-bold text-on-surface">{campaign.title}</h3>
          <p className="text-xs text-on-surface-variant">{campaign.subtitle}</p>
        </div>
        <StatusBadge pulse={campaign.highlight} status={status} />
      </div>

      {/* Canlı arama soundwave göstergesi */}
      {status === "aktif" && campaign.liveCall ? (
        <div className="mb-3.5 flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low p-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary-container" />
            <span className="text-xs font-semibold text-on-surface">{campaign.liveCall.label}</span>
            <span className="text-xs font-bold text-primary">{campaign.liveCall.value}</span>
          </div>
          <div className="flex h-3.5 items-end gap-0.5">
            <span className="h-2 w-0.5 animate-bounce rounded-full bg-primary-container" />
            <span className="h-3.5 w-0.5 animate-pulse rounded-full bg-primary" />
            <span
              className="h-1.5 w-0.5 animate-bounce rounded-full bg-primary-container"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-3 w-0.5 animate-pulse rounded-full bg-primary"
              style={{ animationDelay: "75ms" }}
            />
          </div>
        </div>
      ) : null}

      {/* İlerleme çubuğu */}
      <div className={clsx("space-y-1.5", campaign.stats ? "mb-3.5" : "mb-3")}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-on-surface-variant">
            {campaign.progress.label}
          </span>
          <span className="font-bold text-on-surface">
            {campaign.progress.value ? (
              <>
                {campaign.progress.value}{" "}
                <span
                  className={clsx(
                    "font-semibold",
                    status === "tamamlandi"
                      ? "text-secondary"
                      : status === "duraklatildi"
                        ? "text-on-surface-variant"
                        : "text-primary-container"
                  )}
                >
                  {campaign.progress.valueAccent}
                </span>
              </>
            ) : (
              <span className="text-secondary">{campaign.progress.valueAccent}</span>
            )}
          </span>
        </div>
        <ProgressBar campaign={campaign} status={status} />
      </div>

      {/* Kampanya istatistik grid'i */}
      {campaign.stats ? (
        <div className="grid grid-cols-3 gap-2 border-t border-outline-variant/60 pt-2 text-center">
          {campaign.stats.map((stat) => (
            <div
              key={stat.label}
              className={clsx(
                "rounded-lg p-1.5",
                stat.tone === "primary"
                  ? "border border-primary-fixed bg-primary-fixed/50"
                  : stat.tone === "secondary"
                    ? "border border-secondary-fixed bg-secondary-fixed/40"
                    : "bg-surface-container-low/70"
              )}
            >
              <p
                className={clsx(
                  "text-[10px] font-medium",
                  stat.tone === "primary"
                    ? "text-primary"
                    : stat.tone === "secondary"
                      ? "text-secondary"
                      : "text-on-surface-variant"
                )}
              >
                {stat.label}
              </p>
              <p
                className={clsx(
                  "text-xs font-bold",
                  stat.tone === "primary" ? "text-on-primary-fixed" : "text-on-surface"
                )}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Kontrol satırı */}
      {campaign.scheduleLabel || campaign.collectedNote ? (
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-outline-variant/60 pt-2.5">
          {campaign.scheduleLabel ? (
            <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
              <svg
                className="h-3.5 w-3.5 text-outline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>{campaign.scheduleLabel}</span>
            </div>
          ) : null}
          {campaign.collectedNote ? (
            <span className="text-xs text-on-surface-variant">
              {campaign.collectedNote.prefix}
              <strong className="text-on-surface">{campaign.collectedNote.strong}</strong>
            </span>
          ) : null}
          <div className="flex items-center gap-2">
            {status === "aktif" && campaign.controls?.includes("pause") ? (
              <button
                className="rounded-lg bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
                type="button"
                onClick={() => onPause(campaign.id)}
              >
                Duraklat
              </button>
            ) : null}
            {status === "aktif" && campaign.controls?.includes("report") ? (
              <button
                className="rounded-lg bg-primary-fixed px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary-fixed-dim"
                type="button"
              >
                Rapor
              </button>
            ) : null}
            {status === "duraklatildi" && campaign.controls?.includes("resume") ? (
              <button
                className="rounded-lg bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary transition-colors hover:bg-primary"
                type="button"
                onClick={() => onResume(campaign.id)}
              >
                Devam Ettir
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Tamamlanan kampanya sonucu */}
      {campaign.resultNote ? (
        <p className="text-xs text-on-surface-variant">
          {campaign.resultNote.prefix}
          <strong className="text-on-surface">{campaign.resultNote.strong}</strong>
          {campaign.resultNote.suffix}
        </p>
      ) : null}
    </article>
  );
}

/** Sekmeli filtre + kampanya kartları (Duraklat / Devam Ettir görsel state değişimi yapar). */
export function CampaignList() {
  const [filter, setFilter] = useState<CampaignFilterId>("tumu");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, CampaignStatus>>({});

  const currentStatus = (campaign: Campaign): CampaignStatus =>
    statusOverrides[campaign.id] ?? campaign.status;

  const visibleCampaigns = campaigns.filter(
    (campaign) => filter === "tumu" || currentStatus(campaign) === filter
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Sekmeli filtre (tasarımda üst app bar içindeydi; sayfa akışına alındı) */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pt-1">
        {campaignFilters.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              className={clsx(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs shadow-sm transition-colors",
                active
                  ? "bg-inverse-surface font-semibold text-inverse-on-surface"
                  : "border border-outline-variant bg-surface-container-lowest font-medium text-on-surface-variant hover:bg-surface-container-low"
              )}
              type="button"
              onClick={() => setFilter(tab.id)}
            >
              {tab.id === "aktif" ? (
                <span
                  className={clsx(
                    "h-2 w-2 rounded-full bg-secondary",
                    !active && "animate-pulse"
                  )}
                />
              ) : null}
              <span>{tab.label}</span>
              <span
                className={clsx(
                  "rounded-full px-1.5 text-[10px]",
                  active ? "bg-surface/20" : "bg-surface-container-low"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {visibleCampaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          status={currentStatus(campaign)}
          onPause={(id) => setStatusOverrides((prev) => ({ ...prev, [id]: "duraklatildi" }))}
          onResume={(id) => setStatusOverrides((prev) => ({ ...prev, [id]: "aktif" }))}
        />
      ))}
    </div>
  );
}
