/**
 * Mock veri — Tahsilat ekranı (design/screens/04-tahsilat.mobile.html).
 * Gerçek veri katmanı (Supabase installment_tracker) bağlanana dek demo verisi.
 * Metin ve sayılar Stitch tasarımıyla birebir aynıdır.
 */

/* ── Üst istatistik kartları ─────────────────────────────────── */

export type StatTone = "neutral" | "error" | "secondary" | "primary";

export interface InstallmentStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  tone: StatTone;
  sub:
    | { kind: "plain"; text: string }
    | { kind: "dot"; text: string }
    | { kind: "trend"; text: string };
}

export const tahsilatHeader = {
  statusLabel: "Otomasyon Durumu",
  statusValue: "Canlı Senkron",
  statusIcon: "sync",
};

export const installmentStats: InstallmentStat[] = [
  {
    id: "pending",
    label: "Toplam Bekleyen",
    value: "₺348.500",
    icon: "schedule",
    tone: "neutral",
    sub: { kind: "plain", text: "42 Taksit · Aktif" },
  },
  {
    id: "overdue",
    label: "Geciken Tutar",
    value: "₺92.000",
    icon: "warning",
    tone: "error",
    sub: { kind: "dot", text: "14 Veli Riskte" },
  },
  {
    id: "ai-rate",
    label: "AI Dönüşüm",
    value: "%88.4",
    icon: "auto_awesome",
    tone: "secondary",
    sub: { kind: "trend", text: "+%4.2 bu ay" },
  },
  {
    id: "collected",
    label: "Tahsil Edilen",
    value: "₺256.500",
    icon: "check_circle",
    tone: "primary",
    sub: { kind: "plain", text: "78 Taksit kapandı" },
  },
];

/* ── 5 aşamalı eskalasyon pipeline ───────────────────────────── */

export type StageVariant = "primary" | "secondary" | "tertiary" | "ai" | "error";

export interface PipelineStage {
  id: number;
  variant: StageVariant;
  badge: string;
  icon: string;
  title: string;
  subtitle: string;
  count: string;
  amount: string;
}

export const pipelineHeader = {
  title: "Aşama Takip Akışı",
  subtitle: "Kademeli bildirim ve AI eskalasyon adımları",
  badge: "5 Kademe",
};

export const pipelineStages: PipelineStage[] = [
  {
    id: 1,
    variant: "primary",
    badge: "Aşama 1",
    icon: "chat",
    title: "Vade -3 Gün",
    subtitle: "WhatsApp Bilgilendirme",
    count: "18 Veli",
    amount: "₺142.000",
  },
  {
    id: 2,
    variant: "secondary",
    badge: "Aşama 2",
    icon: "sms",
    title: "Vade Günü",
    subtitle: "SMS + WA Ödeme Linki",
    count: "10 Veli",
    amount: "₺78.500",
  },
  {
    id: 3,
    variant: "tertiary",
    badge: "+3 / +7 Gün",
    icon: "notifications_active",
    title: "Nazik Uyarı",
    subtitle: "Gecikme Hatırlatması",
    count: "8 Veli",
    amount: "₺54.000",
  },
  {
    id: 4,
    variant: "ai",
    badge: "+14 Gün",
    icon: "support_agent",
    title: "AI Sesli Arama",
    subtitle: "Ödeme Sözü / Taahhüt",
    count: "4 Veli",
    amount: "₺38.000",
  },
  {
    id: 5,
    variant: "error",
    badge: "+30 Gün",
    icon: "gavel",
    title: "İdari Devir",
    subtitle: "Yönetici & Hukuk Öncesi",
    count: "2 Veli",
    amount: "₺36.000",
  },
];

/* ── Filtre pill'leri ────────────────────────────────────────── */

export type InstallmentFilterId =
  | "all"
  | "overdue"
  | "due-today"
  | "ai-call"
  | "promised";

export interface InstallmentFilterPill {
  id: InstallmentFilterId;
  label: string;
  dotClass?: string;
  icon?: string;
}

export const installmentFilterPills: InstallmentFilterPill[] = [
  { id: "all", label: "Tümü (42)" },
  { id: "overdue", label: "Gecikenler (14)", dotClass: "bg-error" },
  { id: "due-today", label: "Bugün Vadesi Dolan (10)" },
  { id: "ai-call", label: "AI Aramasında (4)", icon: "graphic_eq" },
  { id: "promised", label: "Ödeme Sözü Verenler (6)" },
];

/* ── Taksit kayıt kartları ───────────────────────────────────── */

export type AmountTone = "neutral" | "error" | "tertiary";
export type StatusPillTone = "ai" | "due" | "critical" | "pre" | "warn";
export type AccentTone = "secondary" | "primary" | "error" | "tertiary";

export interface InstallmentRecord {
  id: string;
  studentName: string;
  gradeTag: string;
  parentName: string;
  amount: string;
  amountTone: AmountTone;
  installmentInfo: string;
  infoTone: AmountTone;
  infoBold?: boolean;
  statusPill: {
    icon?: string;
    dot?: boolean;
    text: string;
    tone: StatusPillTone;
  };
  reminderPill: string;
  context: {
    icon: string;
    title: string;
    meta: string;
    body: string;
    clamp2?: boolean;
    tone: AccentTone;
  };
  action: { icon: string; label: string };
  filters: InstallmentFilterId[];
}

export const installmentListHeader = {
  title: "Taksit Listesi (42)",
  sortLabel: "Sırala: Risk Önceliği",
};

export const installmentRecords: InstallmentRecord[] = [
  {
    id: "inst-001",
    studentName: "Efe Yılmaz",
    gradeTag: "12. Sınıf Sayısal",
    parentName: "Murat Yılmaz (Baba)",
    amount: "₺14.500",
    amountTone: "error",
    installmentInfo: "Taksit 4/8",
    infoTone: "neutral",
    statusPill: {
      icon: "support_agent",
      text: "+14 Gün · AI Ses Araması Yapıldı",
      tone: "ai",
    },
    reminderPill: "3 Hatırlatma (1 WA, 1 SMS, 1 Ses)",
    context: {
      icon: "mic",
      title: "AI Ödeme Sözü Aldı",
      meta: "Dün 16:42",
      body:
        '"Murat Bey ile 1 dk 40 sn görüşüldü: Maaş gününün 24 Mayıs olduğunu ve Cuma günü saat 12:00\'ye kadar EFT yapacağını taahhüt etti."',
      clamp2: true,
      tone: "secondary",
    },
    action: { icon: "graphic_eq", label: "Hatırlat (AI Ses / WA)" },
    filters: ["overdue", "ai-call", "promised"],
  },
  {
    id: "inst-002",
    studentName: "Zeynep Kaya",
    gradeTag: "Mezun EA",
    parentName: "Fatma Kaya (Anne)",
    amount: "₺12.000",
    amountTone: "neutral",
    installmentInfo: "Taksit 6/10",
    infoTone: "neutral",
    statusPill: {
      dot: true,
      text: "Vade Günü (Bugün Son Gün)",
      tone: "due",
    },
    reminderPill: "1 Hatırlatma",
    context: {
      icon: "send",
      title: "WhatsApp İletildi",
      meta: "Bugün 09:15",
      body:
        "Otomatik iyzico hızlı ödeme bağlantısı iletildi. Veli mesajı mavi tik ile okudu.",
      tone: "primary",
    },
    action: { icon: "forward_to_inbox", label: "Tekrar Hatırlat" },
    filters: ["due-today"],
  },
  {
    id: "inst-003",
    studentName: "Kerem Demir",
    gradeTag: "11. Sınıf YKS",
    parentName: "Bülent Demir (Baba)",
    amount: "₺18.000",
    amountTone: "error",
    installmentInfo: "Taksit 2/6 (Kritik)",
    infoTone: "error",
    infoBold: true,
    statusPill: {
      icon: "gavel",
      text: "+30 Gün · Yetkili İdari Takibinde",
      tone: "critical",
    },
    reminderPill: "5 Hatırlatma (Eskalasyon Devri)",
    context: {
      icon: "phone_missed",
      title: "AI Ulaşamadı · Manuel Arama Gerekli",
      meta: "3 gün önce",
      body:
        "3 arama meşgule atıldı. Muhasebe müdürü doğrudan fiziki görüşme talebinde bulunacak.",
      tone: "error",
    },
    action: { icon: "call", label: "Hemen Ara (Müdürlük)" },
    filters: ["overdue"],
  },
  {
    id: "inst-004",
    studentName: "Elif Su Çelik",
    gradeTag: "10. Sınıf",
    parentName: "Hande Çelik (Anne)",
    amount: "₺9.500",
    amountTone: "neutral",
    installmentInfo: "Taksit 5/8",
    infoTone: "neutral",
    statusPill: {
      icon: "info",
      text: "Vade -3 Gün (Ön Bilgilendirme)",
      tone: "pre",
    },
    reminderPill: "Otomasyon Kuyruğunda",
    context: {
      icon: "schedule_send",
      title: "Yarın 10:00 Planlandı",
      meta: "Otomatik WA",
      body:
        "Dershane kurumsal WhatsApp hesabından nazik vade yaklaşım metni ve dekont yükleme butonu gönderilecek.",
      tone: "primary",
    },
    action: { icon: "send", label: "Şimdi Gönder" },
    filters: [],
  },
  {
    id: "inst-005",
    studentName: "Barış Koç",
    gradeTag: "12. Sınıf EA",
    parentName: "Hasan Koç (Baba)",
    amount: "₺11.000",
    amountTone: "tertiary",
    installmentInfo: "Taksit 3/8",
    infoTone: "tertiary",
    statusPill: {
      icon: "alarm",
      text: "+5 Gün · Nazik Uyarı",
      tone: "warn",
    },
    reminderPill: "2 Hatırlatma (1 WA, 1 SMS)",
    context: {
      icon: "touch_app",
      title: "SMS Bağlantısına Tıklandı",
      meta: "2 gün önce",
      body:
        "Ödeme ekranı açıldı fakat işlem tamamlanmadı. 24 saat içinde AI sesli arama sırasına alınacak.",
      tone: "tertiary",
    },
    action: { icon: "call", label: "Hatırlat" },
    filters: ["overdue"],
  },
];

/* ── Sticky toplu aksiyon tetikleyici ────────────────────────── */

export const batchCallBanner = {
  title: "Toplu AI Hatırlatıcı",
  subtitle: "14 geciken veliye akıllı çağrı",
  startLabel: "Başlat",
  dialingLabel: "Aranıyor...",
  startedLabel: "Başlatıldı",
};
