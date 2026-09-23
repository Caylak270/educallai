import { RandevularView } from "@/components/pages/randevular/randevular-view";
import { getLiveAppointments } from "@/lib/server/queries";
import { buildRandevularView } from "@/lib/server/randevular-map";
import { appointmentDays } from "@/lib/mock/appointments";

export const metadata = { title: "Randevular" };
// Randevular canlı Supabase'den okunur; her istekte taze olmalı.
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ odak?: string }>;
}) {
  const { odak } = await searchParams;
  const live = await getLiveAppointments();
  const view = live ? buildRandevularView(live.appointments, live.contacts) : null;
  const contactOptions = (live?.contacts ?? []).map((c) => ({
    id: c.id,
    label: `${c.parent_name ?? "Veli"} · ${c.student_name ?? "Öğrenci"}`,
  }));

  return (
    <RandevularView
      autoOpen={odak === "yeni"}
      contacts={contactOptions}
      days={view?.days ?? appointmentDays}
      live={Boolean(view)}
      sourceLabel={
        view
          ? `Supabase canlı veri (${view.days.reduce((n, d) => n + d.items.length, 0)} randevu)`
          : "Demo veri — Supabase bağlantısı bekleniyor"
      }
      stats={
        view?.stats ?? { today: "0", week: "0", pending: "0", noShowRate: "—" }
      }
    />
  );
}
