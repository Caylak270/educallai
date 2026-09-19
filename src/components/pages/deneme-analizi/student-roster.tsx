import { clsx } from "@/lib/clsx";
import { rosterHeader, rosterStudents, type RosterStudent } from "@/lib/mock/exams";
import { AiCallToastButton } from "./call-buttons";

function Sparkline({ student }: { student: RosterStudent }) {
  return (
    <svg className="h-4 w-16 overflow-visible" viewBox="0 0 60 16">
      <polyline
        fill="none"
        points={student.sparkline.points}
        stroke={student.sparkline.color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx={student.sparkline.endX} cy={student.sparkline.endY} fill={student.sparkline.color} r="2" />
    </svg>
  );
}

function StudentCard({ student }: { student: RosterStudent }) {
  const toast = student.action.toast;
  const button = (
    <>
      <span className={clsx("material-symbols-outlined text-[15px]", student.action.iconClass)}>
        {student.action.icon}
      </span>
      <span>{student.action.label}</span>
    </>
  );

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 transition-colors hover:border-outline-variant">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={clsx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-label-md text-label-md font-bold",
              student.avatarClass
            )}
          >
            {student.initials}
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-headline-sm text-headline-sm font-bold text-on-surface">
                {student.name}
              </span>
              <span
                className={clsx(
                  "rounded-md px-1.5 py-0.5 font-label-xs text-label-xs font-bold",
                  student.badgeClass
                )}
              >
                {student.badge}
              </span>
            </div>
            <span className="truncate font-label-xs text-label-xs text-on-surface-variant">{student.meta}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="block font-headline-md text-headline-md font-extrabold leading-tight text-on-surface">
            {student.net}
          </span>
          <span
            className={clsx(
              "flex items-center justify-end font-label-xs text-label-xs font-bold",
              student.trend.className
            )}
          >
            <span className="material-symbols-outlined text-[13px]">{student.trend.icon}</span>{" "}
            {student.trend.label}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/50 pt-2.5">
        {/* Son 5 sınav mini sparkline */}
        <div className="flex items-center gap-2">
          <span className="font-label-xs text-label-xs text-on-surface-variant">Son 5:</span>
          <Sparkline student={student} />
        </div>

        {toast ? (
          <AiCallToastButton
            className={clsx(
              "flex items-center gap-1 rounded-lg px-2.5 py-1 font-label-xs text-label-xs font-semibold transition-colors",
              student.action.buttonClass
            )}
            message={{
              title: `${toast.student} • Veli Aranıyor`,
              description: `${toast.parent} aranarak deneme analizi aktarılıyor...`,
            }}
          >
            {button}
          </AiCallToastButton>
        ) : (
          <button
            className={clsx(
              "flex items-center gap-1 rounded-lg px-2.5 py-1 font-label-xs text-label-xs font-semibold transition-colors",
              student.action.buttonClass
            )}
            type="button"
          >
            {button}
          </button>
        )}
      </div>
    </div>
  );
}

/** Tüm öğrenci listesi: arama, filtre/sıralama butonları ve trend kartları (PC'de iki kolon). */
export function StudentRoster() {
  return (
    <section className="flex flex-col gap-3">
      {/* Başlık ve arama / filtre şeridi */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
            {rosterHeader.title}
          </h2>
          <span className="font-label-xs text-label-xs text-on-surface-variant">{rosterHeader.subtitle}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            aria-label="Filtrele"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant transition-colors hover:bg-surface-container-low"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
          </button>
          <button
            aria-label="Sırala"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant transition-colors hover:bg-surface-container-low"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">swap_vert</span>
          </button>
        </div>
      </div>

      {/* Hızlı arama girişi */}
      <div className="relative w-full">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
          search
        </span>
        <input
          className="h-10 w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest pl-10 pr-4 font-label-md text-label-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
          placeholder={rosterHeader.searchPlaceholder}
          type="text"
        />
      </div>

      {/* Öğrenci kartları */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rosterStudents.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
    </section>
  );
}
