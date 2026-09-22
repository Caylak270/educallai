import { ChatBubble, type ChatMsg } from "@/components/site/chat-player";
import { Eyebrow } from "@/components/site/eyebrow";
import { Reveal } from "@/components/site/reveal";
import { WA_START_TRIAL } from "@/components/site/links";

/*
  "Kurumunuz hangisine benziyor?" — chatflow.muratify.com persona kartları
  mantığı: her kurum tipi için gerçekçi bir mini WhatsApp diyalogu.
*/

const SEGMENTS: Array<{
  title: string;
  subtitle: string;
  messages: ChatMsg[];
}> = [
  {
    title: "Özel Dershane & Etüt Merkezi",
    subtitle: "Erken kayıt dönemi 3 haftadan 3 güne iner",
    messages: [
      { from: "parent", text: "Erken kayıt için fiyat bilgisi alabilir miyim?" },
      {
        from: "ai",
        text: "Tabii ki! 2025-2026 tarifesini ve %35 erken kayıt indirimi broşürünü gönderdim. 15 dakikalık tanışma araması yapsam ister misiniz?",
      },
      { from: "system", text: "📞 Arama tamamlandı · 2 dk 10 sn · Randevu: Salı 16:30" },
    ],
  },
  {
    title: "Kolej & Özel Okul",
    subtitle: "Veli iletişimi kurum prestijine dönüşür",
    messages: [
      { from: "parent", text: "Servis güzergahı ve yemek listesi nereden bakabilirim?" },
      {
        from: "ai",
        text: "Kızınızın sınıfına özel güzergah haritasını ve aylık menüyü gönderdim Elif Hanım. Rehber öğretmenimizle tanışma görüşmesi de planlayalım mı?",
      },
      { from: "system", text: "✓ Bilgiler iletildi · Rehberlik görüşmesi: Perşembe 10:00" },
    ],
  },
  {
    title: "Kurs Merkezi & Muhasebe",
    subtitle: "Geciken taksitlerin %88'i veliyi rahatsız etmeden kapanır",
    messages: [
      { from: "parent", text: "Bu hafta ödemeyi zor yaparım, erteleme olur mu?" },
      {
        from: "ai",
        text: "Elbette Can Bey, anlıyorum. 1 haftalık erteleme notunu düştüm; dilerseniz 3 taksitli güvenli ödeme linkini de gönderebilirim.",
      },
      { from: "system", text: "✓ Erteleme kaydedildi · Muhasebe panelinde göründü" },
    ],
  },
];

export function Segments() {
  return (
    <section className="bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1240px] space-y-10 px-margin-mobile lg:px-margin">
        <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
          <Eyebrow icon="groups">Size Özel</Eyebrow>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Kurumunuz Hangisine Benziyor?
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Her eğitim kurumunun veli akışı farklı. educallai kurumunuzun
            senaryolarını dinleyerek konuşur — üç örnekten bakın.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {SEGMENTS.map((segment, i) => (
            <Reveal key={segment.title} delay={i * 90} className="h-full">
              <div className="flex h-full flex-col gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="space-y-1">
                  <h3 className="font-title-lg text-title-lg text-on-surface">
                    {segment.title}
                  </h3>
                  <p className="font-body-sm text-body-sm font-medium text-voice-teal-ink">
                    {segment.subtitle}
                  </p>
                </div>
                <div className="flex flex-col gap-2 rounded-2xl bg-obsidian-surface p-3.5">
                  {segment.messages.map((msg, j) => (
                    <ChatBubble key={j} msg={msg} />
                  ))}
                </div>
                <a
                  href={WA_START_TRIAL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 font-label-md text-label-md font-semibold text-primary hover:underline"
                >
                  Bu senaryoyu kendi kurumunuzda dinleyin
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
