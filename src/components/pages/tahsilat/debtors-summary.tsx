"use client";

import { clsx } from "@/lib/clsx";
import { tl } from "@/lib/server/tahsilat-map";
import type { DebtorRow } from "@/lib/mock/installments";

const SHORT_DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

/**
 * Borçlular özeti — öğrenci/veli bazında toplam borç, ödenen, kalan ve
 * geciken tutar. Satıra tıklayınca alttaki taksit listesi o öğrenciye süzülür.
 */
export function DebtorsSummary({
  debtors,
  activeContactId,
  onSelect,
}: {
  debtors: DebtorRow[];
  /** Şu an listesi süzülen öğrenci (varsa satır vurgulanır). */
  activeContactId?: string | null;
  onSelect: (contactId: string) => void;
}) {
  const totalRemaining = debtors.reduce((sum, d) => sum + d.remaining, 0);
  const overdueTotal = debtors.reduce((sum, d) => sum + d.overdueAmount, 0);

  return (
    <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/50 px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Borçlular</h2>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            Öğrenci bazında kalan borç · satıra tıklayınca taksitleri listelenir
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {debtors.length} öğrenci
          </span>
          <span className="font-label-sm text-label-sm font-bold text-on-surface">
            Kalan: {tl(totalRemaining)}
          </span>
        </div>
      </header>

      {debtors.length === 0 ? (
        <p className="px-5 py-8 text-center font-body-sm text-body-sm text-on-surface-variant">
          Açık borç bulunan öğrenci yok — tüm taksitler kapandı.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/50">
                {["Öğrenci", "Taksit", "Toplam Borç", "Ödenen", "Kalan", "Geciken", "Sonraki Vade"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 font-label-xs text-label-xs font-medium text-on-surface-variant"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {debtors.map((d) => (
                <tr
                  key={d.contactId}
                  onClick={() => onSelect(d.contactId)}
                  className={clsx(
                    "cursor-pointer border-b border-outline-variant/40 transition-colors last:border-b-0 hover:bg-surface-container-low",
                    activeContactId === d.contactId && "bg-primary-container/20"
                  )}
                >
                  <td className="max-w-[220px] px-5 py-3">
                    <p className="truncate font-label-md text-label-md font-semibold text-on-surface">
                      {d.studentName}
                    </p>
                    <p className="truncate font-label-sm text-label-sm text-on-surface-variant">
                      {d.parentName} · {d.grade}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-label-md text-label-md text-on-surface-variant">
                    {d.paidCount}/{d.installmentCount}
                    <span className="ml-2 inline-block h-1.5 w-14 overflow-hidden rounded-full bg-surface-container align-middle">
                      <span
                        className="block h-full rounded-full bg-secondary"
                        style={{
                          width: `${d.installmentCount > 0 ? Math.round((d.paidCount / d.installmentCount) * 100) : 0}%`,
                        }}
                      />
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-label-md text-label-md text-on-surface-variant">
                    {tl(d.total)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-label-md text-label-md text-secondary">
                    {tl(d.paid)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-label-md text-label-md font-bold text-on-surface">
                    {tl(d.remaining)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {d.overdueAmount > 0 ? (
                      <span className="font-label-md text-label-md font-semibold text-error">
                        {tl(d.overdueAmount)}
                        <span className="ml-1 font-normal">
                          ({d.overdueCount} taksit)
                        </span>
                      </span>
                    ) : (
                      <span className="font-label-sm text-label-sm text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-label-md text-label-md text-on-surface-variant">
                    {d.nextDueDate ? SHORT_DATE.format(new Date(d.nextDueDate + "T00:00:00")) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            {overdueTotal > 0 ? (
              <tfoot>
                <tr className="border-t border-outline-variant/50">
                  <td className="px-5 py-2.5 font-label-sm text-label-sm font-semibold text-on-surface-variant" colSpan={5}>
                    Toplam geciken alacak
                  </td>
                  <td className="whitespace-nowrap px-5 py-2.5 font-label-md text-label-md font-bold text-error" colSpan={2}>
                    {tl(overdueTotal)}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      )}
    </section>
  );
}
