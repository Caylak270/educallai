"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "@/lib/clsx";
import {
  installmentFilterPills,
  installmentListHeader,
  installmentRecords,
  type InstallmentFilterId,
  type InstallmentRecord,
} from "@/lib/mock/installments";
import { InstallmentCard } from "./installment-card";

const PILL_BASE: Record<InstallmentFilterId, string> = {
  all: "Tümü",
  overdue: "Gecikenler",
  "due-today": "Bugün Vadesi Dolan",
  "ai-call": "AI Aramasında",
  promised: "Ödeme Sözü Verenler",
};

/** Gelişmiş filtre sıralama seçenekleri. */
const SORT_OPTIONS = [
  { id: "risk", label: "Risk Önceliği" },
  { id: "vade", label: "Vade Tarihi" },
  { id: "tutar-azalan", label: "Tutar (Azalan)" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["id"];

const SORT_LABELS: Record<SortKey, string> = {
  risk: "Sırala: Risk Önceliği",
  vade: "Sırala: Vade Tarihi",
  "tutar-azalan": "Sırala: Tutar (Azalan)",
};

/** Kaydın sayısal tutarı — canlıda amountValue vardır; mock'ta metinden çözülür. */
function amountToNumber(record: InstallmentRecord): number {
  if (typeof record.amountValue === "number") return record.amountValue;
  const digits = record.amount.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export function InstallmentsBrowser({
  records: liveRecords,
  sourceLabel,
  focusContactId,
  focusLabel,
  onClearFocus,
}: {
  /** Canlı taksit kayıtları (Supabase). Verilmezse demo veri gösterilir. */
  records?: InstallmentRecord[];
  sourceLabel?: string;
  /** Borçlular tablosundan gelen öğrenci süzmesi. */
  focusContactId?: string | null;
  focusLabel?: string | null;
  onClearFocus?: () => void;
}) {
  const router = useRouter();
  // Yerel mutasyonlar sunucu verisinin üstüne optimizer katmanı olarak biner;
  // router.refresh() yeni sunucu verisini prop'tan akıtınca katman harmless düşer.
  const [paidAtOverrides, setPaidAtOverrides] = useState<Record<string, string>>({});
  const [deletedIds, setDeletedIds] = useState<Record<string, true>>({});
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<InstallmentFilterId>("all");
  // Gelişmiş filtre paneli durumu (tune ikonuyla açılır).
  const [panelOpen, setPanelOpen] = useState(false);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [minAmount, setMinAmount] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("risk");

  const records = useMemo<InstallmentRecord[]>(() => {
    const base = liveRecords ?? installmentRecords;
    return base
      .filter((r) => !deletedIds[r.id])
      .map((r) => {
        if (paidAtOverrides[r.id]) {
          return {
            ...r,
            statusPill: { icon: "check_circle", text: "Ödendi", tone: "pre" as const },
            paidAt: r.paidAt ?? paidAtOverrides[r.id],
          };
        }
        return r;
      });
  }, [liveRecords, paidAtOverrides, deletedIds]);

  /** Canlı modda pill etiketleri gerçek sayılarla güncellenir. */
  const pillLabels = useMemo(() => {
    if (!liveRecords) return null;
    const counts: Record<InstallmentFilterId, number> = {
      all: records.length,
      overdue: 0,
      "due-today": 0,
      "ai-call": 0,
      promised: 0,
    };
    for (const r of records) {
      for (const f of r.filters) counts[f] += 1;
    }
    return Object.fromEntries(
      (Object.keys(counts) as InstallmentFilterId[]).map((id) => [
        id,
        `${PILL_BASE[id]} (${counts[id]})`,
      ])
    ) as Record<InstallmentFilterId, string>;
  }, [records, liveRecords]);

  /** Ödendi işaretle → API + yerel katman + üst özetleri tazele. */
  const handlePaid = useCallback(async (id: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/installments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "paid" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) return data.error ?? "Kaydedilemedi";
      setPaidAtOverrides((prev) => ({ ...prev, [id]: new Date().toISOString() }));
      if (data.persisted) router.refresh();
      return null;
    } catch {
      return "Sunucuya ulaşılamadı";
    }
  }, [router]);

  /** Ödemeyi geri al (yanlış işaretleme düzeltmesi) — gerçek durum refresh ile gelir. */
  const handleUnpaid = useCallback(async (id: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/installments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unpaid" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) return data.error ?? "Geri alınamadı";
      setPaidAtOverrides((prev) => {
        if (!(id in prev)) return prev;
        const { [id]: _drop, ...rest } = prev;
        return rest;
      });
      if (data.persisted) router.refresh();
      return null;
    } catch {
      return "Sunucuya ulaşılamadı";
    }
  }, [router]);

  /** Hatırlat → collection_actions'a kayıt. */
  const handleRemind = useCallback(async (id: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/installments/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remind" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) return data.error ?? "Hatırlatma kaydedilemedi";
      return null;
    } catch {
      return "Sunucuya ulaşılamadı";
    }
  }, []);

  /** Taksit ya da tüm planı sil (sunucu gerçeği router.refresh() ile gelir). */
  const handleDelete = useCallback(
    async (id: string, scope: "row" | "plan"): Promise<string | null> => {
      try {
        const res = await fetch(`/api/installments/${id}?scope=${scope}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok || !data.ok) return data.error ?? "Silinemedi";
        setDeletedIds((prev) => ({ ...prev, [id]: true }));
        if (data.persisted) router.refresh();
        return null;
      } catch {
        return "Sunucuya ulaşılamadı";
      }
    },
    [router]
  );

  const visibleRecords = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const min = Number(minAmount.replace(",", ".")) || 0;
    const filtered = records.filter((record) => {
      const matchesFilter =
        activeFilter === "all" || record.filters.includes(activeFilter);
      const matchesOverdue = !onlyOverdue || record.filters.includes("overdue");
      const matchesAmount = min <= 0 || amountToNumber(record) >= min;
      const matchesContact =
        !focusContactId || record.contactId === focusContactId;
      const haystack = `${record.studentName} ${record.parentName}`
        .toLocaleLowerCase("tr-TR");
      const matchesQuery = q.length === 0 || haystack.includes(q);
      return matchesFilter && matchesOverdue && matchesAmount && matchesContact && matchesQuery;
    });
    // Sıralama gerçek client state ile: vade artan ya da tutar azalan.
    if (sortKey === "vade") {
      return filtered.sort((a, b) =>
        (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31")
      );
    }
    if (sortKey === "tutar-azalan") {
      return filtered.sort((a, b) => amountToNumber(b) - amountToNumber(a));
    }
    return filtered;
  }, [records, query, activeFilter, onlyOverdue, minAmount, sortKey, focusContactId]);

  return (
    <section className="flex flex-col gap-4">
      {/* Arama girişi */}
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
          search
        </span>
        <input
          className="h-11 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-11 pr-11 font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant/70 focus:border-outline-variant focus:outline-none"
          placeholder="Öğrenci veya veli adı ara..."
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="button"
          aria-label="Gelişmiş filtre"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((prev) => !prev)}
          className={clsx(
            "absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition-colors hover:bg-surface-container",
            panelOpen ? "text-primary" : "text-on-surface-variant"
          )}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
        </button>
      </div>

      {/* Gelişmiş filtre paneli — pill filtreleri genişletir: geciken + min tutar + sıralama */}
      {panelOpen ? (
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4">
          <label className="flex items-center gap-2 font-label-sm text-label-sm font-medium text-on-surface">
            <input
              checked={onlyOverdue}
              onChange={(event) => setOnlyOverdue(event.target.checked)}
              type="checkbox"
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            Sadece geciken
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-xs text-label-xs text-on-surface-variant">
              Min tutar (₺)
            </span>
            <input
              className="h-9 w-32 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:border-primary focus:outline-none"
              min={0}
              onChange={(event) => setMinAmount(event.target.value)}
              placeholder="0"
              type="number"
              value={minAmount}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-label-xs text-label-xs text-on-surface-variant">Sıralama</span>
            <select
              className="h-9 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 font-label-sm text-label-sm text-on-surface focus:border-primary focus:outline-none"
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              value={sortKey}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setOnlyOverdue(false);
              setMinAmount("");
              setSortKey("risk");
            }}
            className="h-9 rounded-lg px-3 font-label-sm text-label-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      ) : null}

      {/* Yatay pill filtre rayı */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
        {installmentFilterPills.map((pill) => {
          const isActive = pill.id === activeFilter;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setActiveFilter(pill.id)}
              className={clsx(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-label-sm text-label-sm transition-colors",
                isActive
                  ? "bg-primary-container font-semibold text-on-primary"
                  : "border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
              )}
            >
              {pill.dotClass && (
                <span className={clsx("h-1.5 w-1.5 rounded-full", pill.dotClass)} />
              )}
              {pillLabels ? pillLabels[pill.id] : pill.label}
            </button>
          );
        })}
      </div>

      {sourceLabel ? (
        <p className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}

      {/* Borçlular tablosundan gelen öğrenci süzmesi çipi */}
      {focusContactId ? (
        <button
          type="button"
          onClick={onClearFocus}
          className="flex w-fit items-center gap-1.5 rounded-full border border-primary/40 bg-primary-container/30 px-3 py-1.5 font-label-sm text-label-sm font-medium text-on-surface transition-colors hover:bg-primary-container/50"
        >
          <span className="material-symbols-outlined text-[14px]">filter_alt</span>
          Süzme: {focusLabel ?? "Öğrenci"}
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      ) : null}

      {/* Kayıt listesi */}
      <div className="flex items-center justify-between">
        <h3 className="font-label-sm text-label-sm font-medium text-on-surface-variant">
          {liveRecords
            ? `Taksit Listesi (${visibleRecords.length}/${records.length})`
            : installmentListHeader.title}
        </h3>
        <span className="font-label-sm text-label-sm font-medium text-primary">
          {SORT_LABELS[sortKey]}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleRecords.map((record) => (
          <InstallmentCard
            key={record.id}
            record={record}
            initialPaid={record.statusPill.text === "Ödendi"}
            onPaid={liveRecords ? handlePaid : undefined}
            onRemind={liveRecords ? handleRemind : undefined}
            onUnpaid={liveRecords ? handleUnpaid : undefined}
            onDelete={liveRecords ? handleDelete : undefined}
          />
        ))}
        {visibleRecords.length === 0 && (
          <div className="rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-lowest p-8 text-center lg:col-span-2">
            <span className="material-symbols-outlined text-[24px] text-on-surface-variant">
              search_off
            </span>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Filtreye uygun taksit kaydı bulunamadı.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
