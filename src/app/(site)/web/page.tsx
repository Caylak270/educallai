import type { Metadata } from "next";

import { FAQS } from "@/components/site/sections/faq-data";
import { Cockpit } from "@/components/site/sections/cockpit";
import { Consultation } from "@/components/site/sections/consultation";
import { Control } from "@/components/site/sections/control";
import { FaqSection } from "@/components/site/sections/faq-section";
import { Features } from "@/components/site/sections/features";
import { FinalCta } from "@/components/site/sections/final-cta";
import { Founder } from "@/components/site/sections/founder";
import { Hero } from "@/components/site/sections/hero";
import { HowItWorks } from "@/components/site/sections/how-it-works";
import { Integrations } from "@/components/site/sections/integrations";
import { Journey } from "@/components/site/sections/journey";
import { LossCalculatorSection } from "@/components/site/sections/loss-calculator-section";
import { QuoteSection } from "@/components/site/sections/quote-section";
import { Segments } from "@/components/site/sections/segments";
import { Testimonials } from "@/components/site/sections/testimonials";

export const metadata: Metadata = {
  title: {
    absolute: "educallai — Dershaneler İçin Otonom Veli & Kayıt Asistanı",
  },
  description:
    "Yapay zeka 7/24 veli arıyor: kayıt randevusu, deneme analizi, WhatsApp bilgilendirme ve tahsilat hatırlatması tek platformda.",
  alternates: { canonical: "https://educallai.com/web" },
  openGraph: {
    title: "educallai — Dershaneler İçin Otonom Veli & Kayıt Asistanı",
    description:
      "Yapay zeka 7/24 veli arıyor: kayıt randevusu, deneme analizi, WhatsApp bilgilendirme ve tahsilat hatırlatması tek platformda.",
    url: "https://educallai.com/web",
    locale: "tr_TR",
    type: "website",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630, alt: "educallai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "educallai — Dershaneler İçin Otonom Veli & Kayıt Asistanı",
    description:
      "Yapay zeka 7/24 veli arıyor: kayıt randevusu, deneme analizi, WhatsApp bilgilendirme ve tahsilat hatırlatması tek platformda.",
    images: ["/brand/og-image.png"],
  },
};

/* Yapısal veri: Organization + WebSite + FAQPage (zengin sonuç uygunluğu) */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://educallai.com/#org",
      name: "educallai",
      url: "https://educallai.com",
      logo: "https://educallai.com/brand/icon.png",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+90-530-992-95-05",
        contactType: "sales",
        availableLanguage: "Turkish",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://educallai.com/#site",
      name: "educallai",
      url: "https://educallai.com",
      inLanguage: "tr",
      publisher: { "@id": "https://educallai.com/#org" },
    },
    {
      "@type": "WebPage",
      "@id": "https://educallai.com/web",
      url: "https://educallai.com/web",
      name: "educallai — Dershaneler İçin Otonom Veli & Kayıt Asistanı",
      isPartOf: { "@id": "https://educallai.com/#site" },
      inLanguage: "tr",
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ],
};

export default function WebPage() {
  return (
    <div className="flex w-full flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Integrations />
      <Cockpit />
      <Features />
      <Segments />
      <HowItWorks />
      <Journey />
      <Control />
      <Testimonials />
      <QuoteSection />
      <LossCalculatorSection />
      <Consultation />
      <Founder />
      <FaqSection />
      <FinalCta />
    </div>
  );
}
