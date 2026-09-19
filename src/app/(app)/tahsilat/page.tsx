import { BatchCallTrigger } from "@/components/pages/tahsilat/batch-call-trigger";
import { InstallmentsBrowser } from "@/components/pages/tahsilat/installments-browser";
import { PipelineStepper } from "@/components/pages/tahsilat/pipeline-stepper";
import { StatsSection } from "@/components/pages/tahsilat/stats-section";

export const metadata = { title: "Tahsilat" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-xl pb-16">
      <StatsSection />
      <PipelineStepper />
      <InstallmentsBrowser />
      <BatchCallTrigger />
    </div>
  );
}
