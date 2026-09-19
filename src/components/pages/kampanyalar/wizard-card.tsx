"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { wizard } from "@/lib/mock/campaigns";

/** Yeni Kampanya Sihirbazı — Adım 1: liste, saatler, KVKK ve senaryo. PC'de 2 kolon. */
export function WizardCard() {
  const [name, setName] = useState(wizard.defaultName);
  const [checkedDays, setCheckedDays] = useState<Record<string, boolean>>(
    Object.fromEntries(wizard.schedule.days.map((day) => [day.id, day.defaultChecked]))
  );

  const toggleDay = (id: string) =>
    setCheckedDays((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
      {/* Adım göstergesi */}
      <div className="flex items-center gap-3 border-b border-outline-variant/50 px-5 py-4">
        {wizard.steps.map((step, index) => (
          <div key={step.number} className="flex flex-1 items-center gap-3 last:flex-none">
            <div
              className={clsx(
                "flex items-center gap-2 font-label-sm text-label-sm",
                step.active ? "font-semibold text-primary" : "text-outline"
              )}
            >
              <span
                className={clsx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-label-xs text-label-xs",
                  step.active ? "bg-primary-container text-on-primary" : "bg-surface-container"
                )}
              >
                {step.number}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {index < wizard.steps.length - 1 ? (
              <div
                className={clsx(
                  "h-px flex-1",
                  step.active ? "bg-primary-fixed-dim" : "bg-surface-container"
                )}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-5 p-5">
        {/* Kampanya adı */}
        <div>
          <label
            className="mb-1.5 block font-label-sm text-label-sm font-semibold text-on-surface"
            htmlFor="campaign-name"
          >
            {wizard.nameLabel}
          </label>
          <input
            className="h-11 w-full rounded-xl border border-outline-variant bg-surface px-3.5 font-body-md text-body-md text-on-surface transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30"
            id="campaign-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        {/* Liste yükleme + arama saatleri — PC'de yan yana */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* 1. CSV / Veli listesi yükleme */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-label-sm font-semibold text-on-surface">
                {wizard.upload.sectionLabel}
              </label>
              <button
                className="font-label-sm text-label-sm font-medium text-primary hover:underline"
                type="button"
              >
                {wizard.upload.templateLabel}
              </button>
            </div>

            <div className="cursor-pointer rounded-xl border border-dashed border-outline-variant bg-surface-container-low/60 p-6 text-center transition-colors hover:border-primary-fixed-dim hover:bg-primary-fixed/30">
              <span className="material-symbols-outlined mx-auto mb-2 block text-[28px] text-primary-container">
                cloud_upload
              </span>
              <p className="font-label-sm text-label-sm font-semibold text-on-surface">
                {wizard.upload.dropTitle}
              </p>
              <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                {wizard.upload.dropHint}
              </p>
              <button
                className="mt-3 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 py-1.5 font-label-sm text-label-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
                type="button"
              >
                {wizard.upload.buttonLabel}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-outline-variant/60 bg-surface-container-low px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary font-label-xs text-label-xs font-bold text-on-secondary">
                  CSV
                </span>
                <div>
                  <p className="font-label-sm text-label-sm font-semibold text-on-surface">
                    {wizard.upload.chip.name}
                  </p>
                  <p className="font-body-xs text-[11px] text-on-surface-variant">
                    {wizard.upload.chip.meta}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm font-semibold text-secondary">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {wizard.upload.chip.status}
              </span>
            </div>
          </div>

          {/* 2. Arama saatleri */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-label-sm font-semibold text-on-surface">
                {wizard.schedule.sectionLabel}
              </label>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {wizard.schedule.headerNote}
              </span>
            </div>

            <div className="space-y-2">
              {wizard.schedule.days.map((day) => {
                const checked = checkedDays[day.id];
                return (
                  <label
                    key={day.id}
                    className={clsx(
                      "flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-3 transition-colors",
                      checked
                        ? "border-outline-variant bg-surface-container-low"
                        : "border-outline-variant/50 opacity-60",
                      day.disabled && "cursor-not-allowed"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        aria-label={day.label}
                        checked={checked}
                        className="h-4 w-4 rounded accent-primary-container"
                        disabled={day.disabled}
                        type="checkbox"
                        onChange={() => {
                          if (!day.disabled) toggleDay(day.id);
                        }}
                      />
                      <span
                        className={clsx(
                          "font-label-md text-label-md",
                          checked ? "font-medium text-on-surface" : "text-on-surface-variant"
                        )}
                      >
                        {day.label}
                      </span>
                    </span>
                    {day.hours ? (
                      <span className="rounded-lg bg-surface-container-lowest px-2.5 py-1 font-mono-data text-mono-data font-semibold text-primary">
                        {day.hours[0]}–{day.hours[1]}
                      </span>
                    ) : (
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {day.note}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* KVKK + senaryo — PC'de yan yana */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* 3. KVKK / İYS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-label-sm font-semibold text-on-surface">
                {wizard.compliance.sectionLabel}
              </label>
              <span className="rounded-full bg-secondary-container px-2.5 py-0.5 font-label-xs text-label-xs font-semibold text-on-secondary-container">
                {wizard.compliance.badge}
              </span>
            </div>
            <div className="space-y-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/60 p-4">
              {wizard.compliance.items.map((item) => (
                <div key={item.title} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-secondary">
                    check_circle
                  </span>
                  <div>
                    <p className="font-label-md text-label-md font-semibold text-on-surface">
                      {item.title}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Senaryo önizleme */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-label-sm font-semibold text-on-surface">
                {wizard.script.sectionLabel}
              </label>
              <button
                className="font-label-sm text-label-sm font-medium text-primary hover:underline"
                type="button"
              >
                {wizard.script.customizeLabel}
              </button>
            </div>

            <div className="flex h-[calc(100%-2.25rem)] flex-col rounded-xl border border-outline-variant/60 bg-surface-container-low/60 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 font-label-sm text-label-sm font-semibold text-on-surface">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                  {wizard.script.model}
                </span>
                <span className="rounded-full bg-primary-fixed px-2.5 py-0.5 font-label-xs text-label-xs font-semibold text-primary">
                  {wizard.script.modelBadge}
                </span>
              </div>
              <p className="flex-1 rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-3.5 font-body-sm text-body-sm italic leading-relaxed text-on-surface-variant">
                {wizard.script.text}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {wizard.script.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-outline-variant/60 bg-surface-container-lowest px-2.5 py-0.5 font-label-xs text-label-xs text-on-surface-variant"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Aksiyon footer */}
        <div className="flex items-center justify-between gap-3 border-t border-outline-variant/50 pt-4">
          <button
            className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-5 py-2.5 font-label-md text-label-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
            type="button"
            onClick={() => {
              setName(wizard.defaultName);
              setCheckedDays(
                Object.fromEntries(wizard.schedule.days.map((day) => [day.id, day.defaultChecked]))
              );
            }}
          >
            {wizard.actions.cancelLabel}
          </button>
          <button
            className="flex items-center gap-1.5 rounded-xl bg-primary-container px-6 py-2.5 font-label-md text-label-md font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.98]"
            type="button"
          >
            <span>{wizard.actions.nextLabel}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
