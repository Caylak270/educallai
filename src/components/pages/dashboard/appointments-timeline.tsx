import Link from "next/link";
import { clsx } from "@/lib/clsx";
import { appointments } from "@/lib/mock/kpis";

/* Bugünün Randevuları zaman çizelgesi */
export function AppointmentsTimeline() {
  return (
    <div className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="mb-space-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Bugünün Randevuları
            </h2>
            <span className="h-2 w-2 rounded-full bg-secondary" />
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            14 Ekim 2024 Pazartesi • Kurum İçi Yüz Yüze Görüşmeler
          </p>
        </div>
        <button
          className="flex h-8 items-center gap-1 rounded-lg bg-surface-container px-3 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Randevu Ekle</span>
        </button>
      </div>

      {/* Zaman çizelgesi öğeleri */}
      <div className="space-y-4">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-start gap-space-md rounded-xl bg-surface-container-low p-space-md transition-colors hover:bg-surface-container"
          >
            <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-container-lowest py-1.5 text-center shadow-sm">
              <span
                className={clsx(
                  "font-headline-sm text-headline-sm font-extrabold leading-tight",
                  appointment.timeClass
                )}
              >
                {appointment.time}
              </span>
              <span className="font-label-xs text-label-xs text-on-surface-variant">
                {appointment.duration}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate font-label-md text-label-md font-bold text-on-surface">
                  {appointment.parent}
                </h3>
                <span
                  className={clsx(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-label-xs text-label-xs font-semibold",
                    appointment.typePillClass
                  )}
                >
                  <span className="material-symbols-outlined text-[12px]">
                    {appointment.typeIcon}
                  </span>{" "}
                  {appointment.typeLabel}
                </span>
              </div>
              <p className="mt-0.5 font-body-sm text-body-sm text-on-surface">
                {appointment.topic}
              </p>
              <div className="mt-2 flex items-center gap-3 font-label-xs text-label-xs text-on-surface-variant">
                {appointment.meta.map((item, index) => (
                  <span key={item.text} className="flex items-center gap-1">
                    {index > 0 && <span>•</span>}
                    {item.icon && (
                      <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                    )}
                    <span className={item.className}>{item.text}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3">
        <Link
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-low py-2 font-label-sm text-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
          href="/randevular"
        >
          <span>Takvim Görünümünü Aç (Haftalık Plan)</span>
          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
        </Link>
      </div>
    </div>
  );
}
