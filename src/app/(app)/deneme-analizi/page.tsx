import { BatchBanner } from "@/components/pages/deneme-analizi/batch-banner";
import { ScrollToDetailButton } from "@/components/pages/deneme-analizi/call-buttons";
import { CallToast } from "@/components/pages/deneme-analizi/call-toast";
import { SegmentStrip } from "@/components/pages/deneme-analizi/segment-strip";
import { StudentDetailCard } from "@/components/pages/deneme-analizi/student-detail-card";
import { StudentRoster } from "@/components/pages/deneme-analizi/student-roster";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { examHeader } from "@/lib/mock/exams";

export const metadata = { title: "Deneme Analizi" };

export default function Page() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Akademik Takip"
        title={examHeader.title}
        description="Segment bazlı öğrenci takibi, net trendleri ve AI veli arama aksiyonları tek ekranda."
        actions={
          <>
            <button
              className="flex h-10 items-center gap-1 font-label-sm text-label-sm font-semibold text-primary transition-colors hover:text-primary-container"
              type="button"
            >
              <span>{examHeader.activeExam.linkLabel}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
            {/* Sınav seçici dropdown */}
            <button
              className="flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3.5 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
              <span>{examHeader.filterLabel}</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
            </button>
          </>
        }
      />

      <div className="flex flex-col gap-6">
        {/* Aktif sınav + acil alarm şeridi */}
        <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
            </div>
            <div className="min-w-0">
              <p className="font-label-md text-label-md font-bold leading-tight text-on-surface">
                {examHeader.activeExam.name}
              </p>
              <p className="truncate font-label-xs text-label-xs text-on-surface-variant">
                {examHeader.activeExam.meta}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:justify-end">
            <p className="min-w-0 font-label-xs text-label-xs font-medium leading-relaxed text-on-surface-variant sm:text-right">
              <span className="material-symbols-outlined mr-1 inline-block align-[-3px] text-[16px] text-error">
                crisis_alert
              </span>
              <strong className="font-bold text-error">{examHeader.urgent.strongText}</strong>{" "}
              {examHeader.urgent.text}
            </p>
            <ScrollToDetailButton
              className="shrink-0 rounded-lg bg-error-container px-3 py-1.5 font-label-xs text-label-xs font-bold text-error transition-colors hover:bg-error hover:text-on-error"
              targetId="studentDetailCard"
            >
              {examHeader.urgent.ctaLabel}
            </ScrollToDetailButton>
          </div>
        </div>

        {/* Segment kartları */}
        <SegmentStrip />

        {/* Vurgulanan öğrenci detay paneli */}
        <StudentDetailCard />

        {/* Öğrenci trend listesi */}
        <StudentRoster />

        {/* Toplu kampanya şeridi */}
        <BatchBanner />
      </div>

      {/* AI görüşme durum toast'u */}
      <CallToast />
    </PageShell>
  );
}
