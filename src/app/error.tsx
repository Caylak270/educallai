"use client";

/** Kök hata sınırı — (app) dışındaki segmentler için. */
export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-container text-on-error-container">
        <span className="material-symbols-outlined text-[32px]">report</span>
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Bir şeyler ters gitti
        </h1>
        <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
          Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>
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
  );
}
