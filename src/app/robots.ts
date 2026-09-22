import type { MetadataRoute } from "next";

/*
  Pazarlama sitesi yayına hazır: arama motoru kuralları.
  İç panel (/) ve CRM demo (/demo) dizinlenmez.
*/
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/web",
        disallow: [
          "/demo",
          "/api",
          "/ayarlar",
          "/gorusmeler",
          "/kampanyalar",
          "/randevular",
          "/raporlar",
          "/tahsilat",
          "/veliler",
          "/deneme-analizi",
        ],
      },
    ],
    sitemap: "https://educallai.com/sitemap.xml",
  };
}
