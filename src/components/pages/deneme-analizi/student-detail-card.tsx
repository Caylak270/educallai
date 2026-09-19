import { clsx } from "@/lib/clsx";
import {
  aiVoicePlan,
  highlightedStudent,
  subjectBreakdown,
} from "@/lib/mock/exams";
import { AiCallToastButton } from "./call-buttons";

/** Son 10 sınavlık SVG net trend grafiği — Stitch tasarımından birebir taşınmış. */
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
          <span className="text-[9px] font-bold uppercase tracking-wider text-error">
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
            <linearGradient id="dropHighlight" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ba1a1a" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0" />
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

/** Ders dağılımı özeti — tam genişlik kart, 4 ders yan yana. */
function SubjectBreakdown() {
  return (
    <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5">
      <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
        Son Sınav Ders Net Dağılımı
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
        {subjectBreakdown.map((subject) => (
          <div key={subject.name} className="flex items-center gap-3">
            <span className={clsx("h-9 w-1.5 shrink-0 rounded-full", subject.barClass)} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-label-sm text-label-sm font-semibold leading-tight text-on-surface">
                {subject.name}
              </p>
              <span className="text-[11px] text-on-surface-variant">{subject.questions}</span>
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
function AiVoicePlanBox() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">auto_awesome</span>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            {aiVoicePlan.title}
          </h3>
        </div>
        <p className="mt-2 max-w-3xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          &quot;Berk son 2 denemedir Matematik ve Fizik branşlarında %18 gerileme yaşadı.{" "}
          <strong className="font-semibold text-on-surface">Serdar Bey (Veli)</strong> ile yapılacak
          görüşmede sınav kaygısı ve geometri odaklı haftalık 3 saatlik telafi etüt paketi teklif
          edilecek.&quot;
        </p>
      </div>

      {/* Anında aksiyonlar — sağda */}
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <AiCallToastButton
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-container px-4 font-label-md text-label-md font-semibold text-on-primary transition-all hover:bg-primary active:scale-[0.99]"
          message={{
            title: `${aiVoicePlan.callButton.student} • Veli Aranıyor`,
            description: `${aiVoicePlan.callButton.parent} aranarak deneme analizi aktarılıyor...`,
          }}
        >
          <span className="material-symbols-outlined animate-pulse text-[20px]">phone_in_talk</span>
          <span>{aiVoicePlan.callButton.label}</span>
          <span className="ml-1 hidden text-[11px] font-normal opacity-80 xl:inline">
            {aiVoicePlan.callButton.phone}
          </span>
        </AiCallToastButton>
        <button
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/60 px-3.5 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px] text-secondary">chat</span>
          <span>WhatsApp Raporu</span>
        </button>
        <button
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/60 px-3.5 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
          <span>Etüt Randevusu</span>
        </button>
      </div>
    </div>
  );
}

/** Vurgulanan öğrenci detay paneli (Berk Yılmaz): solda trend grafiği, sağda meta + hızlı istatistikler. */
export function StudentDetailCard() {
  const student = highlightedStudent;
  return (
    <section className="flex flex-col gap-4" id={student.anchorId}>
      {/* Üst blok: grafik (7 kolon) + öğrenci meta & hızlı istatistikler (5 kolon) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Net trend grafiği */}
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 lg:col-span-7">
          <NetTrendChart />
        </div>

        {/* Öğrenci meta + hızlı istatistikler */}
        <div className="flex flex-col rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 lg:col-span-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative shrink-0">
                <div
                  className={clsx(
                    "flex h-12 w-12 items-center justify-center rounded-2xl font-label-md text-label-md font-bold",
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
            <button
              aria-label="Diğer işlemler"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant/60 text-on-surface-variant transition-colors hover:bg-surface-container-low"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
          </div>

          {/* Hızlı istatistikler */}
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-outline-variant/50 pt-4 lg:mt-auto">
            {student.stats.map((stat) => (
              <div key={stat.label} className="flex min-w-0 flex-col">
                <span className="truncate font-label-xs text-label-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  {stat.label}
                </span>
                <span
                  className={clsx(
                    "mt-1 font-headline-md text-headline-md font-extrabold tracking-tight",
                    stat.valueClass
                  )}
                >
                  {stat.value}
                </span>
                <span
                  className={clsx("flex items-center font-label-xs text-label-xs font-semibold", stat.noteClass)}
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

      {/* Ders dağılımı — tam genişlik */}
      <SubjectBreakdown />

      {/* AI ses motoru önerisi — tam genişlik */}
      <AiVoicePlanBox />
    </section>
  );
}
