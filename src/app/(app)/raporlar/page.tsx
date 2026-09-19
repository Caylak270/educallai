import { PageHeader, PageShell, SectionCard, Stat } from "@/components/ui/page-shell";
import { channelBreakdown, reportFiles, reportKpis, weeklyCallVolume } from "@/lib/mock/reports";

export const metadata = { title: "Raporlar" };

function WeeklyCallChart() {
  const max = Math.max(...weeklyCallVolume.map((d) => d.answered + d.missed));
  return (
    <div className="flex h-56 gap-3 sm:gap-5">
      {weeklyCallVolume.map((d) => {
        const total = d.answered + d.missed;
        const answeredH = Math.round((d.answered / max) * 100);
        const missedH = Math.round((d.missed / max) * 100);
        return (
          <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="font-mono-data text-mono-data font-semibold text-on-surface">
              {total}
            </span>
            <div className="flex w-full max-w-10 flex-1 flex-col justify-end overflow-hidden rounded-lg bg-surface-container-low">
              <div
                className="anim-bar w-full rounded-t-lg bg-tertiary-fixed-dim/70"
                style={{ height: `${missedH}%` }}
                title={`Cevapsız: ${d.missed}`}
              />
              <div
                className="anim-bar w-full bg-primary-container"
                style={{ height: `${answeredH}%` }}
                title={`Cevaplanan: ${d.answered}`}
              />
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

function ChannelBars() {
  const total = channelBreakdown.reduce((sum, c) => sum + c.value, 0);
  return (
    <div className="flex h-56 flex-col justify-center gap-4">
      {channelBreakdown.map((c) => (
        <div key={c.label}>
          <div className="mb-1.5 flex items-baseline justify-between font-label-sm text-label-sm">
            <span className="text-on-surface-variant">{c.label}</span>
            <span className="font-semibold text-on-surface">
              {c.value.toLocaleString("tr-TR")}{" "}
              <span className="font-normal text-outline">· %{c.percent}</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-low">
            <div
              className={`anim-bar h-full rounded-full ${c.color}`}
              style={{ width: `${Math.round((c.value / total) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <PageShell>
      <PageHeader
        title="Raporlar"
        description="Outcome Telemetry özetleri ve dönemsel performans raporları."
        actions={
          <button
            className="flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant/60 px-4 font-label-md text-label-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>PDF İndir</span>
          </button>
        }
      />

      <div className="flex flex-col gap-6">
        {/* Telemetri KPI'ları */}
        <section className="grid grid-cols-2 divide-y divide-outline-variant/50 rounded-xl border border-outline-variant/60 bg-surface-container-lowest sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {reportKpis.map((kpi) => (
            <div key={kpi.label} className="p-5">
              <Stat
                label={kpi.label}
                value={kpi.value}
                hint={kpi.hint}
                valueTone={kpi.deltaTone === "negative" ? "error" : "default"}
              />
              <p
                className={
                  "mt-1 font-label-xs text-label-xs font-semibold " +
                  (kpi.deltaTone === "negative" ? "text-error" : "text-secondary")
                }
              >
                {kpi.delta}
              </p>
            </div>
          ))}
        </section>

        {/* Grafikler */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <SectionCard
            className="xl:col-span-7"
            title="Haftalık AI arama hacmi"
            subtitle="Cevaplanan ve cevapsız aramalar"
            action={
              <span className="flex items-center gap-3 font-label-xs text-label-xs text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-primary-container" /> Cevaplanan
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-tertiary-fixed-dim" /> Cevapsız
                </span>
              </span>
            }
          >
            <WeeklyCallChart />
          </SectionCard>

          <SectionCard
            className="xl:col-span-5"
            title="Kanal dağılımı"
            subtitle="Bu ay toplam 2.072 temas"
          >
            <ChannelBars />
          </SectionCard>
        </div>

        {/* Rapor dosyaları */}
        <SectionCard title="Son raporlar" bodyClassName="p-0">
          {reportFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between gap-3 border-b border-outline-variant/40 px-5 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate font-label-md text-label-md font-semibold text-on-surface">
                  {file.name}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {file.period} · {file.size}
                </p>
              </div>
              <button
                aria-label={`${file.name} indir`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
              </button>
            </div>
          ))}
        </SectionCard>
      </div>
    </PageShell>
  );
}
