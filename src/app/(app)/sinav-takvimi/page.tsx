import { PageHeader, PageShell, Stat } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getLiveExamSchedule } from "@/lib/server/queries";
import type { ExamScheduleRow } from "@/lib/types/db";

export const metadata = { title: "Sınav Takvimi" };
export const dynamic = "force-dynamic";

const TYPE_BADGE: Record<ExamScheduleRow["exam_type"], string> = {
  TYT: "bg-secondary-container text-on-secondary-container",
  AYT: "bg-primary-fixed text-primary",
  LGS: "bg-tertiary-container text-on-tertiary-container",
  OKUL: "bg-surface-container text-on-surface-variant",
  DENEME: "bg-primary-container text-on-primary",
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (new Date(dateStr + "T00:00:00").getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );
}

export default async function Page() {
  const live = await getLiveExamSchedule();
  const rows = live ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = today.getTime();

  const upcoming = rows.filter(
    (r) => new Date(r.exam_date + "T00:00:00").getTime() >= startOfDay
  );
  const past = rows.length - upcoming.length;
  const thisMonth = upcoming.filter((r) => {
    const d = new Date(r.exam_date + "T00:00:00");
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;
  const merkezî = rows.filter((r) => r.dershane_id === null).length;

  return (
    <PageShell>
      <PageHeader
        title="Sınav Takvimi"
        description="Merkezî sınavlar ve kurum denemeleri — geri sayım ve hatırlatıcı planlaması."
      />

      {live ? (
        <div className="flex flex-col gap-6">
          <section className="grid grid-cols-3 divide-y divide-outline-variant/50 rounded-xl border border-outline-variant/60 bg-surface-container-lowest sm:divide-x sm:divide-y-0 divide-y">
            <div className="p-5">
              <Stat label="Bu ay" value={String(thisMonth)} valueTone="primary" hint="Planlı sınav" />
            </div>
            <div className="p-5">
              <Stat label="Yaklaşan" value={String(upcoming.length)} hint="Tüm dönem" />
            </div>
            <div className="p-5">
              <Stat label="Merkezî sınav" value={String(merkezî)} hint="TYT · AYT · LGS" />
            </div>
          </section>

          {upcoming.length === 0 ? (
            <EmptyState
              description="Takvimde yaklaşan sınav yok. Eklenen sınavlar burada otomatik görünür."
              icon="calendar_month"
              title="Yaklaşan sınav yok"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map((exam) => {
                const days = daysUntil(exam.exam_date);
                const date = new Date(exam.exam_date + "T00:00:00");
                return (
                  <div
                    key={exam.id}
                    className="flex items-center gap-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4"
                  >
                    <div className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-surface-container-low py-2">
                      <span className="font-headline-md text-headline-md font-bold text-on-surface">
                        {date.getDate()}
                      </span>
                      <span className="font-label-xs text-label-xs uppercase text-on-surface-variant">
                        {date.toLocaleDateString("tr-TR", { month: "short" })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">
                          {exam.name}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 font-label-xs text-label-xs font-semibold ${TYPE_BADGE[exam.exam_type]}`}>
                          {exam.exam_type}
                        </span>
                        {exam.is_estimated ? (
                          <span className="rounded bg-surface-container px-1.5 py-0.5 font-label-xs text-label-xs text-on-surface-variant">
                            tahmini
                          </span>
                        ) : null}
                      </div>
                      {exam.notes ? (
                        <p className="mt-0.5 truncate font-body-sm text-body-sm text-on-surface-variant">
                          {exam.notes}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 font-label-sm text-label-sm font-bold ${
                        days === 0
                          ? "bg-error-container text-on-error-container"
                          : days <= 30
                            ? "bg-tertiary-container text-on-tertiary-container"
                            : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {days === 0 ? "Bugün!" : `${days} gün`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Geçmiş {past} sınav kaydı arşivde.
          </p>
        </div>
      ) : (
        <EmptyState
          description="Sınav takvimi Supabase'de tutulur; bağlantı sağlandığında burada görünür."
          icon="calendar_month"
          title="Takvim için veritabanı bağlantısı gerekli"
        />
      )}
    </PageShell>
  );
}
