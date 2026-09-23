/**
 * Öğrenci Ekosistemi — öğrenci durumu ve faaliyet tipleri.
 *
 * Bir öğrenciye ait her kayıt (ödev, yoklama, deneme, beceri gözlemi,
 * taksit, etkinlik daveti, AI görüşmesi, randevu) tüm modüllere aynı
 * dilde yansır. Mimari: docs/raporlar/2026-09-23-ogrenci-ekosistemi-mimari-ve-plan.md
 *
 * Tüketen: src/lib/server/ogrenci-durumu.ts (tek hesap katmanı) ve
 * bunu prop olarak alan tüm modüller.
 */

/** Bir öğrenci faaliyetinin kaynak modülü. */
export type FaaliyetTipi =
  | "odev"
  | "yoklama"
  | "deneme"
  | "beceri"
  | "tahsilat"
  | "etkinlik"
  | "gorusme"
  | "randevu";

/** Faaliyetin/rozetin göndergesi — UI'da renk tek bu alandan seçilir. */
export type FaaliyetYonu = "olumlu" | "notr" | "risk";

/** Öğrenci başına birleşik faaliyet akışının tek kaydı. */
export interface OgrenciFaaliyeti {
  contact_id: string;
  /** ISO 8601; kaynak satırda olay tarihi yoksa created_at kullanılır. */
  ts: string | null;
  tip: FaaliyetTipi;
  baslik: string;
  detay: string | null;
  yon: FaaliyetYonu;
}

/** Ödev performansı — odev-performans.ts'teki OdevPerformans ile birebir. */
export interface OdevOzeti {
  total: number;
  done: number;
  partial: number;
  missing: number;
}

export interface YoklamaOzeti {
  /** İşaretli ders sayısı */
  total: number;
  present: number;
  late: number;
  absent: number;
}

export interface DenemeOzeti {
  sayi: number;
  /** Son denemenin toplam neti (yoksa null) */
  sonNet: number | null;
  /** Son deneme ile bir önceki arasındaki net farkı */
  delta: number | null;
  /** exam_results.category — DECLINING / PLATEAU / RISING / … */
  kategori: string | null;
  sonTarih: string | null;
}

export interface BeceriOzeti {
  gozlem: number;
  /** 1-5 arası ortalama; gözlem yoksa null */
  ort: number | null;
  /** En yüksek ortalamalı beceri etiketi (SKILLS'ten Türkçe) */
  enIyi: string | null;
  /** En düşük ortalamalı beceri etiketi */
  enZayif: string | null;
}

export interface TahsilatOzeti {
  /** state = PAID taksit sayısı */
  odenen: number;
  /** OVERDUE_* + ESCALATED taksit sayısı */
  geciken: number;
  /** UPCOMING + DUE_TODAY taksit sayısı */
  acik: number;
  sonOdemeTarihi: string | null;
}

export interface EtkinlikOzeti {
  /** Toplam davet sayısı (davetli + katildi + iptal) */
  davet: number;
  katildi: number;
}

export interface GorusmeOzeti {
  toplam: number;
  /** En son görüşmenin sentiment'i */
  sonDuygu: string | null;
  sonTarih: string | null;
}

export interface RandevuOzeti {
  toplam: number;
  noShow: number;
  sonTarih: string | null;
}

/** Bir öğrencinin tüm ekosistem durumu — modüllerin okuduğu tek model. */
export interface OgrenciDurumu {
  contact_id: string;
  /** Hiç işaretli ödevi yoksa null */
  odev: OdevOzeti | null;
  yoklama: YoklamaOzeti;
  deneme: DenemeOzeti;
  beceri: BeceriOzeti;
  tahsilat: TahsilatOzeti;
  etkinlik: EtkinlikOzeti;
  gorusme: GorusmeOzeti;
  randevu: RandevuOzeti;
  /** Yeniden eskisine sıralı, tüm modüllerden birleşik akış */
  faaliyetler: OgrenciFaaliyeti[];
}

/**
 * Hesaplayıcıya girdi — minimal yapısal tipler. getLive*Data() çıktıları
 * birebir uyumludur; mock veya canlı farkı gözetmez.
 */
export interface OgrenciGirdiler {
  /** assignments — ödev başlıkları faaliyet metni için (opsiyonel) */
  odevler?: { id: string; title: string }[];
  submissions?: { assignment_id: string; contact_id: string; status: string; submitted_at: string | null; checked_at: string | null; created_at: string }[];
  lessons?: { id: string; name: string; scheduled_at: string }[];
  attendance?: { lesson_id: string; contact_id: string; status: string; created_at: string }[];
  exams?: { contact_id: string; exam_date: string | null; exam_name: string | null; total_net: string | null; category: string | null; created_at: string }[];
  skillGozlemleri?: { contact_id: string; skill: string; score: number; created_at: string }[];
  taksitler?: { contact_id: string; state: string; due_date: string; paid_at: string | null; installment_amount: string | null }[];
  etkinlikler?: { id: string; name: string; event_date: string }[];
  davetler?: { event_id: string; contact_id: string; status: string; created_at: string }[];
  gorusmeler?: { contact_id: string; sentiment: string | null; channel: string | null; duration_seconds: number | null; created_at: string }[];
  randevular?: { contact_id: string; scheduled_at: string; status: string }[];
}

/** Modüllerde gösterilen tek rozet — metin tek kaynaktan gelir. */
export interface OgrenciRozeti {
  metin: string;
  yon: FaaliyetYonu;
  /** material-symbols-outlined adı */
  ikon: string;
}
