"use client";

import { useMemo, useState } from "react";
import { clsx } from "@/lib/clsx";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { SKILLS, SCORE_LABEL } from "@/lib/skills";
import type { SkillId } from "@/lib/types/db";

export interface SkillObservationItem {
  id: string;
  contact_id: string;
  skill: SkillId;
  score: number;
  note: string | null;
  period: string | null;
  observed_by: string | null;
  created_at: string;
}

export interface StudentOption {
  id: string;
  label: string;
  grade: string;
}

/** Radar (pentagon) koordinatı: skor 1-5 → merkezden uzaklık. */
function axisPoint(index: number, total: number, radius: number, score: number) {
  const angle = (-90 + (360 / total) * index) * (Math.PI / 180);
  const r = (score / 5) * radius;
  return [60 + r * Math.cos(angle), 60 + r * Math.sin(angle)] as const;
}

function polygonPoints(values: number[], radius: number): string {
  return values
    .map((v, i) => axisPoint(i, values.length, radius, v).join(","))
    .join(" ");
}

/** Seçili öğrencinin radar karnesi + gözlem kayıtları. */
function StudentRadar({ observations }: { observations: SkillObservationItem[] }) {
  // Son gözlemlerden beceri ortalamaları
  const averages = useMemo(() => {
    return SKILLS.map((skill) => {
      const list = observations.filter((o) => o.skill === skill.id);
      const avg = list.length
        ? list.reduce((sum, o) => sum + o.score, 0) / list.length
        : 0;
      return { skill, avg, count: list.length };
    });
  }, [observations]);

  const values = averages.map((a) => a.avg);
  const gridLevels = [1, 2, 3, 4, 5];
  const filled = values.filter((v) => v > 0).length;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      {/* RADAR */}
      <div className="flex shrink-0 justify-center">
        <svg className="h-56 w-56" viewBox="0 0 120 120">
          {/* Grid halkaları */}
          {gridLevels.map((level) => (
            <polygon
              key={level}
              className="fill-none stroke-outline-variant/40"
              strokeWidth="0.4"
              points={polygonPoints(Array(SKILLS.length).fill(level), 52)}
            />
          ))}
          {/* Eksen çizgileri + etiketler */}
          {SKILLS.map((skill, i) => {
            const [x, y] = axisPoint(i, SKILLS.length, 52, 5);
            const [lx, ly] = axisPoint(i, SKILLS.length, 65, 5);
            return (
              <g key={skill.id}>
                <line
                  x1="60" y1="60" x2={x} y2={y}
                  className="stroke-outline-variant/40"
                  strokeWidth="0.4"
                />
                <text
                  x={lx} y={ly}
                  className="fill-on-surface-variant"
                  fontSize="4"
                  textAnchor={lx > 66 ? "start" : lx < 54 ? "end" : "middle"}
                  dominantBaseline="middle"
                >
                  {skill.label.split(" ")[0]}
                </text>
              </g>
            );
          })}
          {/* Veri poligonu */}
          {filled > 0 ? (
            <>
              <polygon
                className="fill-primary/20 stroke-primary"
                strokeWidth="1"
                strokeLinejoin="round"
                points={polygonPoints(values, 52)}
              />
              {values.map((v, i) => {
                const [x, y] = axisPoint(i, values.length, 52, v);
                return v > 0 ? (
                  <circle key={i} cx={x} cy={y} r="1.2" className="fill-primary" />
                ) : null;
              })}
            </>
          ) : null}
        </svg>
      </div>

      {/* Beceri puanları */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {averages.map(({ skill, avg, count }) => (
          <div
            key={skill.id}
            className="flex items-center gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
              <span className="material-symbols-outlined text-[18px]">{skill.icon}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-label-md text-label-md font-semibold text-on-surface">
                {skill.label}
              </p>
              <p className="truncate font-label-xs text-label-xs text-on-surface-variant">
                {count > 0 ? `${count} gözlem · ort. ${avg.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}/5` : "Gözlem yok"}
              </p>
            </div>
            <span
              className={clsx(
                "shrink-0 rounded-full px-2.5 py-1 font-label-xs text-label-xs font-bold",
                avg >= 4
                  ? "bg-secondary-container text-on-secondary-container"
                  : avg >= 3
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : avg > 0
                      ? "bg-error-container text-on-error-container"
                      : "bg-surface-container text-outline"
              )}
            >
              {avg > 0 ? avg.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BeceriKarnesiView({
  students,
  observations,
  odevDurumu,
  live,
  sourceLabel,
}: {
  students: StudentOption[];
  observations: SkillObservationItem[];
  /** M9.2: contact_id → ödev performansı (odev-performans.ts'ten; canlı modda dolu) */
  odevDurumu?: Record<string, { total: number; done: number; missing: number }>;
  live: boolean;
  sourceLabel?: string;
}) {
  const [selectedId, setSelectedId] = useState(students[0]?.id ?? null);
  const [all, setAll] = useState(observations);
  const [skill, setSkill] = useState<SkillId>(SKILLS[0].id);
  const [score, setScore] = useState(4);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const studentObservations = all.filter((o) => o.contact_id === selectedId);
  const selectedStudent = students.find((s) => s.id === selectedId);

  const addObservation = () => {
    if (busy || !selectedId) return;
    setBusy(true);
    setFeedback(null);
    fetch("/api/skill-observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: selectedId, skill, score, note }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setFeedback({ ok: false, text: d.error ?? "Kaydedilemedi" });
        } else if (d.observation) {
          setAll((prev) => [d.observation, ...prev]);
          setFeedback({ ok: true, text: "Gözlem kaydedildi." });
        } else {
          setFeedback({ ok: true, text: "Demo modda kaydedildi." });
        }
      })
      .catch(() => setFeedback({ ok: false, text: "Sunucuya ulaşılamadı" }))
      .finally(() => setBusy(false));
  };

  return (
    <PageShell>
      <PageHeader
        title="Beceri Karnesi"
        description="21. yüzyıl becerileri gözlem karnesi — veli görüşmelerinde AI asistanın anlattığı gelişim haritası."
      />

      {sourceLabel ? (
        <p className="-mt-2 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}

      {students.length === 0 ? (
        <EmptyState
          description="Beceri karnesi için öğrenci kaydı gerekli."
          icon="psychology"
          title="Öğrenci kaydı yok"
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Öğrenci seçici */}
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
            {students.map((student) => (
              <button
                key={student.id}
                className={clsx(
                  "shrink-0 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                  student.id === selectedId
                    ? "border-primary bg-primary-fixed/40"
                    : "border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low"
                )}
                type="button"
                onClick={() => setSelectedId(student.id)}
              >
                <span className="block font-label-sm text-label-sm font-semibold text-on-surface">
                  {student.label}
                </span>
                <span className="block font-label-xs text-label-xs text-on-surface-variant">
                  {student.grade || "—"}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                {selectedStudent?.label ?? "—"} · Beceri Radarı
              </h2>
              {!live ? (
            <p className="font-label-xs text-label-xs text-outline">Demo mod — gözlemler kalıcı olmayabilir.</p>
          ) : studentObservations.length > 0 ? (
                <span className="font-label-xs text-label-xs text-on-surface-variant">
                  {studentObservations.length} gözlem
                </span>
              ) : null}
            </div>
            <StudentRadar observations={studentObservations} />
            {/* M9.2: Ödev Disiplini — ödev modülünden beslenen tek satırlık gösterge */}
            {odevDurumu && selectedId && odevDurumu[selectedId]?.total ? (
              (() => {
                const o = odevDurumu[selectedId];
                const renk =
                  o.missing / o.total >= 0.5
                    ? "bg-error-container text-on-error-container"
                    : o.missing > 0
                      ? "bg-tertiary-container text-on-tertiary-container"
                      : "bg-secondary-container text-on-secondary-container";
                return (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3">
                    <span className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">checklist</span>
                      Ödev Disiplini
                    </span>
                    <span className={clsx("rounded-full px-3 py-1 font-label-sm text-label-sm font-semibold", renk)}>
                      {o.done}/{o.total} yapıldı
                      {o.missing > 0 ? ` (${o.missing} eksik)` : ""}
                    </span>
                  </div>
                );
              })()
            ) : null}
          </div>

          {/* Gözlem ekle */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Yeni Gözlem Ekle
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant">Beceri</span>
                <select
                  className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none"
                  onChange={(e) => setSkill(e.target.value as SkillId)}
                  value={skill}
                >
                  {SKILLS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant">Puan</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      className={clsx(
                        "h-10 flex-1 rounded-lg border font-label-sm text-label-sm transition-colors",
                        score === n
                          ? "border-primary bg-primary-container font-semibold text-on-primary"
                          : "border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                      )}
                      type="button"
                      onClick={() => setScore(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="font-label-xs text-label-xs text-outline">
                  {score}: {SCORE_LABEL[score]}
                </span>
              </div>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="font-label-xs text-label-xs text-on-surface-variant">
                  Gözlem notu
                </span>
                <input
                  className="h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none"
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Kısa gözlem notu (veli karnesinde görünür)"
                  type="text"
                  value={note}
                />
              </label>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                className={clsx(
                  "flex h-10 items-center gap-2 rounded-xl bg-primary-container px-5 font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary",
                  busy && "opacity-60"
                )}
                disabled={busy}
                type="button"
                onClick={addObservation}
              >
                <span className={clsx("material-symbols-outlined text-[16px]", busy && "animate-spin")}>
                  {busy ? "refresh" : "add"}
                </span>
                {busy ? "Kaydediliyor..." : "Gözlemi Kaydet"}
              </button>
              {feedback ? (
                <span
                  role="status"
                  className={clsx(
                    "font-label-sm text-label-sm font-semibold",
                    feedback.ok ? "text-secondary" : "text-error"
                  )}
                >
                  {feedback.text}
                </span>
              ) : null}
            </div>
          </div>

          {/* Son gözlemler */}
          {studentObservations.length > 0 ? (
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Son gözlemler</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {studentObservations.slice(0, 6).map((o) => {
                  const skillDef = SKILLS.find((s) => s.id === o.skill);
                  return (
                    <li
                      key={o.id}
                      className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        {skillDef?.icon ?? "circle"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-label-sm text-label-sm font-semibold text-on-surface">
                          {skillDef?.label ?? o.skill} · {o.score}/5 ({SCORE_LABEL[o.score]})
                        </span>
                        {o.note ? (
                          <span className="block truncate font-body-sm text-body-sm text-on-surface-variant">
                            {o.note}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 font-label-xs text-label-xs text-outline">
                        {o.observed_by ?? "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
