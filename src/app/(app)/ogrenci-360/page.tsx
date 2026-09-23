import { OgrenciEkosistemPaneli } from "@/components/ogrenci/ogrenci-ekosistem-paneli";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { getOgrenciEkosistemi } from "@/lib/server/ogrenci-ekosistem";

export const metadata = { title: "Öğrenci 360" };
// Ekosistem kartı tüm modüllerden canlı beslenir; her istekte taze olmalı.
export const dynamic = "force-dynamic";

export default async function Page() {
  const ekosistem = await getOgrenciEkosistemi();

  return (
    <PageShell>
      <PageHeader
        title="Öğrenci 360"
        description="Bir öğrencinin tüm modüllerdeki kayıtları tek kartta: ödev, yoklama, deneme, beceri, tahsilat, etkinlik, görüşme ve randevu. Bir modülde yapılan değişiklik burada anında görünür."
      />
      <OgrenciEkosistemPaneli
        students={(ekosistem?.contacts ?? []).map((c) => ({
          id: c.id,
          label: c.student_name ?? "Öğrenci",
          grade: [c.student_grade, c.exam_type].filter(Boolean).join(" · "),
          gradeRaw: c.student_grade,
        }))}
        durumlar={ekosistem?.durumlar ?? {}}
        program={(ekosistem?.program ?? []).map((p) => ({
          name: p.name,
          classLevel: p.class_level,
          teacher: p.teacher,
          room: p.room,
          dayOfWeek: p.day_of_week,
          startTime: p.start_time,
          durationMinutes: p.duration_minutes,
        }))}
        live={Boolean(ekosistem)}
      />
    </PageShell>
  );
}
