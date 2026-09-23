import { ExamSelector } from "@/components/pages/deneme-analizi/exam-selector";
import { ScrollToDetailButton } from "@/components/pages/deneme-analizi/call-buttons";
import { CallToast } from "@/components/pages/deneme-analizi/call-toast";
import { DenemeAnaliziView } from "@/components/pages/deneme-analizi/deneme-analizi-view";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import Link from "next/link";
import { examHeader } from "@/lib/mock/exams";
import { getLiveExamResults } from "@/lib/server/queries";
import { buildExamsView, pickHighlightView } from "@/lib/server/exams-map";

export const metadata = { title: "Deneme Analizi" };
// Sınav sonuçları canlı Supabase'den okunur; her istekte taze olmalı.
export const dynamic = "force-dynamic";

export default async function Page() {
  const live = await getLiveExamResults();
  const view = live ? buildExamsView(live.results, live.contacts) : null;
  // Canlı verideki en büyük net düşüşü detay kartına bağlanır; düşüş yoksa mock kalır.
  const highlight = live ? pickHighlightView(live.results, live.contacts) : null;

  // Sınav seçici: canlı verideki ayrı sınav adları (tek sınav varsa seçici gizlenir)
  const examNames = live
    ? [
        ...new Set(
          live.results
            .map((row) => row.exam_name)
            .filter((name): name is string => Boolean(name))
        ),
      ]
    : [];
  const exams = examNames.length > 0 ? examNames : [examHeader.activeExam.name];

  // Acil alarm sayısı canlı düşüş segmentinden; canlı veri yoksa mock metin kalır.
  const decliningCount = view?.segments.find(
    (segment) => segment.id === "dusus-alarmi"
  )?.count;
  const urgentStrong =
    decliningCount !== undefined ? `${decliningCount} öğrenci` : examHeader.urgent.strongText;

  return (
    <PageShell>
      <PageHeader
        title={examHeader.title}
        description="Segment bazlı öğrenci takibi, net trendleri ve AI veli arama aksiyonları tek ekranda."
        actions={
          <>
            {/* Raporlara gider */}
            <Link
              className="flex h-10 items-center gap-1 font-label-sm text-label-sm font-semibold text-primary transition-colors hover:text-primary-container"
              href="/raporlar"
            >
              <span>{examHeader.activeExam.linkLabel}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
            {/* Sınav seçici: birden fazla sınav varsa açılır menü */}
            <ExamSelector activeExam={examHeader.activeExam.name} exams={exams} />
          </>
        }
      />

      {/* Aktif sınav + acil alarm şeridi */}
      <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between">
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
            <strong className="font-bold text-error">{urgentStrong}</strong>{" "}
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

      {/* Segment kartları, detay paneli, öğrenci listesi ve toplu kampanya */}
      <DenemeAnaliziView highlight={highlight} view={view} />

      {/* AI görüşme durum toast'u */}
      <CallToast />
    </PageShell>
  );
}
