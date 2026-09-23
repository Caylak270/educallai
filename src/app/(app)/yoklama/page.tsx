import { YoklamaView, type YoklamaContact } from "@/components/pages/yoklama/yoklama-view";
import { getLiveAttendanceData } from "@/lib/server/queries";
import type { AttendanceStatus } from "@/lib/types/db";

export const metadata = { title: "Devamsızlık & Yoklama" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const live = await getLiveAttendanceData();
  // Dersler sorgu katmanında "bugüne en yakın" sırasıyla gelir

  const contacts: YoklamaContact[] = (live?.contacts ?? [])
    .filter((c) => !c.do_not_call)
    .map((c) => ({
      id: c.id,
      studentName: c.student_name ?? "Öğrenci",
      parentName: c.parent_name ?? "Veli",
      grade: [c.student_grade, c.exam_type].filter(Boolean).join(" · "),
      phone: c.phone ?? "",
    }));

  // lesson_id → contact_id → status
  const initialMarks: Record<string, Record<string, AttendanceStatus>> = {};
  for (const row of live?.attendance ?? []) {
    initialMarks[row.lesson_id] ??= {};
    initialMarks[row.lesson_id][row.contact_id] = row.status;
  }

  return (
    <YoklamaView
      contacts={contacts}
      initialMarks={initialMarks}
      lessons={live?.lessons ?? []}
      live={Boolean(live)}
      sourceLabel={
        live
          ? `Supabase canlı veri (${live.lessons.length} ders, ${contacts.length} öğrenci)`
          : "Demo veri — Supabase bağlantısı bekleniyor"
      }
    />
  );
}
