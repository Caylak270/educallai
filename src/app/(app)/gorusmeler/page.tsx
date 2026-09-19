import { CallListBrowser } from "@/components/pages/gorusmeler/call-list-browser";
import { PageHeader, PageShell } from "@/components/ui/page-shell";

export const metadata = { title: "Görüşmeler" };

export default function Page() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="İletişim Geçmişi"
        title="Görüşmeler"
        description="Tüm AI ve danışman görüşmeleri: sesli aramalar, WhatsApp ve SMS kayıtları."
      />
      <CallListBrowser />
    </PageShell>
  );
}
