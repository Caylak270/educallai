import { Reveal } from "@/components/site/reveal";

const STEPS = [
  {
    number: "01",
    icon: "chat",
    iconColor: "text-whatsapp-deep",
    title: "WhatsApp'tan Yazın",
    description:
      "İki bilgi yeterli: Kurum adı ve tahmini öğrenci sayınız. Size özel veli karşılama ve erken kayıt senaryosunu aynı gün hazırlayalım.",
  },
  {
    number: "02",
    icon: "upload_file",
    iconColor: "text-voice-teal",
    title: "Öğrenci & Veli Listenizi Yükleyin",
    description:
      "Mevcut Excel veya kurum otomasyonunuzdaki (K12NET vb.) listeyi sürükleyip bırakın; eksik veya hatalı numaraları sistem otomatik temizlesin.",
  },
  {
    number: "03",
    icon: "rocket_launch",
    iconColor: "text-primary",
    title: "Biz Başlatır, Birlikte İzleriz",
    description:
      "Asistanınız velileri aramaya, kayıt randevusu almaya ve WhatsApp'tan konum göndermeye başlasın. Canlı panelden sonuçları izleyin.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="nasil-calisir" className="scroll-mt-24 bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1240px] space-y-12 px-margin-mobile lg:px-margin">
        <Reveal className="mx-auto max-w-2xl space-y-2 text-center">
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary">
            Kolay Kurulum
          </span>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            5 Dakikada Yayında. Teknik Ekip Gerekmez.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Üç adım — telefon başında saatlerce beklemeden, kurumunuzun günlük
            temposunu bozmadan gerçekleşir.
          </p>
        </Reveal>
        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.number} delay={i * 120} className="h-full">
              <div className="relative h-full space-y-4 rounded-2xl border border-surface-container bg-surface-container-low p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-title-lg font-bold text-on-primary">
                    {step.number}
                  </div>
                  <span
                    className={`material-symbols-outlined text-[24px] ${step.iconColor}`}
                  >
                    {step.icon}
                  </span>
                </div>
                <h3 className="font-title-lg text-title-lg text-on-surface">
                  {step.title}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
