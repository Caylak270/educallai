import { batchBanner } from "@/lib/mock/exams";
import { AiCallToastButton } from "./call-buttons";

/** Toplu kampanya başlatma şeridi (tasarımda listenin sonunda, normal akışta). */
export function BatchBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[22px] text-primary">{batchBanner.icon}</span>
        <div className="flex flex-col">
          <span className="font-label-md text-label-md font-bold text-on-surface">{batchBanner.title}</span>
          <span className="font-label-xs text-label-xs text-on-surface-variant">{batchBanner.subtitle}</span>
        </div>
      </div>
      <AiCallToastButton
        className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 font-label-sm text-label-sm font-bold text-on-primary transition-all active:scale-95"
        message={batchBanner.toast}
      >
        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
        <span>{batchBanner.ctaLabel}</span>
      </AiCallToastButton>
    </div>
  );
}
