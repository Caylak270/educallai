import { KpiSummary } from "@/components/pages/kampanyalar/kpi-summary";
import { CampaignList } from "@/components/pages/kampanyalar/campaign-list";
import { WizardCard } from "@/components/pages/kampanyalar/wizard-card";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { wizard } from "@/lib/mock/campaigns";

export const metadata = { title: "Kampanyalar" };

export default function Page() {
  return (
    <PageShell>
      <PageHeader
        title="Kampanyalar"
        description="AI sesli arama ve WhatsApp kampanyalarını tek yerden yönet: liste yükle, saatleri seç, KVKK onayını işaretle ve başlat."
      />

      <div className="flex flex-col gap-6">
        {/* KPI özet şeridi */}
        <KpiSummary />

        {/* Kampanya kartları (sekmeli filtre ile) */}
        <CampaignList />

        {/* Sihirbaz */}
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
              {wizard.sectionTitle}
            </h2>
            <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
              {wizard.sectionSubtitle}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary-fixed px-3 py-1 font-label-xs text-label-xs font-bold text-primary">
            {wizard.stepBadge}
          </span>
        </div>
        <WizardCard />
      </div>
    </PageShell>
  );
}
