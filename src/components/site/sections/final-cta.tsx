import { Reveal } from "@/components/site/reveal";
import { WA_INFO, WA_START_TRIAL } from "@/components/site/links";

export function FinalCta() {
  return (
    <section className="bg-surface-container-low py-space-3xl">
      <Reveal className="mx-auto max-w-[800px] space-y-6 px-margin-mobile text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
          <span className="material-symbols-outlined text-[32px]">rocket_launch</span>
        </div>
        <div className="space-y-2">
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Kurumunuzu Bugün Dijitalleştirin.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            14 gün boyunca tüm özellikleri ücretsiz ve sınırsız deneyin. Kart bilgisi
            gerekmez.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          <a
            href={WA_START_TRIAL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-title-md text-body-sm text-on-primary shadow-md transition-all hover:bg-primary-container active:scale-[0.98] sm:w-auto"
          >
            <span>Randevu Planla — Ücretsiz Görüşme</span>
          </a>
          <a
            href={WA_INFO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-6 py-3.5 font-title-md text-body-sm text-on-surface transition-all hover:bg-surface-container-low active:scale-[0.98] sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px] text-whatsapp-deep">
              chat
            </span>
            <span>WhatsApp Destek Hattı</span>
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 font-mono-data text-mono-data text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">call</span> 0850 885
            91 22
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-whatsapp-deep">
              chat
            </span>{" "}
            WhatsApp: 0530 992 95 05
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">mail</span>{" "}
            info@educallai.com
          </span>
        </div>
      </Reveal>
    </section>
  );
}
