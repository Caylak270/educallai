import { AppointmentsTimeline } from "@/components/pages/dashboard/appointments-timeline";
import { FunnelCard } from "@/components/pages/dashboard/funnel-card";
import { ExamCountdown } from "@/components/pages/dashboard/exam-countdown";
import { HeroStatus } from "@/components/pages/dashboard/hero-status";
import { HotLeadsTable } from "@/components/pages/dashboard/hot-leads-table";
import { KpiCards } from "@/components/pages/dashboard/kpi-cards";
import { LiveFeed } from "@/components/pages/dashboard/live-feed";
import { RangeRefresher } from "@/components/pages/dashboard/range-refresher";
import { TahsilatCard } from "@/components/pages/dashboard/tahsilat-card";
import { OgrenciHareketAkisi, type HareketSatiri } from "@/components/ogrenci/ogrenci-hareket-akisi";
import { PageShell } from "@/components/ui/page-shell";
import { getLiveDashboard, getLiveExamSchedule } from "@/lib/server/queries";
import { getOgrenciEkosistemi } from "@/lib/server/ogrenci-ekosistem";
import { buildDashboardView } from "@/lib/server/dashboard-map";
import { cookies } from "next/headers";

export const metadata = { title: "Genel Bakış" };
// KPI'lar canlı Supabase tablolarından üretilir; her istekte taze olmalı.
export const dynamic = "force-dynamic";

export default async function Page() {
  const [live, schedule, ekosistem, cookieStore] = await Promise.all([
    getLiveDashboard(),
    getLiveExamSchedule(),
    getOgrenciEkosistemi(),
    cookies(),
  ]);
  // Topbar tarih aralığı çerezden okunur (DateRangeMenu yazıyor)
  const rangeDays = Number(cookieStore.get("educallai-range-days")?.value) || 30;
  const view = live
    ? buildDashboardView(
        live.leads,
        live.contacts,
        live.signals,
        live.installments,
        live.appointments,
        live.handoffs,
        rangeDays
      )
        : null;

  // A5: tüm modüllerden birleşik öğrenci hareketleri (en yeniler)
  const isimler = new Map(
    (ekosistem?.contacts ?? []).map((c) => [c.id, c.student_name ?? "Öğrenci"])
  );
  const hareketler: HareketSatiri[] = [];
  for (const durum of Object.values(ekosistem?.durumlar ?? {})) {
    const ad = isimler.get(durum.contact_id) ?? "Öğrenci";
    for (const f of durum.faaliyetler) hareketler.push({ ...f, ogrenci: ad });
  }
  hareketler.sort(
    (a, b) => new Date(b.ts ?? 0).getTime() - new Date(a.ts ?? 0).getTime()
  );

  return (
    <PageShell>
      {/* Tarih aralığı değişince sayfayı sunucudan tazelet */}
      <RangeRefresher />
      <div className="flex w-full flex-col gap-6">
        {/* 1. Hero & AI durum şeridi */}
        <HeroStatus />
        {/* 1b. Sıradaki sınav geri sayımı */}
        <ExamCountdown exams={schedule} />
        {/* 2. KPI metrik kartları */}
        <p className="-mt-4 flex items-center gap-1.5 font-label-xs text-label-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px]">date_range</span>
          KPI&apos;lar {rangeDays <= 1 ? "bugün" : `son ${rangeDays} gün`} penceresine göre —
          topbar&apos;dan değiştirebilirsiniz
        </p>
        <KpiCards kpis={view?.kpis} />
        {/* 3. Dönüşüm hunisi & tahsilat (7:5) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <FunnelCard steps={view?.funnel} />
          <TahsilatCard segments={view?.tahsilat} />
        </div>
        {/* 4. Aranmayı Bekleyen Sıcak Leadler */}
        <HotLeadsTable leads={view?.hotLeads} />
        {/* 5. Bugünün randevuları & canlı görüşme akışı */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AppointmentsTimeline appointments={view?.appointments} />
          <LiveFeed feed={view?.feed} />
        </div>
        {/* 6. Öğrenci hareketleri — tüm modüllerden birleşik akış (A5) */}
        <OgrenciHareketAkisi items={hareketler.slice(0, 15)} />
      </div>
    </PageShell>
  );
}
