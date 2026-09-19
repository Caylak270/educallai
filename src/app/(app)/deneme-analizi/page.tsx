import { BatchBanner } from "@/components/pages/deneme-analizi/batch-banner";
import { ScrollToDetailButton } from "@/components/pages/deneme-analizi/call-buttons";
import { CallToast } from "@/components/pages/deneme-analizi/call-toast";
import { SegmentStrip } from "@/components/pages/deneme-analizi/segment-strip";
import { StudentDetailCard } from "@/components/pages/deneme-analizi/student-detail-card";
import { StudentRoster } from "@/components/pages/deneme-analizi/student-roster";
import { examHeader } from "@/lib/mock/exams";

export const metadata = { title: "Deneme Analizi" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex w-full flex-col space-y-5 px-space-md pb-10 pt-2">
        {/* Alt başlık ve kurum filtre bağlamı */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-label-xs text-label-xs font-bold uppercase tracking-wider text-primary">
                {examHeader.eyebrow}
              </span>
              <h1 className="font-headline-lg text-headline-lg font-extrabold tracking-tight text-on-surface">
                {examHeader.title}
              </h1>
            </div>
            <button
              className="flex items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1.5 font-label-sm text-label-sm text-on-surface shadow-sm transition-colors hover:bg-surface-variant"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
              <span>{examHeader.filterLabel}</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
          </div>

          {/* Aktif sınav çubuğu ve AI alarm hapı */}
          <div className="flex flex-col gap-2 rounded-2xl bg-surface-container-lowest p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-fixed font-bold text-primary">
                  <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm font-bold leading-tight text-on-surface">
                    {examHeader.activeExam.name}
                  </span>
                  <span className="font-label-xs text-label-xs text-on-surface-variant">
                    {examHeader.activeExam.meta}
                  </span>
                </div>
              </div>
              <button
                className="flex items-center gap-0.5 font-label-sm text-label-sm font-semibold text-primary hover:text-primary-container"
                type="button"
              >
                <span>{examHeader.activeExam.linkLabel}</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            {/* Acil aksiyon callout'u */}
            <div className="flex items-center justify-between rounded-xl bg-error-container p-2.5 text-on-error-container">
              <div className="flex min-w-0 items-center gap-2">
                <span className="material-symbols-outlined shrink-0 animate-pulse text-[20px] text-error">
                  crisis_alert
                </span>
                <p className="truncate font-label-xs text-label-xs font-medium">
                  <strong className="font-bold">{examHeader.urgent.strongText}</strong>{" "}
                  {examHeader.urgent.text}
                </p>
              </div>
              <ScrollToDetailButton
                className="ml-2 shrink-0 rounded-lg bg-surface-container-lowest px-2.5 py-1 font-label-xs text-label-xs font-bold text-error shadow-xs"
                targetId="studentDetailCard"
              >
                {examHeader.urgent.ctaLabel}
              </ScrollToDetailButton>
            </div>
          </div>
        </div>

        {/* Segment yatay şeridi */}
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
    </div>
  );
}
