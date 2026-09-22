/**
 * Mock veri — Görüşme Detayı ekranı (design/screens/05-gorusme-detay.mobile.html).
 * Tek örnek görüşme: demo modda bilinen mock id'ler bu kayda düşer, bilinmeyen
 * id'ler 404 verir. Gerçek veri Supabase (conversation_signals) üzerinden akar.
 */

import { callList } from "./call-list";

/* ── Veli & çağrı özeti ──────────────────────────────────────── */

export interface CallSummary {
  directionPill: string;
  outcomePill: string;
  initials: string;
  parentName: string;
  callTime: string;
  studentLabel: string;
  studentName: string;
  classTag: string;
  programTag: string;
  phoneLabel: string;
  phone: string;
  durationLabel: string;
  duration: string;
}

/* ── Ses oynatıcı ────────────────────────────────────────────── */

export interface AudioPlayerData {
  channelTitle: string;
  channelSubtitle: string;
  playedBars: number[];
  markerBar: number;
  upcomingBars: number[];
  elapsed: string;
  total: string;
  speeds: string[];
  defaultSpeed: string;
}

/* ── Senkron transkript ──────────────────────────────────────── */

export type Speaker = "ai" | "parent";

export interface TranscriptSegment {
  id: number;
  speaker: Speaker;
  time: string;
  text: string;
  /** Şu an çalan segment (sarı vurgu + "Çalıyor" rozeti) */
  playing?: boolean;
}

export interface TranscriptMeta {
  syncLabel: string;
  copyLabel: string;
  copiedLabel: string;
  aiSpeaker: string;
  parentSpeaker: string;
}

/* ── AI sinyalleri ───────────────────────────────────────────── */

export interface AiSignals {
  score: {
    title: string;
    badge: string;
    value: string;
    regionAverage: string;
    percent: number;
    note: string;
  };
  sentiment: {
    title: string;
    detail: string;
    badge: string;
  };
  intent: {
    label: string;
    title: string;
    tag: string;
  };
  priceSensitivity: {
    label: string;
    value: string;
    detail: string;
  };
  objection: {
    label: string;
    value: string;
    detail: string;
  };
  targetProgram: {
    label: string;
    value: string;
  };
  handoff: {
    button: string;
    captionPrefix: string;
    counselor: string;
  };
}

/* ── Aksiyonlar & otomasyon günlüğü ──────────────────────────── */

export type DescSegment = { text: string; strong?: boolean; em?: boolean };

export interface AutomationItem {
  id: number;
  title: string;
  time: string;
  desc: DescSegment[];
  footer:
    | { variant: "success"; icon: string; text: string }
    | { variant: "chip"; icon: string; text: string }
    | { variant: "link"; icon: string; text: string };
}

export interface AutomationPanel {
  title: string;
  subtitle: string;
  badge: string;
  items: AutomationItem[];
}

export interface NoteBox {
  title: string;
  hint: string;
  placeholder: string;
  saveLabel: string;
  savedLabel: string;
}

/* ── Sekmeler ────────────────────────────────────────────────── */

export type CallTabId = "transcript" | "ai-signals" | "actions";

export interface CallTab {
  id: CallTabId;
  label: string;
  count?: number;
  dot?: boolean;
}

export const callTabs: CallTab[] = [
  { id: "transcript", label: "Transkript", count: 6 },
  { id: "ai-signals", label: "AI Sinyalleri", dot: true },
  { id: "actions", label: "Aksiyonlar", count: 3 },
];

/* ── Örnek görüşme ───────────────────────────────────────────── */

export const sampleCall: {
  id: string;
  summary: CallSummary;
  audio: AudioPlayerData;
  transcriptMeta: TranscriptMeta;
  transcript: TranscriptSegment[];
  signals: AiSignals;
  automation: AutomationPanel;
  noteBox: NoteBox;
} = {
  id: "call-001",
  summary: {
    directionPill: "Gelen Çağrı (Inbound)",
    outcomePill: "Başarılı Görüşme",
    initials: "AY",
    parentName: "Ayşe Yılmaz",
    callTime: "14:25",
    studentLabel: "Öğrenci:",
    studentName: "Kerem Yılmaz",
    classTag: "11. Sınıf · Sayısal",
    programTag: "YKS 2026",
    phoneLabel: "İletişim Numarası",
    phone: "+90 (532) 841 29 10",
    durationLabel: "Toplam Süre",
    duration: "03 dk 42 sn",
  },
  audio: {
    channelTitle: "educallai Çift Kanallı Ses Kaydı",
    channelSubtitle: "Sol: Veli · Sağ: Asistan Zeynep",
    playedBars: [4, 8, 12, 6, 10, 13, 7, 11, 9, 5, 14, 8],
    markerBar: 14,
    upcomingBars: [7, 10, 4, 9, 12, 6, 11, 8, 5, 10, 4, 7, 3],
    elapsed: "01:48",
    total: "03:42",
    speeds: ["1.0x", "1.25x", "1.5x"],
    defaultSpeed: "1.25x",
  },
  transcriptMeta: {
    syncLabel: "Canlı Ses Senkronizasyonu Aktif",
    copyLabel: "Metin Olarak Kopyala",
    copiedLabel: "Kopyalandı",
    aiSpeaker: "educallai (Zeynep)",
    parentSpeaker: "Ayşe Yılmaz (Veli)",
  },
  transcript: [
    {
      id: 1,
      speaker: "ai",
      time: "00:04",
      text:
        "İyi günler Ayşe Hanım, Beylikdüzü Çözüm Kurs Merkezi'nden arıyorum. Kerem'in 11. sınıf YKS hazırlık programı hakkında yaptığınız bilgi talebi için ulaşıyorum. Size nasıl yardımcı olabilirim?",
    },
    {
      id: 2,
      speaker: "parent",
      time: "00:22",
      text:
        "Merhaba, evet Kerem sayısal alanda ve özellikle Matematik ile Fizik konusunda takviyeye ihtiyaç duyuyor. Haftalık ders saatleri ve 2025-2026 erken kayıt ücretleriniz nedir?",
    },
    {
      id: 3,
      speaker: "ai",
      time: "00:58",
      text:
        "Harika bir hedef. Sayısal grupta haftalık 16 saat yüz yüze eğitim, birebir etüt ve haftalık Türkiye geneli deneme sınavlarımız mevcut. Erken kayıt döneminde peşin ödemede %15 indirim avantajımız var. Dilerseniz Kerem'in seviyesini belirlemek için Cumartesi günü ücretsiz bursluluk ve seviye tespit sınavımıza kayıt oluşturalım mı?",
    },
    {
      id: 4,
      speaker: "parent",
      time: "01:45",
      playing: true,
      text:
        "Cumartesi günü saat kaçta uygun olur? Ücret konusunda taksit imkanı var mı peki?",
    },
    {
      id: 5,
      speaker: "ai",
      time: "02:18",
      text:
        "Saat 11:00 veya 14:00 seanslarımız bulunuyor. Ödemelerde anlaşmalı kartlara vade farksız 9 taksit imkanımız mevcut. Size detaylı broşürü ve merkezimizin konumunu WhatsApp üzerinden hemen iletebilirim.",
    },
    {
      id: 6,
      speaker: "parent",
      time: "03:10",
      text:
        "Çok iyi olur, Cumartesi 14:00 randevusunu onaylıyorum. WhatsApp'tan da konumu bekliyorum.",
    },
  ],
  signals: {
    score: {
      title: "Kayıt Olma İhtimali Skoru",
      badge: "Yüksek Potansiyel",
      value: "%85",
      regionAverage: "Bölge Ortalaması: %64",
      percent: 85,
      note:
        "Veli belirli branşlarda takviye ihtiyacını net şekilde bildirdi ve sunulan ilk randevu slotunu (Cumartesi 14:00) tereddütsüz onayladı.",
    },
    sentiment: {
      title: "Duygu & Yaklaşım",
      detail: "Nazik, çözüm odaklı ve istekli",
      badge: "Pozitif (%88)",
    },
    intent: {
      label: "Temel Çağrı Niyeti",
      title: "Erken Kayıt & Seviye Tespit Randevusu",
      tag: "Matematik & Fizik Takviye Odağı",
    },
    priceSensitivity: {
      label: "Fiyat Hassasiyeti",
      value: "Orta Seviye",
      detail: "Taksit & peşin indirim oranları sorgulandı.",
    },
    objection: {
      label: "Ödeme İtirazı",
      value: "İtiraz Yok",
      detail: "9 taksit çözümüne olumlu teyit verildi.",
    },
    targetProgram: {
      label: "Tespit Edilen Sınıf & Sınav",
      value: "11. Sınıf · YKS Sayısal (TYT / AYT)",
    },
    handoff: {
      button: "Yetkiliye Devret (Temsilciye Canlı Aktar)",
      captionPrefix: "Şu anda müsait rehber öğretmen:",
      counselor: "Selin Hoca (Öğrenci İşleri)",
    },
  },
  automation: {
    title: "Görüşme Sonrası Otomasyonlar",
    subtitle: "educallai bot motoru tarafından tamamlanan işlemler",
    badge: "3 / 3 Tamamlandı",
    items: [
      {
        id: 1,
        title: "WhatsApp İletimi Sağlandı",
        time: "14:28",
        desc: [
          {
            text:
              "Merkez konum linki ve 2025-26 11. Sınıf Sayısal müfredat broşürü WhatsApp Business API üzerinden gönderildi.",
          },
        ],
        footer: {
          variant: "success",
          icon: "done_all",
          text: "İletildi ve Mavi Tik Alındı",
        },
      },
      {
        id: 2,
        title: "Sınav & Tanıma Randevusu",
        time: "14:29",
        desc: [
          { text: "14 Mart Cumartesi, 14:00", strong: true },
          {
            text:
              " bursluluk ve seviye tespit seansı için takvim kaydı kilitlendi. Veliye SMS onay kodu iletildi.",
          },
        ],
        footer: {
          variant: "chip",
          icon: "event_available",
          text: "Salon B - Masa 14",
        },
      },
      {
        id: 3,
        title: "CRM Pipeline Senkronizasyonu",
        time: "14:29",
        desc: [
          { text: "Öğrenci kartı " },
          { text: "'Sıcak Takip / Randevulu Aday'", em: true },
          {
            text:
              " aşamasına otomatik taşındı. Danışman Selin Akın'a görev bildirimi atandı.",
          },
        ],
        footer: {
          variant: "link",
          icon: "link",
          text: "CRM Kaydına Git (#CR-8491)",
        },
      },
    ],
  },
  noteBox: {
    title: "Rehberlik / Temsilci Notu Ekle",
    hint: "Dahili Ekip Görür",
    placeholder:
      "Örn: Veli görüşmede Matematik hocasının tecrübesini özellikle sordu, randevuda Zümre Başkanı ile tanıştırılacak...",
    saveLabel: "Notu Kaydet",
    savedLabel: "Not Kaydedildi ✓",
  },
};

/**
 * Demo detay: yalnızca bilinen mock id'ler (liste mock'u + örnek detay) örnek
 * görüşmeye düşer; bilinmeyen id'ler undefined döner → sayfa 404 verir.
 */
const KNOWN_MOCK_CALL_IDS = new Set<string>([
  sampleCall.id,
  ...callList.map((call) => call.id),
]);

export function getCallById(id: string) {
  if (!KNOWN_MOCK_CALL_IDS.has(id)) return undefined;
  return { ...sampleCall, id };
}
