"use client";

import { useState } from "react";
import { clsx } from "@/lib/clsx";
import { wizard } from "@/lib/mock/campaigns";

/** Yeni Kampanya Sihirbazı — Adım 1: liste, saatler, KVKK ve senaryo. */
export function WizardCard() {
  const [name, setName] = useState(wizard.defaultName);
  const [checkedDays, setCheckedDays] = useState<Record<string, boolean>>(
    Object.fromEntries(wizard.schedule.days.map((day) => [day.id, day.defaultChecked]))
  );

  const toggleDay = (id: string) =>
    setCheckedDays((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4 rounded-2xl border border-primary-fixed-dim bg-surface-container-lowest p-4 shadow-md">
      {/* Sihirbaz adım noktaları */}
      <div className="flex items-center justify-between px-2 pt-1">
        {wizard.steps.map((step, index) => (
          <div key={step.number} className="contents">
            <div
              className={clsx(
                "flex items-center gap-1.5 text-xs font-bold",
                step.active ? "text-primary" : "text-outline"
              )}
            >
              <span
                className={clsx(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                  step.active ? "bg-primary text-on-primary" : "bg-surface-container-low"
                )}
              >
                {step.number}
              </span>
              <span>{step.label}</span>
            </div>
            {index < wizard.steps.length - 1 ? (
              <div className="h-0.5 w-8 bg-surface-container-low" />
            ) : null}
          </div>
        ))}
      </div>

      {/* Kampanya adı girişi */}
      <div>
        <label className="mb-1 block text-xs font-bold text-on-surface" htmlFor="campaign-name">
          {wizard.nameLabel}
        </label>
        <input
          className="w-full rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 py-2 text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          id="campaign-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      {/* 1. CSV / Veli listesi yükleme */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-on-surface">{wizard.upload.sectionLabel}</label>
          <button
            className="text-[11px] font-semibold text-primary hover:underline"
            type="button"
          >
            {wizard.upload.templateLabel}
          </button>
        </div>

        <div className="cursor-pointer rounded-xl border-2 border-dashed border-primary-fixed-dim bg-primary-fixed/40 p-4 text-center transition-colors hover:bg-primary-fixed/70">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-primary-fixed-dim bg-surface-container-lowest text-primary shadow-xs">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <p className="text-xs font-bold text-on-surface">{wizard.upload.dropTitle}</p>
          <p className="mt-0.5 text-[11px] text-on-surface-variant">{wizard.upload.dropHint}</p>
          <button
            className="mt-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-on-surface shadow-xs"
            type="button"
          >
            {wizard.upload.buttonLabel}
          </button>
        </div>

        {/* Yüklenen dosya chip'i */}
        <div className="flex items-center justify-between rounded-xl border border-secondary-fixed bg-secondary-fixed/50 p-2.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold text-on-secondary">
              CSV
            </div>
            <div>
              <p className="text-xs font-bold text-on-secondary-fixed">{wizard.upload.chip.name}</p>
              <p className="text-[10px] text-secondary">{wizard.upload.chip.meta}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-secondary">{wizard.upload.chip.status}</span>
        </div>
      </div>

      {/* 2. Arama saatleri ayarı */}
      <div className="space-y-1.5 border-t border-outline-variant/60 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-on-surface">{wizard.schedule.sectionLabel}</label>
          <span className="text-[11px] text-on-surface-variant">{wizard.schedule.headerNote}</span>
        </div>

        <div className="space-y-2">
          {wizard.schedule.days.map((day) => {
            const checked = checkedDays[day.id];
            const off = !checked && !day.disabled;
            return (
              <div
                key={day.id}
                className={clsx(
                  "flex items-center justify-between rounded-xl border p-2.5 text-xs",
                  checked
                    ? "border-outline-variant bg-surface-container-low"
                    : "border-outline-variant/60 bg-surface-container-low/50",
                  !checked && "opacity-60"
                )}
              >
                <div className="flex items-center gap-2">
                  <input
                    aria-label={day.label}
                    checked={checked}
                    className={clsx(
                      "h-4 w-4 rounded border-outline accent-primary-container",
                      day.disabled && "cursor-not-allowed"
                    )}
                    disabled={day.disabled}
                    type="checkbox"
                    onChange={() => {
                      if (!day.disabled) toggleDay(day.id);
                    }}
                  />
                  <span className={clsx(checked ? "font-semibold text-on-surface" : "font-medium text-on-surface-variant")}>
                    {day.label}
                  </span>
                </div>
                {day.hours ? (
                  <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1 text-[11px] font-bold text-primary">
                    <span>{day.hours[0]}</span>
                    <span className="text-outline">-</span>
                    <span>{day.hours[1]}</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-on-surface-variant">{day.note}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. KVKK / İYS onay kontrol listesi */}
      <div className="space-y-2 border-t border-outline-variant/60 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-on-surface">{wizard.compliance.sectionLabel}</label>
          <span className="rounded bg-secondary-fixed px-1.5 py-0.5 text-[10px] font-bold text-on-secondary-fixed">
            {wizard.compliance.badge}
          </span>
        </div>

        <div className="space-y-2.5 rounded-xl border border-outline-variant bg-surface-container-low p-3">
          {wizard.compliance.items.map((item) => (
            <div key={item.title} className="flex items-start gap-2.5 text-xs">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-on-surface">{item.title}</p>
                <p className="text-[11px] text-on-surface-variant">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Senaryo önizleme */}
      <div className="space-y-1.5 border-t border-outline-variant/60 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-on-surface">{wizard.script.sectionLabel}</label>
          <button className="text-[11px] font-semibold text-primary" type="button">
            {wizard.script.customizeLabel}
          </button>
        </div>

        <div className="space-y-2 rounded-xl border border-primary-fixed bg-primary-fixed/50 p-3 text-xs">
          <div className="flex items-center justify-between border-b border-primary-fixed-dim/60 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary-container" />
              <span className="font-bold text-on-surface">{wizard.script.model}</span>
            </div>
            <span className="rounded border border-primary-fixed-dim bg-surface-container-lowest px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {wizard.script.modelBadge}
            </span>
          </div>

          <p className="rounded-lg border border-primary-fixed-dim/70 bg-surface-container-lowest p-2.5 text-[11px] italic leading-relaxed text-on-surface-variant">
            {wizard.script.text}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {wizard.script.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-outline-variant bg-surface-container-lowest px-2 py-0.5 text-[10px] font-medium text-on-surface-variant"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Aksiyon footer */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          className="w-1/3 rounded-xl border border-outline-variant py-2.5 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low"
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
          className="flex w-2/3 items-center justify-center gap-1.5 rounded-xl bg-primary-container py-2.5 text-xs font-bold text-on-primary shadow-sm transition-all hover:bg-primary active:scale-[0.98]"
          type="button"
        >
          <span>{wizard.actions.nextLabel}</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
