/** /gorusmeler listesi için örnek görüşme kayıtları. */

export type CallChannel = "voice" | "whatsapp" | "sms";
export type CallDirection = "inbound" | "outbound";
export type CallSentiment = "positive" | "neutral" | "negative" | "handoff";

export interface CallListItem {
  id: string;
  parentName: string;
  studentName: string;
  grade: string;
  channel: CallChannel;
  direction: CallDirection;
  sentiment: CallSentiment;
  durationSeconds: number | null;
  summary: string;
  /** Görsel tarih etiketi (mock) */
  when: string;
  sortKey: number; // sıralama için (dakika cinsinden "önce")
}

export const CHANNEL_LABELS: Record<CallChannel, string> = {
  voice: "Sesli",
  whatsapp: "WhatsApp",
  sms: "SMS",
};

export const SENTIMENT_LABELS: Record<CallSentiment, string> = {
  positive: "Memnun",
  neutral: "Nötr",
  negative: "Olumsuz",
  handoff: "Danışmana Aktarıldı",
};

export const callList: CallListItem[] = [
  {
    id: "deneme-1",
    parentName: "Ayşe Yılmaz",
    studentName: "Kerem Yılmaz",
    grade: "11. Sınıf · Sayısal",
    channel: "voice",
    direction: "inbound",
    sentiment: "positive",
    durationSeconds: 222,
    summary: "Cumartesi 14:00 kampüs ziyareti randevusu onaylandı, konum WhatsApp'tan iletildi.",
    when: "Bugün 14:25",
    sortKey: 25,
  },
  {
    id: "c2",
    parentName: "Zeynep Kaya",
    studentName: "Emre Kaya",
    grade: "11. Sınıf · Sayısal (YKS)",
    channel: "voice",
    direction: "outbound",
    sentiment: "positive",
    durationSeconds: 206,
    summary: "YKS paket fiyatları anlatıldı; matematik net endişesine birebir koçluk önerildi.",
    when: "Bugün 11:40",
    sortKey: 100,
  },
  {
    id: "c3",
    parentName: "Murat Demirtaş",
    studentName: "Elif Demirtaş",
    grade: "8. Sınıf · LGS",
    channel: "whatsapp",
    direction: "outbound",
    sentiment: "neutral",
    durationSeconds: null,
    summary: "Bursluluk sınavı tarihi + 2025 LGS başarı tablosu broşürü gönderildi.",
    when: "Bugün 10:05",
    sortKey: 160,
  },
  {
    id: "c4",
    parentName: "Selda Aydın",
    studentName: "Defne Aydın",
    grade: "12. Sınıf · Eşit Ağırlık",
    channel: "voice",
    direction: "outbound",
    sentiment: "handoff",
    durationSeconds: 178,
    summary: "Fiyat konusunda karar velide; taksit görüşmesi için danışmana aktarıldı.",
    when: "Dün 17:42",
    sortKey: 1180,
  },
  {
    id: "c5",
    parentName: "Bülent Tekin",
    studentName: "Çınar Tekin",
    grade: "12. Sınıf · Sayısal",
    channel: "sms",
    direction: "outbound",
    sentiment: "neutral",
    durationSeconds: null,
    summary: "Taksit hatırlatması (vade -3 gün) — ödeme bağlantısı iletildi.",
    when: "Dün 14:00",
    sortKey: 1360,
  },
  {
    id: "c6",
    parentName: "Elif Su Çelik",
    studentName: "Kaan Çelik",
    grade: "10. Sınıf · Sayısal",
    channel: "voice",
    direction: "inbound",
    sentiment: "negative",
    durationSeconds: 95,
    summary: "Deneme sonucuna itiraz; optik form okuma tekrarı için yetkiliye not bırakıldı.",
    when: "Dün 09:31",
    sortKey: 1570,
  },
  {
    id: "c7",
    parentName: "Fatma Demir",
    studentName: "Miraç Demir",
    grade: "8. Sınıf · LGS + VIP",
    channel: "whatsapp",
    direction: "inbound",
    sentiment: "positive",
    durationSeconds: null,
    summary: "Veli VIP sınıf kontenjanını sordu; yerleşkek kampüs broşürü ve ücret tablosu paylaşıldı.",
    when: "Pzt 18:20",
    sortKey: 2900,
  },
  {
    id: "c8",
    parentName: "Hasan Koç",
    studentName: "Barış Koç",
    grade: "12. Sınıf · Eşit Ağırlık",
    channel: "voice",
    direction: "outbound",
    sentiment: "neutral",
    durationSeconds: 143,
    summary: "Etüt randevusu hatırlatması; veli teyit etti, ders saati cumartesi 10:00 olarak güncellendi.",
    when: "Pzt 11:15",
    sortKey: 3170,
  },
];

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} dk ${String(s).padStart(2, "0")} sn`;
}
