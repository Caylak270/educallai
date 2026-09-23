import { ReferanslarView } from "@/components/pages/referanslar/referanslar-view";
import { getLiveReferrals } from "@/lib/server/queries";

export const metadata = { title: "Arkadaşını Getir" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const live = await getLiveReferrals();
  const byContact = new Map((live?.contacts ?? []).map((c) => [c.id, c]));

  const referrals = (live?.referrals ?? []).map((r) => ({
    ...r,
    referrerName: byContact.get(r.referrer_contact_id)?.parent_name ?? "Veli",
  }));

  return (
    <ReferanslarView
      contacts={(live?.contacts ?? [])
        .filter((c) => !c.do_not_call)
        .map((c) => ({ id: c.id, label: `${c.parent_name ?? "Veli"} · ${c.student_name ?? "Öğrenci"}` }))}
      live={Boolean(live)}
      referrals={referrals}
      sourceLabel={
        live
          ? `Supabase canlı veri (${referrals.length} referans)`
          : "Demo veri — Supabase bağlantısı bekleniyor"
      }
    />
  );
}
