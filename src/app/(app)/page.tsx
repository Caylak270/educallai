import { AppointmentsTimeline } from "@/components/pages/dashboard/appointments-timeline";
import { FunnelCard } from "@/components/pages/dashboard/funnel-card";
import { HeroStatus } from "@/components/pages/dashboard/hero-status";
import { HotLeadsTable } from "@/components/pages/dashboard/hot-leads-table";
import { KpiCards } from "@/components/pages/dashboard/kpi-cards";
import { LiveFeed } from "@/components/pages/dashboard/live-feed";
import { TahsilatCard } from "@/components/pages/dashboard/tahsilat-card";

export const metadata = { title: "Genel Bakış" };

export default function Page() {
  return (
    <div className="flex w-full flex-col gap-space-lg px-space-lg py-space-lg pb-12">
      {/* 1. Hero & AI durum şeridi */}
      <HeroStatus />
      {/* 2. KPI metrik kartları */}
      <KpiCards />
      {/* 3. Dönüşüm hunisi & tahsilat (7:5) */}
      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
        <FunnelCard />
        <TahsilatCard />
      </div>
      {/* 4. Aranmayı Bekleyen Sıcak Leadler */}
      <HotLeadsTable />
      {/* 5. Bugünün randevuları & canlı görüşme akışı */}
      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <AppointmentsTimeline />
        <LiveFeed />
      </div>
    </div>
  );
}
