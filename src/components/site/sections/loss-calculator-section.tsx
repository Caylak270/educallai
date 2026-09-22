import { Reveal } from "@/components/site/reveal";
import { LossCalculator } from "@/components/site/sections/loss-calculator";

export function LossCalculatorSection() {
  return (
    <section
      id="kayip-gelir-hesapla"
      className="relative scroll-mt-24 overflow-hidden bg-obsidian-canvas py-space-3xl text-inverse-on-surface"
    >
      <div className="relative z-10 mx-auto max-w-[1240px] space-y-10 px-margin-mobile lg:px-margin">
        <Reveal className="mx-auto max-w-2xl space-y-2 text-center">
          <span className="font-label-sm font-bold text-label-sm uppercase tracking-wider text-critical-rose">
            Gerçek Rakamlar
          </span>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-surface-container-lowest">
            Kaçırılan veya Ulaşılamayan Veliler Size Ne Kadar Kaybettiriyor?
          </h2>
          <p className="font-body-md text-body-md text-outline-variant">
            Aramaya vakit bulunamayan aday veliler rakip kurslara gidiyor. Aşağıdaki
            sürgüleri kurumunuza göre ayarlayın — gerçek rakamlar konuşsun.
          </p>
        </Reveal>
        <Reveal>
          <LossCalculator />
        </Reveal>
      </div>
    </section>
  );
}
