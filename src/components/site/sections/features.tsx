import { Eyebrow } from "@/components/site/eyebrow";
import { Reveal } from "@/components/site/reveal";

const FEATURES = [
  {
    icon: "record_voice_over",
    title: "Doğal Sesli AI Arama Motoru",
    description:
      "Robot gibi konuşmayan, velinin sözünü kesmeyen ve Türkçe şiveleri anlayan ultra düşük gecikmeli (650ms) yerel ses modelleri. Erken kayıt ve bursluluk için günde 1.000 veliyi 10 dakikada arayın.",
    footerLeft: "Gecikme: 650 ms",
    footerRight: "Doğallık Skoru: %98.4",
  },
  {
    icon: "calendar_today",
    title: "Tek Tıkla Rehberlik & Randevu Ajandası",
    description:
      'Veli telefonda "cumartesi öğleden sonra gelebilirim" dediği an rehberlik masası takvimine boşlukları kontrol ederek randevu işler. SMS ve WhatsApp doğrulamasını anında yollar.',
    footerLeft: "Sıfır Çakışma",
    footerRight: "Otomatik Takvim Entegre",
  },
  {
    icon: "analytics",
    title: "Deneme Sınavı Alarmı & Veli Araması",
    description:
      "Özdebir, Töder ve kurum içi denemelerde neti gerileyen veya sınıfında ilk 3'e giren öğrencileri otomatik tespit eder. Veliyi özel arayıp analiz raporu sunarak kurum prestijinizi katlar.",
    footerLeft: "Kişiselleştirilmiş Net Raporu",
    footerRight: "Veli Bağlılığı Artışı",
  },
  {
    icon: "payments",
    title: "Nazik & Akıllı Taksit Tahsilatı",
    description:
      "Geciken taksitler için veliyi kırmadan 3 aşamalı nazik hatırlatma (WhatsApp, SMS, AI sesli arama). Güvenli 3D iyzico ödeme linki ile muhasebe personelinizin tahsilat stresini yok eder.",
    footerLeft: "%88.4 Tahsilat Başarısı",
    footerRight: "Hukuki Güvenlik",
  },
  {
    icon: "chat",
    title: "Resmi WhatsApp Business & Broşür",
    description:
      "Telefonu kapatan velinin cebine 2 saniye içinde kurumunuzun Google Harita konumu, bursluluk başvuru formu veya erken kayıt fiyat broşürü yeşil onay rozetli WhatsApp hesabınızdan iletilir.",
    footerLeft: "Meta Cloud API",
    footerRight: "Işık Hızı Teslim",
  },
  {
    icon: "gavel",
    title: "%100 KVKK & İYS Hukuki Uyum Kalkanı",
    description:
      "İleti Yönetim Sistemi (İYS) izinli listeleriyle tam senkron. Arama başında yasal bilgilendirme anonsu, veli 'arama istemiyorum' dediğinde tek cümleyle otomatik kara liste güvenliği.",
    footerLeft: "Cezai Risk Sıfır",
    footerRight: "MEB Standartlarına Uygun",
  },
] as const;

export function Features() {
  return (
    <section
      id="ozellikler"
      className="scroll-mt-24 border-y border-surface-container-highest bg-surface-container-low py-space-3xl"
    >
      <div className="mx-auto max-w-[1240px] space-y-10 px-margin-mobile lg:px-margin">
        <Reveal className="mx-auto max-w-3xl space-y-3 text-center">
          <Eyebrow icon="auto_awesome">Neden educallai?</Eyebrow>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Kurumunuzu Büyüten 6 Ana Güç
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Gereksiz detaylar, karmaşık santral menüleri veya tuşlama labirentleri yok.
            Her saniyesi yeni öğrenci kaydı ve veli memnuniyeti sağlayan yüksek
            teknolojili altyapı.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 80} className="h-full">
              <div className="flex h-full flex-col justify-between space-y-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[26px]">
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className="font-title-lg text-title-lg text-on-surface">
                    {feature.title}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {feature.description}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-surface-container pt-3 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="font-semibold text-primary">{feature.footerLeft}</span>
                  <span className="font-semibold text-voice-teal-ink">{feature.footerRight}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
