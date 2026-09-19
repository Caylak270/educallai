"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import type { AutomationItem, AutomationPanel, NoteBox } from "@/lib/mock/calls";

function TimelineItem({ item }: { item: AutomationItem }) {
  return (
    <div className="relative flex items-start gap-space-md">
      <div className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-sm">
        <span className="material-symbols-outlined text-[16px]">check</span>
      </div>
      <div className="flex-1 rounded-lg bg-surface-container-low p-3">
        <div className="flex items-center justify-between">
          <span className="font-label-md text-label-md font-semibold text-on-surface">
            {item.title}
          </span>
          <span className="font-mono-data text-mono-data text-on-surface-variant">
            {item.time}
          </span>
        </div>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          {item.desc.map((segment, index) => {
            if (segment.strong) return <strong key={index}>{segment.text}</strong>;
            if (segment.em) return <em key={index}>{segment.text}</em>;
            return <span key={index}>{segment.text}</span>;
          })}
        </p>
        {item.footer.variant === "success" && (
          <div className="mt-2 flex items-center gap-1 font-label-sm text-label-sm font-medium text-secondary">
            <span className="material-symbols-outlined text-[14px]">
              {item.footer.icon}
            </span>
            <span>{item.footer.text}</span>
          </div>
        )}
        {item.footer.variant === "chip" && (
          <div className="mt-2 inline-flex items-center gap-1 rounded bg-surface-container-highest px-2 py-0.5 font-label-sm text-label-sm text-on-surface">
            <span className="material-symbols-outlined text-[14px]">
              {item.footer.icon}
            </span>
            <span>{item.footer.text}</span>
          </div>
        )}
        {item.footer.variant === "link" && (
          <div className="mt-2 inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold text-primary">
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
    <div className="flex flex-col gap-space-md">
      {/* Otomasyon günlüğü */}
      <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="mb-space-md flex items-center justify-between">
          <div>
            <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">
              {automation.title}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {automation.subtitle}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-secondary-fixed px-2.5 py-1 font-label-sm text-label-sm font-bold text-on-secondary-fixed">
            {automation.badge}
          </span>
        </div>

        {/* Aksiyon timeline checklist */}
        <div className="relative flex flex-col gap-space-md before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-surface-container">
          {automation.items.map((item) => (
            <TimelineItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Dahili not kutusu */}
      <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex items-center justify-between">
          <label
            htmlFor="counselorNote"
            className="flex items-center gap-1.5 font-title-sm text-title-sm font-semibold text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              edit_note
            </span>
            {noteBox.title}
          </label>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {noteBox.hint}
          </span>
        </div>
        <textarea
          id="counselorNote"
          rows={3}
          value={note}
          onChange={(event) => handleNoteChange(event.target.value)}
          placeholder={noteBox.placeholder}
          className="w-full resize-none rounded-lg bg-surface-container-low p-3 font-body-md text-body-md text-on-surface transition-colors placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            type="button"
            disabled={saved}
            onClick={() => setSaved(true)}
            className={clsx(
              "rounded-lg bg-primary-container px-4 py-2 font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary",
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
