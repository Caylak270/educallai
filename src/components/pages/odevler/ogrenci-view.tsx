"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "@/lib/clsx";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import {
  formatTeslim,
  sinifEslesir,
  type HomeworkAssignmentVM,
  type HomeworkStudent,
  type HomeworkSubmissionVM,
  type OdevRol,
} from "@/components/pages/odevler/odevler-view";
import type { HomeworkStatus } from "@/lib/types/db";

const STATUS_LABEL: Record<HomeworkStatus, string> = {
  done: "Yapıldı",
  partial: "Yarım",
  missing: "Yapılmadı",
};

const STATUS_PILL: Record<HomeworkStatus, string> = {
  done: "bg-secondary-container text-on-secondary-container",
  partial: "bg-tertiary-container text-on-tertiary-container",
  missing: "bg-error-container text-on-error-container",
};

/**
 * Öğrenci görünümü — seçilen öğrenci yalnız kendi sınıfına ait ödevleri görür;
 * fotoğraf çekip yükleyebilir (telefonda kamera açılır), öğretmen kontrolünü
 * ve kendi işaretini burada takip eder.
 *
 * DEVİR NOTU: "hangi öğrenci" bilgisi şimdilik panelde seçilir (auth yok);
 * gerçek öğrenci girişi bağlandığında ogrenciId oturumdan gelecek.
 */
export function OgrenciView({
  students,
  assignments,
  submissions,
  live,
  onRolDegistir,
}: {
  students: HomeworkStudent[];
  assignments: HomeworkAssignmentVM[];
  submissions: HomeworkSubmissionVM[];
  live: boolean;
  onRolDegistir: (r: OdevRol) => void;
}) {
  const router = useRouter();
  const [ogrenciId, setOgrenciId] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void Promise.resolve().then(() => {
      if (!alive) return;
      const saved = localStorage.getItem("educallai-odev-ogrenci");
      if (saved && students.some((s) => s.id === saved)) setOgrenciId(saved);
    });
    return () => {
      alive = false;
    };
  }, [students]);

  const sec = (id: string) => {
    setOgrenciId(id);
    localStorage.setItem("educallai-odev-ogrenci", id);
  };

  const ogrenci = students.find((s) => s.id === ogrenciId) ?? null;
  const odevler = ogrenci
    ? assignments.filter((a) => sinifEslesir(a.classLevel, ogrenci.grade))
    : [];

  // assignment başına yerel seçim durumu
  const [dosyalar, setDosyalar] = useState<Record<string, { file: File; preview: string }>>({});
  const [notlar, setNotlar] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const submissionBy: Record<string, HomeworkSubmissionVM> = Object.fromEntries(
    submissions.map((s) => [`${s.assignmentId}:${s.contactId}`, s])
  );

  const yukle = (assignment: HomeworkAssignmentVM) => {
    if (!ogrenci || busyId) return;
    const secili = dosyalar[assignment.id];
    if (!secili) {
      setNotice({ ok: false, text: "Önce fotoğraf seçin veya çekin." });
      return;
    }
    setBusyId(assignment.id);
    setNotice(null);
    const bitir = (mesaj: string, ok = true) => {
      setNotice({ ok, text: mesaj });
      setBusyId(null);
    };
    if (!live) {
      bitir("Demo modda kaydedildi — Supabase bağlandığında kalıcı olacak.");
      return;
    }
    const fd = new FormData();
    fd.append("assignmentId", assignment.id);
    fd.append("contactId", ogrenci.id);
    fd.append("file", secili.file);
    const n = notlar[assignment.id]?.trim();
    if (n) fd.append("note", n);
    fetch("/api/homework/photo", { method: "POST", body: fd })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          bitir(d.error ?? "Fotoğraf yüklenemedi", false);
          return;
        }
        if (d.persisted) {
          setDosyalar((prev) => {
            const { [assignment.id]: _silinecek, ...kalan } = prev;
            return kalan;
          });
          router.refresh();
          bitir("Ödev fotoğrafı teslim edildi — öğretmenin kontrolü bekleniyor.");
        } else {
          bitir("Demo modda kaydedildi — Supabase bağlandığında kalıcı olacak.");
        }
      })
      .catch(() => bitir("Sunucuya ulaşılamadı", false));
  };

  return (
    <PageShell>
      <PageHeader
        title="Ödevlerim"
        description="Ödevlerini buradan takip et; fotoğrafını çekip yüklediğinde öğretmenin kontrol eder."
        actions={
          <button
            className="flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low"
            type="button"
            onClick={() => onRolDegistir("ogretmen")}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Öğretmen Görünümü
          </button>
        }
      />

      {/* Öğrenci seçici — DEVİR NOTU: gerçek girişte kaldırılır, ogrenciId oturumdan gelir */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3">
        <span className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">face</span>
          Öğrenci:
        </span>
        <select
          className="h-9 flex-1 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 font-label-sm text-label-sm text-on-surface focus:outline-none sm:max-w-xs"
          onChange={(e) => sec(e.target.value)}
          value={ogrenciId ?? ""}
        >
          <option value="">Öğrenci seçin...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.studentName} ({s.grade || "—"})
            </option>
          ))}
        </select>
      </div>

      {notice ? (
        <p
          className={clsx(
            "flex items-center gap-2 rounded-lg px-3 py-2 font-label-sm text-label-sm",
            notice.ok
              ? "bg-secondary-container/50 text-on-secondary-container"
              : "bg-error-container/50 text-on-error-container"
          )}
          role="status"
        >
          <span className="material-symbols-outlined text-[16px]">
            {notice.ok ? "info" : "warning"}
          </span>
          {notice.text}
        </p>
      ) : null}

      {!ogrenci ? (
        <EmptyState
          description="Ödevlerini görmek için yukarıdan adını seç."
          icon="school"
          title="Öğrenci seçilmedi"
        />
      ) : odevler.length === 0 ? (
        <EmptyState
          description={`${ogrenci.studentName} için atanmış ödev görünmüyor. Sınıfına uygun ödev verildiğinde burada listelenir.`}
          icon="checklist"
          title="Ödev yok"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {odevler.map((assignment) => {
            const submission = submissionBy[`${assignment.id}:${ogrenci.id}`];
            const durum: HomeworkStatus | null = assignment.marks[ogrenci.id] ?? null;
            const dosya = dosyalar[assignment.id];
            return (
              <section
                key={assignment.id}
                className="flex flex-col gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-title-md text-title-md font-semibold text-on-surface">
                      {assignment.title}
                    </p>
                    <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                      {[assignment.subject, assignment.classLevel].filter(Boolean).join(" · ")}
                      {assignment.createdBy ? ` · Öğretmen: ${assignment.createdBy}` : ""}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">event</span>
                      Teslim: {formatTeslim(assignment.dueDate)}
                    </p>
                  </div>
                  {durum ? (
                    <span
                      className={clsx(
                        "shrink-0 rounded-full px-3 py-1 font-label-sm text-label-sm font-semibold",
                        STATUS_PILL[durum]
                      )}
                    >
                      Öğretmen işareti: {STATUS_LABEL[durum]}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
                      Kontrol edilmedi
                    </span>
                  )}
                </div>

                {assignment.description ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {assignment.description}
                  </p>
                ) : null}

                {submission?.photoPath ? (
                  <OgrenciTeslim
                    path={submission.photoPath}
                    note={submission.studentNote}
                    submittedAt={submission.submittedAt}
                    checkedAt={submission.checkedAt}
                  />
                ) : null}

                {/* Fotoğraf yükleme */}
                <div className="flex flex-col gap-2 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low/50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        photo_camera
                      </span>
                      {submission?.photoPath ? "Yeni fotoğraf seç" : "Fotoğraf Çek / Seç"}
                      <input
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        type="file"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setDosyalar((prev) => ({
                            ...prev,
                            [assignment.id]: { file: f, preview: URL.createObjectURL(f) },
                          }));
                        }}
                      />
                    </label>
                    <input
                      className="h-9 min-w-0 flex-1 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none"
                      onChange={(e) =>
                        setNotlar((prev) => ({ ...prev, [assignment.id]: e.target.value }))
                      }
                      placeholder="Kısa not (isteğe bağlı) — örn. 45 sorunun 42'sini çözdüm"
                      type="text"
                      value={notlar[assignment.id] ?? ""}
                    />
                    <button
                      className={clsx(
                        "flex h-9 items-center gap-1.5 rounded-lg bg-primary-container px-3 font-label-sm text-label-sm font-semibold text-on-primary transition-colors hover:bg-primary",
                        (busyId === assignment.id || !dosya) && "opacity-60"
                      )}
                      disabled={busyId === assignment.id || !dosya}
                      type="button"
                      onClick={() => yukle(assignment)}
                    >
                      <span
                        className={clsx(
                          "material-symbols-outlined text-[16px]",
                          busyId === assignment.id && "animate-spin"
                        )}
                      >
                        {busyId === assignment.id ? "refresh" : "upload"}
                      </span>
                      {busyId === assignment.id ? "Yükleniyor..." : "Teslim Et"}
                    </button>
                  </div>
                  {dosya ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Seçilen ödev fotoğrafı önizlemesi"
                        className="h-20 w-20 rounded-lg border border-outline-variant/50 object-cover"
                        src={dosya.preview}
                      />
                      <p className="font-label-xs text-label-xs text-on-surface-variant">
                        Seçildi: {dosya.file.name} — Teslim Et ile gönder
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

/** Öğrencinin kendi yüklediği teslimin küçük önizlemesi (imzalı URL ile). */
function OgrenciTeslim({
  path,
  note,
  submittedAt,
  checkedAt,
}: {
  path: string;
  note: string | null;
  submittedAt: string | null;
  checkedAt: string | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/homework/photo?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.ok) setUrl(d.url);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [path]);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-secondary/50 bg-secondary-container/30 p-3">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt="Yüklediğin ödev fotoğrafı"
          className="h-16 w-16 rounded-lg border border-outline-variant/50 object-cover"
          src={url}
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-surface-container">
          <span className="material-symbols-outlined animate-spin text-[18px] text-on-surface-variant">
            refresh
          </span>
        </div>
      )}
      <div className="min-w-0 font-body-sm text-body-sm text-on-surface-variant">
        <p className="flex items-center gap-1 font-label-sm text-label-sm font-semibold text-on-surface">
          <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
          Teslim edildi
          {submittedAt ? ` · ${formatTeslim(submittedAt)}` : ""}
        </p>
        {note ? <p className="truncate">Not: {note}</p> : null}
        {checkedAt ? <p>Öğretmen kontrolü: {formatTeslim(checkedAt)}</p> : null}
      </div>
    </div>
  );
}
