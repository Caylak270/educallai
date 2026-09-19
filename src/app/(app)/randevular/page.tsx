import { PageHeader, PageShell, SectionCard, Stat } from "@/components/ui/page-shell";
import { appointmentDays, appointmentStats, type AppointmentItem } from "@/lib/mock/appointments";

export const metadata = { title: "Randevular" };

function StatusBadge({ status }: { status: AppointmentItem["status"] }) {
  if (status === "onayli") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-secondary-container px-2.5 py-1 font-label-xs text-label-xs font-semibold text-on-secondary-container">
        Onaylandı
      </span>
    );
  }
  if (status === "bekliyor") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-tertiary-fixed px-2.5 py-1 font-label-xs text-label-xs font-semibold text-tertiary-container">
        Veli onayı bekliyor
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-surface-container px-2.5 py-1 font-label-xs text-label-xs font-semibold text-on-surface-variant">
      İptal edildi
    </span>
  );
}

const CREATED_BY_LABELS = {
  ai_voice: "AI sesli arama ile oluşturuldu",
  ai_whatsapp: "AI WhatsApp ile oluşturuldu",
  manuel: "Danışman tarafından oluşturuldu",
} as const;

function AppointmentRow({ item }: { item: AppointmentItem }) {
  const cancelled = item.status === "iptal";
  return (
    <div
      className={
        "flex flex-col gap-3 border-b border-outline-variant/40 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center " +
        (cancelled ? "opacity-60" : "")
      }
    >
      <div className="flex w-20 shrink-0 items-center gap-1.5 sm:flex-col sm:items-start sm:gap-0">
        <span className="font-headline-md text-headline-md font-bold text-on-surface">
          {item.time}
        </span>
        <span className="font-body-sm text-body-sm text-outline">{item.durationMinutes} dk</span>
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={
            "font-label-md text-label-md font-semibold text-on-surface " + (cancelled ? "line-through" : "")
          }
        >
          {item.topic}
        </p>
        <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
          {item.parentName} · {item.studentName} ({item.grade})
        </p>
        <p className="mt-1 flex items-center gap-1.5 font-body-sm text-body-sm text-outline">
          <span className="material-symbols-outlined text-[14px]">
            {item.createdBy === "manuel" ? "person" : "smart_toy"}
          </span>
          {CREATED_BY_LABELS[item.createdBy]} · {item.counselor}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={item.status} />
        {!cancelled ? (
          <button
            className="rounded-lg border border-outline-variant px-3 py-1.5 font-label-sm text-label-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
            type="button"
          >
            Detay
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function Page() {
  const [today, ...rest] = appointmentDays;
  return (
    <PageShell>
      <PageHeader
        eyebrow="Takvim"
        title="Randevular"
        description="AI tarafından oluşturulan ve danışman takvimine düşen tüm veli randevuları."
        actions={
          <button
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary-container px-4 font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-all hover:bg-primary active:scale-[0.98]"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Yeni Randevu</span>
          </button>
        }
      />

      <div className="flex flex-col gap-6">
        {/* Özet şeridi */}
        <section className="grid grid-cols-2 divide-outline-variant/50 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest sm:grid-cols-4 sm:divide-x sm:divide-y-0 divide-y">
          <div className="p-5">
            <Stat label="Bugün" value={appointmentStats.today} accent="primary" hint="Planlı randevu" />
          </div>
          <div className="p-5">
            <Stat label="Bu hafta" value={appointmentStats.week} hint="Toplam randevu" />
          </div>
          <div className="p-5">
            <Stat label="Onay bekleyen" value={appointmentStats.pending} accent="error" hint="Veli dönüşü bekleniyor" />
          </div>
          <div className="p-5">
            <Stat label="Gelmedi oranı" value={appointmentStats.noShowRate} hint="Son 30 gün" />
          </div>
        </section>

        {/* Bugün — tam genişlik */}
        <SectionCard
          title={`${today.label} · ${today.dateLabel}`}
          subtitle={`${today.items.length} randevu`}
          bodyClassName="p-0"
        >
          {today.items.map((item) => (
            <AppointmentRow key={item.id} item={item} />
          ))}
        </SectionCard>

        {/* Sonraki günler — PC'de 2 kolon */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {rest.map((day) => (
            <SectionCard
              key={day.label}
              title={`${day.label} · ${day.dateLabel}`}
              subtitle={`${day.items.length} randevu`}
              bodyClassName="p-0"
            >
              {day.items.map((item) => (
                <AppointmentRow key={item.id} item={item} />
              ))}
            </SectionCard>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
