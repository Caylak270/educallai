import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { VelilerCrm } from "@/components/pages/veliler/veliler-crm";

export const metadata = { title: "Veliler (CRM)" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <PageShell>
      <PageHeader
        title="Veliler (CRM)"
        description="AI lead puanlama ve otomatik takip ile veli portföyünü yönet."
      />
      <VelilerCrm initialQuery={q ?? ""} />
    </PageShell>
  );
}
