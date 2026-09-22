"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clsx } from "@/lib/clsx";
import {
  callList,
  CHANNEL_LABELS,
  formatDuration,
  SENTIMENT_LABELS,
  type CallChannel,
  type CallListItem,
  type CallSentiment,
} from "@/lib/mock/call-list";
import {
  onRangeChange,
  readRange,
  type RangeSelection,
} from "@/components/shell/topbar-menus";

const CHANNEL_ICONS: Record<CallChannel, string> = {
  voice: "phone_in_talk",
  whatsapp: "forum",
  sms: "sms",
};

function SentimentBadge({ sentiment }: { sentiment: CallSentiment }) {
  const styles: Record<CallSentiment, string> = {
    positive: "bg-secondary-container text-on-secondary-container",
    neutral: "bg-surface-container text-on-surface-variant",
    negative: "bg-error-container text-on-error-container",
    handoff: "bg-primary-fixed text-primary",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 font-label-xs text-label-xs font-semibold",
        styles[sentiment]
      )}
    >
      {SENTIMENT_LABELS[sentiment]}
    </span>
  );
}

function ChannelTag({ channel }: { channel: CallChannel }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
      <span className="material-symbols-outlined text-[16px] text-outline">
        {CHANNEL_ICONS[channel]}
      </span>
      {CHANNEL_LABELS[channel]}
    </span>
  );
}

function DirectionTag({ direction }: { direction: CallListItem["direction"] }) {
  return (
    <span className="inline-flex items-center gap-1 font-label-xs text-label-xs text-on-surface-variant">
      <span className="material-symbols-outlined text-[14px] text-outline">
        {direction === "inbound" ? "call_received" : "call_made"}
      </span>
      {direction === "inbound" ? "Gelen" : "Giden"}
    </span>
  );
}

const CHANNEL_FILTERS = [
  { id: "all", label: "Tümü" },
  { id: "voice", label: "Sesli" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "sms", label: "SMS" },
] as const;

export function CallListBrowser({
  calls,
  sourceLabel,
}: {
  /** Canlı veri (Supabase). Verilmazsa demo veri gösterilir. */
  calls?: CallListItem[];
  /** Listenin kaynağını açıklayan kısa rozet metni. */
  sourceLabel?: string;
}) {
  const list = calls ?? callList;
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState<"all" | CallChannel>("all");
  const [range, setRange] = useState<RangeSelection>({ days: 30, label: "Son 30 gün" });

  // Topbardaki tarih aralığı seçimini izle (sortKey = dakika cinsinden "önce")
  useEffect(() => {
    let alive = true;
    void Promise.resolve().then(() => {
      if (alive) setRange(readRange());
    });
    const unsubscribe = onRangeChange(setRange);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const visible = useMemo(
    () =>
      list.filter((c) => {
        if (c.sortKey > range.days * 24 * 60) return false;
        if (channel !== "all" && c.channel !== channel) return false;
        if (!query) return true;
        const q = query.toLocaleLowerCase("tr");
        return (
          c.parentName.toLocaleLowerCase("tr").includes(q) ||
          c.studentName.toLocaleLowerCase("tr").includes(q) ||
          c.summary.toLocaleLowerCase("tr").includes(q)
        );
      }),
    [list, range, query, channel]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Filtre satırı */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
            search
          </span>
          <input
            className="h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-9 pr-3 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Veli, öğrenci veya özet ara..."
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {CHANNEL_FILTERS.map((f) => {
            const active = channel === f.id;
            return (
              <button
                key={f.id}
                className={clsx(
                  "shrink-0 rounded-full px-3.5 py-1.5 font-label-sm text-label-sm transition-colors",
                  active
                    ? "bg-primary-container font-semibold text-on-primary"
                    : "border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                )}
                type="button"
                onClick={() => setChannel(f.id)}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
        {/* PC: tablo */}
        <table className="hidden w-full text-left lg:table">
          <thead>
            <tr className="border-b border-outline-variant/50 font-label-sm text-label-sm font-medium text-on-surface-variant">
              <th className="px-5 py-3.5">Veli / Öğrenci</th>
              <th className="px-3 py-3.5">Kanal</th>
              <th className="px-3 py-3.5">Yön</th>
              <th className="px-3 py-3.5">Sonuç</th>
              <th className="px-3 py-3.5">Süre</th>
              <th className="px-3 py-3.5">Zaman</th>
              <th className="px-3 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {visible.map((c) => (
              <tr key={c.id} className="group transition-colors hover:bg-surface-container-low/60">
                <td className="max-w-xs px-5 py-3.5">
                  <p className="font-label-md text-label-md font-semibold text-on-surface">
                    {c.parentName}
                  </p>
                  <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                    {c.studentName} · {c.grade}
                  </p>
                </td>
                <td className="px-3 py-3.5">
                  <ChannelTag channel={c.channel} />
                </td>
                <td className="px-3 py-3.5">
                  <DirectionTag direction={c.direction} />
                </td>
                <td className="px-3 py-3.5">
                  <SentimentBadge sentiment={c.sentiment} />
                </td>
                <td className="px-3 py-3.5 font-mono-data text-mono-data text-on-surface-variant">
                  {formatDuration(c.durationSeconds)}
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 font-body-sm text-body-sm text-on-surface-variant">
                  {c.when}
                </td>
                <td className="px-3 py-3.5 text-right">
                  <Link
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-label-sm text-label-sm font-medium text-primary transition-colors hover:bg-primary-fixed"
                    href={`/gorusmeler/${c.id}`}
                  >
                    İncele
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobil: kartlar */}
        <div className="divide-y divide-outline-variant/40 lg:hidden">
          {visible.map((c) => (
            <Link
              key={c.id}
              className="block p-4 transition-colors hover:bg-surface-container-low/60"
              href={`/gorusmeler/${c.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-label-md text-label-md font-semibold text-on-surface">
                    {c.parentName}
                  </p>
                  <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                    {c.studentName} · {c.grade}
                  </p>
                </div>
                <SentimentBadge sentiment={c.sentiment} />
              </div>
              <p className="mt-2 line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">
                {c.summary}
              </p>
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChannelTag channel={c.channel} />
                  <DirectionTag direction={c.direction} />
                  <span className="font-mono-data text-mono-data text-on-surface-variant">
                    {formatDuration(c.durationSeconds)}
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-outline">{c.when}</span>
              </div>
            </Link>
          ))}
        </div>

        {sourceLabel ? (
          <div className="flex items-center gap-2 border-b border-outline-variant/40 px-5 py-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {sourceLabel}
            </span>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <p className="p-8 text-center font-body-md text-body-md text-on-surface-variant">
            Filtreye uygun görüşme bulunamadı.
          </p>
        ) : (
          <p className="border-t border-outline-variant/40 px-5 py-3 font-body-sm text-body-sm text-on-surface-variant">
            Toplam {visible.length} görüşme listeleniyor.
          </p>
        )}
      </div>
    </div>
  );
}
