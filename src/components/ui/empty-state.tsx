import Link from "next/link";

/** Boş veri durumu — ikon + açıklama + isteğe bağlı aksiyon. */
export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-lowest px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </span>
      <div className="flex flex-col gap-1">
        <span className="font-title-sm text-title-sm font-semibold text-on-surface">
          {title}
        </span>
        {description ? (
          <span className="max-w-sm font-body-sm text-body-sm text-on-surface-variant">
            {description}
          </span>
        ) : null}
      </div>
      {action ? (
        <Link
          className="mt-1 flex h-9 items-center gap-1.5 rounded-lg bg-primary-container px-4 font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary"
          href={action.href}
        >
          <span>{action.label}</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      ) : null}
    </div>
  );
}
