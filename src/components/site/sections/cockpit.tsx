import { Eyebrow } from "@/components/site/eyebrow";
import { Reveal } from "@/components/site/reveal";
import { CockpitSimulator } from "@/components/site/sections/cockpit-simulator";

export function Cockpit() {
  return (
    <section id="kokpit" className="scroll-mt-24 bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1240px] space-y-6 px-margin-mobile lg:px-margin">
        <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
          <Eyebrow icon="play_circle" tone="amber">Canlı Deneyim Kokpiti</Eyebrow>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Kurulum Yok — İzle, Dinle, Karar Ver.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Yanınızdaki gerçek panel canlı çalışır — içinde gezin, senaryolar
            arasında geçiş yapın, ister canlı arama başlatın.
          </p>
        </Reveal>
        <CockpitSimulator />
      </div>
    </section>
  );
}
