"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "@/lib/clsx";
import { PageHeader, PageShell, SectionCard } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { OgrenciView } from "@/components/pages/odevler/ogrenci-view";
import type { HomeworkStatus } from "@/lib/types/db";

export interface HomeworkStudent {
  id: string;
  studentName: string;
  parentName: string;
  grade: string;
  phone: string;
}

export interface HomeworkAssignmentVM {
  id: string;
  title: string;
  subject: string | null;
  classLevel: string | null;
  dueDate: string;
  description: string | null;
  createdBy: string | null;
  /** contact_id → done | partial | missing */
  marks: Record<string, HomeworkStatus>;
}

/** Öğrenci teslim/kontrol bilgisi (canlı veride dolu) */
export interface HomeworkSubmissionVM {
  assignmentId: string;
  contactId: string;
  photoPath: string | null;
  studentNote: string | null;
  submittedAt: string | null;
  checkedAt: string | null;
}

export type OdevRol = "ogretmen" | "ogrenci";

const STATUS_LABEL: Record<HomeworkStatus, string> = {
  done: "Yapıldı",
  partial: "Yarım",
  missing: "Yapılmadı",
};

const STATUS_BTN: Record<HomeworkStatus, string> = {
  done: "bg-secondary-container text-on-secondary-container font-semibold border-secondary",
  partial: "bg-tertiary-container text-on-tertiary-container font-semibold border-tertiary",
  missing: "bg-error-container text-on-error-container font-semibold border-error",
};

const DT_FMT = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const D_FMT = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/**
 * Teslim gösterimi — saat boş bırakıldıysa ödev gün sonu (23:59) olarak
 * kaydedilir ve arayüzde yalnız tarih gösterilir.
 */
export function formatTeslim(iso: string): string {
  const d = new Date(iso);
  return d.getHours() === 23 && d.getMinutes() === 59 ? D_FMT.format(d) : DT_FMT.format(d);
}

function trLower(s: string): string {
  return s.toLocaleLowerCase("tr-TR").trim();
}

const TUM_SINIFLAR = "tüm sınıflar";

/** Ödevin sınıfı ile öğrencinin sınıfı eşleşiyor mu ("Tüm Sınıflar" herkese açık). */
export function sinifEslesir(classLevel: string | null, studentGrade: string): boolean {
  if (!classLevel || trLower(classLevel) === TUM_SINIFLAR) return true;
  return trLower(studentGrade).includes(trLower(classLevel));
}

/** wa.me derin bağlantısı — ödevi yapmayan öğrencinin velisine hazır mesaj (Netgsm gerekmez). */
function waLink(
  phone: string,
  studentName: string,
  assignmentTitle: string,
  dueLabel: string
): string {
  const digits = (phone.match(/\d/g) ?? []).join("");
  const full = digits.startsWith("90") ? digits : `90${digits.replace(/^0/, "")}`;
  const msg = encodeURIComponent(
    `Merhaba, "${assignmentTitle}" ödevini ${studentName} için teslim tarihi (${dueLabel}) geçmiş/kapanmak üzere olmasına rağmen tamamlanmamıştır. Destek olmanızı rica ederiz.`
  );
  return `https://wa.me/${full}?text=${msg}`;
}

const INPUT_CLS =
  "h-10 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:outline-none";

export function OdevlerView({
  assignments,
  students,
  submissions,
  live,
  sourceLabel,
}: {
  assignments: HomeworkAssignmentVM[];
  students: HomeworkStudent[];
  submissions: HomeworkSubmissionVM[];
  live: boolean;
  sourceLabel?: string;
}) {
  const router = useRouter();

  // ── Rol anahtarı — DEVİR NOTU: şimdilik kozmetik; gerçek rol sistemi
  // bağlandığında burası oturum rolünden türetilecek (tek nokta).
  const [rol, setRol] = useState<OdevRol>("ogretmen");
  useEffect(() => {
    let alive = true;
    void Promise.resolve().then(() => {
      if (alive && localStorage.getItem("educallai-odev-rolu") === "ogrenci") setRol("ogrenci");
    });
    return () => {
      alive = false;
    };
  }, []);
  const rolDegistir = (r: OdevRol) => {
    setRol(r);
    localStorage.setItem("educallai-odev-rolu", r);
  };

  // Demo modda sunucuya kalıcı yazılamaz: yerel kopyalarla optimistik davran
  const [localAssignments, setLocalAssignments] = useState<HomeworkAssignmentVM[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const allAssignments = [...localAssignments, ...assignments].filter(
    (a) => !deletedIds.includes(a.id)
  );

  // ── Sınıf filtresi (öğretmen görünümü) ─────────────────────────
  const siniflar = Array.from(
    new Set(allAssignments.map((a) => a.classLevel?.trim()).filter(Boolean) as string[])
  );
  const [sinifFiltre, setSinifFiltre] = useState<string | null>(null);
  const gosterilenOdevler = sinifFiltre
    ? allAssignments.filter((a) => sinifEslesir(a.classLevel, sinifFiltre))
    : allAssignments;
  // Sınıf seçiliyken o sınıfın öğrencileri (grade metni sınıf adını içermeli)
  const gosterilenOgrenciler = sinifFiltre
    ? students.filter((s) => sinifEslesir(sinifFiltre, s.grade))
    : students;

  const [selectedId, setSelectedId] = useState<string | null>(assignments[0]?.id ?? null);
  const selected =
    gosterilenOdevler.find((a) => a.id === selectedId) ?? gosterilenOdevler[0] ?? null;

  // assignment_id → contact_id → status
  const [marksBy, setMarksBy] = useState<Record<string, Record<string, HomeworkStatus>>>(
    Object.fromEntries(assignments.map((a) => [a.id, a.marks]))
  );
  const marks = selected ? marksBy[selected.id] ?? {} : {};

  // submission index: `${assignmentId}:${contactId}` → teslim bilgisi
  const submissionBy: Record<string, HomeworkSubmissionVM> = Object.fromEntries(
    submissions.map((s) => [`${s.assignmentId}:${s.contactId}`, s])
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  // ── Yeni ödev formu ────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [teacher, setTeacher] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Mevcut ödevlerden öğretmen önerileri
  const ogretmenler = Array.from(
    new Set(allAssignments.map((a) => a.createdBy?.trim()).filter(Boolean) as string[])
  );

  const setStatus = (studentId: string, status: HomeworkStatus) => {
    if (!selected) return;
    setMarksBy((prev) => {
      const aMarks = { ...(prev[selected.id] ?? {}) };
      if (aMarks[studentId] === status) delete aMarks[studentId];
      else aMarks[studentId] = status;
      return { ...prev, [selected.id]: aMarks };
    });
  };

  const saveMarks = () => {
    if (saving || !selected) return;
    if (Object.keys(marks).length === 0) {
      setNote({ ok: false, text: "Önce en az bir öğrenci işaretleyin." });
      return;
    }
    setSaving(true);
    setNote(null);
    fetch("/api/homework/marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: selected.id,
        entries: Object.entries(marks).map(([contactId, status]) => ({ contactId, status })),
        markedBy: teacher.trim() || "Panel",
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setNote({ ok: false, text: d.error ?? "Ödev durumu kaydedilemedi" });
        } else {
          setNote({
            ok: true,
            text: d.persisted
              ? `Ödev durumu kaydedildi (${d.saved} öğrenci, ${d.missing} yapmadı).`
              : "Demo modda kaydedildi — Supabase bağlandığında kalıcı olacak.",
          });
        }
      })
      .catch(() => setNote({ ok: false, text: "Sunucuya ulaşılamadı" }))
      .finally(() => setSaving(false));
  };

  const createAssignment = () => {
    if (creating) return;
    if (!title.trim() || !dueDate) {
      setFormError("Başlık ve teslim tarihi zorunlu.");
      return;
    }
    setCreating(true);
    setFormError(null);
    const localDue = dueTime ? `${dueDate}T${dueTime}:00` : `${dueDate}T23:59:00`;
    fetch("/api/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        subject,
        classLevel,
        dueDate: localDue,
        description,
        createdBy: teacher,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setFormError(d.error ?? "Ödev oluşturulamadı");
          setCreating(false);
          return;
        }
        if (d.persisted) {
          setCreating(false);
          setFormOpen(false);
          setTitle("");
          setSubject("");
          setClassLevel("");
          setTeacher("");
          setDueDate("");
          setDueTime("");
          setDescription("");
          router.refresh();
        } else {
          // Demo mod: kalıcı değil ama listeye yerel olarak ekle
          const local: HomeworkAssignmentVM = {
            id: `demo-${Date.now()}`,
            title: title.trim(),
            subject: subject.trim() || null,
            classLevel: classLevel.trim() || null,
            dueDate: localDue,
            description: description.trim() || null,
            createdBy: teacher.trim() || "Panel",
            marks: {},
          };
          setLocalAssignments((prev) => [local, ...prev]);
          setSelectedId(local.id);
          setNote({
            ok: true,
            text: "Demo modda oluşturuldu — Supabase bağlandığında kalıcı olacak.",
          });
          setFormOpen(false);
          setCreating(false);
          setTitle("");
          setSubject("");
          setClassLevel("");
          setTeacher("");
          setDueDate("");
          setDueTime("");
          setDescription("");
        }
      })
      .catch(() => {
        setFormError("Sunucuya ulaşılamadı");
        setCreating(false);
      });
  };

  const deleteAssignment = () => {
    if (deleting || !selected) return;
    if (!window.confirm(`"${selected.title}" ödevi ve tüm işaretleri silinsin mi?`)) return;
    setDeleting(true);
    setNote(null);
    fetch(`/api/homework?id=${encodeURIComponent(selected.id)}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setNote({ ok: false, text: d.error ?? "Ödev silinemedi" });
        } else if (d.persisted) {
          router.refresh();
        } else {
          // Demo mod: kalıcı değil, listeden yerel olarak çıkar
          setDeletedIds((prev) => [...prev, selected.id]);
          setNote({
            ok: true,
            text: "Demo modda silindi — Supabase bağlandığında kalıcı olacak.",
          });
        }
        setSelectedId(null);
      })
      .catch(() => setNote({ ok: false, text: "Sunucuya ulaşılamadı" }))
      .finally(() => setDeleting(false));
  };

  // ── Fotoğraf önizleme (öğretmen tarafı) ────────────────────────
  const [photoPreview, setPhotoPreview] = useState<{
    studentName: string;
    path: string;
    note: string | null;
    submittedAt: string | null;
  } | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const acOdev = selected;

  const fotoAc = (studentName: string, path: string, note: string | null, submittedAt: string | null) => {
    setPhotoPreview({ studentName, path, note, submittedAt });
    setPhotoUrl(null);
    fetch(`/api/homework/photo?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setPhotoUrl(d.url);
        else setPhotoUrl(null);
      })
      .catch(() => setPhotoUrl(null));
  };

  // ── ÖĞRENCİ GÖRÜNÜMÜ ───────────────────────────────────────────
  if (rol === "ogrenci") {
    return (
      <OgrenciView
        students={students}
        assignments={allAssignments}
        submissions={submissions}
        live={live}
        onRolDegistir={rolDegistir}
      />
    );
  }

  const doneCount = gosterilenOgrenciler.filter((s) => marks[s.id] === "done").length;
  const partialCount = gosterilenOgrenciler.filter((s) => marks[s.id] === "partial").length;
  const missing = gosterilenOgrenciler.filter((s) => marks[s.id] === "missing");

  return (
    <PageShell>
      <PageHeader
        title="Ödev Takibi"
        description="Ödev ata, teslim durumunu işaretle, yapmayanların velilerini tek tıkla bilgilendir."
        actions={
          <div className="flex items-center gap-2">
            {/* DEVİR NOTU: rol anahtarı kozmetik — gerçek rol oturumdan alınacak */}
            <div className="flex overflow-hidden rounded-xl border border-outline-variant/60">
              <button
                className="flex h-10 items-center gap-1.5 bg-primary-container px-3 font-label-md text-label-md font-semibold text-on-primary-container transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                Öğretmen
              </button>
              {/* Erken dönüş nedeniyle bu dalda rol her zaman öğretmendir;
                  öğrenci görünümüne geçiş butonu pasif stildedir. */}
              <button
                className="flex h-10 items-center gap-1.5 bg-surface-container-lowest px-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low"
                type="button"
                onClick={() => rolDegistir("ogrenci")}
              >
                <span className="material-symbols-outlined text-[18px]">school</span>
                Öğrenci
              </button>
            </div>
            <button
              className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-container px-4 font-label-md text-label-md font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.98]"
              type="button"
              onClick={() => setFormOpen((v) => !v)}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Yeni Ödev
            </button>
          </div>
        }
      />

      {sourceLabel ? (
        <p className="-mt-2 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
          {sourceLabel}
        </p>
      ) : null}

      {note ? (
        <p
          className={clsx(
            "-mt-2 flex items-center gap-2 rounded-lg px-3 py-2 font-label-sm text-label-sm",
            note.ok
              ? "bg-secondary-container/50 text-on-secondary-container"
              : "bg-error-container/50 text-on-error-container"
          )}
          role="status"
        >
          <span className="material-symbols-outlined text-[16px]">
            {note.ok ? "info" : "warning"}
          </span>
          {note.text}
          <button
            className="ml-auto rounded p-0.5 hover:bg-surface-container"
            type="button"
            onClick={() => setNote(null)}
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </p>
      ) : null}

      {formOpen ? (
        <SectionCard title="Yeni Ödev" bodyClassName="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Başlık</span>
              <input
                className={INPUT_CLS}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="örn. TYT Matematik — Sayfa 42-58"
                type="text"
                value={title}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Ders</span>
              <input
                className={INPUT_CLS}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="örn. Matematik"
                type="text"
                value={subject}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Öğretmen</span>
              <input
                className={INPUT_CLS}
                list="odev-ogretmenler"
                onChange={(e) => setTeacher(e.target.value)}
                placeholder="örn. Merve Hoca"
                type="text"
                value={teacher}
              />
              <datalist id="odev-ogretmenler">
                {ogretmenler.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Sınıf</span>
              <input
                className={INPUT_CLS}
                list="odev-siniflar"
                onChange={(e) => setClassLevel(e.target.value)}
                placeholder="örn. 12. Sınıf"
                type="text"
                value={classLevel}
              />
              <datalist id="odev-siniflar">
                {siniflar.map((s) => (
                  <option key={s} value={s} />
                ))}
                <option value="Tüm Sınıflar" />
              </datalist>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant">Teslim Tarihi</span>
                <input
                  className={INPUT_CLS}
                  onChange={(e) => setDueDate(e.target.value)}
                  type="date"
                  value={dueDate}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-label-xs text-label-xs text-on-surface-variant">Saat (isteğe bağlı)</span>
                <input
                  className={INPUT_CLS}
                  onChange={(e) => setDueTime(e.target.value)}
                  type="time"
                  value={dueTime}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-label-xs text-label-xs text-on-surface-variant">Açıklama (isteğe bağlı)</span>
              <textarea
                className="min-h-16 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 font-body-sm text-body-sm text-on-surface focus:outline-none"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ödev kapsamı, kaynak, uyarılar..."
                value={description}
              />
            </label>
          </div>
          {formError ? (
            <p className="mt-2 font-label-sm text-label-sm font-semibold text-error" role="alert">
              {formError}
            </p>
          ) : null}
          <button
            className={clsx(
              "mt-3 flex h-10 items-center gap-2 rounded-xl bg-primary-container px-5 font-label-md text-label-md font-semibold text-on-primary hover:bg-primary",
              creating && "opacity-60"
            )}
            disabled={creating}
            type="button"
            onClick={createAssignment}
          >
            <span className={clsx("material-symbols-outlined text-[16px]", creating && "animate-spin")}>
              {creating ? "refresh" : "assignment"}
            </span>
            Ödevi Oluştur
          </button>
        </SectionCard>
      ) : null}

      {allAssignments.length === 0 || students.length === 0 ? (
        <EmptyState
          description="Ödev atamak için öğrenci kaydı gerekli. Öğrenciler Supabase'de tutulur; canlı bağlantıda ödevleriniz burada listelenir."
          icon="checklist"
          title="Ödev kaydı yok"
        />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Sınıf filtresi */}
          {siniflar.length > 0 ? (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
              <button
                className={clsx(
                  "flex h-8 shrink-0 items-center rounded-full border px-3 font-label-sm text-label-sm transition-colors",
                  sinifFiltre === null
                    ? "border-primary bg-primary-fixed/40 font-semibold text-on-surface"
                    : "border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                )}
                type="button"
                onClick={() => setSinifFiltre(null)}
              >
                Tümü
              </button>
              {siniflar.map((s) => (
                <button
                  key={s}
                  className={clsx(
                    "flex h-8 shrink-0 items-center rounded-full border px-3 font-label-sm text-label-sm transition-colors",
                    sinifFiltre === s
                      ? "border-primary bg-primary-fixed/40 font-semibold text-on-surface"
                      : "border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                  )}
                  type="button"
                  onClick={() => setSinifFiltre(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          {/* Ödev seçici */}
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
            {gosterilenOdevler.map((assignment) => {
              const active = assignment.id === selected?.id;
              return (
                <button
                  key={assignment.id}
                  className={clsx(
                    "flex shrink-0 flex-col items-start gap-0.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                    active
                      ? "border-primary bg-primary-fixed/40"
                      : "border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low"
                  )}
                  type="button"
                  onClick={() => setSelectedId(assignment.id)}
                >
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface">
                    {assignment.title}
                  </span>
                  <span className="font-label-xs text-label-xs text-on-surface-variant">
                    {[assignment.subject, assignment.classLevel].filter(Boolean).join(" · ") ||
                      "—"}{" "}
                    · {formatTeslim(assignment.dueDate)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Özet şeridi */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              {selected?.title ?? "Ödev seçin"}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {selected ? `Teslim: ${formatTeslim(selected.dueDate)}` : ""}
              {selected?.createdBy ? ` · Öğretmen: ${selected.createdBy}` : ""}
              {sinifFiltre ? ` · Sınıf: ${sinifFiltre}` : ""}
            </span>
            <span className="ml-auto flex items-center gap-2 font-label-sm text-label-sm">
              <span className="rounded-full bg-secondary-container px-2.5 py-1 font-semibold text-on-secondary-container">
                Yapıldı: {doneCount}
              </span>
              <span className="rounded-full bg-tertiary-container px-2.5 py-1 font-semibold text-on-tertiary-container">
                Yarım: {partialCount}
              </span>
              <span className="rounded-full bg-error-container px-2.5 py-1 font-semibold text-on-error-container">
                Yapılmadı: {missing.length}
              </span>
              <button
                className={clsx(
                  "flex h-8 items-center gap-1 rounded-lg border border-outline-variant/60 px-2.5 font-label-xs text-label-xs text-on-surface-variant transition-colors hover:border-error hover:bg-error-container/40 hover:text-error",
                  deleting && "opacity-60"
                )}
                disabled={deleting}
                type="button"
                onClick={deleteAssignment}
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                Ödevi Sil
              </button>
            </span>
          </div>

          {selected?.description ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {selected.description}
            </p>
          ) : null}

          {/* Öğrenci grid'i */}
          {gosterilenOgrenciler.length === 0 ? (
            <EmptyState
              description={`"${sinifFiltre}" sınıfına kayıtlı öğrenci görünmüyor. Öğrenci kayıtlarının sınıf bilgilerini kontrol edin.`}
              icon="group_off"
              title="Bu sınıfta öğrenci yok"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {gosterilenOgrenciler.map((student) => {
                const current = marks[student.id];
                const submission = selected
                  ? submissionBy[`${selected.id}:${student.id}`]
                  : undefined;
                return (
                  <div
                    key={student.id}
                    className="flex flex-col gap-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-label-md text-label-md font-semibold text-on-surface">
                        {student.studentName}
                      </p>
                      <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                        {student.grade || "—"} · Veli: {student.parentName}
                      </p>
                    </div>
                    {submission?.photoPath ? (
                      <button
                        className="flex h-8 items-center gap-1.5 self-start rounded-lg border border-secondary/60 bg-secondary-container/40 px-2.5 font-label-xs text-label-xs font-semibold text-on-secondary-container transition-colors hover:bg-secondary-container"
                        type="button"
                        onClick={() =>
                          fotoAc(
                            student.studentName,
                            submission.photoPath!,
                            submission.studentNote,
                            submission.submittedAt
                          )
                        }
                      >
                        <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                        Fotoğraf geldi
                        {submission.submittedAt
                          ? ` · ${formatTeslim(submission.submittedAt)}`
                          : ""}
                      </button>
                    ) : null}
                    <div className="grid grid-cols-3 gap-1.5">
                      {(Object.keys(STATUS_LABEL) as HomeworkStatus[]).map((status) => (
                        <button
                          key={status}
                          className={clsx(
                            "flex h-9 items-center justify-center rounded-lg border font-label-xs text-label-xs transition-colors",
                            current === status
                              ? STATUS_BTN[status]
                              : "border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                          )}
                          type="button"
                          onClick={() => setStatus(student.id, status)}
                        >
                          {STATUS_LABEL[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Kaydet */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              className={clsx(
                "flex h-11 items-center gap-2 rounded-xl bg-primary-container px-6 font-title-sm text-title-sm font-semibold text-on-primary transition-all hover:bg-primary",
                saving && "opacity-60"
              )}
              disabled={saving}
              type="button"
              onClick={saveMarks}
            >
              <span className={clsx("material-symbols-outlined text-[18px]", saving && "animate-spin")}>
                {saving ? "refresh" : "save"}
              </span>
              {saving ? "Kaydediliyor..." : "Ödev Durumlarını Kaydet"}
            </button>
            {!live ? (
              <span className="font-label-xs text-label-xs text-outline">Demo mod</span>
            ) : null}
          </div>

          {/* Veli bildirim kuyruğu */}
          {missing.length > 0 ? (
            <div className="rounded-2xl border border-error/40 bg-error-container/30 p-5">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Velileri bilgilendir ({missing.length})
              </h3>
              <p className="mb-3 mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                Yapılmadı işaretlenen öğrencilerin velilerine hazır mesajla WhatsApp bildirimi açın.
              </p>
              <div className="flex flex-wrap gap-2">
                {missing.map((student) => (
                  <a
                    key={student.id}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
                    href={waLink(
                      student.phone,
                      student.studentName,
                      selected?.title ?? "ödev",
                      selected ? formatTeslim(selected.dueDate) : ""
                    )}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      chat
                    </span>
                    {student.parentName}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Fotoğraf önizleme katmanı */}
      {photoPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-label="Ödev fotoğrafı önizleme"
          onClick={() => setPhotoPreview(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                {photoPreview.studentName}
                {acOdev ? ` — ${acOdev.title}` : ""}
              </h3>
              <button
                aria-label="Önizlemeyi kapat"
                className="rounded p-1 hover:bg-surface-container"
                type="button"
                onClick={() => setPhotoPreview(null)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {photoPreview.submittedAt
                ? `Teslim: ${formatTeslim(photoPreview.submittedAt)}`
                : "Teslim bilgisi yok"}
              {photoPreview.note ? ` · Not: ${photoPreview.note}` : ""}
            </p>
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${photoPreview.studentName} ödev fotoğrafı`}
                className="w-full rounded-xl border border-outline-variant/50"
                src={photoUrl}
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-outline-variant/50 bg-surface-container-low">
                <span className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                  Fotoğraf açılıyor...
                </span>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
