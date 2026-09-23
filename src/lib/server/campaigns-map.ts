/**
 * Supabase campaigns → Kampanyalar ekran modeli (mock Campaign tipi).
 * Kanal, ilerleme ve durum canlı satırlardan türetilir.
 */

import type { Campaign as CampaignView, CampaignStatus } from "@/lib/mock/campaigns";
import type { Campaign } from "@/lib/types/db";

const CHANNEL_LABEL: Record<string, string> = {
  voice: "Sesli Arama",
  whatsapp: "WhatsApp",
  sms: "SMS",
};

function statusToMock(status: string): CampaignStatus {
  if (status === "running") return "aktif";
  if (status === "paused") return "duraklatildi";
  if (status === "completed") return "tamamlandi";
  // draft | scheduled → "Duraklatıldı/Taslak" sekmesinde listelenir;
  // draft olanlara ayrıca "Taslak" rozeti verilir (aşağıda).
  return "duraklatildi";
}

/** Tarih alanını tr-TR kısa tarih metnine çevirir; boşsa undefined döner. */
function formatDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

/** Canlı kampanya satırlarını ekran modeline çevirir. */
export function buildCampaignsView(rows: Campaign[]): CampaignView[] {
  return rows.map((row) => {
    const total = row.total_targets ?? 0;
    const contacted = row.contacted ?? 0;
    const progressPct = total > 0 ? Math.round((contacted / total) * 100) : 0;
    const status = statusToMock(row.status);
    const isRunning = row.status === "running";
    const isDraft = row.status === "draft";

    return {
      id: row.id,
      title: row.name,
      subtitle: `${CHANNEL_LABEL[row.channel] ?? row.channel} · ${row.script?.slice(0, 60) ?? "AI kampanya"}`,
      status,
      // Taslak kampanyalar Duraklatıldı grubunda ama "Taslak" rozetiyle görünür.
      badgeLabel: isDraft ? "Taslak" : undefined,
      highlight: isRunning,
      liveCall: isRunning
        ? { label: "Canlı Arama Yapılıyor:", value: "dialer aktif" }
        : undefined,
      progress: {
        label: "Arama İlerlemesi",
        value: `${contacted} / ${total} veli`,
        valueAccent: undefined,
        width: progressPct,
      },
      stats: [
        { label: "Ulaşılan", value: String(row.answered ?? 0) },
        { label: "Randevu", value: String(row.appointments ?? 0) },
        { label: "Başarı", value: `%${contacted > 0 ? Math.round(((row.answered ?? 0) / contacted) * 100) : 0}` },
      ],
      scheduleLabel: row.scheduled_at
        ? `Plan: ${new Date(row.scheduled_at).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
        : undefined,
      // "Detay" paneli içeriği: kanal, hedef sayısı, başlangıç ve örnek script.
      detail: {
        channel: CHANNEL_LABEL[row.channel] ?? row.channel,
        targetCount: total,
        startDate: formatDate(row.started_at ?? row.scheduled_at ?? row.created_at),
        script: row.script ?? undefined,
      },
      // pause/resume kartın GÜNCEL durumuna göre seçilir; her ikisi de verildiğinden
      // duraklat → devam → duraklat döngüsü çalışır.
      controls:
        status === "tamamlandi"
          ? ["report" as const]
          : (["pause", "resume", "report"] as const),
    } satisfies CampaignView;
  });
}
