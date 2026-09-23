"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import {
  callTabs,
  type AiSignals,
  type AutomationPanel,
  type CallTabId,
  type NoteBox,
  type TranscriptMeta,
  type TranscriptSegment,
} from "@/lib/mock/calls";
import { ActionsPanel } from "./actions-panel";
import { AiSignalsPanel } from "./ai-signals-panel";
import { TranscriptPanel } from "./transcript-panel";

interface CallDetailTabsProps {
  transcript: TranscriptSegment[];
  transcriptMeta: TranscriptMeta;
  signals: AiSignals;
  automation: AutomationPanel;
  noteBox: NoteBox;
  /** Canlı görüşmenin kontak kaydı (not/devir API'leri için); demo kayıtta null */
  contactId: string | null;
  /** Görüşme sinyal kaydının id'si (devir API'si için); demo kayıtta mock id */
  callId: string;
}

export function CallDetailTabs({
  transcript,
  transcriptMeta,
  signals,
  automation,
  noteBox,
  contactId,
  callId,
}: CallDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<CallTabId>("transcript");

  return (
    <div className="flex flex-col gap-4">
      {/* Sekme gezinmesi */}
      <div
        role="tablist"
        aria-label="Görüşme detayı sekmeleri"
        className="flex items-center gap-1 rounded-xl border border-outline-variant/60 bg-surface-container-low p-1"
      >
        {callTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-label-md text-label-md transition-colors",
                isActive
                  ? "bg-surface-container-lowest font-semibold text-primary"
                  : "font-medium text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant">
                  {tab.count}
                </span>
              )}
              {tab.dot && <span className="h-2 w-2 rounded-full bg-secondary" />}
            </button>
          );
        })}
      </div>

      {/* Aktif panel içeriği — tek yüzey */}
      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5">
        {activeTab === "transcript" && (
          <TranscriptPanel segments={transcript} meta={transcriptMeta} />
        )}
        {activeTab === "ai-signals" && (
          <AiSignalsPanel signals={signals} callId={callId} contactId={contactId} />
        )}
        {activeTab === "actions" && (
          <ActionsPanel automation={automation} noteBox={noteBox} contactId={contactId} />
        )}
      </div>
    </div>
  );
}
