import Link from "next/link";

/** Global 404 — olmayan route'lar ve bulunamayan kayıtlar için. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant">
        <span className="material-symbols-outlined text-[32px]">search_off</span>
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Sayfa bulunamadı
        </h1>
        <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
          Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.
        </p>
      </div>
      <Link
        className="flex h-11 items-center gap-2 rounded-xl bg-primary-container px-space-lg font-title-sm text-title-sm font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.98]"
        href="/"
      >
        <span className="material-symbols-outlined text-[18px]">home</span>
        <span>Genel Bakışa Dön</span>
      </Link>
    </div>
  );
}
