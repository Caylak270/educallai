import { batchBanner } from "@/lib/mock/exams";
import { AiCallToastButton } from "./call-buttons";

/** Toplu kampanya başlatma şeridi (tasarımda listenin sonunda, normal akışta). */
export function BatchBanner() {
  return (
    <div className="mt-2 flex items-center justify-between rounded-2xl bg-surface-container-high p-3.5 shadow-xs">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[22px] text-primary">{batchBanner.icon}</span>
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm font-bold text-on-surface">{batchBanner.title}</span>
          <span className="font-label-xs text-label-xs text-on-surface-variant">{batchBanner.subtitle}</span>
        </div>
      </div>
      <AiCallToastButton
        className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 font-label-xs text-label-xs font-bold text-on-primary shadow-sm transition-all active:scale-95"
        message={batchBanner.toast}
      >
        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
        <span>{batchBanner.ctaLabel}</span>
      </AiCallToastButton>
    </div>
  );
}
