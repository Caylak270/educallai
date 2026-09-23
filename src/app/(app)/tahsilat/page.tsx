import { BatchCallTrigger } from "@/components/pages/tahsilat/batch-call-trigger";
import { DebtEntryCard } from "@/components/pages/tahsilat/debt-entry-card";
import { PaymentProjection } from "@/components/pages/tahsilat/payment-projection";
import { PipelineStepper } from "@/components/pages/tahsilat/pipeline-stepper";
import { StatsSection } from "@/components/pages/tahsilat/stats-section";
import { TahsilatBoard } from "@/components/pages/tahsilat/tahsilat-board";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { installmentRecords } from "@/lib/mock/installments";
import type { DebtorContactOption } from "@/lib/mock/installments";
import { getLiveInstallments } from "@/lib/server/queries";
import { buildTahsilatView } from "@/lib/server/tahsilat-map";

export const metadata = { title: "Tahsilat" };
// Taksit durumu canlı Supabase'den okunur; her istekte taze olmalı.
export const dynamic = "force-dynamic";

export default async function Page() {
  const live = await getLiveInstallments();
  const view = live ? buildTahsilatView(live.installments, live.contacts) : null;

  // Borç giriş formunun öğrenci/veli seçenekleri: canlıda contacts, demoda mock.
  const contactOptions: DebtorContactOption[] = live
    ? live.contacts.map((c) => ({
        id: c.id,
        parentName: c.parent_name ?? "Veli",
        studentName: c.student_name ?? "Öğrenci",
        grade: c.student_grade ?? "—",
        phone: c.phone ?? undefined,
      }))
    : installmentRecords.map((r) => ({
        id: r.id,
        parentName: r.parentName,
        studentName: r.studentName,
        grade: r.gradeTag,
      }));

  // Toplu arama hedefleri: geciken (ödenmemiş) taksitlerin velileri.
  // Telefon contacts.phone'dan gelir; yoksa bileşen /veliler?q= aramasına yönlenir.
  const batchTargets = view
    ? view.records
        .filter((r) => r.filters.includes("overdue"))
        .map((r) => ({ id: r.id, name: r.parentName, phone: r.phone }))
    : undefined;

  return (
    <PageShell>
      <PageHeader
        title="Tahsilat"
        description="Borç girişi, taksit takibi ve kademeli AI eskalasyon akışı"
      />

      <div className="flex flex-col gap-6 pb-4">
        <DebtEntryCard contacts={contactOptions} />
        <StatsSection stats={view?.stats} />
        <TahsilatBoard
          records={view?.records}
          debtors={view?.debtors}
          sourceLabel={
            view
              ? `Supabase canlı veri (${view.records.length} taksit)`
              : "Demo veri — Supabase bağlantısı bekleniyor"
          }
        />
        <PipelineStepper stages={view?.stages} />
        {view ? <PaymentProjection projection={view.projection} /> : null}
      </div>

      <BatchCallTrigger targets={batchTargets} />
    </PageShell>
  );
}
