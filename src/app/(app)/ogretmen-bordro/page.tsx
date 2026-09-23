import {
  OgretmenBordroView,
  type OgretmenUcretiVM,
} from "@/components/pages/ogretmen-bordro/ogretmen-bordro-view";
import type { ScheduleSlotVM } from "@/components/pages/ders-programi/ders-programi-view";
import { getLiveScheduleSlots, getLiveTeacherRates } from "@/lib/server/queries";
import { buildDemoScheduleSlots, demoOgretmenUcretleri } from "@/lib/mock/schedule";

export const metadata = { title: "Öğretmen Bordro" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const [schedule, rates] = await Promise.all([
    getLiveScheduleSlots(),
    getLiveTeacherRates(),
  ]);

  const slots: ScheduleSlotVM[] = (schedule?.slots ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    subject: s.subject,
    classLevel: s.class_level,
    teacher: s.teacher,
    room: s.room,
    dayOfWeek: s.day_of_week,
    startTime: s.start_time,
    durationMinutes: s.duration_minutes,
  }));

  const ucretler: OgretmenUcretiVM[] = (rates ?? []).map((r) => ({
    teacher: r.teacher,
    hourlyRate: Number(r.hourly_rate),
  }));

  const gorunenSlotlar = schedule?.slots ? slots : buildDemoScheduleSlots();
  const gorunenUcretler = rates ? ucretler : demoOgretmenUcretleri;
  const canli = Boolean(schedule?.slots);

  return (
    <OgretmenBordroView
      slots={gorunenSlotlar}
      rates={gorunenUcretler}
      live={canli}
      sourceLabel={
        canli
          ? "Supabase canlı veri (sabit program + ücretler)"
          : "Demo veri — Supabase bağlantısı bekleniyor"
      }
    />
  );
}
