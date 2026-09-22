# Web Sitesi (/web) Rehberi

> Bu rehber **sadece pazarlama web sitesi** (`/web`) ile ilgilenenler içindir.
> Dashboard (`src/app/(app)`, `src/components/pages`, `src/components/shell`),
> voice agent (`agent/`) ve Supabase (`supabase/`) ile ilgilenmiyorsanız o
> klasörleri hiç açmanıza gerek yok.

## Kurulum (sır/anahtar GEREKMEZ)

```bash
git clone https://github.com/Caylak270/educallai.git
cd educallai
npm install
npm run dev
```

→ http://localhost:3000/web — `.env.local` olmadan da tam çalışır (demo veri).

## Nerede Ne Var

| Ne | Nerede |
|---|---|
| **Bölüm sırası / sayfa** | `src/app/(site)/web/page.tsx` — bölümleri buradan ekler/çıkarır/sıralarsın |
| **Her bölümün dosyası** | `src/components/site/sections/` — `hero.tsx`, `features.tsx`, `faq.tsx`… |
| **Üst bar / alt bilgi** | `src/components/site/site-header.tsx` · `site-footer.tsx` |
| **Sitenin renk & font teması** | `src/app/(site)/site.css` — `@theme` bloğu |
| **Tüm WhatsApp linkleri / numara** | `src/components/site/links.ts` — numara buradan değişir |
| **Canlı CRM vitrini** | `src/app/demo/page.tsx` (ekran) + `sections/live-panel.tsx` (çerçeve) |
| **Hero'daki oynayan sohbet** | `sections/chat-player.tsx` — senaryo metinleri `hero.tsx` içinde |

## Değişiklik Sonrası Kontrol

```bash
node scripts/site-smoke.mjs
```

26 kontrol koşar (rota, kırık link, etkileşim, mobil taşma). **Hepsi ✓ değilse
pushlama.**

## Bilinmesi Gereken 4 Kural

1. **İki ayrı tema var:** `src/app/globals.css` = dashboard teması,
   `src/app/(site)/site.css` = site teması. Siteye dokunurken site.css'teki
   tokenları kullan; ikisini birleştirme.
2. **Renk hiyerarşisi:** birincil aksiyon = indigo (`bg-primary`);
   teal (`voice-teal`) yalnızca canlı/AI sinyalleri;
   yeşil (`whatsapp-deep/green`) yalnızca WhatsApp görselleri ve
   yüzen buton (`float-whatsapp.tsx`).
3. **Yeni bölüm eklerken:** `Reveal` (giriş animasyonu) ve `Eyebrow`
   (başlık üstü hap) bileşenlerini kullan — sayfa tutarlılığı bunlara bağlı.
4. **Metin/`₺` fiyat yok:** sitede sabit paket fiyatı gösterilmiyor, her CTA
   `links.ts` üzerinden WhatsApp randevusuna gidiyor.
