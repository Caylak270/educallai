import { clsx } from "@/lib/clsx";
import type { ReactNode } from "react";

/**
 * Sayfa kabuğu (v2.1):
 * - Mobilde tam genişlik + 16px gutler
 * - PC'de (lg+) akışkan genişlik; aşırı geniş ekranlarda (2xl+) 1720px üst sınır
 *   (dar ortalanmış sütun sorunu yok)
 */
export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("w-full px-4 py-6 lg:px-6 lg:py-8 2xl:mx-auto 2xl:max-w-[1720px]", className)}>
      {children}
    </div>
  );
}

/**
 * Sayfa başlığı (v2): başlık + açıklama + sağda aksiyonlar.
 * Süs etiketi (eyebrow) yok — başlık doğrudan konuşur.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl font-body-md text-body-md text-on-surface-variant">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/**
 * Bölüm kartı (v2): beyaz yüzey + 1px çerçeve + 12px köşe.
 * Gölge yok; başlık yalnızca anlamlıysa gösterilir.
 */
export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-xl border border-outline-variant/60 bg-surface-container-lowest",
        className
      )}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-outline-variant/50 px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{subtitle}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={clsx("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/**
 * İstatistik hücresi (v2): sessiz etiket, büyük değer, renkli delta metni.
 * Rozet/pill yok — yön oku + renk yeterli.
 */
export function Stat({
  label,
  value,
  hint,
  delta,
  deltaTone = "neutral",
  valueTone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** Değerin altında yön gösteren kısa metin: "▲ %4,2 bu ay" gibi */
  delta?: ReactNode;
  deltaTone?: "positive" | "negative" | "neutral";
  valueTone?: "default" | "primary" | "secondary" | "error";
}) {
  return (
    <div className="min-w-0">
      <p className="truncate font-label-md text-label-md text-on-surface-variant">{label}</p>
      <p
        className={clsx(
          "mt-1 font-headline-lg text-headline-lg font-bold tracking-tight",
          valueTone === "primary" && "text-primary-container",
          valueTone === "secondary" && "text-secondary",
          valueTone === "error" && "text-error",
          valueTone === "default" && "text-on-surface"
        )}
      >
        {value}
      </p>
      {delta ? (
        <p
          className={clsx(
            "mt-1 inline-flex items-center gap-1 font-label-sm text-label-sm font-medium",
            deltaTone === "positive" && "text-secondary",
            deltaTone === "negative" && "text-error",
            deltaTone === "neutral" && "text-on-surface-variant"
          )}
        >
          {deltaTone === "positive" && (
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
          )}
          {deltaTone === "negative" && (
            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
          )}
          {delta}
        </p>
      ) : null}
      {hint && !delta ? (
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}
