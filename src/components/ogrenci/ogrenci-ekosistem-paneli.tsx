"use client";

/**
 * Öğrenci 360 — Ekosistem Kartı (paylaşılan bileşen).
 * Bir öğrenciye ait TÜM modül kayıtlarını (ödev, yoklama, deneme, beceri,
 * tahsilat, etkinlik, görüşme, randevu) tek kartta gösterir.
 * Veri src/lib/server/ogrenci-durumu.ts tek kaynağından gelir; her modül
 * bu bileşeni kendi sayfasına yerleştirerek aynı öğrenci kartını sunar.
 */

import { useMemo, useState } from "react";
import { clsx } from "@/lib/clsx";
import { PrintSectionButton } from "@/components/ui/print-section-button";
import { ogrenciRozetleri } from "@/lib/server/ogrenci-durumu";
import type { OgrenciDurumu, OgrenciFaaliyeti, FaaliyetYonu } from "@/lib/types/ogrenci";

export interface PanelOgrencisi {
  id: string;
  label: string;
  grade: string;
  /** Ham sınıf/seviye (student_grade) — ders programı eşleştirmesi için */
  gradeRaw?: string | null;
}

/** Sabit haftalık program slotu (schedule_slots) — ders programı modülünden */
export interface ProgramSlot {
  name: string;
  classLevel: string | null;
  teacher: string | null;
  room: string | null;
  /** 1=Pazartesi … 7=Pazar */
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
}

const PROGRAM_GUNLERI = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function ayniMetin(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLocaleLowerCase("tr-TR") === b.trim().toLocaleLowerCase("tr-TR");
}

const YON_STILI: Record<FaaliyetYonu, string> = {
  olumlu: "bg-secondary-container text-on-secondary-container",
  notr: "bg-tertiary-container text-on-tertiary-container",
  risk: "bg-error-container text-on-error-container",
};

export const YON_NOKTA: Record<FaaliyetYonu, string> = {
  olumlu: "bg-secondary",
  notr: "bg-tertiary",
  risk: "bg-error",
};

export const TIP_IKONU: Record<OgrenciFaaliyeti["tip"], string> = {
  odev: "checklist",
  yoklama: "event_busy",
  deneme: "insights",
  beceri: "psychology",
  tahsilat: "payments",
  etkinlik: "celebration",
  gorusme: "call",
  randevu: "calendar_month",
};

export function formatTarih(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

function sayi(n: number | null): string {
  return n === null ? "—" : n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
}

/** Tek istatistik kutusu */
function StatKutu({
  ikon,
  label,
  deger,
  alt,
  yon = "notr",
}: {
  ikon: string;
  label: string;
  deger: string;
  alt?: string | null;
  yon?: FaaliyetYonu;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-low p-3">
      <span
        className={clsx(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          YON_STILI[yon]
        )}
      >
        <span className="material-symbols-outlined text-[18px]">{ikon}</span>
      </span>
      <div className="min-w-0">
        <p className="font-label-xs text-label-xs text-on-surface-variant">{label}</p>
        <p className="truncate font-label-md text-label-md font-semibold text-on-surface">{deger}</p>
        {alt ? (
          <p className="truncate font-label-xs text-label-xs text-outline">{alt}</p>
        ) : null}
      </div>
    </div>
  );
}

export function OgrenciEkosistemPaneli({
  students,
  durumlar,
  program,
  live,
}: {
  students: PanelOgrencisi[];
  /** contact_id → OgrenciDurumu (ogrenciDurumHaritasi çıktısı) */
  durumlar: Record<string, OgrenciDurumu>;
  /** Sabit haftalık program — seçili öğrencinin sınıfına ait olanlar gösterilir */
  program?: ProgramSlot[];
  /** Tüm kaynak modüller canlı okunduysa true; değilse bilgilendirme gösterilir */
  live: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(students[0]?.id ?? null);

  const durum = selectedId ? durumlar[selectedId] ?? null : null;
  const rozetler = useMemo(() => (durum ? ogrenciRozetleri(durum) : []), [durum]);
  const secili = students.find((s) => s.id === selectedId);

  // Öğrencinin sınıfına düşen program slotları (gün + saat sırasıyla)
  const sinifProgrami = useMemo(() => {
    if (!program || !secili?.gradeRaw) return [];
    return program
      .filter((p) => ayniMetin(p.classLevel, secili.gradeRaw))
      .sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)
      );
  }, [program, secili]);

  return (
    <section id="ogrenci-360-karti" className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">
          Öğrenci 360 · Ekosistem Kartı
        </h2>
        <div className="flex items-center gap-2">
          {!live ? (
            <span className="rounded-full bg-surface-container px-2.5 py-1 font-label-xs text-label-xs text-outline">
              Demo mod — canlı veri bekleniyor
            </span>
          ) : null}
          {/* A4: kartı veli toplantısı çıktısı olarak yazdır (print-target deseni) */}
          {durum ? (
            <PrintSectionButton
              targetId="ogrenci-360-karti"
              ariaLabel="Öğrenci 360 kartını yazdır"
              className="flex h-9 items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 font-label-sm text-label-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Yazdır
            </PrintSectionButton>
          ) : null}
        </div>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Öğrencinin ödev, yoklama, deneme, beceri, tahsilat, etkinlik, görüşme ve randevu
        kayıtları tüm modüllerden toplanır — bir modülde yapılan değişiklik burada anında görünür.
      </p>

      {/* Öğrenci seçici */}
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:px-0">
        {students.map((student) => (
          <button
            key={student.id}
            type="button"
            onClick={() => setSelectedId(student.id)}
            className={clsx(
              "shrink-0 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
              student.id === selectedId
                ? "border-primary bg-primary-fixed/40"
                : "border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low"
            )}
          >
            <span className="block font-label-sm text-label-sm font-semibold text-on-surface">
              {student.label}
            </span>
            <span className="block font-label-xs text-label-xs text-on-surface-variant">
              {student.grade || "—"}
            </span>
          </button>
        ))}
      </div>

      {!secili ? null : !durum ? (
        <p className="mt-4 rounded-xl bg-surface-container-low p-4 font-label-sm text-label-sm text-on-surface-variant">
          {secili.label} için ekosistem kaydı bulunmuyor — öğrenci modüllerde ilk faaliyetini
          kaydettirdiğinde bu kart otomatik dolar.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {/* Rozetler — tek dil, tek kaynak (ogrenci-durumu.ts) */}
          {rozetler.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {rozetler.map((r) => (
                <span
                  key={r.metin}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 font-label-sm text-label-sm font-semibold",
                    YON_STILI[r.yon]
                  )}
                >
                  <span className="material-symbols-outlined text-[16px]">{r.ikon}</span>
                  {r.metin}
                </span>
              ))}
            </div>
          ) : null}

          {/* İstatistik şeridi */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <StatKutu
              ikon="checklist"
              label="Ödev"
              deger={durum.odev ? `${durum.odev.done}/${durum.odev.total} yapıldı` : "Kayıt yok"}
              alt={durum.odev && durum.odev.missing > 0 ? `${durum.odev.missing} eksik · ${durum.odev.partial} yarım` : null}
              yon={
                durum.odev && durum.odev.missing / durum.odev.total >= 0.5
                  ? "risk"
                  : durum.odev && durum.odev.missing > 0
                    ? "notr"
                    : "olumlu"
              }
            />
            <StatKutu
              ikon="event_busy"
              label="Yoklama"
              deger={`${durum.yoklama.absent} devamsızlık`}
              alt={`${durum.yoklama.present} katılım · ${durum.yoklama.late} geç`}
              yon={durum.yoklama.absent > 0 ? "risk" : "olumlu"}
            />
            <StatKutu
              ikon="insights"
              label="Deneme"
              deger={durum.deneme.sonNet !== null ? `Son net ${sayi(durum.deneme.sonNet)}` : "Kayıt yok"}
              alt={
                durum.deneme.delta !== null
                  ? `Değişim ${durum.deneme.delta > 0 ? "+" : ""}${sayi(durum.deneme.delta)} net`
                  : durum.deneme.sayi > 0
                    ? `${durum.deneme.sayi} deneme`
                    : null
              }
              yon={
                durum.deneme.kategori === "DECLINING"
                  ? "risk"
                  : durum.deneme.kategori === "RISING" || durum.deneme.kategori === "TOP_PERFORMER"
                    ? "olumlu"
                    : "notr"
              }
            />
            <StatKutu
              ikon="psychology"
              label="Beceri ortalaması"
              deger={durum.beceri.ort !== null ? `${sayi(durum.beceri.ort)}/5` : "Gözlem yok"}
              alt={
                durum.beceri.enIyi
                  ? `En iyi: ${durum.beceri.enIyi}${durum.beceri.enZayif ? ` · Gelişecek: ${durum.beceri.enZayif}` : ""}`
                  : null
              }
              yon={durum.beceri.ort !== null ? (durum.beceri.ort >= 3 ? "olumlu" : "notr") : "notr"}
            />
            <StatKutu
              ikon="payments"
              label="Tahsilat"
              deger={durum.tahsilat.geciken > 0 ? `${durum.tahsilat.geciken} gecikmiş` : durum.tahsilat.odenen > 0 ? `${durum.tahsilat.odenen} taksit ödendi` : "Açık taksit yok"}
              alt={durum.tahsilat.sonOdemeTarihi ? `Son ödeme ${formatTarih(durum.tahsilat.sonOdemeTarihi)}` : null}
              yon={durum.tahsilat.geciken > 0 ? "risk" : "olumlu"}
            />
            <StatKutu
              ikon="celebration"
              label="Etkinlik"
              deger={`${durum.etkinlik.katildi}/${durum.etkinlik.davet} katılım`}
              yon={durum.etkinlik.davet > 0 && durum.etkinlik.katildi === 0 ? "notr" : "olumlu"}
            />
            <StatKutu
              ikon="call"
              label="AI görüşmesi"
              deger={`${durum.gorusme.toplam} görüşme`}
              alt={durum.gorusme.sonTarih ? `Son: ${formatTarih(durum.gorusme.sonTarih)}` : null}
              yon={durum.gorusme.sonDuygu === "negative" ? "risk" : "notr"}
            />
            <StatKutu
              ikon="calendar_month"
              label="Randevu"
              deger={`${durum.randevu.toplam} randevu`}
              alt={durum.randevu.noShow > 0 ? `${durum.randevu.noShow} gelmeme` : durum.randevu.sonTarih ? `Son: ${formatTarih(durum.randevu.sonTarih)}` : null}
              yon={durum.randevu.noShow > 0 ? "risk" : "notr"}
            />
          </div>

          {/* Sınıfın haftalık programı — ders programı modülünden yansıma (F4) */}
          {sinifProgrami.length > 0 && secili?.gradeRaw ? (
            <div>
              <h3 className="mb-2 font-title-md text-title-md text-on-surface">
                Haftalık Ders Programı
                <span className="ml-2 font-label-xs text-label-xs text-on-surface-variant">
                  {secili.gradeRaw} · ders programı modülünden
                </span>
              </h3>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {sinifProgrami.map((p, i) => (
                  <li
                    key={`${p.name}-${p.dayOfWeek}-${p.startTime}-${i}`}
                    className="flex items-center gap-2.5 rounded-lg bg-surface-container-low px-3 py-2"
                  >
                    <span className="shrink-0 rounded-md bg-primary-fixed px-1.5 py-0.5 font-label-xs text-label-xs font-bold text-primary">
                      {PROGRAM_GUNLERI[p.dayOfWeek - 1] ?? "—"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-label-sm text-label-sm font-semibold text-on-surface">
                        {p.name}
                      </span>
                      <span className="block truncate font-label-xs text-label-xs text-on-surface-variant">
                        {p.startTime}
                        {p.teacher ? ` · ${p.teacher}` : ""}
                        {p.room ? ` · ${p.room}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Faaliyet akışı */}
          <div>
            <h3 className="mb-2 font-title-md text-title-md text-on-surface">
              Faaliyet Akışı
              <span className="ml-2 font-label-xs text-label-xs text-on-surface-variant">
                tüm modüllerden birleşik
              </span>
            </h3>
            {durum.faaliyetler.length === 0 ? (
              <p className="rounded-xl bg-surface-container-low p-4 font-label-sm text-label-sm text-on-surface-variant">
                Henüz faaliyet kaydı yok.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {durum.faaliyetler.slice(0, 12).map((f, i) => (
                  <li
                    key={`${f.tip}-${f.ts ?? "tarihsiz"}-${i}`}
                    className="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 py-2.5"
                  >
                    <span className={clsx("h-2 w-2 shrink-0 rounded-full", YON_NOKTA[f.yon])} />
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                      {TIP_IKONU[f.tip]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-label-sm text-label-sm font-semibold text-on-surface">
                        {f.baslik}
                        {f.detay ? (
                          <span className="ml-1.5 font-normal text-on-surface-variant">{f.detay}</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="shrink-0 font-label-xs text-label-xs text-outline">
                      {formatTarih(f.ts)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
