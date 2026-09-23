import { VeliBulteniView } from "@/components/pages/veli-bulteni/veli-bulteni-view";
import { getLiveBulletinData, getLiveHomeworkData, getLiveEvents } from "@/lib/server/queries";
import { buildBulletins } from "@/lib/server/bulletin-map";

export const metadata = { title: "Veli Bülteni" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const [live, homework, events] = await Promise.all([
    getLiveBulletinData(),
    getLiveHomeworkData(),
    getLiveEvents(),
  ]);
  const bundle = live
    ? buildBulletins(
        live.contacts,
        live.exams,
        live.attendance,
        live.skills,
        "Limit Dershane Beylikdüzü",
        homework?.submissions ?? [],
        events?.events ?? [],
        events?.invites ?? []
      )
    : { students: [], dershaneName: "Dershane" };

  return (
    <VeliBulteniView
      bundle={bundle}
      live={Boolean(live)}
      sourceLabel={
        live
          ? `Supabase canlı veri (${bundle.students.length} öğrenci)`
          : "Demo veri — Supabase bağlantısı bekleniyor"
      }
    />
  );
}
