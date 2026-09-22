import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { VelilerCrm } from "@/components/pages/veliler/veliler-crm";
import { buildLeadsView, computeChipCounts } from "@/lib/server/leads-map";
import { getLiveLeads } from "@/lib/server/queries";

export const metadata = { title: "Veliler (CRM)" };
// Kanban verisi canlı Supabase'den okunur; her istekte taze olmalı.
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; odak?: string }>;
}) {
  const { q, odak } = await searchParams;
  const liveLeads = await getLiveLeads();

  return (
    <PageShell>
      <PageHeader
        title="Veliler (CRM)"
        description="AI lead puanlama ve otomatik takip ile veli portföyünü yönet."
      />
      {liveLeads ? (
        <VelilerCrm
          initialQuery={q ?? ""}
          autoFocusSearch={odak === "ara"}
          leads={buildLeadsView(liveLeads)}
          chipCounts={computeChipCounts(liveLeads)}
          sourceLabel={
            liveLeads.length === 0
              ? "Supabase bağlı — henüz lead yok."
              : `Supabase canlı veri (${liveLeads.length} veli)`
          }
        />
      ) : (
        <VelilerCrm
          initialQuery={q ?? ""}
          autoFocusSearch={odak === "ara"}
          sourceLabel="Demo veri — Supabase bağlantısı bekleniyor"
        />
      )}
    </PageShell>
  );
}
