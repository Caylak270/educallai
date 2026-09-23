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

function StatusBadge({
  status,
  pulse,
  label,
}: {
  status: CampaignStatus;
  pulse?: boolean;
  label?: string;
}) {
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
        {label ?? "Duraklatıldı"}
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
          "anim-bar h-full rounded-full transition-all duration-500",
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

/** Kart altında açılan satır içi künye paneli — kampanya nesnesinde ne varsa gösterir. */
function DetailPanel({ campaign, status }: { campaign: Campaign; status: CampaignStatus }) {
  const detail = campaign.detail ?? {};
  const rows: Array<[string, string]> = [
    ["Kampanya", campaign.title],
    ["Durum", status === "aktif" ? "Aktif" : status === "duraklatildi" ? (campaign.badgeLabel ?? "Duraklatıldı") : "Tamamlandı"],
    ["Kanal", detail.channel ?? "—"],
    ["Hedef sayısı", detail.targetCount !== undefined ? `${detail.targetCount.toLocaleString("tr-TR")} veli` : "—"],
    ["Başlangıç", detail.startDate ?? "—"],
  ];
  return (
    <div className="mt-3 rounded-lg bg-surface-container-low p-4">
      <p className="mb-2 font-label-xs text-label-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Kampanya Detayı
      </p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-w-0 justify-between gap-3">
            <dt className="shrink-0 font-label-sm text-label-sm text-on-surface-variant">{label}</dt>
            <dd className="truncate text-right font-label-sm text-label-sm font-semibold text-on-surface">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {detail.script ? (
        <div className="mt-3 border-t border-outline-variant/50 pt-2">
          <p className="font-label-xs text-label-xs text-on-surface-variant">Örnek script</p>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant italic">
            {detail.script}
          </p>
        </div>
      ) : null}
      <p className="mt-3 font-label-xs text-label-xs text-outline">
        Not: Bu panel kampanya künyesini gösterir; ayrıntılı performans raporu henüz üretilmiyor.
      </p>
    </div>
  );
}

function CampaignCard({
  campaign,
  status,
  expanded,
  notice,
  onPause,
  onResume,
  onToggleDetail,
}: {
  campaign: Campaign;
  status: CampaignStatus;
  expanded: boolean;
  notice: { kind: "error" | "demo"; text: string } | null;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onToggleDetail: (id: string) => void;
}) {
  return (
    <article className="flex flex-col rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 transition-colors hover:border-outline-variant">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{campaign.title}</h3>
          <p className="mt-0.5 truncate font-body-sm text-body-sm text-on-surface-variant">
            {campaign.subtitle}
          </p>
        </div>
        <StatusBadge pulse={campaign.highlight} status={status} label={campaign.badgeLabel} />
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
              className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-1.5 font-label-sm text-label-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
              type="button"
              onClick={() => onPause(campaign.id)}
            >
              Duraklat
            </button>
          ) : null}
          {campaign.controls?.includes("report") ? (
            <button
              aria-expanded={expanded}
              className={clsx(
                "rounded-lg px-3 py-1.5 font-label-sm text-label-sm font-medium transition-colors",
                expanded ? "font-semibold text-primary-container" : "text-primary hover:text-primary-container"
              )}
              type="button"
              onClick={() => onToggleDetail(campaign.id)}
            >
              Detay
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

      {/* Satır içi bildirim: hata veya demo-mod dürüst notu */}
      {notice ? (
        <p
          className={clsx(
            "mt-2 font-label-sm text-label-sm font-semibold",
            notice.kind === "error" ? "text-error" : "text-on-surface-variant"
          )}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      ) : null}

      {/* "Detay" ile açılan satır içi künye paneli */}
      {expanded ? <DetailPanel campaign={campaign} status={status} /> : null}
    </article>
  );
}

/** Sekmeli filtre + kampanya kartları (Duraklat / Devam Ettir / Detay işlevsel). */
export function CampaignList({
  campaigns: liveCampaigns,
  sourceLabel,
}: {
  /** Canlı kampanyalar (Supabase). Verilmezse demo veri gösterilir. */
  campaigns?: Campaign[];
  sourceLabel?: string;
}) {
  const [filter, setFilter] = useState<CampaignFilterId>("tumu");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, CampaignStatus>>({});
  // "Detay" paneli tek kartta açık durur; tekrar tıklanınca kapanır.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Satır içi bildirimler: PATCH hatası veya demo-mod dürüst notu.
  const [notices, setNotices] = useState<Record<string, { kind: "error" | "demo"; text: string } | null>>({});
  const list = liveCampaigns ?? campaigns;

  const clearOverride = (id: string) =>
    setStatusOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  /**
   * Duraklat/devam → PATCH /api/campaigns/[id].
   * Optimistik durum güncellemesi; hata olursa eski duruma dönüp satır içi uyarı,
   * demo modda (persisted:false) kalıcı olmadığını bildiren dürüst not gösterilir.
   */
  const handleToggle = (id: string, status: CampaignStatus) => {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }));
    setNotices((prev) => ({ ...prev, [id]: null }));
    void (async () => {
      try {
        const res = await fetch(`/api/campaigns/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: status === "aktif" ? "running" : "paused" }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          clearOverride(id);
          setNotices((prev) => ({ ...prev, [id]: { kind: "error", text: "Durum güncellenemedi" } }));
          return;
        }
        if (data.persisted === false) {
          setNotices((prev) => ({
            ...prev,
            [id]: { kind: "demo", text: "Demo modda — kalıcı değil" },
          }));
        }
      } catch {
        clearOverride(id);
        setNotices((prev) => ({ ...prev, [id]: { kind: "error", text: "Durum güncellenemedi" } }));
      }
    })();
  };

  const currentStatus = (campaign: Campaign): CampaignStatus =>
    statusOverrides[campaign.id] ?? campaign.status;

  const liveCounts = liveCampaigns
    ? {
        tumu: list.length,
        aktif: list.filter((c) => (statusOverrides[c.id] ?? c.status) === "aktif").length,
        duraklatildi: list.filter((c) => (statusOverrides[c.id] ?? c.status) === "duraklatildi").length,
        tamamlandi: list.filter((c) => (statusOverrides[c.id] ?? c.status) === "tamamlandi").length,
      }
    : null;

  const visibleCampaigns = list.filter(
    (campaign) => filter === "tumu" || currentStatus(campaign) === filter
  );

  return (
    <div className="flex flex-col gap-4">
      {sourceLabel ? (
        <p className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}
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
                {liveCounts ? liveCounts[tab.id] : tab.count}
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
            expanded={expandedId === campaign.id}
            notice={notices[campaign.id] ?? null}
            onPause={(id) => handleToggle(id, "duraklatildi")}
            onResume={(id) => handleToggle(id, "aktif")}
            onToggleDetail={(id) => setExpandedId((prev) => (prev === id ? null : id))}
          />
        ))}
      </div>
    </div>
  );
}
