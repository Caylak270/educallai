/*
  Genel Bakış (web dashboard) mock verileri
  Kaynak: design/screens/02-genel-bakis.web.html — metinler birebir korunmuştur.
*/

export type KpiBadgeTone = "positive" | "neutral" | "urgent";

export type Kpi = {
  id: string;
  label: string;
  badge: string;
  badgeTone: KpiBadgeTone;
  value: string;
  suffix?: string;
  valueClass: string;
  urgent?: boolean;
  barPct: number;
  barTrackClass: string;
  barFillClass: string;
  note: string;
};

export const kpis: Kpi[] = [
  {
    id: "handoff",
    label: "AI Handoff Sayısı",
    badge: "+12% dünden",
    badgeTone: "positive",
    value: "47",
    valueClass: "text-on-surface",
    barPct: 72,
    barTrackClass: "bg-surface-container",
    barFillClass: "bg-primary-container",
    note: "İnsan danışmana yönlendirilen",
  },
  {
    id: "authority-follow",
    label: "Yetkili Takip Oranı",
    badge: "+4.2% bu hafta",
    badgeTone: "positive",
    value: "%80,9",
    valueClass: "text-on-surface",
    barPct: 80.9,
    barTrackClass: "bg-surface-container",
    barFillClass: "bg-secondary",
    note: "Zamanında veli geri dönüşü",
  },
  {
    id: "unfollowed",
    label: "Takip Edilmeyen",
    badge: "Acil Müdahale",
    badgeTone: "urgent",
    value: "9",
    suffix: "(%19,1)",
    valueClass: "text-error",
    urgent: true,
    barPct: 38,
    barTrackClass: "bg-error-container",
    barFillClass: "bg-error",
    note: "Son 2 saatte beklemede olan",
  },
  {
    id: "conversion",
    label: "Kayıt Dönüşüm",
    badge: "+3.8% bu ay",
    badgeTone: "positive",
    value: "%25,5",
    valueClass: "text-on-surface",
    barPct: 55,
    barTrackClass: "bg-surface-container",
    barFillClass: "bg-primary-container",
    note: "AI randevusundan kesin kayıt",
  },
  {
    id: "accuracy",
    label: "AI Doğruluk Oranı",
    badge: "%99.2 Yanıt",
    badgeTone: "neutral",
    value: "%84,2",
    valueClass: "text-on-surface",
    barPct: 84.2,
    barTrackClass: "bg-surface-container",
    barFillClass: "bg-secondary",
    note: "Sorunsuz tamamlanan diyalog",
  },
  {
    id: "avg-follow",
    label: "Ortalama Takip",
    badge: "-45 dk hızlanma",
    badgeTone: "positive",
    value: "3,2",
    suffix: "saat",
    valueClass: "text-on-surface",
    barPct: 65,
    barTrackClass: "bg-surface-container",
    barFillClass: "bg-primary-container",
    note: "İlk talepten arama anına",
  },
];

export type FunnelStep = {
  id: string;
  name: string;
  dotClass: string;
  nameClass: string;
  count: string;
  countClass: string;
  pct: string;
  pctClass: string;
  barPct: number;
  barFillClass: string;
  barLabel: string;
};

export const funnelSteps: FunnelStep[] = [
  {
    id: "pool",
    name: "1. Aranan Veli Havuzu",
    dotClass: "bg-primary-container",
    nameClass: "text-on-surface",
    count: "1.420 Veli",
    countClass: "text-on-surface",
    pct: "(%100)",
    pctClass: "text-on-surface-variant font-normal",
    barPct: 100,
    barFillClass: "bg-primary-container text-on-primary",
    barLabel: "Dershane Tanıtım Portföyü",
  },
  {
    id: "reached",
    name: "2. Ulaşılan & Yanıt Veren",
    dotClass: "bg-primary",
    nameClass: "text-on-surface",
    count: "1.180 Veli",
    countClass: "text-on-surface",
    pct: "(%83,1 dönüşüm)",
    pctClass: "text-secondary font-semibold",
    barPct: 83.1,
    barFillClass: "bg-gradient-to-r from-primary-container to-primary text-on-primary",
    barLabel: "%83.1 Ulaşım Başarısı",
  },
  {
    id: "interested",
    name: "3. İlgilenen & Bilgi Alan",
    dotClass: "bg-surface-tint",
    nameClass: "text-on-surface",
    count: "642 Veli",
    countClass: "text-on-surface",
    pct: "(%54,4 oran)",
    pctClass: "text-secondary font-semibold",
    barPct: 45.2,
    barFillClass: "bg-gradient-to-r from-primary to-surface-tint text-on-primary",
    barLabel: "YKS & LGS Paket Talepleri",
  },
  {
    id: "appointment",
    name: "4. Kurum Randevusu Oluşturulan",
    dotClass: "bg-secondary",
    nameClass: "text-on-surface",
    count: "284 Randevu",
    countClass: "text-on-surface",
    pct: "(%44,2 oran)",
    pctClass: "text-secondary font-semibold",
    barPct: 20,
    barFillClass: "bg-gradient-to-r from-surface-tint to-secondary text-on-primary",
    barLabel: "Rehberlik & Yüz Yüze",
  },
  {
    id: "enrolled",
    name: "5. Kesin Kayıt Tamamlanan 🎉",
    dotClass: "bg-secondary-fixed-dim",
    nameClass: "text-secondary",
    count: "164 Öğrenci",
    countClass: "text-secondary",
    pct: "(%57,7 Randevu Kapatma)",
    pctClass: "text-on-surface font-semibold",
    barPct: 11.5,
    barFillClass: "bg-secondary text-on-secondary",
    barLabel: "164 Kayıt",
  },
];

export type TahsilatSegment = {
  id: string;
  label: string;
  dotClass: string;
  amount: string;
  amountClass: string;
};

export const tahsilatSegments: TahsilatSegment[] = [
  {
    id: "paid",
    label: "Ödenen (%62)",
    dotClass: "bg-secondary",
    amount: "₺520.000",
    amountClass: "text-on-surface",
  },
  {
    id: "due-soon",
    label: "Vadesi Yaklaşan (%25)",
    dotClass: "bg-tertiary-fixed-dim",
    amount: "₺210.000",
    amountClass: "text-tertiary",
  },
  {
    id: "late",
    label: "Gecikmiş (%13)",
    dotClass: "bg-error",
    amount: "₺110.000",
    amountClass: "text-error",
  },
];

export const tahsilatAiNote = {
  strong: "AI Asistan:",
  rest: " Bugün 34 veliye sesli ve WhatsApp üzerinden ödeme hatırlatması otomatik iletildi.",
};

export type HotLead = {
  id: string;
  initials: string;
  avatarClass: string;
  parent: string;
  detail: string;
  classTag: string;
  classTagClass: string;
  heat: "hot" | "warm";
  summary: string;
  summaryClass: string;
  wait: string;
  waitClass: string;
  urgentRow: boolean;
  cta: "hot" | "warm";
  classFilterKey: string | null;
};

export const hotLeadClassFilters = [
  "Tüm Sınıflar",
  "12. Sınıf (YKS)",
  "8. Sınıf (LGS)",
  "11. Sınıf",
] as const;

export const hotLeads: HotLead[] = [
  {
    id: "zeynep-kaya",
    initials: "ZK",
    avatarClass: "bg-primary-container text-on-primary",
    parent: "Zeynep Kaya",
    detail: "Öğr: Arda Kaya • +90 (532) 412 ** **",
    classTag: "YKS 12. Sınıf Sayısal",
    classTagClass: "bg-surface-container-lowest text-on-surface",
    heat: "hot",
    summary:
      "Veli bursluluk sınavı indirimini sordu, bugün yüz yüze görüşmeye ve kayıt protokolünü konuşmaya hazır.",
    summaryClass: "text-on-surface",
    wait: "18 dk önce",
    waitClass: "font-bold text-error",
    urgentRow: true,
    cta: "hot",
    classFilterKey: "12. Sınıf (YKS)",
  },
  {
    id: "murat-demir",
    initials: "MD",
    avatarClass: "bg-secondary text-on-secondary",
    parent: "Murat Demir",
    detail: "Öğr: Ela Demir • +90 (544) 890 ** **",
    classTag: "LGS 8. Sınıf",
    classTagClass: "bg-surface-container-lowest text-on-surface",
    heat: "hot",
    summary:
      "Başka bir kurumdan geçiş düşünüyor, hedefi Kabataş Erkek Lisesi. Birebir etüt kontenjanı teyidi bekliyor.",
    summaryClass: "text-on-surface",
    wait: "34 dk önce",
    waitClass: "font-bold text-error",
    urgentRow: true,
    cta: "hot",
    classFilterKey: "8. Sınıf (LGS)",
  },
  {
    id: "sevgi-yilmaz",
    initials: "SY",
    avatarClass: "bg-primary text-on-primary",
    parent: "Sevgi Yılmaz",
    detail: "Öğr: Can Yılmaz • +90 (505) 314 ** **",
    classTag: "11. Sınıf Eşit Ağırlık",
    classTagClass: "bg-surface-container-lowest text-on-surface",
    heat: "hot",
    summary:
      "Deneme kulübü üyeliği ve TYT kampı istiyor, danışmandan indirimli paket fiyat teklifi talep etti.",
    summaryClass: "text-on-surface",
    wait: "1 saat önce",
    waitClass: "font-bold text-tertiary",
    urgentRow: true,
    cta: "hot",
    classFilterKey: "11. Sınıf",
  },
  {
    id: "bulent-tekin",
    initials: "BT",
    avatarClass: "bg-surface-container-highest text-on-surface",
    parent: "Bülent Tekin",
    detail: "Öğr: Ceyda Tekin • +90 (533) 901 ** **",
    classTag: "12. Sınıf Sayısal",
    classTagClass: "bg-surface-container text-on-surface",
    heat: "warm",
    summary: "Hafta sonu etüt saatlerini sordu. Ders programı PDF olarak WhatsApp'tan yollandı.",
    summaryClass: "text-on-surface-variant",
    wait: "2.5 saat önce",
    waitClass: "font-medium text-on-surface-variant",
    urgentRow: false,
    cta: "warm",
    classFilterKey: "12. Sınıf (YKS)",
  },
  {
    id: "emine-koc",
    initials: "EK",
    avatarClass: "bg-surface-container-highest text-on-surface",
    parent: "Emine Koç",
    detail: "Öğr: Yiğit Koç • +90 (542) 711 ** **",
    classTag: "Mezun YKS Grubu",
    classTagClass: "bg-surface-container text-on-surface",
    heat: "warm",
    summary:
      "Sadece kütüphane ve koçluk desteği arıyor. Koçluk koordinatörünün geri dönüşünü bekliyor.",
    summaryClass: "text-on-surface-variant",
    wait: "3 saat önce",
    waitClass: "font-medium text-on-surface-variant",
    urgentRow: false,
    cta: "warm",
    classFilterKey: null,
  },
];

export type AppointmentMetaItem = {
  icon?: string;
  text: string;
  className?: string;
};

export type Appointment = {
  id: string;
  time: string;
  duration: string;
  timeClass: string;
  parent: string;
  typeIcon: string;
  typeLabel: string;
  typePillClass: string;
  topic: string;
  meta: AppointmentMetaItem[];
};

export const appointments: Appointment[] = [
  {
    id: "apt-1",
    time: "11:30",
    duration: "45 dk",
    timeClass: "text-primary-container",
    parent: "Selim Öztürk",
    typeIcon: "call",
    typeLabel: "AI Telefon Araması",
    typePillClass: "bg-primary-container/10 text-primary-container",
    topic: "12. Sınıf YKS Veli Bilgilendirme ve Bursluluk Sözleşmesi",
    meta: [
      { icon: "person", text: "Danışman: Merve Hoca" },
      { icon: "meeting_room", text: "Görüşme Odası 2" },
    ],
  },
  {
    id: "apt-2",
    time: "14:00",
    duration: "60 dk",
    timeClass: "text-secondary",
    parent: "Fatma Demir",
    typeIcon: "chat",
    typeLabel: "AI WhatsApp Botu",
    typePillClass: "bg-secondary-container text-on-secondary-container",
    topic: "8. Sınıf LGS Kayıt & VIP Sınıf Kontenjan Görüşmesi",
    meta: [
      { icon: "badge", text: "Ahmet Bey (Müdür Odası)", className: "font-semibold text-on-surface" },
      { text: "Protokol İmzası", className: "text-secondary font-medium" },
    ],
  },
  {
    id: "apt-3",
    time: "16:15",
    duration: "30 dk",
    timeClass: "text-on-surface",
    parent: "Burak Yılmaz",
    typeIcon: "call",
    typeLabel: "AI Telefon Araması",
    typePillClass: "bg-primary-container/10 text-primary-container",
    topic: "11. Sınıf Sayısal Seviye Tespit Sınav Analizi",
    meta: [
      { icon: "person", text: "Danışman: Canan Hoca" },
      { icon: "meeting_room", text: "Rehberlik Servisi 1" },
    ],
  },
  {
    id: "apt-4",
    time: "17:45",
    duration: "45 dk",
    timeClass: "text-on-surface",
    parent: "Emel Çetin",
    typeIcon: "language",
    typeLabel: "AI Web Form Takip",
    typePillClass: "bg-surface-container-highest text-on-surface",
    topic: "Mezun YKS Danışmanlığı & Derece Sınıfı Değerlendirmesi",
    meta: [
      { icon: "person", text: "Danışman: Murat Hoca" },
      { icon: "meeting_room", text: "Görüşme Odası 3" },
    ],
  },
];

export type FeedItem = {
  id: string;
  icon: string;
  iconWrapClass: string;
  parent: string;
  context: string;
  pill: { text: string; className: string };
  meta: string;
  summary: string;
  links?: { icon: string; label: string }[];
  handoff?: boolean;
};

export const feedItems: FeedItem[] = [
  {
    id: "feed-1",
    icon: "phone_in_talk",
    iconWrapClass: "bg-primary-container/10 text-primary-container",
    parent: "Hasan Erdem",
    context: "(Öğrenci: Mert - 12. Sınıf)",
    pill: { text: "😊 Memnun", className: "bg-secondary-container text-on-secondary-container" },
    meta: "3dk 42sn",
    summary:
      '"YKS deneme paketleri detaylı anlatıldı, veli yarınki etüt programı ve deneme kulübü üyeliğine sözel onay verdi."',
    links: [
      { icon: "volume_up", label: "Ses Kaydını Dinle" },
      { icon: "description", label: "Transkript" },
    ],
  },
  {
    id: "feed-2",
    icon: "chat",
    iconWrapClass: "bg-secondary-container/40 text-secondary",
    parent: "Aylin Şahin",
    context: "(Öğrenci: Derin - 8. Sınıf)",
    pill: { text: "🧐 İlgili", className: "bg-surface-container-high text-on-surface" },
    meta: "12 dk önce",
    summary:
      '"LGS kamp programı broşürü PDF olarak otomatik iletildi, veli peşin ödeme ve erken kayıt taksit seçeneklerini sordu."',
    links: [{ icon: "forum", label: "WhatsApp Konuşmasını Aç" }],
  },
  {
    id: "feed-3",
    icon: "support_agent",
    iconWrapClass: "bg-tertiary-fixed/30 text-tertiary",
    parent: "Mustafa Koç",
    context: "(Öğrenci: Ege - 10. Sınıf)",
    pill: { text: "⚠️ Kararsız", className: "bg-tertiary-fixed text-on-tertiary-fixed" },
    meta: "4dk 15sn",
    summary:
      '"Fiyat artışı hakkında itiraz etti, kurum müdürü veya kıdemli danışman geri araması talep etti (Otomatik Handoff oluşturuldu)."',
    handoff: true,
  },
  {
    id: "feed-4",
    icon: "check_circle",
    iconWrapClass: "bg-secondary-container/40 text-secondary",
    parent: "Selin Barış",
    context: "(Öğrenci: Kaan - 11. Sınıf)",
    pill: { text: "✅ Onaylandı", className: "bg-secondary-container text-on-secondary-container" },
    meta: "25 dk önce",
    summary:
      '"Ekim ayı 2. taksit güvenli ödeme linki iletildi, veli kredi kartı ile ₺14.500 ödemesini sorunsuz tamamladı."',
  },
];
