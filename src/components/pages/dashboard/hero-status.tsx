import Link from "next/link";
import { PageHeader } from "@/components/ui/page-shell";

/**
 * Dashboard başlığı (v2) — tek sakin satır: karşılama solda,
 * canlı AI durumu sağda tek gösterge olarak. Süslü alt paneller yok.
 */
export function HeroStatus() {
  return (
    <PageHeader
      title="Günaydın, Ahmet Bey"
      description="Limit Dershane Beylikdüzü Şubesi · 14 Ekim Pazartesi · Bugün 128 arama, %94 başarılı bağlantı"
      actions={
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest px-3.5 py-2 font-label-sm text-label-sm text-on-surface-variant md:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
            </span>
            3 görüşme sürüyor
          </span>
          <Link
            className="flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 font-label-md text-label-md font-medium text-on-surface transition-colors hover:bg-surface-container-low"
            href="/gorusmeler"
          >
            <span className="material-symbols-outlined text-[18px] text-primary-container">
              play_circle
            </span>
            <span>Canlı İzle</span>
          </Link>
        </div>
      }
    />
  );
}
