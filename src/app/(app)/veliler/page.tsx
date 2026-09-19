import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { VelilerCrm } from "@/components/pages/veliler/veliler-crm";

export const metadata = { title: "Veliler (CRM)" };

export default function Page() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Veli Portföyü"
        title="Veliler (CRM)"
        description="AI lead puanlama ve otomatik takip ile veli portföyünü yönet."
      />
      <VelilerCrm />
    </PageShell>
  );
}
