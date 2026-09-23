import { RiskPanelView } from "@/components/pages/risk-paneli/risk-panel-view";
import { getLiveRiskStudents } from "@/lib/server/queries";
import { buildRiskList } from "@/lib/server/risk-map";
import { getOgrenciEkosistemi } from "@/lib/server/ogrenci-ekosistem";

export const metadata = { title: "Öğrenci Risk Paneli" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const [live, ekosistem] = await Promise.all([
    getLiveRiskStudents(),
    getOgrenciEkosistemi(),
  ]);
  // A3: risk skoru artık ekosistem faktörlerini de içerir
  // (devamsızlık +10, gecikmiş taksit +15, katılmadığı davetler +5)
  const students = live ? buildRiskList(live, ekosistem?.durumlar) : [];

  return (
    <RiskPanelView
      sourceLabel={
        live
          ? `Supabase canlı veri (${students.length} öğrenci)`
          : "Demo veri — Supabase bağlantısı bekleniyor"
      }
      students={students}
    />
  );
}
