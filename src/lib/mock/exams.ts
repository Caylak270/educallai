/*
  Deneme Analizi ekranı için mock veri.
  Kaynak: design/screens/03-deneme-analizi.mobile.html — metinler/sayılar birebir.
*/

export interface ExamSegment {
  id: string;
  icon: string;
  iconClass: string;
  badge: string;
  badgeClass: string;
  count: string;
  unit: string;
  statusLabel: string;
  statusClass: string;
  description: string;
  footerLabel: string;
  footerClass: string;
  pulseDot?: boolean;
}

export const examHeader = {
  eyebrow: "Akademik Takip Motoru",
  title: "Deneme Analizi",
  filterLabel: "12. Sınıf & Mezun",
  activeExam: {
    name: "Özdebir TYT-4",
    meta: "Dün Tamamlandı • 248 Katılımcı",
    linkLabel: "Tüm Sınavlar",
  },
  urgent: {
    strongText: "14 öğrenci",
    text: "ani düşüş segmentinde, veli araması planlandı.",
    ctaLabel: "İncele",
  },
};

export const examSegments: ExamSegment[] = [
  {
    id: "dusus-alarmi",
    icon: "trending_down",
    iconClass: "bg-error-container text-on-error-container",
    badge: "Kritik: -11.2 Net",
    badgeClass: "bg-error-container text-error",
    count: "14",
    unit: "Öğrenci",
    statusLabel: "Düşüşte (Alarm)",
    statusClass: "text-error",
    description:
      "Son iki sınavda 8+ net gerileme; acil psikolojik ve veli etüt müdahalesi.",
    footerLabel: "Acil Veli Görüşmesi",
    footerClass: "text-error",
    pulseDot: true,
  },
  {
    id: "yukselenler",
    icon: "trending_up",
    iconClass: "bg-secondary-container text-on-secondary-container",
    badge: "+8.5 Net Ort.",
    badgeClass: "bg-secondary-container text-secondary",
    count: "42",
    unit: "Öğrenci",
    statusLabel: "Yükselen Trend",
    statusClass: "text-secondary",
    description:
      "İstikrarlı ivme yakalayan grup. Tebrik mesajları & motivasyon araması.",
    footerLabel: "Tebrik Bildirimi",
    footerClass: "text-secondary",
  },
  {
    id: "zirve-ogrenciler",
    icon: "workspace_premium",
    iconClass: "bg-primary-fixed text-primary",
    badge: "Top %2 Dilim",
    badgeClass: "bg-primary-fixed text-primary",
    count: "15",
    unit: "Öğrenci",
    statusLabel: "Zirve Grubu",
    statusClass: "text-primary",
    description:
      "100+ TYT / 72+ AYT bandı; derece koçluğu ve ileri branş soru analizi.",
    footerLabel: "Derece Koçluğu",
    footerClass: "text-primary",
  },
  {
    id: "plato-sikisanlar",
    icon: "drag_handle",
    iconClass: "bg-surface-container-high text-tertiary-container",
    badge: "±2 Net Bandı",
    badgeClass: "bg-surface-container-high text-tertiary-container",
    count: "28",
    unit: "Öğrenci",
    statusLabel: "Plato (Durgun)",
    statusClass: "text-tertiary-container",
    description: "Son 3 sınavdır takılma yaşayanlar. Strateji ve soru stili revizyonu.",
    footerLabel: "Birebir Etüt Önerisi",
    footerClass: "text-on-surface-variant",
  },
  {
    id: "ilk-deneme",
    icon: "flag",
    iconClass: "bg-surface-variant text-on-surface-variant",
    badge: "Yeni Kayıt",
    badgeClass: "bg-surface-variant text-on-surface-variant",
    count: "9",
    unit: "Öğrenci",
    statusLabel: "İlk Deneme",
    statusClass: "text-on-surface",
    description: "Kurum bünyesindeki ilk sonuçları; başlangıç seviye tespit raporu.",
    footerLabel: "Başlangıç Raporu",
    footerClass: "text-on-surface-variant",
  },
];

export interface HighlightedStat {
  label: string;
  value: string;
  valueClass: string;
  note: string;
  noteClass: string;
  noteIcon?: string;
}

export const highlightedStudent = {
  anchorId: "studentDetailCard",
  initials: "BY",
  avatarClass: "bg-primary text-on-primary",
  name: "Berk Yılmaz",
  badge: "Düşüş Alarmı",
  meta: "12-Sayısal • No: 1042 • Hedef: İTÜ Bilgisayar",
  stats: [
    {
      label: "Son TYT Net",
      value: "74.50",
      valueClass: "text-error",
      note: "-11.25 Net",
      noteClass: "text-error",
      noteIcon: "arrow_downward",
    },
    {
      label: "Sezon Zirvesi",
      value: "92.00",
      valueClass: "text-on-surface",
      note: "Töder-2 (Kasım)",
      noteClass: "text-on-surface-variant",
    },
    {
      label: "Sınıf Ort. Farkı",
      value: "-4.20",
      valueClass: "text-on-surface",
      note: "12-Say Sınıfı",
      noteClass: "text-on-surface-variant",
    },
  ] satisfies HighlightedStat[],
  chart: {
    legendLeft: "Berk TYT İlerlemesi",
    legendRight: "12-Say Sınıf Ortalaması (78.7)",
    dropZoneLabel: "Kritik Düşüş Alanı",
    xLabels: [
      { text: "ÖZD-1", className: "" },
      { text: "TÖD-1", className: "" },
      { text: "TÜR-1", className: "" },
      { text: "TÖD-2", className: "text-primary font-bold" },
      { text: "ÖZD-2", className: "" },
      { text: "TÜR-2", className: "" },
      { text: "ÖZD-3", className: "" },
      { text: "TÜR-3", className: "text-error font-bold" },
      { text: "ÖZD-4", className: "text-error font-extrabold" },
    ],
  },
};

export interface SubjectNet {
  name: string;
  questions: string;
  net: string;
  delta: string;
  deltaClass: string;
  barClass: string;
}

export const subjectBreakdown: SubjectNet[] = [
  {
    name: "Matematik",
    questions: "40 Soru",
    net: "24.50",
    delta: "-6.00 Net",
    deltaClass: "text-error",
    barClass: "bg-primary-container",
  },
  {
    name: "Fen Bilimleri",
    questions: "20 Soru",
    net: "18.00",
    delta: "-3.50 Net",
    deltaClass: "text-error",
    barClass: "bg-secondary",
  },
  {
    name: "Türkçe",
    questions: "40 Soru",
    net: "26.00",
    delta: "+1.00 Net",
    deltaClass: "text-secondary",
    barClass: "bg-surface-variant",
  },
  {
    name: "Sosyal Bilg.",
    questions: "20 Soru",
    net: "6.00",
    delta: "-2.00 Net",
    deltaClass: "text-error",
    barClass: "bg-surface-variant",
  },
];

export const aiVoicePlan = {
  title: "AI Veli Arama & Aksiyon Planı",
  callButton: {
    label: "AI ile Ara (Serdar Bey - Veli)",
    phone: "0532 ••• 41 82",
    student: "Berk Yılmaz",
    parent: "Serdar Yılmaz",
  },
};

export interface RosterStudent {
  id: string;
  initials: string;
  avatarClass: string;
  name: string;
  badge: string;
  badgeClass: string;
  meta: string;
  /** Öğrencinin segment kartı kimliği (SEGMENT_LABELS anahtarları) */
  segmentKey?: string;
  /** Veli telefonu — canlı kontaklardan gelir; yoksa aksiyon CRM aramasına düşer */
  phone?: string;
  net: string;
  trend: {
    icon: string;
    label: string;
    className: string;
  };
  sparkline: {
    points: string;
    color: string;
    endX: number;
    endY: number;
  };
  action: {
    icon: string;
    iconClass?: string;
    label: string;
    buttonClass: string;
    /** AI çağrı tetikleyen butonlar için toast metinleri */
    toast?: { student: string; parent: string };
  };
}

export const rosterHeader = {
  title: "Öğrenci Trend Sıralaması",
  subtitle: "Toplam 248 Öğrenci Kayıtlı",
  searchPlaceholder: "Öğrenci adı, numara veya sınıf ara...",
};

export const rosterStudents: RosterStudent[] = [
  {
    id: "zeynep-kaya",
    initials: "ZK",
    avatarClass: "bg-secondary-container text-on-secondary-container",
    name: "Zeynep Kaya",
    badge: "Yükselen",
    badgeClass: "bg-secondary-container text-secondary",
    meta: "12-EA • No: 1089",
    segmentKey: "yukselenler",
    net: "88.25",
    trend: { icon: "trending_up", label: "+6.50", className: "text-secondary" },
    sparkline: {
      points: "2,14 15,11 30,12 45,7 58,2",
      color: "#006b5f",
      endX: 58,
      endY: 2,
    },
    action: {
      icon: "phone",
      iconClass: "text-secondary",
      label: "Tebrik Araması",
      buttonClass:
        "bg-surface-container hover:bg-secondary-container hover:text-on-secondary-container text-on-surface",
      toast: { student: "Zeynep Kaya", parent: "Fatma Kaya" },
    },
  },
  {
    id: "mert-demir",
    initials: "MD",
    avatarClass: "bg-primary-fixed text-on-primary-fixed",
    name: "Mert Demir",
    badge: "Düşüşte",
    badgeClass: "bg-error-container text-error",
    meta: "Mezun-Sayısal • No: 2014",
    segmentKey: "dusus-alarmi",
    net: "67.75",
    trend: { icon: "trending_down", label: "-9.00", className: "text-error" },
    sparkline: {
      points: "2,3 15,4 30,8 45,9 58,15",
      color: "#ba1a1a",
      endX: 58,
      endY: 15,
    },
    action: {
      icon: "crisis_alert",
      label: "AI Alarm Araması",
      buttonClass: "bg-error-container text-error",
      toast: { student: "Mert Demir", parent: "Hakan Demir" },
    },
  },
  {
    id: "selin-dogan",
    initials: "SD",
    avatarClass: "bg-primary text-on-primary",
    name: "Selin Doğan",
    badge: "Zirve (%1)",
    badgeClass: "bg-primary-fixed text-primary",
    meta: "12-Sayısal • No: 1002",
    segmentKey: "zirve-ogrenciler",
    net: "106.25",
    trend: { icon: "trending_up", label: "+1.25", className: "text-secondary" },
    sparkline: {
      points: "2,6 15,4 30,5 45,3 58,2",
      color: "#3525cd",
      endX: 58,
      endY: 2,
    },
    action: {
      icon: "psychology",
      iconClass: "text-primary",
      label: "Derece Koçu Raporu",
      buttonClass: "bg-surface-container text-on-surface hover:bg-surface-variant",
    },
  },
  {
    id: "kaan-ozturk",
    initials: "KÖ",
    avatarClass: "bg-surface-container-high text-on-surface",
    name: "Kaan Öztürk",
    badge: "Plato",
    badgeClass: "bg-surface-container-high text-tertiary-container",
    meta: "11-Sayısal • No: 1218",
    segmentKey: "plato-sikisanlar",
    net: "58.50",
    trend: { icon: "drag_handle", label: "±0.00", className: "text-outline" },
    sparkline: {
      points: "2,8 15,9 30,8 45,8 58,8",
      color: "#777587",
      endX: 58,
      endY: 8,
    },
    action: {
      icon: "assignment_late",
      label: "Branş Tahlili",
      buttonClass: "bg-surface-container text-on-surface hover:bg-surface-variant",
    },
  },
];

// Alt yazı ve toast kaldırıldı: öğrenci sayısı canlı roster'dan, arama sonucu
// ise gerçek /api/calls yanıtlarından üretilir (bkz. batch-banner.tsx).
export const batchBanner = {
  icon: "forward_to_inbox",
  title: "Toplu Veli Bilgilendirme",
  ctaLabel: "Aramaları Başlat",
};

/**
 * Segment kimlikleri → Türkçe etiketler.
 * Mock ve canlı (exams-map) segment kartları aynı kimlikleri paylaşır;
 * roster öğelerinin segmentKey alanı da bu kimliklere eşlenir.
 */
export const SEGMENT_LABELS: Record<string, string> = {
  "dusus-alarmi": "Düşüş Alarmı",
  yukselenler: "Yükselenler",
  "zirve-ogrenciler": "Zirve",
  "plato-sikisanlar": "Plato",
  "ilk-deneme": "İlk Deneme",
};

/** Deneme analizi ekran verisi: segment şeridi + öğrenci listesi. */
export interface ExamsView {
  segments: ExamSegment[];
  roster: RosterStudent[];
}

/**
 * Canlı "en büyük düşüş" öğrencisinin detay kartı görünümü.
 * exams-map.pickHighlightView üretir; canlı veri yoksa kart mock'a düşer.
 */
export interface HighlightView {
  name: string;
  initials: string;
  meta: string;
  /** Son sınavın toplam neti (tr-TR biçimli) */
  net: string;
  /** Son sınav değişimi (tr-TR biçimli, işaretli) */
  deltaLabel: string;
  deltaDown: boolean;
  /** Kronolojik net geçmişi (grafikte son 10 sınav) */
  nets: number[];
  /** nets ile eş uzunlukta kısa sınav etiketleri */
  examNames: string[];
  /** Son sınavın ders netleri — canlıda soru sayısı yok, questions boş gelir */
  subjects: SubjectNet[];
  parentName: string | null;
  phone: string | null;
}
