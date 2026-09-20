import { CallListBrowser } from "@/components/pages/gorusmeler/call-list-browser";
import { PageHeader, PageShell } from "@/components/ui/page-shell";
import { getLiveCalls } from "@/lib/server/queries";

export const metadata = { title: "Görüşmeler" };
// Görüşme kayıtları canlı Supabase verisinden okunur; her istekte taze olmalı.
export const dynamic = "force-dynamic";

export default async function Page() {
  const live = await getLiveCalls();

  return (
    <PageShell>
      <PageHeader
        title="Görüşmeler"
        description="Tüm AI ve danışman görüşmeleri: sesli aramalar, WhatsApp ve SMS kayıtları."
      />
      {live ? (
        <CallListBrowser
          calls={live}
          sourceLabel={
            live.length === 0
              ? "Supabase bağlı — henüz görüşme kaydı yok."
              : `Supabase canlı veri (${live.length} kayıt)`
          }
        />
      ) : (
        <CallListBrowser sourceLabel="Demo veri — Supabase bağlantısı bekleniyor" />
      )}
    </PageShell>
  );
}
