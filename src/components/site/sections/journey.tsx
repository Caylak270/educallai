import { ChatBubble } from "@/components/site/chat-player";
import { Eyebrow } from "@/components/site/eyebrow";
import { Reveal } from "@/components/site/reveal";

/*
  "Bir velinin 7 günü" — chatflow.muratify.com'daki uçtan uca yolculuk
  bölümünün educallai uyarlaması: kurulum değil, veli deneyimi anlatılır.
*/

const STEPS: Array<{
  day: string;
  title: string;
  description: string;
  messages: Array<{ from: "ai" | "parent" | "system"; text: string }>;
}> = [
  {
    day: "Pazartesi · 10:00",
    title: "Erken kayıt araması",
    description:
      "Asistan, listeyi yüklediğiniz anda aday velileri tek tek aramaya başlar. Veli evet derse randevuyu anında takvime koyar.",
    messages: [
      {
        from: "ai",
        text: "İyi günler Ayşe Hanım, Çözüm Kurs Merkezi'nden arıyorum. Kerem'in YKS hazırlığı için cumartesi rehberlik randevusu oluşturabilir miyiz?",
      },
      { from: "parent", text: "Cumartesi 14:00 uygun." },
      { from: "system", text: "✓ Randevu: Cumartesi 14:00 · Broşür WhatsApp'ta" },
    ],
  },
  {
    day: "Aynı an",
    title: "WhatsApp broşür ve konum",
    description:
      "Telefonu kapatan velinin cebine bile fiyat tablosu, Google Harita konumu ve tanıtım kartı saniyeler içinde ulaşır.",
    messages: [
      { from: "ai", text: "📄 2025-2026 fiyat tablosu\n📍 Kurum konumu ve otopark rehberi\n👩‍🏫 Rehber öğretmen tanıtım kartı" },
      { from: "system", text: "✓ 3 dosya teslim edildi · okundu bilgisi alındı" },
    ],
  },
  {
    day: "Çarşamba · 18:00",
    title: "Randevu hatırlatması",
    description:
      "Gelmeyen randevu, kaybedilen kayıttır. Asistan randevudan bir gün önce veliyi WhatsApp'tan hatırlatır.",
    messages: [
      {
        from: "ai",
        text: "Ayşe Hanım, yarın 14:00 rehberlik görüşmenizi hatırlatmak istedim. Değişiklik gerekirse tek mesajla yenileyebiliriz 🙏",
      },
      { from: "parent", text: "Teşekkürler, geleceğiz!" },
    ],
  },
  {
    day: "Cuma · 16:30",
    title: "Deneme analizi araması",
    description:
      "Deneme sonrası veliye bireysel net analizi araması yapan kurum, velinin gözünde 1 sınıf üstüne çıkar.",
    messages: [
      {
        from: "ai",
        text: "Mehmet Bey, Zeynep'in fen neti son denemeye göre %30 arttı 🎉 Geometri için önerdiğimiz takviye planını da ilettim.",
      },
      { from: "parent", text: "Harika haber! Planı paylaşır mısınız?" },
      { from: "system", text: "✓ Takviye planı WhatsApp'a gönderildi" },
    ],
  },
  {
    day: "Ay sonu",
    title: "Nazik taksit hatırlatması",
    description:
      "Muhasebe telefonla kovalamaz; asistan kibarca hatırlatır, güvenli ödeme linkini ilettiği gibi makbuzu da gönderir.",
    messages: [
      {
        from: "ai",
        text: "Sayın Hakan Bey, mart ayı taksidinizin vadesi geçti. Uygunsa 3 taksitli güvenli ödeme bağlantısı gönderebilirim.",
      },
      { from: "system", text: "✓ Ödeme alındı · ₺4.250 · makbuz iletildi" },
    ],
  },
  {
    day: "Her an",
    title: "İnsana devir",
    description:
      "Asistan bilmediği veya hassas bulduğu konuda susmaz, danışmanını sohbete katıp özetiyle birlikte devreder.",
    messages: [
      { from: "parent", text: "Oğlumun bursluluk sınavından sonra kayıt iptali düşünebiliriz..." },
      { from: "system", text: "👤 Asistan bu konuyu danışmana devretti · özetle birlikte" },
      {
        from: "ai",
        text: "Elif Hanım şu anda sohbete katıldı. Tüm geçmişi özetiyle birlikte gördü — yeniden anlatmanıza gerek yok.",
      },
    ],
  },
];

export function Journey() {
  return (
    <section className="bg-surface-container-low py-space-3xl">
      <div className="mx-auto max-w-[1240px] space-y-12 px-margin-mobile lg:px-margin">
        <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
          <Eyebrow icon="route">Uçtan Uca</Eyebrow>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Bir Velinin 7 Günü — educallai Her Adımda Devrede
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Tek bir aday velinin kayıt olmasından taksitinin kapanmasına kadar
            gerçekleşenlerin tamamı — ekibiniz hiç telefonu kaldırmadan.
          </p>
        </Reveal>

        <div className="relative mx-auto max-w-3xl space-y-8">
          {/* Zaman çizgisi */}
          <div
            aria-hidden="true"
            className="absolute bottom-4 left-[19px] top-4 hidden w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent sm:block"
          />
          {STEPS.map((step, i) => (
            <Reveal key={step.day} delay={i * 60}>
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex items-center gap-3 sm:w-44 sm:shrink-0 sm:flex-col sm:items-end sm:text-right">
                  <div className="order-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary font-title-md font-bold text-on-primary sm:order-1">
                    {i + 1}
                  </div>
                  <div className="order-1 sm:order-2">
                    <p className="font-label-sm font-mono-data text-mono-data uppercase text-primary">
                      {step.day}
                    </p>
                    <h3 className="font-title-md text-title-md text-on-surface">
                      {step.title}
                    </h3>
                  </div>
                </div>
                <div className="flex-1 space-y-3 rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-sm sm:ml-2">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {step.description}
                  </p>
                  <div className="flex flex-col gap-2 rounded-xl bg-obsidian-surface p-3.5">
                    {step.messages.map((msg, j) => (
                      <ChatBubble key={j} msg={msg} />
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
