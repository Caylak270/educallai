import { KpiSummary } from "@/components/pages/kampanyalar/kpi-summary";
import { CampaignList } from "@/components/pages/kampanyalar/campaign-list";
import { WizardCard } from "@/components/pages/kampanyalar/wizard-card";
import { wizard } from "@/lib/mock/campaigns";

export const metadata = { title: "Kampanyalar" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex w-full flex-col gap-4 px-space-md py-space-md pb-10">
        {/* KPI özet satırı */}
        <KpiSummary />

        {/* Kampanya kartları (sekmeli filtre ile) */}
        <CampaignList />

        {/* Sihirbaz bölümü başlığı */}
        <div className="pt-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">{wizard.sectionTitle}</h2>
              <p className="text-xs text-on-surface-variant">{wizard.sectionSubtitle}</p>
            </div>
            <span className="rounded-md bg-primary-fixed px-2 py-0.5 text-[11px] font-bold text-primary">
              {wizard.stepBadge}
            </span>
          </div>
        </div>

        {/* Sihirbaz kartı */}
        <WizardCard />
      </div>
    </div>
  );
}
