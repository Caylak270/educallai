import { clsx } from "@/lib/clsx";
import type { ReactNode } from "react";

/**
 * Sadeleştirilmiş sayfa kabuğu:
 * - Mobilde tam genişlik + 16px gutler
 * - PC'de (lg+) ortalanmış max 1280px, 24px gutler — dar sütun sorunu yok
 */
export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto w-full max-w-7xl px-4 py-6 lg:px-gutter lg:py-8", className)}>
      {children}
    </div>
  );
}

/**
 * Ortak sayfa başlığı: küçük üst etiket + başlık + açıklama + sağda aksiyonlar.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 font-label-xs text-label-xs font-semibold uppercase tracking-wider text-secondary">
            {eyebrow}
          </p>
        ) : null}
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
 * Sade bölüm kartı: beyaz zemin + ince çerçeve + başlık satırı.
 * İç içe renkli panellerin yerine geçer — tek yüzey, az görsel gürültü.
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
        "rounded-2xl border border-outline-variant/60 bg-surface-container-lowest",
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
 * Tek istatistik hücresi: küçük etiket üstte, büyük değer altta — renksiz, sade.
 */
export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "primary" | "secondary" | "error";
}) {
  return (
    <div className="min-w-0">
      <p className="truncate font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <p
        className={clsx(
          "mt-1 font-headline-lg text-headline-lg font-bold tracking-tight",
          accent === "primary" && "text-primary-container",
          accent === "secondary" && "text-secondary",
          accent === "error" && "text-error",
          !accent && "text-on-surface"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}
