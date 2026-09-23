import Link from "next/link";
import type { ExamScheduleRow } from "@/lib/types/db";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (new Date(dateStr + "T00:00:00").getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );
}

/** Dashboard geri sayım kartı — bir sonraki yaklaşan sınav. */
export function ExamCountdown({ exams }: { exams: ExamScheduleRow[] | null }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = (exams ?? [])
    .filter((e) => new Date(e.exam_date + "T00:00:00").getTime() >= today.getTime())
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  const next = upcoming[0];
  if (!next) return null;

  const days = daysUntil(next.exam_date);
  let cd: { text: string; cls: string };
  if (days === 0) cd = { text: "Bugün!", cls: "bg-error-container text-on-error-container" };
  else if (days <= 30) cd = { text: `${days} gün kaldı`, cls: "bg-tertiary-container text-on-tertiary-container" };
  else cd = { text: `${days} gün`, cls: "bg-surface-container text-on-surface-variant" };

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary">
        <span className="material-symbols-outlined text-[24px]">timer</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Sıradaki sınav
        </p>
        <p className="truncate font-headline-sm text-headline-sm font-semibold text-on-surface">
          {next.name}
          {next.is_estimated ? (
            <span className="ml-2 rounded bg-surface-container px-1.5 py-0.5 font-label-xs text-label-xs font-normal text-on-surface-variant">
              tahmini tarih
            </span>
          ) : null}
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {new Date(next.exam_date + "T00:00:00").toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            weekday: "long",
          })}
        </p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 font-label-sm text-label-sm font-bold ${cd.cls}`}
      >
        {cd.text}
      </span>
      <Link
        className="flex h-9 items-center gap-1 rounded-lg bg-surface-container px-3 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
        href="/sinav-takvimi"
      >
        Tüm Takvim
        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
      </Link>
    </div>
  );
}
