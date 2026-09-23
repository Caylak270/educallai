/*
  Kampanyalar ekranı için mock veri.
  Kaynak: design/screens/06-kampanyalar-genel-bakis.mobile.html — metinler/sayılar birebir.
*/

export type CampaignStatus = "aktif" | "duraklatildi" | "tamamlandi";

export interface CampaignKpis {
  reached: { label: string; value: string; total: string; percent: number };
  response: { label: string; value: string; delta: string };
  appointment: { label: string; value: string; unit: string; note: string };
}

export const campaignKpis: CampaignKpis = {
  reached: { label: "Ulaşılan Veli", value: "1.482", total: "/2.150", percent: 68.9 },
  response: { label: "Cevaplama", value: "%76,4", delta: "↑ %4.2 artış" },
  appointment: { label: "Randevu Alındı", value: "184", unit: "veli", note: "%12.4 dönüşüm" },
};

export interface CampaignStat {
  label: string;
  value: string;
  /** "primary" → indigo vurgulu kutu, "secondary" → teal vurgulu kutu */
  tone?: "default" | "primary" | "secondary";
}

export interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  status: CampaignStatus;
  /** Aktif kart 1'deki ring + köşe vurgusu */
  highlight?: boolean;
  /** "duraklatildi" grubundaki taslaklar için farklı rozet etiketi (örn. "Taslak") */
  badgeLabel?: string;
  /** Canlı arama soundwave şeridi */
  liveCall?: { label: string; value: string };
  progress: {
    label: string;
    value?: string;
    valueAccent?: string;
    width: number;
  };
  stats?: CampaignStat[];
  scheduleLabel?: string;
  /** Kontrol butonları: duraklat / rapor / devam ettir */
  controls?: Array<"pause" | "report" | "resume">;
  collectedNote?: { prefix: string; strong: string };
  resultNote?: { prefix: string; strong: string; suffix: string };
  /** "Detay" panelinde gösterilen kampanya künyesi (canlıda campaigns-map doldurur). */
  detail?: {
    channel?: string;
    targetCount?: number;
    startDate?: string;
    script?: string;
  };
}

export const campaigns: Campaign[] = [
  {
    id: "yks-2025-erken-kayit",
    title: "YKS 2025 Erken Kayıt Avantajı",
    subtitle: "11. ve 12. sınıf aday veliler · Sesli Arama + WhatsApp",
    status: "aktif",
    highlight: true,
    liveCall: { label: "Canlı Arama Yapılıyor:", value: "2 veli hatta" },
    progress: {
      label: "Arama İlerlemesi",
      value: "742 / 950 veli",
      valueAccent: "(%78)",
      width: 78,
    },
    stats: [
      { label: "Cevaplama", value: "%81,2" },
      { label: "Randevu", value: "96 Veli", tone: "primary" },
      { label: "Geri Arayacak", value: "48 Veli" },
    ],
    scheduleLabel: "Hafta içi 09:30-18:00",
    controls: ["pause", "report"],
    detail: {
      channel: "Sesli Arama",
      targetCount: 950,
      startDate: "3 Şubat 2025",
      script:
        '"İyi günler {Veli_Adi} Hanım/Bey, ben Limit Dershanesi\'nden arıyorum. Erken kayıt avantajlı ücret baremini paylaşmak istedim..."',
    },
  },
  {
    id: "lgs-bursluluk",
    title: "LGS Bursluluk Sınavı Çağrısı",
    subtitle: "7. ve 8. sınıf hedef veli listesi · AI Sesli Arama",
    status: "aktif",
    progress: {
      label: "Arama İlerlemesi",
      value: "420 / 600 veli",
      valueAccent: "(%70)",
      width: 70,
    },
    stats: [
      { label: "Cevaplama", value: "%74,8" },
      { label: "Randevu", value: "54 Veli", tone: "secondary" },
      { label: "Ulaşılamayan", value: "32 Veli" },
    ],
    detail: {
      channel: "Sesli Arama",
      targetCount: 600,
      startDate: "10 Şubat 2025",
      script:
        '"Merhaba, LGS Bursluluk Sınavımıza davet etmek istiyorum. {Ogrenci_Adi} için ücretsiz katılım hakkı tanımlandı..."',
    },
  },
  {
    id: "mart-taksit-hatirlatma",
    title: "Mart Ayı Taksit Hatırlatma",
    subtitle: "Geciken taksitler · Otomatik WhatsApp & AI Görüşme",
    status: "duraklatildi",
    progress: {
      label: "İlerleme",
      value: "180 / 280 veli",
      valueAccent: "(%64)",
      width: 64,
    },
    collectedNote: { prefix: "Tahsil Edilen: ", strong: "₺142.500" },
    controls: ["resume"],
    detail: {
      channel: "WhatsApp",
      targetCount: 280,
      startDate: "1 Mart 2025",
      script: "Geciken taksit hatırlatması: nazik uyarı → ödeme linki → AI sesli arama akışı.",
    },
  },
  {
    id: "donem-deneme-daveti",
    title: "1. Dönem Deneme Sınavı Daveti",
    subtitle: "Tüm şube velileri · 12-16 Şubat 2025",
    status: "tamamlandi",
    progress: {
      label: "320 / 320 veli tamamlandı",
      valueAccent: "%100",
      width: 100,
    },
    resultNote: { prefix: "Sonuç: ", strong: "112 deneme katılımı", suffix: " sağlandı." },
    controls: ["report"],
    detail: {
      channel: "Sesli Arama",
      targetCount: 320,
      startDate: "12 Şubat 2025",
      script: '"Deneme sınavı davetiniz hazır, {Ogrenci_Adi} için yer ayırtmak ister misiniz?"',
    },
  },
];

export const campaignFilters = [
  { id: "tumu", label: "Tüm Kampanyalar", count: 4 },
  { id: "aktif", label: "Aktif", count: 2, pulseDot: true },
  { id: "duraklatildi", label: "Duraklatıldı", count: 1 },
  { id: "tamamlandi", label: "Tamamlandı", count: 1 },
] as const;

export type CampaignFilterId = (typeof campaignFilters)[number]["id"];

export const wizard = {
  stepBadge: "Adım 1/4",
  sectionTitle: "Yeni Kampanya Sihirbazı",
  sectionSubtitle: "4 adımda yapay zeka arama kampanyasını başlatın",
  steps: [
    { number: 1, label: "Yapılandırma", active: true },
    { number: 2, label: "Ses Seçimi", active: false },
    { number: 3, label: "Test & Onay", active: false },
  ],
  nameLabel: "Kampanya Adı",
  defaultName: "Nisan Ayı 10. ve 11. Sınıf Yaz Kampı Bilgilendirmesi",
  upload: {
    sectionLabel: "1. Veli / Aday Listesi Yükleme",
    templateLabel: "Örnek Şablon (.xlsx)",
    dropTitle: "CSV veya Excel dosyasını sürükleyin",
    dropHint: "Ad Soyad, Telefon, Öğrenci Sınıfı sütunları zorunludur",
    buttonLabel: "Dosya Seç",
    chip: {
      name: "yaz_kampi_aday_veliler_v2.csv",
      meta: "340 geçerli numara tespit edildi · 2 mükerrer silindi",
      status: "Hazır ✓",
    },
  },
  schedule: {
    sectionLabel: "2. Arama Saatleri ve Günleri",
    headerNote: "Otomatik Zamanlayıcı",
    days: [
      {
        id: "hafta-ici",
        label: "Hafta İçi (Pzt - Cuma)",
        hours: ["09:30", "18:00"],
        defaultChecked: true,
        disabled: false,
        note: null,
      },
      {
        id: "cumartesi",
        label: "Cumartesi",
        hours: ["10:00", "15:00"],
        defaultChecked: true,
        disabled: false,
        note: null,
      },
      {
        id: "pazar",
        label: "Pazar (Arama Yapılmaz)",
        hours: null,
        defaultChecked: false,
        disabled: true,
        note: "Dinlenme Günü",
      },
    ],
  },
  compliance: {
    sectionLabel: "3. KVKK & İYS Onay Kontrolü",
    badge: "Zorunlu Hukuki Denetim",
    items: [
      {
        title: "İYS (İleti Yönetim Sistemi) Entegrasyonu Aktif",
        description: "Listeden ret hakkı kullanan 4 numara arama kuyruğundan düşürüldü.",
      },
      {
        title: "6698 Sayılı KVKK Açık Rıza Metni",
        description: 'Ön görüşme başında "Görüşme kayıt altına alınmaktadır" anonsu ekli.',
      },
      {
        title: "Dershane Ticari İleti Ruhsatı Doğrulandı",
        description: "Limit Eğitim Kurumları A.Ş. adına onaylı mersis kaydı eşleşti.",
      },
    ],
  },
  script: {
    sectionLabel: "4. AI Arama Senaryosu (Script)",
    customizeLabel: "Özelleştir",
    model: "Eğitim Danışmanı Modeli · Ayşe",
    modelBadge: "Doğal Türkçe",
    text: '"İyi günler {Veli_Adi} Hanım/Bey, ben Limit Dershanesi\'nden arıyorum. {Ogrenci_Adi}\'nin gelecek seneki YKS hazırlığı kapsamında düzenlediğimiz 2 günlük Ücretsiz Kamp Tanıtım Günümüz için randevu planlamak istedik. Cumartesi saat 14:00 sizin için uygun olur mu?"',
    tags: ["İtiraz Karşılama: Fiyat", "Adres Bilgisi", "WhatsApp'a Konum At"],
  },
  actions: {
    cancelLabel: "Vazgeç",
    nextLabel: "Sonraki Adım: Ses & Ton",
  },
};
