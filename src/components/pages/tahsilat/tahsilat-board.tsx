"use client";

import { useState } from "react";
import type { DebtorRow, InstallmentRecord } from "@/lib/mock/installments";
import { DebtorsSummary } from "./debtors-summary";
import { InstallmentsBrowser } from "./installments-browser";

/**
 * Borçlular özeti + taksit listesi arasındaki bağ: borçlu satırına tıklanınca
 * liste o öğrenciye süzülür (Tahsilat sayfası sunucu bileşeni olduğu için
 * paylaşılan durum burada tutulur).
 */
export function TahsilatBoard({
  records,
  debtors,
  sourceLabel,
}: {
  records?: InstallmentRecord[];
  debtors?: DebtorRow[];
  sourceLabel?: string;
}) {
  const [focusContactId, setFocusContactId] = useState<string | null>(null);
  // Borçlu satırı etiketi — süzme çipinde gösterilir
  const focused = debtors?.find((d) => d.contactId === focusContactId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      {debtors ? (
        <DebtorsSummary
          debtors={debtors}
          activeContactId={focusContactId}
          onSelect={(id) => setFocusContactId((prev) => (prev === id ? null : id))}
        />
      ) : null}

      <InstallmentsBrowser
        records={records}
        sourceLabel={sourceLabel}
        focusContactId={focusContactId}
        focusLabel={focused ? `${focused.studentName} (${focused.parentName})` : null}
        onClearFocus={() => setFocusContactId(null)}
      />
    </div>
  );
}
