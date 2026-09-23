"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { AttendanceStatus, Lesson } from "@/lib/types/db";

export interface YoklamaContact {
  id: string;
  studentName: string;
  parentName: string;
  grade: string;
  phone: string;
}

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Geldi",
  late: "Geç Kaldı",
  absent: "Gelmedi",
};

const STATUS_BTN: Record<AttendanceStatus, string> = {
  present:
    "bg-secondary-container text-on-secondary-container font-semibold border-secondary",
  late: "bg-tertiary-container text-on-tertiary-container font-semibold border-tertiary",
  absent: "bg-error-container text-on-error-container font-semibold border-error",
};

const TIME_FMT = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** wa.me derin bağlantısı — veliye hazır mesajla bildirim (Netgsm gerekmez). */
function waLink(phone: string, studentName: string, lessonName: string, dateStr: string): string {
  const digits = (phone.match(/\d/g) ?? []).join("");
  const full = digits.startsWith("90") ? digits : `90${digits.replace(/^0/, "")}`;
  const msg = encodeURIComponent(
    `Merhaba, ${dateStr} tarihli "${lessonName}" dersine ${studentName} katılımı gerçekleşmemiştir. Bilginize.`
  );
  return `https://wa.me/${full}?text=${msg}`;
}

export function YoklamaView({
  lessons,
  contacts,
  initialMarks,
  live,
  sourceLabel,
}: {
  lessons: Lesson[];
  contacts: YoklamaContact[];
  /** Canlı: kayıtlı işaretler (lesson_id → contact_id → status) */
  initialMarks: Record<string, Record<string, AttendanceStatus>>;
  live: boolean;
  sourceLabel?: string;
}) {
  // Dersler sunucuda "bugüne en yakın" olacak şekilde sıralanıp gelir
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(lessons[0]?.id ?? null);
  const selectedLesson = lessons.find((l) => l.id === selectedLessonId) ?? null;

  const [marksByLesson, setMarksByLesson] = useState<Record<string, Record<string, AttendanceStatus>>>(
    initialMarks
  );
  const marks = selectedLessonId ? marksByLesson[selectedLessonId] ?? {} : {};
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const setStatus = (contactId: string, status: AttendanceStatus) => {
    if (!selectedLessonId) return;
    setMarksByLesson((prev) => {
      const lessonMarks = { ...(prev[selectedLessonId] ?? {}) };
      if (lessonMarks[contactId] === status) delete lessonMarks[contactId];
      else lessonMarks[contactId] = status;
      return { ...prev, [selectedLessonId]: lessonMarks };
    });
  };

  const save = () => {
    if (saving || !selectedLesson) return;
    if (Object.keys(marks).length === 0) {
      setNote({ ok: false, text: "Önce en az bir öğrenci işaretleyin." });
      return;
    }
    setSaving(true);
    setNote(null);
    fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: selectedLesson.id,
        entries: Object.entries(marks).map(([contactId, status]) => ({ contactId, status })),
        markedBy: "Panel",
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setNote({ ok: false, text: d.error ?? "Yoklama kaydedilemedi" });
        } else {
          setNote({
            ok: true,
            text: d.persisted
              ? `Yoklama kaydedildi (${d.saved} öğrenci, ${d.absent} gelmedi).`
              : "Demo modda kaydedildi — Supabase anahtarları gerekli.",
          });
        }
      })
      .catch(() => setNote({ ok: false, text: "Sunucuya ulaşılamadı" }))
      .finally(() => setSaving(false));
  };

  const absentees = contacts.filter((c) => marks[c.id] === "absent");
  const presentCount = Object.values(marks).filter((s) => s === "present").length;
  const lateCount = Object.values(marks).filter((s) => s === "late").length;

  return (
    <PageShell>
      <PageHeader
        title="Devamsızlık & Yoklama"
        description="Ders bazlı hızlı yoklama — gelmeyenlerin velilerine tek tıkla bildirim."
      />

      {sourceLabel ? (
        <p className="-mt-2 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}

      {lessons.length === 0 || contacts.length === 0 ? (
        <EmptyState
          description="Yoklama için ders ve öğrenci kaydı gerekli. Dersler Supabase'de tutulur."
          icon="fact_check"
          title="Ders kaydı yok"
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Ders seçici */}
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
            {lessons.map((lesson) => {
              const active = lesson.id === selectedLessonId;
              return (
                <button
                  key={lesson.id}
                  className={clsx(
                    "flex shrink-0 flex-col items-start gap-0.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                    active
                      ? "border-primary bg-primary-fixed/40"
                      : "border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low"
                  )}
                  type="button"
                  onClick={() => setSelectedLessonId(lesson.id)}
                >
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                    {lesson.name}
                  </span>
                  <span className="font-label-xs text-label-xs text-on-surface-variant">
                    {TIME_FMT.format(new Date(lesson.scheduled_at))} · {lesson.class_level ?? "—"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Özet şeridi */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              {selectedLesson?.name ?? "Ders seçin"}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {selectedLesson ? TIME_FMT.format(new Date(selectedLesson.scheduled_at)) : ""}
            </span>
            <span className="ml-auto flex items-center gap-2 font-label-sm text-label-sm">
              <span className="rounded-full bg-secondary-container px-2.5 py-1 font-semibold text-on-secondary-container">
                Geldi: {presentCount}
              </span>
              <span className="rounded-full bg-tertiary-container px-2.5 py-1 font-semibold text-on-tertiary-container">
                Geç: {lateCount}
              </span>
              <span className="rounded-full bg-error-container px-2.5 py-1 font-semibold text-on-error-container">
                Gelmedi: {absentees.length}
              </span>
            </span>
          </div>

          {/* Öğrenci grid'i */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {contacts.map((contact) => {
              const current = marks[contact.id];
              return (
                <div
                  key={contact.id}
                  className="flex flex-col gap-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-label-md text-label-md font-semibold text-on-surface">
                      {contact.studentName}
                    </p>
                    <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                      {contact.grade || "—"} · Veli: {contact.parentName}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(Object.keys(STATUS_LABEL) as AttendanceStatus[]).map((status) => (
                      <button
                        key={status}
                        className={clsx(
                          "flex h-9 items-center justify-center rounded-lg border font-label-xs text-label-xs transition-colors",
                          current === status
                            ? STATUS_BTN[status]
                            : "border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                        )}
                        type="button"
                        onClick={() => setStatus(contact.id, status)}
                      >
                        {STATUS_LABEL[status]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kaydet */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              className={clsx(
                "flex h-11 items-center gap-2 rounded-xl bg-primary-container px-6 font-title-sm text-title-sm font-semibold text-on-primary transition-all hover:bg-primary",
                saving && "opacity-60"
              )}
              disabled={saving}
              type="button"
              onClick={save}
            >
              <span className={clsx("material-symbols-outlined text-[18px]", saving && "animate-spin")}>
                {saving ? "refresh" : "save"}
              </span>
              {saving ? "Kaydediliyor..." : "Yoklamayı Kaydet"}
            </button>
            {note ? (
              <span
                role="status"
                className={clsx(
                  "font-label-sm text-label-sm font-semibold",
                  note.ok ? "text-secondary" : "text-error"
                )}
              >
                {note.text}
              </span>
            ) : null}
            {!live ? (
              <span className="font-label-xs text-label-xs text-outline">Demo mod</span>
            ) : null}
          </div>

          {/* Veli bildirim kuyruğu */}
          {absentees.length > 0 ? (
            <div className="rounded-2xl border border-error/40 bg-error-container/30 p-5">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Velileri bilgilendir ({absentees.length})
              </h3>
              <p className="mb-3 mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                Gelmedi işaretlenen öğrencilerin velilerine hazır mesajla WhatsApp bildirimi açın.
              </p>
              <div className="flex flex-wrap gap-2">
                {absentees.map((contact) => (
                  <a
                    key={contact.id}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                    href={waLink(
                      contact.phone,
                      contact.studentName,
                      selectedLesson?.name ?? "ders",
                      selectedLesson
                        ? TIME_FMT.format(new Date(selectedLesson.scheduled_at))
                        : ""
                    )}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      chat
                    </span>
                    {contact.parentName}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
