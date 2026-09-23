import { BeceriKarnesiView, type SkillObservationItem, type StudentOption } from "@/components/pages/beceri-karnesi/beceri-karnesi-view";
import { getLiveSkillObservations, getLiveHomeworkData } from "@/lib/server/queries";
import { odevPerformansHaritasi } from "@/lib/server/odev-performans";

export const metadata = { title: "Beceri Karnesi" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const [live, homework] = await Promise.all([
    getLiveSkillObservations(),
    getLiveHomeworkData(),
  ]);

  const students: StudentOption[] = (live?.contacts ?? [])
    .filter((c) => !c.do_not_call)
    .map((c) => ({
      id: c.id,
      label: c.student_name ?? "Öğrenci",
      grade: [c.student_grade, c.exam_type].filter(Boolean).join(" · "),
    }));

  const observations: SkillObservationItem[] = (live?.observations ?? []).map((o) => ({
    id: o.id,
    contact_id: o.contact_id,
    skill: o.skill,
    score: o.score,
    note: o.note,
    period: o.period,
    observed_by: o.observed_by,
    created_at: o.created_at,
  }));

  // M9.2: Ödev Disiplini — odev-performans.ts tek kaynaktan
  const odevDurumu: Record<string, { total: number; done: number; missing: number }> = {};
  for (const [contactId, p] of odevPerformansHaritasi(homework?.submissions ?? [])) {
    if (p.total > 0) odevDurumu[contactId] = { total: p.total, done: p.done, missing: p.missing };
  }

  return (
    <BeceriKarnesiView
      live={Boolean(live)}
      observations={observations}
      odevDurumu={odevDurumu}
      sourceLabel={
        live
          ? `Supabase canlı veri (${observations.length} gözlem)`
          : "Demo veri — Supabase bağlantısı bekleniyor"
      }
      students={students}
    />
  );
}
