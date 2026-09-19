import Link from "next/link";
import { clsx } from "@/lib/clsx";
import { feedItems } from "@/lib/mock/kpis";

/* Son AI Görüşmeleri & Canlı İletişim Akışı */
export function LiveFeed() {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="mb-space-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Son AI Görüşmeleri
            </h2>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Canlı çağrı dökümleri ve WhatsApp etkileşim özeti
          </p>
        </div>
        <button
          className="flex h-8 items-center gap-1 rounded-lg bg-surface-container px-3 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">sync</span>
          <span>Yenile</span>
        </button>
      </div>

      {/* Akış kartları */}
      <div className="space-y-3">
        {feedItems.map((item) => (
          <div
            key={item.id}
            className="space-y-2 rounded-xl bg-surface p-space-md transition-colors hover:bg-surface-container-low"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "flex h-7 w-7 items-center justify-center rounded-lg",
                    item.iconWrapClass
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                </span>
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  {item.parent}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {item.context}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-xs text-label-xs font-semibold",
                    item.pill.className
                  )}
                >
                  {item.pill.text}
                </span>
                <span className="font-label-xs text-label-xs text-on-surface-variant">
                  {item.meta}
                </span>
              </div>
            </div>
            <p className="pl-9 font-body-sm text-body-sm text-on-surface-variant">{item.summary}</p>
            {item.handoff ? (
              <div className="flex items-center gap-3 pl-9 font-label-xs text-label-xs font-semibold text-primary-container">
                <span className="inline-flex items-center gap-1 rounded bg-primary-container/10 px-2 py-0.5">
                  <span className="material-symbols-outlined text-[12px]">priority_high</span>{" "}
                  Danışman Geri Dönüşü Bekleniyor
                </span>
              </div>
            ) : (
              item.links && (
                <div className="flex items-center gap-3 pl-9 font-label-xs text-label-xs font-medium text-secondary">
                  {item.links.map((link, index) => (
                    <span key={link.label} className="flex items-center gap-3">
                      {index > 0 && <span>•</span>}
                      <button className="flex items-center gap-0.5 hover:underline" type="button">
                        <span className="material-symbols-outlined text-[14px]">
                          {link.icon}
                        </span>{" "}
                        {link.label}
                      </button>
                    </span>
                  ))}
                </div>
              )
            )}
          </div>
        ))}
      </div>

      <div className="pt-3">
        <Link
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-low py-2 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
          href="/gorusmeler"
        >
          <span>Tüm Görüşme Kayıtlarını Filtrele (128 Görüşme)</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
