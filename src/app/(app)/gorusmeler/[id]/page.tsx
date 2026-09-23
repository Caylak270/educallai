import { notFound } from "next/navigation";
import { AudioPlayer } from "@/components/pages/gorusme-detay/audio-player";
import { CallDetailTabs } from "@/components/pages/gorusme-detay/call-detail-tabs";
import { CallSummaryCard } from "@/components/pages/gorusme-detay/call-summary-card";
import { RecallButton } from "@/components/pages/gorusme-detay/recall-button";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { getCallById } from "@/lib/mock/calls";
import { getLiveCallDetail } from "@/lib/server/queries";

export const metadata = { title: "Görüşme Detayı" };
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Önce canlı Supabase kaydı; bulunamazsa bilinen demo id'ler örnek kayda düşer,
  // aksi hâlde (silinmiş/yabancı id) 404.
  const liveCall = await getLiveCallDetail(id);
  const mockCall = liveCall ? null : getCallById(id);
  if (!liveCall && !mockCall) notFound();
  const call = liveCall ?? mockCall!;
  const isLive = Boolean(liveCall);
  const { summary } = call;

  return (
    <PageShell>
      <PageHeader
        title={`${summary.parentName} · ${summary.studentName}`}
        description={[
          summary.classTag,
          summary.programTag,
          summary.phone,
          summary.duration,
          summary.callTime,
        ].join(" · ")}
        actions={
          <>
            {/* Kaynak rozeti: canlı / demo */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 font-label-sm text-label-sm text-on-surface-variant">
              <span
                className={
                  isLive
                    ? "h-1.5 w-1.5 rounded-full bg-tertiary"
                    : "h-1.5 w-1.5 rounded-full bg-outline"
                }
              />
              {isLive ? "Supabase canlı veri" : "Demo veri"}
            </span>
            {/* Kanal badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed px-3 py-1.5 font-label-sm text-label-sm font-semibold text-on-secondary-fixed">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              {summary.directionPill}
            </span>
            {/* Durum badge */}
            <span className="hidden items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1.5 font-label-sm text-label-sm font-semibold text-primary md:inline-flex">
              <span className="material-symbols-outlined text-[16px]">
                verified
              </span>
              {summary.outcomePill}
            </span>
            {/* Sesli aramayı tekrarla (POST /api/calls) */}
            <RecallButton name={summary.parentName} phone={summary.phone} />
          </>
        }
      />

      {/* PC'de iki panel: sol özet + oynatıcı (sabit), sağ sekmeli içerik */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* SOL: veli & çağrı özeti + ses oynatıcı */}
        <div className="flex flex-col gap-6 lg:col-span-5 lg:sticky lg:top-20">
          <CallSummaryCard summary={summary} />
          <AudioPlayer audio={call.audio} />
        </div>

        {/* SAĞ: sekmeler + panel içeriği */}
        <div className="min-w-0 lg:col-span-7">
          <CallDetailTabs
            transcript={call.transcript}
            transcriptMeta={call.transcriptMeta}
            signals={call.signals}
            automation={call.automation}
            noteBox={call.noteBox}
            contactId={call.contactId ?? null}
            callId={call.id}
          />
        </div>
      </div>
    </PageShell>
  );
}
