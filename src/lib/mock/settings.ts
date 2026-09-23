/**
 * Ayarlar sayfası (AI Asistan Yetenekleri ve Operasyon Kuralları) mock verileri.
 * Tasarım kaynağı: design/screens/07-ayarlar.web.html
 */

export type CapabilityBadgeTone = "primary" | "secondary" | "neutral" | "tertiary";

export type CapabilityToggle = {
  id: string;
  icon: string;
  title: string;
  badge: string;
  badgeTone: CapabilityBadgeTone;
  description: string;
  /** true ise toggle altına ajan yönlendirme kutusu gelir. */
  hasRoutingBox?: boolean;
};

export const capabilityToggles: CapabilityToggle[] = [
  {
    id: "pricing",
    icon: "sell",
    title: "Fiyat ve İndirim Paylaşabilir",
    badge: "YKS & LGS 2025",
    badgeTone: "primary",
    description:
      "AI, kurumun güncel eğitim ücretlerini ve erken kayıt indirim baremlerini veliyle paylaşır. Kampanyalı peşin/taksit fiyatlarını seslendirir.",
  },
  {
    id: "appointment",
    icon: "calendar_today",
    title: "Randevu Oluşturabilir",
    badge: "Takvim Entegre",
    badgeTone: "secondary",
    description:
      "Google Calendar ve kurum rehberlik ajandasına direkt entegre olarak şube ziyareti veya seviye tespit randevusu organize eder.",
  },
  {
    id: "exam-results",
    icon: "fact_check",
    title: "Deneme Sınavı Sonucu Sorgulayabilir",
    badge: "TC / No Doğrulama",
    badgeTone: "neutral",
    description:
      "Veli T.C. Kimlik No veya Öğrenci Okul No doğrulandığında son TYT/AYT deneme net ve şube/genel sıralama bilgilerini aktarır.",
  },
  {
    id: "whatsapp-note",
    icon: "chat",
    title: "WhatsApp ile Konum ve Bilgi Notu Gönderebilir",
    badge: "Meta Business API",
    badgeTone: "secondary",
    description:
      "Görüşme sonrasında velinin onayladığı şube konumunu (Google Maps) ve güncel kayıt broşürü PDF dosyasını anında iletir.",
  },
  {
    id: "agent-routing",
    icon: "support_agent",
    title: "İnsana (Temsilciye) Yönlendirebilir",
    badge: "SIP Aktarımı",
    badgeTone: "primary",
    description:
      "Öfke, aşırı itiraz veya karmaşık burs talebi durumlarında çağrıyı derhal canlı rehberlik ve kayıt masasına bağlar.",
    hasRoutingBox: true,
  },
  {
    id: "payment-reminder",
    icon: "credit_card",
    title: "Tahsilat & Ödeme Hatırlatması Yapabilir",
    badge: "Finans Güvenliği",
    badgeTone: "tertiary",
    description:
      "Geciken taksit veya kurs ücreti hatırlatması yaparak velinin onay vermesi durumunda IBAN ve güvenli 3D ödeme bağlantısını SMS ile tetikler.",
  },
];

export const agentRouting = {
  initials: "SY",
  desk: "Hedef Masa: Selin Yılmaz",
  contact: "Dahili: 104 • 0850 885 91 22",
};

/** İnsana yönlendirme hedefi — dershaneler.capabilities.human_handoff alanına yazılır. */
export type HumanHandoffTarget = "advisor" | "manager" | "off";

export const humanHandoffTargets: Array<{
  id: HumanHandoffTarget;
  label: string;
  /** Yönlendirme kutusunda görünen açıklama. */
  boxLabel: string;
  boxContact?: string;
}> = [
  {
    id: "advisor",
    label: "Danışman",
    boxLabel: agentRouting.desk,
    boxContact: agentRouting.contact,
  },
  { id: "manager", label: "Müdür", boxLabel: "Müdür Masası (mesai saatleri içinde)" },
  { id: "off", label: "Kapalı", boxLabel: "Yönlendirme kapalı — AI görüşmeyi kibarca sonlandırır" },
];

export const DEFAULT_HUMAN_HANDOFF: HumanHandoffTarget = "advisor";

export type ScheduleRowConfig = {
  id: string;
  label: string;
  sublabel: string;
  sublabelTone: "secondary" | "variant" | "outline";
  titleSemibold: boolean;
  defaultEnabled: boolean;
  defaultStart: string;
  defaultEnd: string;
};

export const scheduleRows: ScheduleRowConfig[] = [
  {
    id: "weekdays",
    label: "Hafta İçi (Pazartesi – Cuma)",
    sublabel: "Yoğun veli iletişim dönemi",
    sublabelTone: "secondary",
    titleSemibold: true,
    defaultEnabled: true,
    defaultStart: "09:30",
    defaultEnd: "18:30",
  },
  {
    id: "saturday",
    label: "Cumartesi",
    sublabel: "Hafta sonu deneme sınavı & kayıt bilgilendirmesi",
    sublabelTone: "variant",
    titleSemibold: true,
    defaultEnabled: true,
    defaultStart: "10:00",
    defaultEnd: "15:00",
  },
  {
    id: "sunday",
    label: "Pazar",
    sublabel: "Dinlenme günü (Otomatik Arama Kapalı)",
    sublabelTone: "outline",
    titleSemibold: false,
    defaultEnabled: false,
    defaultStart: "10:00",
    defaultEnd: "15:00",
  },
];

export const smartTimingRules = {
  title: "Akıllı Yeniden Arama & Israr Kuralı",
  retry: {
    label: "Meşgule Atma / Cevapsız Kuralı",
    question: "En erken bekleme süresi:",
    unit: "Saat sonra",
    defaultValue: 3,
  },
  frequency: {
    label: "Frekans Limiti (Veli Koruma)",
    question: "Günde maksimum arama:",
    unit: "Deneme",
    defaultValue: 2,
  },
  note: '* Veli üst üste 2 kez açmazsa arama görevi duraklatılır ve CRM paneline "Ulaşılamadı" bayrağı düşer.',
};

export type VoiceOption = {
  id: string;
  name: string;
  description: string;
};

export const activeVoice = {
  id: "elif",
  name: "Elif",
  initial: "E",
  description: "Doğal & Güler Yüzlü (Kadın)",
  score: "%98.4",
  previewDuration: "0:04 / 0:12",
  quote:
    '"İyi günler Mehmet Bey! Limit Dershanesi\'nden arıyorum. Berke\'nin son TYT deneme sınavı sonuçları hakkında bilgi vermek istemiştim..."',
};

export const alternativeVoices: VoiceOption[] = [
  { id: "mert", name: "Mert", description: "Kurumsal & Net Türkçe (Erkek)" },
  { id: "zeynep", name: "Zeynep", description: "Dinamik & Eğitici (Kadın)" },
];

export type WaveformBar = {
  height: string;
  color: string;
};

export const waveformBars: WaveformBar[] = [
  { height: "h-3", color: "bg-primary" },
  { height: "h-5", color: "bg-primary" },
  { height: "h-6", color: "bg-primary" },
  { height: "h-4", color: "bg-primary" },
  { height: "h-7", color: "bg-primary/40" },
  { height: "h-5", color: "bg-primary" },
  { height: "h-3", color: "bg-primary/40" },
  { height: "h-6", color: "bg-primary" },
  { height: "h-8", color: "bg-primary/60" },
  { height: "h-4", color: "bg-primary" },
  { height: "h-2", color: "bg-primary/40" },
  { height: "h-5", color: "bg-primary" },
  { height: "h-3", color: "bg-primary/40" },
];

export const complianceItems = [
  {
    title: "İYS (İleti Yönetim Sistemi)",
    description: "2.410 veli izin kaydı anlık doğrulanmaktadır. Ret veren aranmaz.",
  },
  {
    title: "Görüşme Başı KVKK Aydınlatması",
    description: '"Kalite ve eğitim takibi için sesli kayıt" metni zorunlu okunur.',
  },
  {
    title: "Tek Cümleyle Kara Liste (Opt-Out)",
    description: 'Veli "Bir daha aramayın" dediğinde bot konuşmayı sonlandırıp numarayı kilitler.',
  },
  {
    title: "90 Günlük Anonimleştirme",
    description: "Ses kayıtları 90 gün sonunda otomatik maskelenir.",
  },
];

export const SAVE_TOAST_MESSAGE = "Değişiklikler başarıyla kaydedildi ve tüm botlara dağıtıldı.";
export const RESET_TOAST_MESSAGE = "Ayarlar varsayılana sıfırlandı.";

export type ScheduleRowState = {
  id: string;
  enabled: boolean;
  start: string;
  end: string;
};

export type SettingsState = {
  capabilities: Record<string, boolean>;
  /** İnsana yönlendirme hedefi (capabilities.human_handoff). */
  humanHandoff: HumanHandoffTarget;
  schedule: ScheduleRowState[];
  retryHours: number;
  dailyCallLimit: number;
  selectedVoiceId: string;
  speechSpeed: number;
  latencyMs: number;
  phone: string;
};

export const DEFAULT_SETTINGS: SettingsState = {
  capabilities: Object.fromEntries(capabilityToggles.map((toggle) => [toggle.id, true])),
  humanHandoff: DEFAULT_HUMAN_HANDOFF,
  schedule: scheduleRows.map((row) => ({
    id: row.id,
    enabled: row.defaultEnabled,
    start: row.defaultStart,
    end: row.defaultEnd,
  })),
  retryHours: smartTimingRules.retry.defaultValue,
  dailyCallLimit: smartTimingRules.frequency.defaultValue,
  selectedVoiceId: activeVoice.id,
  speechSpeed: 1,
  latencyMs: 650,
  phone: "532 450 12 88",
};
