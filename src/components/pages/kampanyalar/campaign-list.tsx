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
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary-container px-2.5 py-1 font-label-xs text-label-xs font-semibold text-on-secondary-container">
        <span className={clsx("h-1.5 w-1.5 rounded-full bg-secondary", pulse && "animate-pulse")} />
        Aktif
      </span>
    );
  }
  if (status === "duraklatildi") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-tertiary-fixed px-2.5 py-1 font-label-xs text-label-xs font-semibold text-tertiary-container">
        <span className="h-1.5 w-1.5 rounded-full bg-tertiary-container" />
        Duraklatıldı
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-surface-container px-2.5 py-1 font-label-xs text-label-xs font-semibold text-on-surface-variant">
      Tamamlandı
    </span>
  );
}

function ProgressBar({ campaign, status }: { campaign: Campaign; status: CampaignStatus }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low">
      <div
        className={clsx(
          "h-full rounded-full transition-all duration-500",
          status === "duraklatildi"
            ? "bg-tertiary-fixed-dim"
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
    <article className="flex flex-col rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 transition-colors hover:border-outline-variant">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{campaign.title}</h3>
          <p className="mt-0.5 truncate font-body-sm text-body-sm text-on-surface-variant">
            {campaign.subtitle}
          </p>
        </div>
        <StatusBadge pulse={campaign.highlight} status={status} />
      </div>

      {/* Canlı arama bilgisi */}
      {status === "aktif" && campaign.liveCall ? (
        <div className="mb-3 flex items-center gap-2 font-label-sm text-label-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
          </span>
          <span className="text-on-surface-variant">{campaign.liveCall.label}</span>
          <span className="font-semibold text-on-surface">{campaign.liveCall.value}</span>
        </div>
      ) : null}

      {/* İlerleme */}
      <div className="mb-3 space-y-1.5">
        <div className="flex items-baseline justify-between font-label-sm text-label-sm">
          <span className="text-on-surface-variant">{campaign.progress.label}</span>
          <span className="font-semibold text-on-surface">
            {campaign.progress.value ? (
              <>
                {campaign.progress.value}{" "}
                <span className="text-primary-container">{campaign.progress.valueAccent}</span>
              </>
            ) : (
              <span className="text-secondary">{campaign.progress.valueAccent}</span>
            )}
          </span>
        </div>
        <ProgressBar campaign={campaign} status={status} />
      </div>

      {/* İstatistik satırı — renksiz, bölücülü */}
      {campaign.stats ? (
        <div className="grid grid-cols-3 divide-x divide-outline-variant/50 border-t border-outline-variant/50 pt-3">
          {campaign.stats.map((stat) => (
            <div key={stat.label} className="px-2 text-center first:pl-0 last:pr-0">
              <p className="font-label-xs text-label-xs font-medium text-on-surface-variant">
                {stat.label}
              </p>
              <p className="mt-0.5 font-title-sm text-title-sm font-bold text-on-surface">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Alt satır: saat/sonuç + aksiyonlar */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant/50 pt-3">
        <div className="min-w-0">
          {campaign.scheduleLabel ? (
            <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-outline">schedule</span>
              {campaign.scheduleLabel}
            </span>
          ) : null}
          {campaign.collectedNote ? (
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {campaign.collectedNote.prefix}
              <strong className="font-semibold text-on-surface">
                {campaign.collectedNote.strong}
              </strong>
            </span>
          ) : null}
          {campaign.resultNote ? (
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {campaign.resultNote.prefix}
              <strong className="font-semibold text-on-surface">{campaign.resultNote.strong}</strong>
              {campaign.resultNote.suffix}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status === "aktif" && campaign.controls?.includes("pause") ? (
            <button
              className="rounded-lg border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
              type="button"
              onClick={() => onPause(campaign.id)}
            >
              Duraklat
            </button>
          ) : null}
          {status === "aktif" && campaign.controls?.includes("report") ? (
            <button
              className="rounded-lg px-3 py-1.5 font-label-sm text-label-sm font-medium text-primary transition-colors hover:bg-primary-fixed"
              type="button"
            >
              Rapor
            </button>
          ) : null}
          {status === "duraklatildi" && campaign.controls?.includes("resume") ? (
            <button
              className="rounded-lg bg-primary-container px-3 py-1.5 font-label-sm text-label-sm font-semibold text-on-primary transition-colors hover:bg-primary"
              type="button"
              onClick={() => onResume(campaign.id)}
            >
              Devam Ettir
            </button>
          ) : null}
        </div>
      </div>
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
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {campaignFilters.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              className={clsx(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-label-sm text-label-sm transition-colors",
                active
                  ? "bg-primary-container font-semibold text-on-primary"
                  : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
              )}
              type="button"
              onClick={() => setFilter(tab.id)}
            >
              {tab.id === "aktif" ? (
                <span
                  className={clsx("h-1.5 w-1.5 rounded-full bg-secondary", !active && "animate-pulse")}
                />
              ) : null}
              <span>{tab.label}</span>
              <span
                className={clsx(
                  "rounded-full px-1.5 text-[10px]",
                  active ? "bg-white/20" : "bg-surface-container"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
    </div>
  );
}
