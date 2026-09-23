"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "@/lib/clsx";
import {
  aiVoicePlan,
  highlightedStudent,
  subjectBreakdown,
  type HighlightedStat,
  type HighlightView,
  type SubjectNet,
} from "@/lib/mock/exams";
import { AiCallToastButton } from "./call-buttons";

/** Son 10 sınavlık SVG net trend grafiği — Stitch tasarımından birebir taşınmış (demo veri). */
function NetTrendChart() {
  const { chart } = highlightedStudent;
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between font-label-xs text-label-xs">
        <span className="flex items-center gap-1 font-semibold text-on-surface">
          <span className="h-2.5 w-2.5 rounded-full bg-primary-container" /> {chart.legendLeft}
        </span>
        <span className="flex items-center gap-1 text-on-surface-variant">
          <span className="h-0.5 w-3 bg-outline" /> {chart.legendRight}
        </span>
      </div>

      {/* SVG grafik kabı */}
      <div className="relative flex h-44 w-full flex-col justify-end overflow-hidden rounded-xl bg-surface-container-low p-2">
        {/* Y ekseni çizgileri (Net ölçeği 60 - 100) */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 opacity-40">
          {["95 Net", "85 Net", "75 Net", "65 Net"].map((tick) => (
            <div key={tick} className="flex items-center justify-between text-[10px] text-on-surface-variant">
              <span>{tick}</span>
              <div className="ml-2 flex-1 border-b border-dashed border-outline-variant" />
            </div>
          ))}
        </div>

        {/* Düşüş bölgesi ortam vurgusu (8., 9. ve 10. sınav bölgesi) */}
        <div className="pointer-events-none absolute bottom-6 right-3 top-2 flex w-28 items-start justify-center rounded-lg bg-error-container/40 pt-1">
          <span className="text-[9px] font-bold text-error">
            {chart.dropZoneLabel}
          </span>
        </div>

        {/* Çok noktalı SVG eğrisi */}
        <svg
          className="relative z-10 h-28 w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 320 130"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#4f46e5" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Sınıf ortalaması referansı (kesikli yatay eğri) */}
          <path
            d="M 10,62 Q 80,60 160,61 T 310,63"
            fill="none"
            stroke="#777587"
            strokeDasharray="4,4"
            strokeWidth="1.5"
          />
          {/* Öğrenci eğrisi altı alan */}
          <path
            d="M 10,75 L 10,75 L 40,60 L 75,50 L 110,42 L 145,28 L 180,35 L 215,40 L 250,58 L 285,82 L 310,95 L 310,125 L 10,125 Z"
            fill="url(#areaGradient)"
          />
          {/* Öğrenci net puan eğrisi */}
          <path
            d="M 10,75 L 40,60 L 75,50 L 110,42 L 145,28 L 180,35 L 215,40 L 250,58 L 285,82 L 310,95"
            fill="none"
            stroke="#4f46e5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
          {/* Son dilim kritik düşüş vurgusu (kırmızı) */}
          <path
            d="M 250,58 L 285,82 L 310,95"
            fill="none"
            stroke="#ba1a1a"
            strokeLinecap="round"
            strokeWidth="3"
          />
          {/* Etkileşimli nokta işaretleri */}
          <circle cx="10" cy="75" fill="#ffffff" r="3" stroke="#4f46e5" strokeWidth="2" />
          <circle cx="40" cy="60" fill="#ffffff" r="3" stroke="#4f46e5" strokeWidth="2" />
          <circle cx="75" cy="50" fill="#ffffff" r="3" stroke="#4f46e5" strokeWidth="2" />
          <circle cx="110" cy="42" fill="#ffffff" r="3" stroke="#4f46e5" strokeWidth="2" />
          {/* Zirve noktası */}
          <circle cx="145" cy="28" fill="#4f46e5" r="4.5" stroke="#ffffff" strokeWidth="2" />
          <text fill="#3525cd" fontSize="9" fontWeight="700" textAnchor="middle" x="145" y="18">
            92.0 Zirve
          </text>
          <circle cx="180" cy="35" fill="#ffffff" r="3" stroke="#4f46e5" strokeWidth="2" />
          <circle cx="215" cy="40" fill="#ffffff" r="3" stroke="#4f46e5" strokeWidth="2" />
          <circle cx="250" cy="58" fill="#ba1a1a" r="3.5" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="285" cy="82" fill="#ba1a1a" r="3.5" stroke="#ffffff" strokeWidth="1.5" />
          {/* Son sınav noktası */}
          <circle cx="310" cy="95" fill="#ba1a1a" r="5" stroke="#ffffff" strokeWidth="2" />
          <text fill="#ba1a1a" fontSize="10" fontWeight="800" textAnchor="middle" x="295" y="112">
            74.5 Net
          </text>
        </svg>

        {/* X ekseni sınav etiketleri */}
        <div className="flex items-center justify-between px-1 pt-1 text-[9px] font-medium text-on-surface-variant">
          {chart.xLabels.map((label) => (
            <span key={label.text} className={label.className}>
              {label.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Canlı net geçmişinden üretilen SVG trend grafiği (son 10 sınav).
 * Noktalar gerçek exam_results netlerinden hesaplanır — sabit mock yol yok.
 */
function LiveNetChart({ data }: { data: HighlightView }) {
  const nets = data.nets;
  const labels = data.examNames;
  const width = 300;
  const height = 100;
  const x0 = 10;
  const y0 = 15;
  const min = Math.min(...nets);
  const max = Math.max(...nets);
  const span = max - min || 1;
  const px = (i: number) => x0 + (width * i) / Math.max(nets.length - 1, 1);
  const py = (n: number) => y0 + (height * (max - n)) / span;
  const points = nets.map((n, i) => `${px(i).toFixed(1)},${py(n).toFixed(1)}`);
  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${px(nets.length - 1).toFixed(1)},${y0 + height} L ${x0},${y0 + height} Z`;
  const peakIndex = nets.indexOf(max);
  const lastIndex = nets.length - 1;
  const lastDeclined = data.deltaDown;
  const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
  const ticks = [max, min + (span * 2) / 3, min + span / 3, min];

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between font-label-xs text-label-xs">
        <span className="flex items-center gap-1 font-semibold text-on-surface">
          <span className="h-2.5 w-2.5 rounded-full bg-primary-container" /> {data.name} Net
          İlerlemesi
        </span>
        <span className="flex items-center gap-1 text-on-surface-variant">
          <span className="h-0.5 w-3 bg-outline" /> {nets.length} Sınav
        </span>
      </div>

      <div className="relative flex h-44 w-full flex-col justify-end overflow-hidden rounded-xl bg-surface-container-low p-2">
        {/* Y ekseni çizgileri (gerçek net aralığından) */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 opacity-40">
          {ticks.map((tick, index) => (
            <div
              key={`tick-${index}`}
              className="flex items-center justify-between text-[10px] text-on-surface-variant"
            >
              <span>{fmt(tick)} Net</span>
              <div className="ml-2 flex-1 border-b border-dashed border-outline-variant" />
            </div>
          ))}
        </div>

        {lastDeclined ? (
          <div className="pointer-events-none absolute bottom-6 right-3 top-2 flex w-24 items-start justify-center rounded-lg bg-error-container/40 pt-1">
            <span className="text-[9px] font-bold text-error">Kritik Düşüş Alanı</span>
          </div>
        ) : null}

        <svg
          className="relative z-10 h-28 w-full overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 320 130"
        >
          <defs>
            <linearGradient id="liveAreaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#4f46e5" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Öğrenci eğrisi altı alan */}
          <path d={areaPath} fill="url(#liveAreaGradient)" />
          {/* Öğrenci net eğrisi */}
          <path
            d={linePath}
            fill="none"
            stroke="#4f46e5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
          {/* Ara noktalar */}
          {nets.map((n, i) =>
            i === peakIndex || i === lastIndex ? null : (
              <circle
                cx={px(i)}
                cy={py(n)}
                fill="#ffffff"
                key={`dot-${i}`}
                r="3"
                stroke="#4f46e5"
                strokeWidth="2"
              />
            )
          )}
          {/* Zirve noktası */}
          <circle cx={px(peakIndex)} cy={py(max)} fill="#4f46e5" r="4.5" stroke="#ffffff" strokeWidth="2" />
          <text
            fill="#3525cd"
            fontSize="9"
            fontWeight="700"
            textAnchor="middle"
            x={px(peakIndex)}
            y={Math.max(py(max) - 10, 10)}
          >
            {fmt(max)} Zirve
          </text>
          {/* Son sınav noktası — düşünce kırmızı */}
          <circle
            cx={px(lastIndex)}
            cy={py(nets[lastIndex])}
            fill={lastDeclined ? "#ba1a1a" : "#4f46e5"}
            r="5"
            stroke="#ffffff"
            strokeWidth="2"
          />
          <text
            fill={lastDeclined ? "#ba1a1a" : "#3525cd"}
            fontSize="10"
            fontWeight="800"
            textAnchor="middle"
            x={px(lastIndex) - 14}
            y={Math.min(py(nets[lastIndex]) + 18, 124)}
          >
            {fmt(nets[lastIndex])} Net
          </text>
        </svg>

        {/* X ekseni sınav etiketleri */}
        <div className="flex items-center justify-between px-1 pt-1 text-[9px] font-medium text-on-surface-variant">
          {labels.map((label, index) => (
            <span className={index === lastIndex ? "font-bold text-error" : ""} key={`lbl-${index}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Ders dağılımı özeti — tam genişlik kart, dersler yan yana. */
function SubjectBreakdown({ subjects }: { subjects: SubjectNet[] }) {
  return (
    <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5">
      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
        Son Sınav Ders Net Dağılımı
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
        {subjects.map((subject) => (
          <div key={subject.name} className="flex items-center gap-3">
            <span className={clsx("h-9 w-1.5 shrink-0 rounded-full", subject.barClass)} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-label-sm text-label-sm font-semibold leading-tight text-on-surface">
                {subject.name}
              </p>
              {/* Canlı veride soru sayısı olmadığından alan boşken gizlenir */}
              {subject.questions ? (
                <span className="text-[11px] text-on-surface-variant">{subject.questions}</span>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <span className="block font-headline-sm text-headline-sm font-bold leading-tight text-on-surface">
                {subject.net}
              </span>
              <span className={clsx("text-[11px] font-bold", subject.deltaClass)}>{subject.delta}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** AI ses motoru öneri kutusu — tek bordered kutu, butonlar sağda. */
function AiVoicePlanBox({
  description,
  whatsappHref,
  etutHref,
  call,
}: {
  description: ReactNode;
  whatsappHref: string;
  etutHref: string;
  call: {
    label: string;
    student: string;
    parent: string;
    phone?: string;
    /** POST /api/calls gövdesindeki name (veli adı) */
    name?: string;
  };
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">auto_awesome</span>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            {aiVoicePlan.title}
          </h3>
        </div>
        <p className="mt-2 max-w-3xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          {description}
        </p>
      </div>

      {/* Anında aksiyonlar — sağda */}
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <AiCallToastButton
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-container px-4 font-label-md text-label-md font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.99]"
          fallbackHref={`/veliler?q=${encodeURIComponent(call.student)}`}
          message={{
            title: `${call.student} • Veli Aranıyor`,
            description: `${call.parent} aranarak deneme analizi aktarılıyor...`,
          }}
          name={call.name}
          phone={call.phone}
        >
          <span className="material-symbols-outlined animate-pulse text-[20px]">phone_in_talk</span>
          <span>{call.label}</span>
          {call.phone ? (
            <span className="ml-1 hidden text-[11px] font-normal opacity-80 xl:inline">
              {call.phone}
            </span>
          ) : null}
        </AiCallToastButton>
        {/* Telefon varsa wa.me raporu; yoksa veli CRM aramasına yönlendirir */}
        <Link
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/60 px-3.5 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          href={whatsappHref}
          rel={whatsappHref.startsWith("https://") ? "noopener noreferrer" : undefined}
          target={whatsappHref.startsWith("https://") ? "_blank" : undefined}
        >
          <span className="material-symbols-outlined text-[16px] text-secondary">chat</span>
          <span>WhatsApp Raporu</span>
        </Link>
        {/* Randevular sayfası odak=yeni ile yeni randevu formunu açar */}
        <Link
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/60 px-3.5 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          href={etutHref}
        >
          <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
          <span>Etüt Randevusu</span>
        </Link>
      </div>
    </div>
  );
}

/** Telefonu wa.me E.164 biçimine çevirir; kullanılabilir numara yoksa null döner. */
function whatsappHrefOf(phone: string | null | undefined, name: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) {
    // Numara yok (veya maskeli demo numarası): veli CRM'de öğrenci ara
    return `/veliler?q=${encodeURIComponent(name)}`;
  }
  const e164 = digits.length === 10 ? `90${digits}` : digits;
  const text = encodeURIComponent(`${name} için deneme analizi raporu`);
  return `https://wa.me/${e164}?text=${text}`;
}

/** Canlı veriden hızlı istatistikler (Son Net / Sezon Zirvesi / Sezon Başlangıcı). */
function liveStats(live: HighlightView): HighlightedStat[] {
  const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  const max = Math.max(...live.nets);
  const maxIndex = live.nets.indexOf(max);
  return [
    {
      label: "Son Net",
      value: live.net,
      valueClass: "text-error",
      note: `${live.deltaLabel} Net`,
      noteClass: "text-error",
      noteIcon: "arrow_downward",
    },
    {
      label: "Sezon Zirvesi",
      value: fmt(max),
      valueClass: "text-on-surface",
      note: live.examNames[maxIndex] ?? "—",
      noteClass: "text-on-surface-variant",
    },
    {
      label: "Sezon Başlangıcı",
      value: fmt(live.nets[0] ?? 0),
      valueClass: "text-on-surface",
      note: live.examNames[0] ?? "—",
      noteClass: "text-on-surface-variant",
    },
  ];
}

/**
 * Vurgulanan öğrenci detay paneli.
 * highlight verilirse ad/net/değişim/ders dağılımı canlı exam_results'tan üretilir;
 * verilmezse (canlı veri yok) demo verisine düşer.
 */
export function StudentDetailCard({ highlight }: { highlight?: HighlightView | null }) {
  const live = highlight ?? null;
  const student = live
    ? {
        anchorId: "studentDetailCard",
        initials: live.initials,
        avatarClass: highlightedStudent.avatarClass,
        name: live.name,
        badge: "Düşüş Alarmı",
        meta: live.meta,
        stats: liveStats(live),
      }
    : highlightedStudent;

  const plan = live
    ? {
        description: (
          <>
            {`${live.name}, son denemesinde ${live.deltaLabel} net gerileme yaşadı. `}
            <strong className="font-semibold text-on-surface">
              {live.parentName ?? "Veli"}
            </strong>
            {" ile yapılacak görüşmede deneme analizi ve telafi etüt önerisi aktarılacak."}
          </>
        ),
        call: {
          label: live.parentName ? `AI ile Ara (${live.parentName} - Veli)` : "AI ile Ara",
          student: live.name,
          parent: live.parentName ?? "Veli",
          phone: live.phone ?? undefined,
          name: live.parentName ?? live.name,
        },
        whatsappHref: whatsappHrefOf(live.phone, live.name),
        etutHref: `/randevular?odak=yeni&ogrenci=${encodeURIComponent(live.name)}`,
      }
    : {
        description: (
          <>
            &quot;Berk son 2 denemedir Matematik ve Fizik branşlarında %18 gerileme yaşadı.{" "}
            <strong className="font-semibold text-on-surface">Serdar Bey (Veli)</strong> ile yapılacak
            görüşmede sınav kaygısı ve geometri odaklı haftalık 3 saatlik telafi etüt paketi teklif
            edilecek.&quot;
          </>
        ),
        call: {
          label: aiVoicePlan.callButton.label,
          student: aiVoicePlan.callButton.student,
          parent: aiVoicePlan.callButton.parent,
          phone: aiVoicePlan.callButton.phone,
          name: aiVoicePlan.callButton.parent,
        },
        whatsappHref: whatsappHrefOf(aiVoicePlan.callButton.phone, highlightedStudent.name),
        etutHref: `/randevular?odak=yeni&ogrenci=${encodeURIComponent(highlightedStudent.name)}`,
      };

  const subjects = live ? live.subjects : subjectBreakdown;

  return (
    <section className="flex flex-col gap-4" id={student.anchorId}>
      {/* Üst blok: grafik (7 kolon) + öğrenci meta & hızlı istatistikler (5 kolon) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Net trend grafiği */}
        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 lg:col-span-7">
          {live ? <LiveNetChart data={live} /> : <NetTrendChart />}
        </div>

        {/* Öğrenci meta + hızlı istatistikler */}
        <div className="flex flex-col rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 lg:col-span-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative shrink-0">
                <div
                  className={clsx(
                    "flex h-12 w-12 items-center justify-center rounded-xl font-label-md text-label-md font-bold",
                    student.avatarClass
                  )}
                >
                  {student.initials}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-error">
                  !
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                    {student.name}
                  </h2>
                  <span className="rounded-full bg-error-container px-2 py-0.5 font-label-xs text-label-xs font-bold text-error">
                    {student.badge}
                  </span>
                </div>
                <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">
                  {student.meta}
                </p>
              </div>
            </div>
          </div>

          {/* Hızlı istatistikler */}
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-outline-variant/50 pt-4 lg:mt-auto">
            {student.stats.map((stat) => (
              <div key={stat.label} className="flex min-w-0 flex-col">
                <span className="truncate font-label-xs text-label-xs font-semibold text-on-surface-variant">
                  {stat.label}
                </span>
                <span
                  className={clsx(
                    "mt-1 font-headline-md text-headline-md font-bold tracking-tight",
                    stat.valueClass
                  )}
                >
                  {stat.value}
                </span>
                <span
                  className={clsx(
                    "flex min-w-0 items-center truncate font-label-xs text-label-xs font-semibold",
                    stat.noteClass
                  )}
                >
                  {stat.noteIcon ? (
                    <span className="material-symbols-outlined text-[12px]">{stat.noteIcon}</span>
                  ) : null}
                  {stat.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ders dağılımı — canlı veride ders neti hiç yoksa bölüm gizlenir */}
      {subjects.length > 0 ? <SubjectBreakdown subjects={subjects} /> : null}

      {/* AI ses motoru önerisi — tam genişlik */}
      <AiVoicePlanBox
        call={plan.call}
        description={plan.description}
        etutHref={plan.etutHref}
        whatsappHref={plan.whatsappHref}
      />
    </section>
  );
}
