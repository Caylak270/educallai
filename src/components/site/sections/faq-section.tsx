import { Eyebrow } from "@/components/site/eyebrow";
import { Reveal } from "@/components/site/reveal";
import { Faq } from "@/components/site/sections/faq";

export function FaqSection() {
  return (
    <section id="sss" className="scroll-mt-24 bg-surface py-space-3xl">
      <div className="mx-auto max-w-[800px] space-y-8 px-margin-mobile lg:px-margin">
        <Reveal className="space-y-3 text-center">
          <Eyebrow icon="help">Merak Edilenler</Eyebrow>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Sıkça Sorulan Sorular
          </h2>
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
      </div>
    </section>
  );
}
