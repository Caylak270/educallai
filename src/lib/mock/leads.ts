/*
  Veliler CRM (mobil kanban) mock verileri
  Kaynak: design/screens/01-veliler-crm.mobile.html — metinler birebir korunmuştur.
  (Zeynep Kaya drawer içeriği tasarımdaki hâliyle; diğer leadler için uyduyo içerik yazılmıştır.)
*/

export type LeadAction = {
  icon: string;
  label: string;
  style: "primary" | "neutral";
  iconClass?: string;
  message: string;
};

export type LeadTimelineItem = {
  icon: string;
  dotClass: string;
  iconClass: string;
  title: string;
  time: string;
  desc: string;
};

export type LeadDrawer = {
  phone: string;
  studentName: string;
  studentClass: string;
  scoreBadge: { text: string; className: string };
  heatPill: { text: string; icon: string; iconClass?: string; className: string };
  stagePill: { text: string; className: string };
  sentiment: { text: string; className: string };
  notePre: string;
  noteHighlight: string;
  notePost: string;
  audioMeta: string;
  timeline: LeadTimelineItem[];
};

export type Lead = {
  id: string;
  focus?: boolean;
  /** CRM aşaması: yeni | iletisim | ilgilendi | randevu | ziyaret | kayit | kaybedildi */
  stage?: string;
  initials: string;
  avatarClass: string;
  badgeIcon: string;
  badgeClass: string;
  badgeIconClass: string;
  name: string;
  role: string;
  student: string;
  studentClass: string;
  studentClassClass: string;
  score: number;
  ringClass: string;
  scoreLabelClass: string;
  heatIcon: string;
  heatIconClass?: string;
  heatLabel: string;
  heatPillClass: string;
  channelIcon: string;
  channelIconClass?: string;
  channelLabel: string;
  time: string;
  insight: string;
  actions: LeadAction[];
  drawer: LeadDrawer;
  /**
   * Filtre chip etiketleri (all hariç): hot | yks | lgs | delayed | waiting.
   * Canlı veride sunucu (buildLeadsView) doldurur; demo leadlerde istemci türetir.
   */
  chipTags?: string[];
};

export const leads: Lead[] = [
  {
    id: "zeynep-kaya",
    stage: "ilgilendi",
    focus: true,
    initials: "ZK",
    avatarClass: "bg-primary-fixed text-primary",
    badgeIcon: "call",
    badgeClass: "bg-secondary",
    badgeIconClass: "text-on-secondary",
    name: "Zeynep Kaya",
    role: "Anne",
    student: "Emre Kaya",
    studentClass: "11. Sınıf Sayısal (YKS)",
    studentClassClass: "text-primary",
    score: 94,
    ringClass: "text-secondary",
    scoreLabelClass: "text-secondary",
    heatIcon: "local_fire_department",
    heatIconClass: "text-error",
    heatLabel: "Sıcak Lead",
    heatPillClass: "bg-tertiary-container/15 text-tertiary-container",
    channelIcon: "phone_in_talk",
    channelIconClass: "text-secondary",
    channelLabel: "AI Telefon Araması",
    time: "18 dk önce",
    insight:
      '"Matematik netlerinden endişeli, hafta sonu kurum deneme sınavı ve rehberlik randevusuna olumlu bakıyor."',
    actions: [
      {
        icon: "record_voice_over",
        label: "Tekrar Ara (AI)",
        style: "primary",
        message: "AI Voice Bot araması başlatılıyor...",
      },
      {
        icon: "assignment_ind",
        label: "Danışman Ata",
        style: "neutral",
        message: "Rehber Danışman atama penceresi açıldı.",
      },
    ],
    drawer: {
      phone: "+90 (532) 841 29 10",
      studentName: "Emre Kaya",
      studentClass: "11. Sınıf Sayısal",
      scoreBadge: {
        text: "Lead Puanı: 94/100",
        className: "bg-secondary-fixed text-on-secondary-fixed",
      },
      heatPill: {
        text: "Sıcak",
        icon: "local_fire_department",
        iconClass: "text-error",
        className: "bg-tertiary-container/15 text-tertiary-container",
      },
      stagePill: { text: "Aşama: İlgilendi", className: "bg-primary-fixed text-on-primary-fixed" },
      sentiment: { text: "Sentiment: %92 Pozitif", className: "bg-secondary/15 text-secondary" },
      notePre: "Veli ile ",
      noteHighlight: "3 dk 42 sn",
      notePost:
        " konuşuldu. Öğrencinin okul başarısı yüksek ancak TYT Matematik netleri ile Fizik denemelerinde desteğe ihtiyaç duyuyorlar. Hafta sonu Cumartesi 14:00 kampüs ziyareti, seviye tespit sınavı ve danışman değerlendirme seansı teklif edildi; veli randevuya son derece sıcak yaklaştı.",
      audioMeta: "01:14 / 03:42 · Çift Kanal",
      timeline: [
        {
          icon: "call",
          dotClass: "bg-primary",
          iconClass: "text-on-primary",
          title: "AI Sesli Görüşme Tamamlandı",
          time: "14:25",
          desc: "Süre: 3 dk 42 sn · Aday öğrenci durumu ve veli randevu teyidi alındı.",
        },
        {
          icon: "chat",
          dotClass: "bg-secondary",
          iconClass: "text-on-secondary",
          title: "Otomatik WhatsApp Daveti",
          time: "14:26",
          desc: "Kampüs Google Harita konumu ve cumartesi randevu hatırlatıcısı iletildi (Çift Mavi Tık ✓✓).",
        },
        {
          icon: "web",
          dotClass: "bg-outline-variant",
          iconClass: "text-on-surface",
          title: "Web Formu: YKS Paket Talebi",
          time: "Dün 11:15",
          desc: "Instagram reklam kampanyası yönlendirmesiyle 11. Sınıf erken kayıt formu dolduruldu.",
        },
      ],
    },
  },
  {
    id: "murat-demirtas",
    stage: "ilgilendi",
    initials: "MD",
    avatarClass: "bg-secondary-fixed-dim/40 text-on-secondary-fixed",
    badgeIcon: "chat",
    badgeClass: "bg-secondary-container",
    badgeIconClass: "text-on-secondary-container",
    name: "Murat Demirtaş",
    role: "Baba",
    student: "Elif Demirtaş",
    studentClass: "8. Sınıf (LGS Hazırlık)",
    studentClassClass: "text-secondary",
    score: 88,
    ringClass: "text-secondary",
    scoreLabelClass: "text-secondary",
    heatIcon: "local_fire_department",
    heatIconClass: "text-error",
    heatLabel: "Sıcak Lead",
    heatPillClass: "bg-tertiary-container/15 text-tertiary-container",
    channelIcon: "forum",
    channelIconClass: "text-secondary",
    channelLabel: "WhatsApp AI Yanıtı",
    time: "1 saat önce",
    insight:
      '"Bursluluk sınavı tarihini sordu, 2025 LGS başarı tablosu ve bilgilendirme broşürü PDF\'i yollandı."',
    actions: [
      {
        icon: "chat",
        label: "Mesajı Aç",
        style: "neutral",
        iconClass: "text-secondary",
        message: "WhatsApp konuşması açılıyor...",
      },
      {
        icon: "event",
        label: "Randevu Yaz",
        style: "neutral",
        message: "Randevu yazma ekranı açılıyor...",
      },
    ],
    drawer: {
      phone: "+90 (544) 445 82 07",
      studentName: "Elif Demirtaş",
      studentClass: "8. Sınıf LGS",
      scoreBadge: {
        text: "Lead Puanı: 88/100",
        className: "bg-secondary-fixed text-on-secondary-fixed",
      },
      heatPill: {
        text: "Sıcak",
        icon: "local_fire_department",
        iconClass: "text-error",
        className: "bg-tertiary-container/15 text-tertiary-container",
      },
      stagePill: { text: "Aşama: İlgilendi", className: "bg-primary-fixed text-on-primary-fixed" },
      sentiment: { text: "Sentiment: %87 Pozitif", className: "bg-secondary/15 text-secondary" },
      notePre: "Veli ile ",
      noteHighlight: "2 dk 58 sn",
      notePost:
        " konuşuldu. Bursluluk sınavı takvimi ve 2025 LGS başarı tablosu veli ile paylaşıldı. Öğrencinin deneme netleri ve hedef okul listesi değerlendirildi; cumartesi günü kampüs ziyareti için ön randevu oluşturuldu.",
      audioMeta: "00:48 / 02:58 · Çift Kanal",
      timeline: [
        {
          icon: "call",
          dotClass: "bg-primary",
          iconClass: "text-on-primary",
          title: "AI Sesli Görüşme Tamamlandı",
          time: "13:50",
          desc: "Süre: 2 dk 58 sn · Bursluluk sınavı tarihi teyit edildi, veli iletişime açık.",
        },
        {
          icon: "chat",
          dotClass: "bg-secondary",
          iconClass: "text-on-secondary",
          title: "Otomatik WhatsApp Yanıtı",
          time: "13:52",
          desc: "Bursluluk sınavı başvuru formu ve LGS broşürü PDF olarak iletildi.",
        },
        {
          icon: "web",
          dotClass: "bg-outline-variant",
          iconClass: "text-on-surface",
          title: "Web Formu: LGS Hazırlık",
          time: "Pzt 09:20",
          desc: "Google reklam kampanyası yönlendirmesiyle 8. Sınıf hazırlık formu dolduruldu.",
        },
      ],
    },
  },
  {
    id: "aylin-celik",
    stage: "ilgilendi",
    initials: "AÇ",
    avatarClass: "bg-tertiary-fixed text-on-tertiary-fixed",
    badgeIcon: "sms",
    badgeClass: "bg-outline-variant",
    badgeIconClass: "text-on-surface",
    name: "Aylin Çelik",
    role: "Anne",
    student: "Kaan Çelik",
    studentClass: "12. Sınıf Eşit Ağırlık",
    studentClassClass: "text-on-surface-variant",
    score: 72,
    ringClass: "text-tertiary-container",
    scoreLabelClass: "text-tertiary",
    heatIcon: "bolt",
    heatLabel: "Ilık Lead",
    heatPillClass: "bg-surface-container-high text-on-surface-variant",
    channelIcon: "cell_tower",
    channelLabel: "Otomatik Sesli Takip",
    time: "Dün 17:40",
    insight:
      '"Fiyat ve ödeme planını eşine danışacağını belirtti. 2 gün sonra öğleden sonra tekrar aranmak istiyor."',
    actions: [
      {
        icon: "alarm",
        label: "Hatırlatıcı Kur",
        style: "neutral",
        message: "Hatırlatıcı kuruluyor...",
      },
    ],
    drawer: {
      phone: "+90 (542) 303 77 91",
      studentName: "Kaan Çelik",
      studentClass: "12. Sınıf Eşit Ağırlık",
      scoreBadge: {
        text: "Lead Puanı: 72/100",
        className: "bg-secondary-fixed text-on-secondary-fixed",
      },
      heatPill: {
        text: "Ilık",
        icon: "bolt",
        className: "bg-surface-container-high text-on-surface-variant",
      },
      stagePill: { text: "Aşama: İlgilendi", className: "bg-primary-fixed text-on-primary-fixed" },
      sentiment: { text: "Sentiment: %64 Nötr", className: "bg-secondary/15 text-secondary" },
      notePre: "Veli ile ",
      noteHighlight: "1 dk 47 sn",
      notePost:
        " konuşuldu. Fiyat ve ödeme planı hakkındaki sorularına genel bilgi verildi; veli eşiyle değerlendirip öğleden sonra dönüş bekliyor. Perşembe 15:00 için otomatik takip araması planlandı.",
      audioMeta: "00:22 / 01:47 · Çift Kanal",
      timeline: [
        {
          icon: "call",
          dotClass: "bg-primary",
          iconClass: "text-on-primary",
          title: "AI Sesli Görüşme Tamamlandı",
          time: "Dün 17:40",
          desc: "Süre: 1 dk 47 sn · Fiyat bilgisi iletildi, geri dönüş perşembe planlandı.",
        },
        {
          icon: "sms",
          dotClass: "bg-outline-variant",
          iconClass: "text-on-surface",
          title: "Otomatik SMS Takibi",
          time: "Dün 17:45",
          desc: "Ödeme planı özet linki SMS ile iletildi.",
        },
        {
          icon: "web",
          dotClass: "bg-outline-variant",
          iconClass: "text-on-surface",
          title: "Web Formu: Eşit Ağırlık",
          time: "Sal 11:05",
          desc: "Instagram kampanyası üzerinden 12. Sınıf eşit ağırlık talep formu dolduruldu.",
        },
      ],
    },
  },
];

export type KanbanStage = {
  id: string;
  name: string;
  count: number;
  dotClass: string;
  conversion: string;
};

export const kanbanStages: KanbanStage[] = [
  { id: "yeni", name: "Yeni", count: 18, dotClass: "bg-outline-variant", conversion: "%14 Yanıt Oranı" },
  {
    id: "iletisim",
    name: "İletişime Geçildi",
    count: 34,
    dotClass: "bg-primary-fixed-dim",
    conversion: "%58 İlgi Oranı",
  },
  {
    id: "ilgilendi",
    name: "İlgilendi",
    count: 27,
    dotClass: "bg-secondary-fixed",
    conversion: "%68 Dönüşüm Oranı",
  },
  {
    id: "randevu",
    name: "Randevu Alındı",
    count: 15,
    dotClass: "bg-secondary",
    conversion: "%81 Onay Oranı",
  },
  {
    id: "ziyaret",
    name: "Ziyaret Etti",
    count: 9,
    dotClass: "bg-tertiary-fixed-dim",
    conversion: "%76 Kayıt Oranı",
  },
  {
    id: "kayit",
    name: "Kayıt Oldu",
    count: 22,
    dotClass: "bg-secondary-container",
    conversion: "%100 Tamamlanma",
  },
  {
    id: "kaybedildi",
    name: "Kaybedildi",
    count: 17,
    dotClass: "bg-outline",
    conversion: "%12 Geri Kazanım",
  },
];

export type PortfolioChip = {
  id: string;
  label: string;
  icon?: string;
  iconClass?: string;
  dot?: boolean;
};

export const portfolioChips: PortfolioChip[] = [
  { id: "all", label: "Tümü (142)" },
  { id: "hot", label: "Sıcak Leadler (28)", icon: "local_fire_department", iconClass: "text-error" },
  { id: "yks", label: "12. Sınıf / YKS (64)" },
  { id: "lgs", label: "LGS Hazırlık (39)" },
  { id: "delayed", label: "AI Takip Geciken (7)", dot: true },
  { id: "waiting", label: "Görüşme Bekleyen (12)" },
];
