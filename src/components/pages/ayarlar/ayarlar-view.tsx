"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CapabilitiesCard } from "./capabilities-card";
import { ComplianceCard } from "./compliance-card";
import { ScheduleCard } from "./schedule-card";
import { TestCallCard } from "./test-call-card";
import { VoiceCard } from "./voice-card";
import {
  DEFAULT_SETTINGS,
  RESET_TOAST_MESSAGE,
  SAVE_TOAST_MESSAGE,
  type ScheduleRowState,
  type SettingsState,
} from "@/lib/mock/settings";
import { clsx } from "@/lib/clsx";

const TOAST_DURATION_MS = 3200;

export function AyarlarView() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const update = useCallback((patch: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleCapabilityToggle = useCallback(
    (id: string, value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        capabilities: { ...prev.capabilities, [id]: value },
      }));
    },
    []
  );

  const handleRowChange = useCallback(
    (id: string, patch: Partial<ScheduleRowState>) => {
      setSettings((prev) => ({
        ...prev,
        schedule: prev.schedule.map((row) => (row.id === id ? { ...row, ...patch } : row)),
      }));
    },
    []
  );

  const handleResetAll = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    showToast(RESET_TOAST_MESSAGE);
  }, [showToast]);

  const handleSaveConfiguration = useCallback(() => {
    showToast(SAVE_TOAST_MESSAGE);
  }, [showToast]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-gutter lg:py-8">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-space-md pb-space-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
            <span className="cursor-pointer transition-colors hover:text-primary">Ayarlar</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-semibold text-primary">AI Yetenekleri &amp; Operasyon Kuralları</span>
            <span className="mx-space-xs inline-block h-1 w-1 rounded-full bg-outline-variant" />
            <span className="inline-flex items-center gap-1 font-medium text-secondary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary-fixed-dim" />
              Bot Senkronize
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            AI Asistan Yetenekleri ve Operasyon Kuralları
          </h1>
          <p className="max-w-3xl font-body-md text-body-md text-on-surface-variant">
            Sesli yapay zeka arama robotunuzun velilerle olan görüşmelerdeki sınırlarını,
            fiyat/randevu izinlerini ve entegrasyon parametrelerini şube bazında yapılandırın.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-space-sm self-start lg:self-center">
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-space-xs rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-space-md py-space-sm font-title-sm text-title-sm text-on-surface-variant transition-all hover:bg-surface-container-low hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Tümünü Sıfırla</span>
          </button>
          <button
            type="button"
            onClick={handleSaveConfiguration}
            className="flex items-center gap-space-xs rounded-xl bg-primary-container px-space-lg py-space-sm font-title-sm text-title-sm text-on-primary transition-all hover:bg-primary"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              save
            </span>
            <span>Değişiklikleri Kaydet</span>
          </button>
        </div>
      </div>

      {/* 2. Two-Column Layout Grid */}
      <div className="grid grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
        {/* LEFT COLUMN (~65% width = 8 cols) */}
        <div className="flex min-w-0 flex-col gap-space-lg lg:col-span-8">
          <CapabilitiesCard values={settings.capabilities} onToggle={handleCapabilityToggle} />
          <ScheduleCard
            rows={settings.schedule}
            retryHours={settings.retryHours}
            dailyCallLimit={settings.dailyCallLimit}
            onRowChange={handleRowChange}
            onRuleChange={(patch) => update(patch)}
          />
        </div>

        {/* RIGHT COLUMN (~35% width = 4 cols) */}
        <div className="flex min-w-0 flex-col gap-space-lg lg:col-span-4">
          <VoiceCard
            selectedVoiceId={settings.selectedVoiceId}
            speechSpeed={settings.speechSpeed}
            latencyMs={settings.latencyMs}
            onVoiceChange={(id) => update({ selectedVoiceId: id })}
            onSpeedChange={(value) => update({ speechSpeed: value })}
            onLatencyChange={(value) => update({ latencyMs: value })}
          />
          <ComplianceCard />
          <TestCallCard phone={settings.phone} onPhoneChange={(value) => update({ phone: value })} />
        </div>
      </div>

      {/* Interactive Toast Notification */}
      <div
        role="status"
        aria-live="polite"
        className={clsx(
          "fixed bottom-6 right-6 z-50 flex items-center gap-space-sm rounded-xl bg-inverse-surface px-space-lg py-space-md text-inverse-on-surface shadow-xl transition-all duration-300",
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-20 opacity-0"
        )}
      >
        <span
          className="material-symbols-outlined text-[20px] text-secondary-container"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
        <span className="font-body-md text-body-md font-medium">{toast?.message}</span>
      </div>
    </div>
  );
}
