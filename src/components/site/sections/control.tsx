import { ChatBubble } from "@/components/site/chat-player";
import { Eyebrow } from "@/components/site/eyebrow";
import { Reveal } from "@/components/site/reveal";

const POINTS = [
  {
    icon: "dashboard",
    title: "Tüm konuşmalar panelde",
    description:
      "Her arama ve WhatsApp mesajı; transkript, duygu analizi ve özetiyle kurum panelinize düşer.",
  },
  {
    icon: "record_voice_over",
    title: "Tek tıkla insana devir",
    description:
      "Veli 'yöneticiyle konuşurum' dediğinde asistan konuyu özetiyle birlikte danışmana devreder ve sessize geçer.",
  },
  {
    icon: "gavel",
    title: "Sınırlar sizde",
    description:
      "Asistanın söyleyeceği her cümle sizin onayladığınız senaryolardan çıkar. KVKK ve İYS kuralları sistem içinde.",
  },
] as const;

export function Control() {
  return (
    <section className="bg-surface-container-low py-space-3xl">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-10 px-margin-mobile lg:grid-cols-2 lg:px-margin">
        <Reveal className="space-y-6">
          <Eyebrow icon="tune">Kontrol Sizde</Eyebrow>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Otomasyon Var; Kumanda Da.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            educallai ekibinizi işsiz bırakmaz — tekrar eden işleri alır. Pazarlık,
            iade, hassas konular: hepsi yine insanınızda.
          </p>
          <div className="space-y-4">
            {POINTS.map((point) => (
              <div key={point.title} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[20px]">
                    {point.icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface">
                    {point.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Devir sohbeti */}
        <Reveal delay={120}>
          <div className="overflow-hidden rounded-2xl border border-obsidian-border bg-obsidian-surface shadow-xl">
            <div className="border-b border-obsidian-border bg-[#075E54]/60 px-4 py-3">
              <p className="text-[13px] font-semibold text-white">WhatsApp · devir örneği</p>
              <p className="text-[11px] text-emerald-300">asistan → danışman geçişi</p>
            </div>
            <div className="flex flex-col gap-2 bg-[#0B141A] px-4 py-4">
              <ChatBubble
                msg={{
                  from: "parent",
                  text: "Oğlumun kaydını düşündük, konuşabilir miyiz bu konuyu?",
                }}
              />
              <ChatBubble
                msg={{
                  from: "ai",
                  text: "Elbette, bu konu için danışmanımızın devreye girmesi daha doğru olur. Hemen bağlıyorum.",
                }}
              />
              <ChatBubble
                msg={{
                  from: "system",
                  text: "👤 Asistan sustu · sohbet özetiyle birlikte Elif Hanım'a (rehber öğretmen) devredildi",
                }}
              />
              <ChatBubble
                msg={{
                  from: "ai",
                  text: "Merhaba, ben Elif. Konuyu özetle okudum — 3 dakikada çözelim mi?",
                }}
              />
              <ChatBubble msg={{ from: "parent", text: "Çok hızlısınız, teşekkürler 🙏" }} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
