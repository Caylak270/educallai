"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import type { AutomationItem, AutomationPanel, NoteBox } from "@/lib/mock/calls";

function TimelineItem({ item }: { item: AutomationItem }) {
  return (
    <div className="relative flex items-start gap-3">
      <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
        <span className="material-symbols-outlined text-[16px]">check</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-md text-label-md font-semibold text-on-surface">
            {item.title}
          </span>
          <span className="shrink-0 font-mono-data text-mono-data text-on-surface-variant">
            {item.time}
          </span>
        </div>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          {item.desc.map((segment, index) => {
            if (segment.strong)
              return (
                <strong key={index} className="font-semibold text-on-surface">
                  {segment.text}
                </strong>
              );
            if (segment.em)
              return (
                <em key={index} className="font-medium text-on-surface">
                  {segment.text}
                </em>
              );
            return <span key={index}>{segment.text}</span>;
          })}
        </p>
        {item.footer.variant === "success" && (
          <div className="mt-1.5 flex items-center gap-1 font-label-sm text-label-sm font-medium text-secondary">
            <span className="material-symbols-outlined text-[14px]">
              {item.footer.icon}
            </span>
            <span>{item.footer.text}</span>
          </div>
        )}
        {item.footer.variant === "chip" && (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm text-on-surface">
            <span className="material-symbols-outlined text-[14px]">
              {item.footer.icon}
            </span>
            <span>{item.footer.text}</span>
          </div>
        )}
        {item.footer.variant === "link" && (
          <div className="mt-1.5 inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold text-primary">
            <span className="material-symbols-outlined text-[14px]">
              {item.footer.icon}
            </span>
            <span>{item.footer.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ActionsPanel({
  automation,
  noteBox,
}: {
  automation: AutomationPanel;
  noteBox: NoteBox;
}) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const handleNoteChange = (value: string) => {
    setNote(value);
    if (saved) setSaved(false);
  };

  return (
    <div className="flex flex-col">
      {/* Otomasyon günlüğü */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">
            {automation.title}
          </h3>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            {automation.subtitle}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary-fixed px-2.5 py-1 font-label-sm text-label-sm font-semibold text-primary">
          {automation.badge}
        </span>
      </div>

      {/* Aksiyon timeline checklist */}
      <div className="relative mt-4 flex flex-col gap-4 before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-outline-variant/50">
        {automation.items.map((item) => (
          <TimelineItem key={item.id} item={item} />
        ))}
      </div>

      {/* Dahili not kutusu */}
      <div className="mt-5 flex flex-col gap-3 border-t border-outline-variant/50 pt-5">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="counselorNote"
            className="flex items-center gap-1.5 font-title-sm text-title-sm font-semibold text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              edit_note
            </span>
            {noteBox.title}
          </label>
          <span className="shrink-0 font-label-sm text-label-sm text-on-surface-variant">
            {noteBox.hint}
          </span>
        </div>
        <textarea
          id="counselorNote"
          rows={3}
          value={note}
          onChange={(event) => handleNoteChange(event.target.value)}
          placeholder={noteBox.placeholder}
          className="w-full resize-none rounded-xl border border-outline-variant/60 bg-surface-container-low p-3 font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            type="button"
            disabled={saved}
            onClick={() => setSaved(true)}
            className={clsx(
              "rounded-xl bg-primary-container px-4 py-2 font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary",
              saved && "bg-secondary hover:bg-secondary"
            )}
          >
            {saved ? noteBox.savedLabel : noteBox.saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
