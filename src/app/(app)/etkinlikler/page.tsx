import { EtkinliklerView } from "@/components/pages/etkinlikler/etkinlikler-view";
import { getLiveEvents } from "@/lib/server/queries";

export const metadata = { title: "Etkinlikler" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const live = await getLiveEvents();

  const invitesByEvent: Record<string, Array<{ invite: import("@/lib/types/db").EventInvite; label: string }>> = {};
  for (const invite of live?.invites ?? []) {
    const contact = live?.contacts.find((c) => c.id === invite.contact_id);
    const label = `${contact?.parent_name ?? "Veli"} · ${contact?.student_name ?? "Öğrenci"}`;
    (invitesByEvent[invite.event_id] ??= []).push({ invite, label });
  }

  return (
    <EtkinliklerView
      contacts={(live?.contacts ?? [])
        .filter((c) => !c.do_not_call)
        .map((c) => ({ id: c.id, label: `${c.parent_name ?? "Veli"} · ${c.student_name ?? "Öğrenci"}` }))}
      events={live?.events ?? []}
      invitesByEvent={invitesByEvent}
      live={Boolean(live)}
      sourceLabel={
        live
          ? `Supabase canlı veri (${(live?.events ?? []).length} etkinlik)`
          : "Demo veri — Supabase bağlantısı bekleniyor"
      }
    />
  );
}
