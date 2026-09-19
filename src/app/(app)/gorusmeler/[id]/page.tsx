import { AudioPlayer } from "@/components/pages/gorusme-detay/audio-player";
import { CallDetailTabs } from "@/components/pages/gorusme-detay/call-detail-tabs";
import { CallSummaryCard } from "@/components/pages/gorusme-detay/call-summary-card";
import { getCallById } from "@/lib/mock/calls";

export const metadata = { title: "Görüşme Detayı" };

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const call = getCallById(id);

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex w-full flex-col gap-space-md px-gutter-mobile pb-space-xl pt-space-md">
        {/* Veli & çağrı özeti */}
        <CallSummaryCard summary={call.summary} />

        {/* Ses oynatıcı */}
        <AudioPlayer audio={call.audio} />

        {/* Sekmeler + paneller */}
        <CallDetailTabs
          transcript={call.transcript}
          transcriptMeta={call.transcriptMeta}
          signals={call.signals}
          automation={call.automation}
          noteBox={call.noteBox}
        />
      </div>
    </div>
  );
}
