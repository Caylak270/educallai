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
}

export function CallDetailTabs({
  transcript,
  transcriptMeta,
  signals,
  automation,
  noteBox,
}: CallDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<CallTabId>("transcript");

  return (
    <>
      {/* Segmentli navigasyon denetleyicisi */}
      <div className="flex items-center justify-between gap-1 rounded-xl bg-surface-container-high p-1 text-center inset-shadow-sm">
        {callTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-label-md text-label-md transition-all",
                isActive
                  ? "bg-surface-container-lowest font-semibold text-primary shadow-sm"
                  : "font-medium text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={clsx(
                    "flex h-5 w-5 items-center justify-center rounded-full font-label-sm text-label-sm",
                    tab.id === "transcript"
                      ? "bg-primary-fixed text-primary"
                      : "bg-surface-container text-on-surface-variant"
                  )}
                >
                  {tab.count}
                </span>
              )}
              {tab.dot && (
                <span className="h-2 w-2 rounded-full bg-secondary" />
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "transcript" && (
        <TranscriptPanel segments={transcript} meta={transcriptMeta} />
      )}
      {activeTab === "ai-signals" && <AiSignalsPanel signals={signals} />}
      {activeTab === "actions" && (
        <ActionsPanel automation={automation} noteBox={noteBox} />
      )}
    </>
  );
}
