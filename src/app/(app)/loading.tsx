import { PageShell } from "@/components/ui/page-shell";

/** Sayfa geçişlerinde içerik yerine gösterilen iskelet yükleme görünümü. */
export default function Loading() {
  return (
    <PageShell>
      <div aria-busy="true" aria-live="polite" className="flex w-full flex-col gap-6">
        {/* Başlık iskeleti */}
        <div className="flex flex-col gap-3">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-container-high" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-surface-container" />
        </div>
        {/* KPI satırı */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-surface-container-lowest"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        {/* İçerik panoları */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-72 animate-pulse rounded-2xl bg-surface-container-lowest lg:col-span-7" />
          <div className="h-72 animate-pulse rounded-2xl bg-surface-container-lowest lg:col-span-5" />
        </div>
        <div className="h-56 animate-pulse rounded-2xl bg-surface-container-lowest" />
        <span className="sr-only">Sayfa yükleniyor...</span>
      </div>
    </PageShell>
  );
}
