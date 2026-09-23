"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "@/lib/clsx";
import { type Lead, type LeadAction } from "@/lib/mock/leads";
import { ScoreRing } from "./score-ring";

/* wa.me derin bağlantısı — rakamları çıkarıp başına 90 ekler (yoklama view ile aynı kural) */
function waLinkOf(phone: string): string | null {
  const digits = (phone.match(/\d/g) ?? []).join("");
  const full = digits.startsWith("90") ? digits : `90${digits.replace(/^0/, "")}`;
  return digits.length >= 10 ? `https://wa.me/${full}` : null;
}

/* AI araması için E.164 numara — maskeli/kirli biçimleri de kabul eder (recall-button kuralı) */
function e164Of(phone: string): string | null {
  const digits = (phone.match(/\d/g) ?? []).join("");
  return digits.length >= 10 ? `+${digits.slice(-12)}` : null;
}

type CallState =
  | { status: "idle" }
  | { status: "busy" }
  | { status: "ok"; note: string }
  | { status: "fail"; note: string };

/* "Tekrar Ara (AI)" — POST /api/calls ile gerçek AI araması başlatır;
   sonuç buton üstünde küçük durum metni + ipucu balonuyla gösterilir. */
function CallActionButton({ lead, action }: { lead: Lead; action: LeadAction }) {
  const [state, setState] = useState<CallState>({ status: "idle" });
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleClick() {
    if (state.status === "busy") return;
    setState({ status: "busy" });
    const phone = e164Of(lead.drawer.phone ?? "");
    let next: CallState;
    if (!phone) {
      next = { status: "fail", note: "Kayıtta geçerli telefon numarası yok" };
    } else {
      try {
        const res = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            name: lead.name,
            leadId: lead.id,
            context: `CRM kartı · ${lead.heatLabel} · Skor ${lead.score}`,
          }),
        });
        const data = await res.json();
        next =
          res.ok && data.ok
            ? {
                status: "ok",
                note:
                  data.mode === "live"
                    ? "LiveKit ile çevriliyor — arama başladı"
                    : "Demo arama kaydı oluşturuldu",
              }
            : { status: "fail", note: data.error ?? "Arama başlatılamadı" };
      } catch {
        next = { status: "fail", note: "Sunucuya ulaşılamadı" };
      }
    }
    setState(next);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setState({ status: "idle" }), 6000);
  }

  return (
    <span className="relative inline-flex">
      <button
        aria-busy={state.status === "busy"}
        className={clsx(
          "flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-label-md text-label-md transition-colors",
          action.style === "primary"
            ? state.status === "fail"
              ? "bg-error-container text-on-error-container"
              : "bg-primary-container text-on-primary"
            : state.status === "fail"
              ? "bg-error-container text-on-error-container"
              : "bg-surface-container text-on-surface",
          state.status === "busy" && "opacity-60"
        )}
        disabled={state.status === "busy"}
        onClick={handleClick}
        type="button"
      >
        <span
          className={clsx(
            "material-symbols-outlined text-[15px]",
            state.status === "busy" && "animate-spin",
            action.iconClass
          )}
        >
          {state.status === "busy"
            ? "progress_activity"
            : state.status === "ok"
              ? "check"
              : state.status === "fail"
                ? "error"
                : action.icon}
        </span>
        <span>
          {state.status === "busy"
            ? "Aranıyor..."
            : state.status === "ok"
              ? "Başlatıldı"
              : state.status === "fail"
                ? "Hata"
                : action.label}
        </span>
      </button>
      {state.status === "ok" || state.status === "fail" ? (
        <span
          aria-live="polite"
          className="absolute top-full left-0 z-30 mt-1 w-max max-w-56 rounded-lg bg-inverse-surface px-2.5 py-1.5 font-body-xs text-[11px] leading-snug text-inverse-on-surface shadow-lg"
        >
          {state.note}
        </span>
      ) : null}
    </span>
  );
}

/* Lead kartı — karta tıklayınca veli detay drawer'ı açılır; alt aksiyon butonları gerçektir */
export function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (lead: Lead) => void }) {
  const router = useRouter();

  return (
    <div
      className={clsx(
        "flex h-full cursor-pointer flex-col rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 transition-colors hover:border-outline-variant",
        lead.focus && "group relative"
      )}
      onClick={() => onOpen(lead)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(lead);
        }
      }}
    >
      {/* Kart başlığı: veli bilgisi + skor halkası */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={clsx(
              "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-headline-md text-headline-md",
              lead.avatarClass
            )}
          >
            {lead.initials}
            <span
              className={clsx(
                "absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-surface-container-lowest",
                lead.badgeClass
              )}
            >
              <span className={clsx("material-symbols-outlined text-[10px]", lead.badgeIconClass)}>
                {lead.badgeIcon}
              </span>
            </span>
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-title-sm text-title-sm font-semibold text-on-surface">
                {lead.name}
              </h3>
              <span className="shrink-0 rounded-md bg-surface-container px-1.5 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                {lead.role}
              </span>
            </div>
            <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
              {lead.student} ·{" "}
              <span className={clsx("font-medium", lead.studentClassClass)}>
                {lead.studentClass}
              </span>
            </p>
          </div>
        </div>
        <ScoreRing value={lead.score} ringClass={lead.ringClass} labelClass={lead.scoreLabelClass} />
      </div>

      {/* Sıcaklık & aktivite meta bilgisi */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span
          className={clsx(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-sm text-label-sm font-semibold",
            lead.heatPillClass
          )}
        >
          <span
            className={clsx("material-symbols-outlined text-[13px]", lead.heatIconClass)}
          >
            {lead.heatIcon}
          </span>
          {lead.heatLabel}
        </span>
        <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
          <span
            className={clsx("material-symbols-outlined text-[14px]", lead.channelIconClass)}
          >
            {lead.channelIcon}
          </span>
          {lead.channelLabel}
        </span>
        <span className="text-label-sm text-outline">·</span>
        <span className="font-mono-data text-label-sm text-outline">{lead.time}</span>
      </div>

      {/* AI insight özeti — düz zemin, tek küçük ikon */}
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-surface-container-low p-2.5">
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-primary-container">
          auto_awesome
        </span>
        <p className="line-clamp-2 font-body-sm text-body-sm leading-snug text-on-surface-variant">
          {lead.insight}
        </p>
      </div>

      {/* Hızlı aksiyon butonları — gerçek davranışlı; kart dibine hizalı, bölümü çizgiyle ayır */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant/50 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {lead.actions.map((action) => {
            if (action.kind === "call") {
              return <CallActionButton key={action.label} lead={lead} action={action} />;
            }

            const baseClass = clsx(
              "flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-label-md text-label-md transition-colors",
              action.style === "primary"
                ? "bg-primary-container text-on-primary"
                : "bg-surface-container text-on-surface"
            );

            /* WhatsApp — wa.me derin bağlantısı (numara yoksa dürüst disabled) */
            if (action.kind === "whatsapp") {
              const href = waLinkOf(lead.drawer.phone ?? "");
              if (!href) {
                return (
                  <button
                    key={action.label}
                    className={clsx(baseClass, "cursor-not-allowed opacity-55")}
                    disabled
                    title="Kayıtta geçerli telefon numarası yok"
                    type="button"
                  >
                    <span className={clsx("material-symbols-outlined text-[15px]", action.iconClass)}>
                      {action.icon}
                    </span>
                    <span>{action.label}</span>
                  </button>
                );
              }
              return (
                <a
                  key={action.label}
                  className={baseClass}
                  href={href}
                  onClick={(event) => event.stopPropagation()}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className={clsx("material-symbols-outlined text-[15px]", action.iconClass)}>
                    {action.icon}
                  </span>
                  <span>{action.label}</span>
                </a>
              );
            }

            /* Randevu — randevular ekranını yeni randevu odasıyla açar */
            if (action.kind === "appointment") {
              return (
                <button
                  key={action.label}
                  className={baseClass}
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push("/randevular?odak=yeni");
                  }}
                  type="button"
                >
                  <span className={clsx("material-symbols-outlined text-[15px]", action.iconClass)}>
                    {action.icon}
                  </span>
                  <span>{action.label}</span>
                </button>
              );
            }

            /* assign | remind | soon — karşılık gelen gerçek API yok;
               sahtesini yapmak yerine dürüst "Yakında" rozetiyle devre dışı. */
            return (
              <button
                key={action.label}
                className={clsx(baseClass, "cursor-not-allowed opacity-55")}
                disabled
                title="Bu aksiyon için entegrasyon henüz hazır değil"
                type="button"
              >
                <span className={clsx("material-symbols-outlined text-[15px]", action.iconClass)}>
                  {action.icon}
                </span>
                <span>{action.label}</span>
                <span className="rounded bg-surface-container-high px-1 py-0.5 font-label-xs text-label-xs text-on-surface-variant">
                  Yakında
                </span>
              </button>
            );
          })}
        </div>
        <span
          className={clsx(
            "material-symbols-outlined shrink-0 text-[18px] text-outline",
            lead.focus && "transition-transform group-hover:translate-x-0.5"
          )}
        >
          chevron_right
        </span>
      </div>
    </div>
  );
}
