import { BatchCallTrigger } from "@/components/pages/tahsilat/batch-call-trigger";
import { InstallmentsBrowser } from "@/components/pages/tahsilat/installments-browser";
import { PipelineStepper } from "@/components/pages/tahsilat/pipeline-stepper";
import { StatsSection } from "@/components/pages/tahsilat/stats-section";
import { PageHeader, PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "Tahsilat" };

export default function Page() {
  return (
    <PageShell>
      <PageHeader
        title="Tahsilat"
        description="Taksit takibi ve kademeli AI eskalasyon akışı"
      />

      <div className="flex flex-col gap-6 pb-4">
        <StatsSection />
        <PipelineStepper />
        <InstallmentsBrowser />
      </div>

      <BatchCallTrigger />
    </PageShell>
  );
}
