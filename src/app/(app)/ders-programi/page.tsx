import {
  DersProgramiView,
  type ScheduleSlotVM,
} from "@/components/pages/ders-programi/ders-programi-view";
import { getLiveScheduleSlots } from "@/lib/server/queries";
import { buildDemoScheduleSlots } from "@/lib/mock/schedule";

export const metadata = { title: "Ders Programı" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const live = await getLiveScheduleSlots();

  const slots: ScheduleSlotVM[] = (live?.slots ?? []).map((s) => ({
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

  // Canlı veri yoksa demo sabit program
  const gorunen = live ? slots : buildDemoScheduleSlots();

  return (
    <DersProgramiView
      slots={gorunen}
      live={Boolean(live)}
      sourceLabel={
        live
          ? `Supabase canlı veri (${gorunen.length} ders)`
          : "Demo veri — Supabase bağlantısı bekleniyor"
      }
    />
  );
}
