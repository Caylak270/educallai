/** /raporlar ekranı için örnek veriler (Outcome Telemetry + haftalık özet). */

export const reportKpis = [
  {
    label: "AI Handoff Sayısı",
    value: "47",
    hint: "İnsan danışmana yönlendirilen",
    delta: "+12% geçen aya göre",
    deltaTone: "positive" as const,
  },
  {
    label: "Kayıt Dönüşümü",
    value: "%25,5",
    hint: "AI randevusundan kesin kayıt",
    delta: "+3,8 puan",
    deltaTone: "positive" as const,
  },
  {
    label: "Takip Edilmeyen",
    value: "9",
    hint: "Son 24 saatte beklemede (%19,1)",
    delta: "Acil müdahale",
    deltaTone: "negative" as const,
  },
  {
    label: "Ortalama Takip Süresi",
    value: "3,2 saat",
    hint: "Handoff → ilk arama",
    delta: "-45 dk hızlandı",
    deltaTone: "positive" as const,
  },
];

/** Haftalık AI arama hacmi (Pazartesi → Pazar). */
export const weeklyCallVolume = [
  { day: "Pzt", answered: 96, missed: 12 },
  { day: "Sal", answered: 112, missed: 9 },
  { day: "Çar", answered: 88, missed: 15 },
  { day: "Per", answered: 124, missed: 8 },
  { day: "Cum", answered: 141, missed: 11 },
  { day: "Cmt", answered: 76, missed: 6 },
  { day: "Paz", answered: 8, missed: 2 },
];

/** Kanal dağılımı (bu ay, tüm görüşmeler). */
export const channelBreakdown = [
  { label: "Sesli arama (AI)", value: 1284, color: "bg-primary-container", percent: 62 },
  { label: "WhatsApp", value: 512, color: "bg-secondary", percent: 25 },
  { label: "SMS", value: 204, color: "bg-tertiary-fixed-dim", percent: 10 },
  { label: "Instagram DM", value: 72, color: "bg-outline-variant", percent: 3 },
];

/** Dönemsel rapor dosyaları. */
export const reportFiles = [
  { name: "Ekim — Veli İletişim ve Kayıt Dönüşüm Raporu", period: "1–14 Ekim 2026", size: "PDF · 1,8 MB" },
  { name: "Eylül — Tahsilat Performans ve Eskalasyon Özeti", period: "Eylül 2026", size: "PDF · 2,1 MB" },
  { name: "Deneme Sınavı Fırsat Motoru — Dönem Özeti", period: "Özdebir TYT-4 dönemi", size: "PDF · 940 KB" },
  { name: "Outcome Telemetry — Danışman Takip Raporu", period: "Son 30 gün", size: "PDF · 1,2 MB" },
];
