import { ChatPlayer, type ChatScenario } from "@/components/site/chat-player";
import { CountUp } from "@/components/site/count-up";
import { WA_START_TRIAL } from "@/components/site/links";

const STATS = [
  { value: "7/24", label: "Kesintisiz Veli İletişimi", accent: false },
  { value: "< 5 Dk", label: "Excel Listesiyle Yayına Çıkış", accent: false },
  { value: "₺0", label: "Kurulum & Entegrasyon Masrafı", accent: true },
  { value: null, label: "Cevaplanan Veli & Randevu Dönüşümü", accent: false },
] as const;

/* Hero'da kendiliğinden oynayan veli-asistan sohbetleri */
const SCENARIOS: ChatScenario[] = [
  {
    id: "erken-kayit",
    label: "Erken Kayıt",
    messages: [
      { from: "parent", text: "Merhaba, 8. sınıf oğlum için erken kayıt fiyatlarını öğrenebilir miyim?" },
      {
        from: "ai",
        text: "Merhaba Ayşe Hanım 👋 2025-2026 erken kayıt tarifesini ve indirim takvimini az önce WhatsApp'ınıza gönderdim. İsterseniz 3 dakikalık kısa bir tanışma araması da yapabilirim, uygun mudur?",
      },
      { from: "system", text: "📞 Asistan veliyi 09:24'te aradı · 2 dk 40 sn · Randevu: Cumartesi 14:00" },
      {
        from: "ai",
        text: "Cumartesi 14:00 rehberlik randevunuz oluşturuldu Ayşe Hanım. Kurum konumunu ve broşürü WhatsApp'tan ilettim 📍",
      },
      { from: "system", text: "✓ Randevu takvime eklendi · Broşür ve konum iletildi" },
    ],
  },
  {
    id: "deneme-analizi",
    label: "Deneme Analizi",
    messages: [
      { from: "system", text: "📊 Özdebir deneme sonuçları açıklandı · Zeynep Arslan · Fen neti +4" },
      {
        from: "ai",
        text: "Mehmet Bey iyi günler, Zeynep'in fen neti son denemeye göre %30 arttı 🎉 Soru analiz karnesini ve öğretmen önerilerini az önce WhatsApp'ınıza bıraktım.",
      },
      { from: "parent", text: "Çok teşekkürler, peki geometrideki durumu nasıl?" },
      {
        from: "ai",
        text: "Geometri için haftalık 2 saatlik takviye planı hazırladık. Cuma 17:00 etüt saati müsait — yerinde sayalım mı?",
      },
      { from: "parent", text: "Uygun 👍" },
      { from: "system", text: "✓ Etüt randevusu oluşturuldu · Zümreye bildirildi" },
    ],
  },
  {
    id: "taksit",
    label: "Taksit",
    messages: [
      {
        from: "ai",
        text: "Sayın Hakan Bey, mart ayı eğitim taksidinizin vadesi 3 gün önceydi. Yoğunluğunuzdan gözden kaçmış olabilir diye nazikçe hatırlatmak istedik 🙏",
      },
      { from: "parent", text: "Kusura bakmayın seyahatteydim, hemen ödeyeyim." },
      {
        from: "ai",
        text: "Elbette Hakan Bey, aceleye gerek yok. Kredi kartına 3 taksit imkânıyla güvenli ödeme bağlantınız: pay.educallai.com/48213",
      },
      { from: "system", text: "✓ Ödeme alındı · ₺4.250 · e-makbuz WhatsApp'a gönderildi" },
    ],
  },
];

export function Hero() {
  return (
    <section className="relative -mt-20 overflow-hidden bg-obsidian-canvas pb-space-3xl pt-6 text-inverse-on-surface">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(79,70,229,0.35),rgba(255,255,255,0))] opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[340px] w-[720px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-[1240px] px-margin-mobile pt-24 lg:px-margin">
        {/* Üst aciliyet şeridi */}
        <div className="mb-8 flex items-center justify-between gap-3 rounded-full border border-obsidian-border bg-obsidian-surface px-4 py-2.5 text-tertiary-fixed shadow-sm">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis">
            <span className="inline-flex items-center rounded bg-amber-notice px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-obsidian-canvas">
              Erken Kayıt
            </span>
            <span className="truncate font-body-sm text-body-sm text-surface-container-low">
              🔥 <strong>2025-2026 Erken Kayıt Dönemi Yayında</strong> • YENİ Deneme
              Sınavı Net Analizli Veli Araması • WhatsApp Akıllı Tahsilat &amp; Taksit
              Takibi
            </span>
          </div>
          <span className="hidden shrink-0 items-center gap-1 font-label-sm text-label-sm text-voice-teal md:inline-flex">
            250+ Kurs ve Kolej Aktif
          </span>
        </div>

        {/* Ana hero: metin + canlı sohbet */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-label-md text-label-md text-primary-fixed">
              <span className="material-symbols-outlined text-[16px] text-voice-teal">
                auto_awesome
              </span>
              <span>Kurulum Yok — 1 Günde Anahtar Teslim • MEB &amp; KVKK Uyumlu</span>
            </div>
            <h1 className="font-display-xl text-display-xl tracking-tight text-surface-container-lowest">
              educallai: Kurs ve Dershanelerin{" "}
              <span className="bg-gradient-to-r from-primary-fixed-dim via-voice-teal to-secondary-fixed bg-clip-text text-transparent">
                Otonom Veli &amp; Kayıt Asistanı.
              </span>
            </h1>
            <p className="max-w-2xl font-body-lg text-body-lg text-outline-variant">
              Yapay zeka, velinizi arıyor; randevuyu kuruyor, broşürü WhatsApp&apos;tan
              gönderiyor, geciken taksiti kibarca hatırlatıyor. Rehberlik ve idari
              masanın iş yükünü sıfırlayın — konuşmalar kendiliğinden oynar.
            </p>

            {/* CTA kümesi */}
            <div className="flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row lg:justify-start">
            <a
              href={WA_START_TRIAL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary px-6 py-3.5 font-title-md text-title-md text-on-primary shadow-md shadow-primary/20 transition-all hover:bg-primary-container active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[22px]">chat</span>
              <span>WhatsApp&apos;tan Ücretsiz Görüşme Planla</span>
            </a>
              <a
                href="#canli-test"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-obsidian-border bg-obsidian-surface px-6 py-3.5 font-title-md text-title-md text-surface-container-lowest transition-all hover:bg-slate-800 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[20px] text-voice-teal">
                  call
                </span>
                <span>Kendi Telefonunuza Test Çağrısı Alın</span>
              </a>
            </div>
            <p className="font-body-sm text-body-sm text-outline-variant">
              Türkiye genelindeki 250+ özel kurs, etüt merkezi ve K-12 kolejinin gerçek
              operasyonel akışından geliştirildi.
            </p>
          </div>

          {/* Canlı oynayan sohbet */}
          <div className="lg:col-span-5">
            <ChatPlayer scenarios={SCENARIOS} />
            <p className="mt-3 text-center font-mono text-[11px] text-outline-variant">
              Konuşmalar kendiliğinden oynar · senaryolar gerçek veli akışlarıdır
            </p>
          </div>
        </div>

        {/* Metrik kartları */}
        <div className="mt-12 grid grid-cols-2 gap-3 text-left md:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-obsidian-border bg-obsidian-surface/90 p-4 backdrop-blur-md"
            >
              <span
                className={`font-metric-stat text-metric-stat tracking-tight ${
                  stat.accent ? "text-voice-teal" : "text-surface-container-lowest"
                }`}
              >
                {stat.value ?? <CountUp value={88.4} decimals={1} prefix="%" />}
              </span>
              <p className="mt-1 font-body-sm text-body-sm text-outline-variant">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
