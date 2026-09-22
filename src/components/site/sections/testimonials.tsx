import { Eyebrow } from "@/components/site/eyebrow";
import { Reveal } from "@/components/site/reveal";

const REVIEWS = [
  {
    initials: "MK",
    avatarClass: "bg-primary/20 text-primary",
    name: "Murat Kaya",
    role: "Kurucu Temsilcisi · Limit VIP Kurs Merkezleri (Kadıköy)",
    quote:
      "Erken kayıt döneminde 850 aday veliyi 2 rehber öğretmenimizin telefonla araması en az 3 hafta sürüyordu. educallai ile tüm aramaları 2 günde tamamladık ve ilk haftada 142 yüz yüze görüşme randevusu aldık. Kaçırılan öğrenci sayımız sıfıra indi.",
  },
  {
    initials: "ZA",
    avatarClass: "bg-voice-teal/20 text-secondary",
    name: "Zeynep Arslan",
    role: "Eğitim Koordinatörü · Çözüm Koleji & Fen Bilimleri",
    quote:
      "Deneme sınavından sonra veliye düşen net analizlerini ve öğretmen önerilerini yapay zekanın sesli araması velilerimizde inanılmaz bir prestij yarattı. Gecikmiş taksitlerin %85'ini de velileri hiç utandırmadan, WhatsApp ödeme linkiyle kapattık.",
  },
] as const;

const TRUST_BADGES = [
  { icon: "shield", label: "ISO 27001 Bulut Güvenliği" },
  { icon: "lock", label: "256-Bit SSL Şifreleme" },
  { icon: "verified_user", label: "KVKK %100 Uyumlu" },
  { icon: "dns", label: "Türkiye Merkezli Güvenli Sunucular" },
] as const;

export function Testimonials() {
  return (
    <section id="kurum-yorumlari" className="scroll-mt-24 bg-surface py-space-3xl">
      <div className="mx-auto max-w-[1240px] space-y-12 px-margin-mobile lg:px-margin">
        <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
          <Eyebrow icon="workspace_premium">Müşteri Deneyimi</Eyebrow>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">
            Seçkin Kurs &amp; Kolejlerin Ortak Tercihi
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Türkiye genelinde yüzlerce özel dershane, etüt merkezi ve K-12 koleji veli
            operasyonunu educallai&apos;a emanet etti.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {REVIEWS.map((review, i) => (
            <Reveal key={review.name} delay={i * 120} className="h-full">
              <div className="flex h-full flex-col justify-between space-y-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-8">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-notice">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="font-body-md italic leading-relaxed text-body-md text-on-surface">
                  &quot;{review.quote}&quot;
                </p>
              </div>
              <div className="flex items-center gap-3 border-t border-surface-container pt-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${review.avatarClass}`}
                >
                  {review.initials}
                </div>
                <div>
                  <h3 className="font-title-md text-title-md text-on-surface">
                    {review.name}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {review.role}
                  </p>
                </div>
              </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="flex flex-wrap items-center justify-center gap-4 pt-4 font-label-sm text-label-sm text-on-surface-variant sm:gap-8">
          {TRUST_BADGES.map((badge) => (
            <span key={badge.label} className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-voice-teal">
                {badge.icon}
              </span>{" "}
              {badge.label}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
