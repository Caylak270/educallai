"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "@/lib/clsx";
import { CallButton } from "@/components/ui/call-button";
import type { Lead } from "@/lib/mock/leads";

/* Tasarımdaki dokunsal waveform barları (19 çubuk) */
const WAVEFORM: { h: string; c: string }[] = [
  { h: "h-2", c: "bg-primary" },
  { h: "h-4", c: "bg-primary" },
  { h: "h-5", c: "bg-primary" },
  { h: "h-3", c: "bg-primary" },
  { h: "h-6", c: "bg-primary" },
  { h: "h-4", c: "bg-primary" },
  { h: "h-2", c: "bg-primary-container" },
  { h: "h-5", c: "bg-primary-container" },
  { h: "h-3", c: "bg-outline-variant" },
  { h: "h-4", c: "bg-outline-variant" },
  { h: "h-2", c: "bg-outline-variant" },
  { h: "h-5", c: "bg-outline-variant" },
  { h: "h-3", c: "bg-outline-variant" },
  { h: "h-4", c: "bg-outline-variant" },
  { h: "h-2", c: "bg-outline-variant" },
  { h: "h-5", c: "bg-outline-variant" },
  { h: "h-4", c: "bg-outline-variant" },
  { h: "h-3", c: "bg-outline-variant" },
  { h: "h-2", c: "bg-outline-variant" },
];

/* Alt drawer — lead detayı. lead null iken aşağı kayarak kapanır. */
export function ParentDetailDrawer({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const router = useRouter();
  const [cachedLead, setCachedLead] = useState<Lead | null>(lead);
  const [lastLead, setLastLead] = useState<Lead | null>(lead);

  // Prop değişince render sırasında önbelleği güncelle (React'in önerilen deseni;
  // kapanış animasyonu sırasında içerik korunur).
  if (lead !== lastLead) {
    setLastLead(lead);
    if (lead) setCachedLead(lead);
  }

  const open = lead !== null;
  const data = cachedLead;

  return (
    <div
      aria-hidden={!open}
      className={clsx(
        "fixed inset-x-0 bottom-0 top-14 z-[60] flex flex-col rounded-t-xl border border-b-0 border-outline-variant/60 bg-surface-container-lowest transition-transform duration-300 ease-out lg:left-72",
        open ? "translate-y-0" : "translate-y-full"
      )}
    >
      {/* Drawer tutamağı & başlık çubuğu */}
      <div className="flex flex-col items-center rounded-t-xl border-b border-outline-variant/50 bg-surface-container-low px-gutter-mobile pb-3 pt-2.5">
        <div className="mb-2 h-1.5 w-12 rounded-full bg-outline-variant" />
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
            <span className="font-headline-md text-headline-md text-on-surface">
              Veli ve AI CRM Özeti
            </span>
          </div>
          <button
            aria-label="Drawer'ı kapat"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:text-on-surface"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Kaydırılabilir gövde */}
      {data && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-gutter-mobile py-4">
          {/* Lead profil kartı */}
          <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                  {data.name}
                </h2>
                <div className="mt-0.5 flex items-center gap-2 font-mono-data text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-outline">call</span>
                  <span>{data.drawer.phone}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="block font-label-md text-label-md text-on-surface-variant">
                  Öğrenci
                </span>
                <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                  {data.drawer.studentName}
                </span>
                <span className="block font-body-sm text-body-sm text-primary">
                  {data.drawer.studentClass}
                </span>
              </div>
            </div>
            {/* Metrik rozetleri */}
            <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant/50 pt-3">
              <span
                className={clsx(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 font-mono-data text-label-md font-semibold",
                  data.drawer.scoreBadge.className
                )}
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                {data.drawer.scoreBadge.text}
              </span>
              <span
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label-md text-label-md font-semibold",
                  data.drawer.heatPill.className
                )}
              >
                <span
                  className={clsx(
                    "material-symbols-outlined text-[14px]",
                    data.drawer.heatPill.iconClass
                  )}
                >
                  {data.drawer.heatPill.icon}
                </span>
                {data.drawer.heatPill.text}
              </span>
              <span
                className={clsx(
                  "rounded-full px-2.5 py-1 font-label-md text-label-md",
                  data.drawer.stagePill.className
                )}
              >
                {data.drawer.stagePill.text}
              </span>
            </div>
          </div>

          {/* AI yönetici görüşme özeti — düz zemin, tek küçük ikon */}
          <div className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span className="font-title-sm text-title-sm font-semibold">
                  AI Asistan Görüşme Notu
                </span>
              </div>
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 font-mono-data text-label-sm font-semibold",
                  data.drawer.sentiment.className
                )}
              >
                {data.drawer.sentiment.text}
              </span>
            </div>
            <p className="font-body-md text-body-md leading-relaxed text-on-surface">
              {data.drawer.notePre}
              <span className="font-mono-data font-semibold">{data.drawer.noteHighlight}</span>
              {data.drawer.notePost}
            </p>
          </div>

          {/* Ses kaydı widget'ı — kayıt saklama henüz entegre değil; sahte oynatma
              yerine dürüst bilgilendirme gösteriyoruz (dalga formu statik görseldir). */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <div className="flex items-center gap-2 text-on-surface">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">volume_off</span>
              </span>
              <div>
                <p className="font-title-sm text-title-sm font-medium">AI Görüşme Ses Kaydı</p>
                <p className="font-mono-data text-label-sm text-outline">
                  {data.drawer.audioMeta}
                </p>
              </div>
            </div>
            <p className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
              Ses kaydı yakında — kayıt saklama entegrasyonu bekleniyor.
            </p>
            {/* Dalga formu (statik görsel) */}
            <div className="flex h-8 items-center rounded-xl bg-surface-container-low px-2">
              <div className="flex h-6 flex-1 items-center justify-between gap-1">
                {WAVEFORM.map((bar, index) => (
                  <span key={index} className={clsx("w-1 rounded-full", bar.h, bar.c)} />
                ))}
              </div>
            </div>
          </div>

          {/* Etkileşim geçmişi zaman çizelgesi */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-title-sm text-title-sm font-semibold text-on-surface">
              Etkileşim Geçmişi
            </h4>
            <div className="relative space-y-4 pl-6">
              {/* Dikey çizgi */}
              <div className="absolute bottom-2 left-2 top-2 w-0.5 bg-surface-container-high" />
              {data.drawer.timeline.map((item, index) => (
                <div key={`${item.title}-${index}`} className="relative flex flex-col gap-1">
                  <span
                    className={clsx(
                      "absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-surface-container-lowest",
                      item.dotClass
                    )}
                  >
                    <span
                      className={clsx("material-symbols-outlined text-[10px]", item.iconClass)}
                    >
                      {item.icon}
                    </span>
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      {item.title}
                    </span>
                    <span className="font-mono-data text-label-sm text-outline">{item.time}</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Drawer alt aksiyon çubuğu */}
      <div className="flex flex-col gap-2 border-t border-outline-variant/50 bg-surface-container-lowest p-gutter-mobile pb-safe">
        {data ? (
          <CallButton
            variant="primary"
            size="md"
            className="h-12 rounded-xl font-title-sm"
            label="Şimdi Ara (AI Asistan)"
            name={data.name}
            phone={data.drawer.phone}
            leadId={data.id}
            context={`Aşama: ${data.stage ?? "ilgilendi"} · Skor: ${data.score}`}
          />
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-secondary-container font-label-md text-label-md font-semibold text-on-secondary-container transition-colors hover:bg-secondary"
            onClick={() => {
              onClose();
              router.push("/randevular?odak=yeni");
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
            <span>Randevu Takvimi</span>
          </button>
          <button
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-surface-container font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
            onClick={() => {
                if (!data) return;
                // Numarayı wa.me E.164 biçimine normalize et (yoklama view ile aynı kural)
                const phone = data.drawer.phone ?? "";
                const digits = (phone.match(/\d/g) ?? []).join("");
                const full = digits.startsWith("90") ? digits : `90${digits.replace(/^0/, "")}`;
                if (digits.length >= 10) {
                  window.open(`https://wa.me/${full}`, "_blank", "noopener");
                }
              }}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">forum</span>
            <span>WhatsApp Mesaj</span>
          </button>
        </div>
      </div>
    </div>
  );
}
