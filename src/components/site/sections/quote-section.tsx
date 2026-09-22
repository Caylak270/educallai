import { Eyebrow } from "@/components/site/eyebrow";
import { Reveal } from "@/components/site/reveal";
import { WA_START_TRIAL } from "@/components/site/links";

/*
  Sabit paket/fiyat YOK — fiyat, kuruma özel planla birlikte ücretsiz
  görüşmede netleşir. Tüm CTA'lar WhatsApp randevusuna yönlendirir.
*/

const MEETING_AGENDA = [
  {
    icon: "science",
    color: "text-primary",
    title: "Canlı Test",
    description:
      "Kendi telefonunuza gerçek bir test çağrısı aldırın; asistanın sesini ve akışı kurumunuzun senaryosuyla dinleyin.",
  },
  {
    icon: "tune",
    color: "text-voice-teal",
    title: "İhtiyaç Analizi",
    description:
      "Öğrenci sayınız, arama hacminiz ve veli senaryolarınızı birlikte çıkarıyoruz; size özel plan buna göre şekilleniyor.",
  },
  {
    icon: "request_quote",
    color: "text-whatsapp-deep",
    title: "Net Teklif",
    description:
      "Görüşmenin sonunda kuruşu kuruşuna net fiyatı ve ödeme planını alıyorsunuz — sürpriz kalem yok.",
  },
] as const;

const GUARANTEES = [
  { icon: "verified", label: "14 Gün Koşulsuz Ücretsiz Deneme" },
  { icon: "credit_card_off", label: "Kredi Kartı Bilgisi İstenmez" },
  { icon: "event_busy", label: "İstediğiniz An İptal" },
  { icon: "settings_backup_restore", label: "Eski Veri Aktarımı Ücretsiz" },
] as const;

export function QuoteSection() {
  return (
    <section id="teklif" className="scroll-mt-24 bg-surface-container-low py-space-3xl">
      <div className="mx-auto max-w-[1240px] space-y-10 px-margin-mobile lg:px-margin">
        <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
          <Eyebrow icon="local_offer">Fiyatlandırma</Eyebrow>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Sabit Paket Yok — Size Özel Plan, Görüşmede.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Her kurumun öğrenci sayısı, arama hacmi ve veli senaryoları farklı. Bu
            yüzden fiyatı bir ekrana yazmıyoruz: 30 dakikalık ücretsiz görüşmede
            kurumunuza özel planı ve net fiyatı birlikte çıkarıyoruz.
          </p>
        </Reveal>

        {/* Görüşme gündemi */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {MEETING_AGENDA.map((item, i) => (
            <Reveal key={item.title} delay={i * 80} className="h-full">
              <div className="flex h-full flex-col gap-3 rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ${item.color}`}
                >
                  <span className="material-symbols-outlined text-[26px]">
                    {item.icon}
                  </span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface">
                  {item.title}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {item.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Randevu CTA kartı */}
        <Reveal>
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-surface-container-low p-6 text-center shadow-md sm:p-10">
            <div className="mx-auto max-w-2xl space-y-4">
              <h3 className="font-headline-lg text-headline-lg text-on-surface">
                30 Dakikada Fiyatınızı Öğrenin
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Görüşme ücretsiz, yükümlülük yok. WhatsApp&apos;tan yazın — uygun
                olduğunuz saatte planlayalım.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                <a
                  href={WA_START_TRIAL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-title-md text-body-sm text-on-primary shadow-md shadow-primary/20 transition-all hover:bg-primary-container active:scale-[0.98] sm:w-auto"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  <span>Ücretsiz Görüşme Planla</span>
                </a>
                <a
                  href="tel:05309929505"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-high px-6 py-3.5 font-title-md text-body-sm text-on-surface transition-colors hover:bg-surface-dim sm:w-auto"
                >
                  <span className="material-symbols-outlined text-[20px]">call</span>
                  <span className="font-mono-data text-mono-data">0530 992 95 05</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Güvence şeridi */}
        <Reveal className="flex flex-wrap items-center justify-center gap-4 pt-2 font-medium text-[13px] text-on-surface-variant sm:gap-8">
          {GUARANTEES.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-voice-teal">
                {item.icon}
              </span>{" "}
              {item.label}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
