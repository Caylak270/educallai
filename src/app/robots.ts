import type { MetadataRoute } from "next";

/*
  Pazarlama sitesi arama motoru kuralları.
  Yönetim paneli uygulaması ayrı repoda/deploy'dadır (dershane-ai-hub)
  ve bu siteden dizinlenmez.
*/
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/web",
      },
    ],
    sitemap: "https://educallai.com/sitemap.xml",
  };
}
