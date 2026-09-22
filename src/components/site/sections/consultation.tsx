import { Eyebrow } from "@/components/site/eyebrow";
import { Reveal } from "@/components/site/reveal";
import { WA_BOOK_MEETING } from "@/components/site/links";

const BENEFITS = [
  "Kendi telefonunuza canlı arama testi",
  "Kurumunuza özel 30 dakikalık kurulum planı",
  "Eski veli ve öğrenci verilerinizin ücretsiz aktarımı",
] as const;

export function Consultation() {
  return (
    <section id="canli-demo" className="scroll-mt-24 bg-surface py-space-2xl">
      <div className="mx-auto max-w-[960px] px-margin-mobile lg:px-margin">
        <Reveal className="space-y-6 rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-md sm:p-10">
          <div>
            <Eyebrow icon="event_available">Ücretsiz Canlı Görüşme</Eyebrow>
          </div>
          <div className="space-y-2">
            <h3 className="font-headline-lg text-headline-lg text-on-surface">
              30 Dakikada Sistemi Kendi Listenizle Görün
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Gerçek sistem ekranını kurumunuza özel canlı oturumda gösterelim.
              Görüşmede kursunuza ya da okulunuza özel arama senaryolarını birlikte
              çıkarıyoruz.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-start gap-2.5">
                <span className="material-symbols-outlined shrink-0 text-[20px] text-voice-teal">
                  check_circle
                </span>
                <span className="font-body-sm text-body-sm text-on-surface">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4 border-t border-surface-container pt-4 sm:flex-row">
            <a
              href={WA_BOOK_MEETING}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-title-md text-body-sm text-on-primary transition-all hover:bg-primary-container sm:w-auto"
            >
              <span className="material-symbols-outlined text-[18px]">
                calendar_month
              </span>
              <span>Görüşme Planla</span>
            </a>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Ya da hemen yazın:
            </span>
            <a
              className="font-mono font-bold text-whatsapp-deep hover:underline"
              href={WA_BOOK_MEETING}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp: 0530 992 95 05
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
