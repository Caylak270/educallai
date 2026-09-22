"use client";

import { PageShell } from "@/components/ui/page-shell";

/** (app) segmenti hata sınırı — beklenmeyen render hatalarını yakalar, tekrar dener. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageShell>
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-container text-on-error-container">
          <span className="material-symbols-outlined text-[32px]">report</span>
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Bir şeyler ters gitti
          </h1>
          <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
            Sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar deneyin; sorun
            sürerse panoyu yenileyin.
          </p>
          {error.digest ? (
            <span className="font-mono-data text-mono-data text-outline">
              Hata kodu: {error.digest}
            </span>
          ) : null}
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-xl bg-primary-container px-space-lg font-title-sm text-title-sm font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.98]"
          type="button"
          onClick={reset}
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          <span>Tekrar Dene</span>
        </button>
      </div>
    </PageShell>
  );
}
