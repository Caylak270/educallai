"use client";

import { useEffect, useState } from "react";
import { clsx } from "@/lib/clsx";
import { PageHeader, PageShell, SectionCard } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { RiskStudent, RiskLevel } from "@/lib/server/risk-map";

const LEVEL: Record<RiskLevel, { label: string; dot: string; badge: string }> = {
  yuksek: {
    label: "Yüksek risk",
    dot: "bg-error",
    badge: "bg-error-container text-on-error-container",
  },
  orta: {
    label: "Orta risk",
    dot: "bg-tertiary",
    badge: "bg-tertiary-container text-on-tertiary-container",
  },
  dusuk: {
    label: "Düşük risk",
    dot: "bg-secondary",
    badge: "bg-secondary-container text-on-secondary-container",
  },
};

interface NoteItem {
  id: string;
  author: string | null;
  note: string;
  created_at: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Seçili öğrencinin detayı: net geçmişi + rehberlik notları. */
function RiskDetail({ student }: { student: RiskStudent }) {
  const [notes, setNotes] = useState<NoteItem[] | null>(null);
  const [noteText, setNoteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    // Seçim değişince notları getir (parent key ile remount edilir, reset gerekmez)
    let cancelled = false;
    fetch(`/api/counselor-notes?contactId=${encodeURIComponent(student.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setNotes(d.notes ?? []);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [student.id]);

  const saveNote = () => {
    if (busy || !noteText.trim()) return;
    setBusy(true);
    setError(null);
    fetch("/api/counselor-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: student.id, note: noteText }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setError(d.error ?? "Not kaydedilemedi");
        } else if (d.note) {
          setNotes((prev) => [d.note, ...(prev ?? [])]);
          setNoteText("");
          setInfo("Not kaydedildi.");
        } else {
          setNoteText("");
          setInfo("Demo modda kaydedildi — Supabase bağlandığında kalıcı olacak.");
        }
      })
      .catch(() => {
        setInfo(null);
        setError("Sunucuya ulaşılamadı");
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={clsx("rounded-full px-2.5 py-1 font-label-xs text-label-xs font-semibold", LEVEL[student.riskLevel].badge)}>
          {LEVEL[student.riskLevel].label} · {student.riskScore}
        </span>
        <span className="rounded-full bg-surface-container px-2.5 py-1 font-label-xs text-label-xs text-on-surface-variant">
          {student.categoryLabel}
        </span>
        {student.sentiment ? (
          <span className="rounded-full bg-surface-container px-2.5 py-1 font-label-xs text-label-xs text-on-surface-variant">
            Veli duygusu: {student.sentiment === "positive" ? "pozitif" : student.sentiment === "negative" ? "olumsuz" : "nötr"}
          </span>
        ) : null}
        {student.homework && student.homework.total > 0 ? (
          <span
            className={clsx(
              "rounded-full px-2.5 py-1 font-label-xs text-label-xs font-semibold",
              student.homework.missing / student.homework.total >= 0.5
                ? "bg-error-container text-on-error-container"
                : student.homework.missing > 0
                  ? "bg-tertiary-container text-on-tertiary-container"
                  : "bg-secondary-container text-on-secondary-container"
            )}
          >
            Ödev: {student.homework.done}/{student.homework.total} yapıldı
          </span>
        ) : null}
        {student.doNotCall ? (
          <span className="rounded-full bg-error-container px-2.5 py-1 font-label-xs text-label-xs font-semibold text-on-error-container">
            Aranmaması gereken numara
          </span>
        ) : null}
      </div>

      {/* Net geçmişi */}
      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Net geçmişi ({student.examCount} sınav)
          </span>
          <span className="font-headline-md text-headline-md font-bold text-on-surface">
            {student.net.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
            {student.delta !== null ? (
              <span className={clsx("ml-2 font-label-sm text-label-sm", student.delta >= 0 ? "text-secondary" : "text-error")}>
                {student.delta >= 0 ? "+" : ""}
                {student.delta.toLocaleString("tr-TR")}
              </span>
            ) : null}
          </span>
        </div>
        <svg className="mt-2 h-12 w-full" viewBox="0 0 60 16" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke={student.sparkline.color}
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={student.sparkline.points}
          />
        </svg>
        <p className="mt-1 font-label-xs text-label-xs text-outline">
          Son sınav: {formatDate(student.lastExamDate)}
        </p>
      </div>

      {/* Ödev performansı (M9.2 — odev-performans.ts'ten) */}
      {student.homework && student.homework.total > 0 ? (
        <div className="flex items-center justify-between rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Ödev performansı
          </span>
          <span className="font-label-sm text-label-sm text-on-surface">
            <span className="font-headline-md text-headline-md font-bold">
              {student.homework.done}/{student.homework.total}
            </span>{" "}
            yapıldı
            {student.homework.partial > 0 ? ` · ${student.homework.partial} yarım` : ""}
            {student.homework.missing > 0 ? ` · ${student.homework.missing} eksik` : ""}
          </span>
        </div>
      ) : null}

      {/* Risk kalemleri */}
      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
        <span className="font-label-sm text-label-sm font-semibold text-on-surface">
          Risk skorunu etkileyen kalemler
        </span>
        <ul className="mt-2 flex flex-col gap-1">
          {student.factors.map((f) => (
            <li key={f} className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-outline">arrow_right</span>
              {f}
            </li>
          ))}
          {student.factors.length === 0 ? (
            <li className="font-body-sm text-body-sm text-on-surface-variant">
              Belirgin risk kalemi yok.
            </li>
          ) : null}
        </ul>
      </div>

      {/* Rehberlik notları */}
      <SectionCard title={`Rehberlik notları (${notes?.length ?? 0})`} bodyClassName="p-4">
        <div className="flex flex-col gap-3">
          <textarea
            className="min-h-20 w-full rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 font-body-sm text-body-sm text-on-surface focus:border-primary focus:outline-none"
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Görüşme notu ekle (veliyle konuşma, karar, takip planı...)"
            value={noteText}
          />
          {error ? (
            <p className="font-label-sm text-label-sm font-semibold text-error" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="font-label-sm text-label-sm text-on-surface-variant" role="status">
              {info}
            </p>
          ) : null}
          <button
            className={clsx(
              "flex h-9 w-fit items-center gap-1.5 rounded-lg bg-primary-container px-4 font-label-sm text-label-sm font-semibold text-on-primary transition-colors hover:bg-primary",
              busy && "opacity-60"
            )}
            disabled={busy}
            type="button"
            onClick={saveNote}
          >
            <span className={clsx("material-symbols-outlined text-[16px]", busy && "animate-spin")}>
              {busy ? "refresh" : "note_add"}
            </span>
            {busy ? "Kaydediliyor..." : "Notu Kaydet"}
          </button>

          {notes === null ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Yükleniyor...</p>
          ) : notes.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Henüz not yok — ilk görüşme notunu ekle.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-surface-container-low p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-xs text-label-xs font-semibold text-on-surface">
                      {n.author ?? "Danışman"}
                    </span>
                    <span className="font-label-xs text-label-xs text-outline">
                      {new Date(n.created_at).toLocaleString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface">{n.note}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export function RiskPanelView({
  students,
  sourceLabel,
}: {
  students: RiskStudent[];
  sourceLabel?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(students[0]?.id ?? null);
  const selected = students.find((s) => s.id === selectedId) ?? students[0] ?? null;
  const high = students.filter((s) => s.riskLevel === "yuksek").length;

  return (
    <PageShell>
      <PageHeader
        title="Öğrenci Risk Paneli"
        description="Deneme net eğilimlerinden türetilen risk sıralaması — rehberlik kokpiti."
      />

      {sourceLabel ? (
        <p className="-mt-2 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}

      {students.length === 0 ? (
        <EmptyState
          description="Risk hesaplaması için sınav sonuç verisi bekleniyor."
          icon="monitoring"
          title="Henüz öğrenci verisi yok"
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* SOL: risk listesi */}
          <div className="flex flex-col gap-2 lg:col-span-5">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {students.length} öğrenci · {high} yüksek risk
            </p>
            {students.map((student) => (
              <button
                key={student.id}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  student.id === selected?.id
                    ? "border-primary bg-primary-fixed/40"
                    : "border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low"
                )}
                type="button"
                onClick={() => setSelectedId(student.id)}
              >
                <span className={clsx("h-2.5 w-2.5 shrink-0 rounded-full", LEVEL[student.riskLevel].dot)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-label-md text-label-md font-semibold text-on-surface">
                    {student.name}
                  </span>
                  <span className="block truncate font-body-sm text-body-sm text-on-surface-variant">
                    {student.grade || "—"} · {student.categoryLabel}
                  </span>
                </span>
                <svg className="h-6 w-14 shrink-0" viewBox="0 0 60 16" preserveAspectRatio="none">
                  <polyline fill="none" stroke={student.sparkline.color} strokeWidth="1.4" points={student.sparkline.points} />
                </svg>
                <span className={clsx("shrink-0 rounded-full px-2 py-0.5 font-label-xs text-label-xs font-bold", LEVEL[student.riskLevel].badge)}>
                  {student.riskScore}
                </span>
              </button>
            ))}
          </div>

          {/* SAĞ: detay */}
          <div className="lg:col-span-7">
            {selected ? <RiskDetail key={selected.id} student={selected} /> : null}
          </div>
        </div>
      )}
    </PageShell>
  );
}
