# educallai — Pazarlama Web Sitesi

Dershaneler için **7/24 çok kanallı AI sesli + yazılı asistan platformu**
educallai'nin pazarlama web sitesi: 16 bölümlük tek sayfa vitrin (`/web`),
kayıp gelir hesaplayıcı, canlı sohbet demosu, SSS ve iletişim akışları.

> **Yönetim paneli uygulaması** (dashboard: veliler CRM, tahsilat, ödev takibi,
> ders programı, öğretmen bordro vb.) ayrı depodadır:
> [`Caylak270/dershane-ai-hub`](https://github.com/Caylak270/dershane-ai-hub)

## Sayfa bölümleri (`/web`)

Hero (canlı sohbet) · Kokpit vitrini (canlı panel iframe'i) · Özellikler ·
Nasıl Çalışır · Segmentler · Yol Haritası · Kayıp Gelir Hesaplayıcı ·
Kurum Yorumları · Teklif · SSS · Final CTA · İletişim

## Teknoloji

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 (Material 3
token'ları) · Playwright (smoke testleri)

## Çalıştırma

```bash
npm install
npm run dev                  # http://localhost:3000/web
node scripts/site-smoke.mjs  # smoke test paketi (dev server ayakta iken)
```

- Kök adres (`/`) otomatik `/web`'e yönlendirir.
- "Canlı vitrin" bölümü, yönetim paneli uygulamasının deploy'unu iframe ile
  gömer; hedef adres `NEXT_PUBLIC_APP_DEMO_URL` ortam değişkeniyle
  ayarlanır (varsayılan: `https://app.educallai.com/demo`).

## Deploy

Ortam değişkeni zorunlu değildir; statik içerik + tek iframe'den oluşur.
Panel uygulaması `app.educallai.com` altında yayınlanır.
