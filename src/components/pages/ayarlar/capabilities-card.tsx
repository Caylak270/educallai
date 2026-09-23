"use client";

import { useState } from "react";
import { CardHeader } from "./card-header";
import { ToggleSwitch } from "./toggle-switch";
import {
  agentRouting,
  capabilityToggles,
  humanHandoffTargets,
  type CapabilityBadgeTone,
  type HumanHandoffTarget,
} from "@/lib/mock/settings";
import { clsx } from "@/lib/clsx";

const badgeToneClasses: Record<CapabilityBadgeTone, string> = {
  primary: "bg-primary-fixed text-primary",
  secondary: "bg-secondary-container text-on-secondary-container",
  neutral: "bg-surface-container-high text-on-surface",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
};

type CapabilitiesCardProps = {
  values: Record<string, boolean>;
  onToggle: (id: string, value: boolean) => void;
  /** İnsana yönlendirme hedefi — ayarlar-view state'inden gelir. */
  routingTarget: HumanHandoffTarget;
  /** Kaydet → ayarlar-view state'ine yazılır; kalıcı kayıt "Değişiklikleri Kaydet" ile olur. */
  onRoutingTargetChange: (target: HumanHandoffTarget) => void;
};

export function CapabilitiesCard({
  values,
  onToggle,
  routingTarget,
  onRoutingTargetChange,
}: CapabilitiesCardProps) {
  const activeCount = capabilityToggles.filter((toggle) => values[toggle.id]).length;
  // "Değiştir" ile açılan satır içi düzenleme taslağı (Kaydet ile uygulanır).
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<HumanHandoffTarget>(routingTarget);
  const current = humanHandoffTargets.find((t) => t.id === routingTarget) ?? humanHandoffTargets[0];

  const startEdit = () => {
    setDraft(routingTarget);
    setEditing(true);
  };

  const saveEdit = () => {
    onRoutingTargetChange(draft);
    setEditing(false);
  };

  return (
    <section className="flex flex-col gap-space-md rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-space-lg">
      <CardHeader
        icon="smart_toy"
        className="pb-space-xs"
        title="Temel Yetenek İzinleri & Aksiyon Yetkileri"
        description="Yapay zeka sesli asistanın veli telefon konuşmalarında uygulayabileceği dinamik işlemler."
        right={
          <span className="rounded-full bg-secondary-container px-space-sm py-space-xs font-label-sm text-label-sm font-semibold text-on-secondary-container">
            {activeCount} / {capabilityToggles.length} Yetki Aktif
          </span>
        }
      />

      <div className="flex flex-col gap-space-xs pt-space-xs">
        {capabilityToggles.map((item) => (
          <div
            key={item.id}
            className={clsx(
              "flex gap-space-md rounded-lg bg-surface-container-low p-space-md transition-colors hover:bg-surface-container",
              item.hasRoutingBox ? "flex-col gap-space-sm" : "items-start justify-between"
            )}
          >
            <div className="flex w-full items-start justify-between gap-space-md">
              <div className="flex items-start gap-space-md">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <div
                  className="flex cursor-pointer flex-col"
                  onClick={() => onToggle(item.id, !(values[item.id] ?? false))}
                >
                  <div className="flex items-center gap-space-xs">
                    <span className="font-title-sm text-title-sm text-on-surface">{item.title}</span>
                    <span
                      className={clsx(
                        "rounded-sm px-1.5 py-0.5 font-label-sm text-label-sm font-medium",
                        badgeToneClasses[item.badgeTone]
                      )}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                    {item.description}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                checked={values[item.id] ?? false}
                onChange={(value) => onToggle(item.id, value)}
                ariaLabel={item.title}
                className="mt-1"
              />
            </div>

            {item.hasRoutingBox && (
              <div className="ml-11 rounded-lg bg-surface-container p-space-sm">
                {!editing ? (
                  <div className="flex items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-label-sm text-label-sm font-semibold text-on-primary">
                        {routingTarget === "off" ? "×" : current.id === "manager" ? "M" : agentRouting.initials}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-space-sm">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">
                          {current.boxLabel}
                        </span>
                        {current.boxContact ? (
                          <span className="font-mono-data text-mono-data text-on-surface-variant">
                            {current.boxContact}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={startEdit}
                      className="font-label-sm text-label-sm font-semibold text-primary transition-colors hover:text-primary-container"
                    >
                      Değiştir
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-end gap-space-sm">
                    <label className="flex flex-col gap-1">
                      <span className="font-label-xs text-label-xs text-on-surface-variant">
                        Yönlendirme hedefi
                      </span>
                      <select
                        className="h-9 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 font-label-sm text-label-sm text-on-surface focus:border-primary focus:outline-none"
                        onChange={(event) => setDraft(event.target.value as HumanHandoffTarget)}
                        value={draft}
                      >
                        {humanHandoffTargets.map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="flex h-9 items-center rounded-lg bg-primary-container px-3.5 font-label-sm text-label-sm font-semibold text-on-primary transition-colors hover:bg-primary"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="flex h-9 items-center rounded-lg px-3 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
                    >
                      Vazgeç
                    </button>
                    <p className="w-full font-label-xs text-label-xs text-on-surface-variant">
                      Seçim kaydetmek için sayfanın sağ üstündeki “Değişiklikleri Kaydet”i kullanın.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
