import type { TahsilatView } from "@/lib/server/tahsilat-map";

/**
 * M7 — Ödeme Projeksiyonu: vade bazlı nakit akışı (4 ay) +
 * gecikme yaşlandırması. Tümü canlı installment_tracker'dan hesaplanır.
 */
export function PaymentProjection({
  projection,
}: {
  projection: TahsilatView["projection"];
}) {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Vade bazlı nakit akışı */}
      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Nakit Akış Projeksiyonu
          </h2>
          <span className="font-label-xs text-label-xs text-on-surface-variant">
            Vade bazlı · önümüzdeki dönem
          </span>
        </div>
        {projection.months.length === 0 ? (
          <p className="py-6 text-center font-body-sm text-body-sm text-on-surface-variant">
            Bekleyen taksit yok.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {projection.months.map((month) => (
              <div key={month.label} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-label-sm text-label-sm font-semibold capitalize text-on-surface">
                    {month.label}
                    <span className="ml-1.5 font-normal text-on-surface-variant">
                      ({month.count} taksit)
                    </span>
                  </span>
                  <span className="shrink-0 font-label-sm text-label-sm font-bold text-on-surface">
                    {month.amount}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="anim-bar h-full rounded-full bg-primary-container"
                    style={{ width: `${month.width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 border-t border-outline-variant/50 pt-3 font-label-sm text-label-sm text-on-surface-variant">
          Toplam bekleyen tahsilat:{" "}
          <span className="font-bold text-on-surface">{projection.totalPending}</span>
        </p>
      </div>

      {/* Gecikme yaşlandırması */}
      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            Gecikme Yaşlandırması
          </h2>
          <span className="font-label-xs text-label-xs text-on-surface-variant">
            Vade geçmiş taksitler
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {projection.aging.map((bucket) => (
            <div
              key={bucket.label}
              className="flex items-center gap-3 rounded-xl border border-outline-variant/50 p-3"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  bucket.tone === "critical"
                    ? "bg-error-container text-on-error-container"
                    : bucket.tone === "error"
                      ? "bg-error-container/60 text-on-error-container"
                      : "bg-tertiary-container text-on-tertiary-container"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">hourglass_bottom</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-label-md text-label-md font-semibold text-on-surface">
                  {bucket.label}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {bucket.count} taksit
                </p>
              </div>
              <span
                className={`shrink-0 font-label-md text-label-md font-bold ${
                  bucket.tone === "tertiary" ? "text-tertiary" : "text-error"
                }`}
              >
                {bucket.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
