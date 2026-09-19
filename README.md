# educallai — VeliPilot AI (kod adı: DershaneAI)

Dershaneler için **7/24 çok kanallı AI sesli + yazılı asistan platformu**: veli arama
(outbound/inbound), tahsilat takibi, deneme sınavı analizi ve WhatsApp otomasyonu — tek panelden.

- **Hedef pazar:** Türkiye (önce Esenyurt / Beylikdüzü dershaneleri)
- **Dil / para birimi:** Türkçe / TRY
- **Kaynak şartname:** `educallai.docx` (Master DNA Brief & Teknik Şartname v1.0) — özet `PLAN.md`'de

## Depo Yapısı

```
educallai/
├── src/                    Next.js 16 (App Router, TS, Tailwind v4) dashboard
│   ├── app/(app)/          Sayfalar: /, /veliler, /gorusmeler/[id], /tahsilat,
│   │                       /deneme-analizi, /kampanyalar, /randevular, /raporlar, /ayarlar
│   ├── components/
│   │   ├── shell/          Kabuk: sidebar (lg+), mobil header + alt tab bar, logo
│   │   └── pages/          Sayfa bileşenleri (tasarım Stitch'ten port edilmiş)
│   └── lib/
│       ├── mock/           Demo veri (Supabase bağlanana dek)
│       └── types/db.ts     Veritabanı satır tipleri (migration'larla birebir)
├── agent/                  Python voice agent (LiveKit Cascade Pipeline)
│   ├── agent/              Pattern 1-8 + Batch Dialer + Tahsilat SM + Deneme motoru
│   └── tests/              134 test (harici servis gerektirmez)
├── supabase/               SQL migration'lar (12 tablo + RLS) + demo seed
├── design/screens/         Stitch tasarım referansları (7 ekran HTML)
├── docs/raporlar/          İlerleme raporları
├── docs/render/            Sayfa render PNG'leri (tam sayfa)
└── scripts/render-pages.mjs  Playwright tabanlı tam sayfa render aracı
```

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # üretim derlemesi

# Voice agent testleri (harici anahtar gerekmez)
agent/.venv/Scripts/python -m pytest agent/tests -q
```

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Sunum | Next.js 16 + React 19 + Tailwind v4 (M3 token seti) + Vercel |
| Veri | Supabase (PostgreSQL 15+, pgvector, RLS) |
| Ses | LiveKit Cloud + Netgsm SIP · Deepgram Nova-3 (tr) · Claude Haiku 4.5 · Cartesia Sonic 3.6 |
| Mesajlaşma | Meta WhatsApp Business API, Netgsm SMS, Zernio |
| Kuyruk | Redis / BullMQ (Outbound Batch Dialer) |

## Tasarım Sistemi

`src/app/globals.css` içinde Tailwind v4 `@theme` ile Stitch'in Material Design 3 tokenları
birebir tanımlı (renkler `bg-primary-container` gibi, tipografi `text-headline-md` +
`font-headline-md`, spacing `p-space-md`, `px-gutter`). Yeni ekranlar bu tokenlarla yazılır;
referans HTML'ler `design/screens/` altındadır.

## Durum ve Yol Haritası

Faz 0-2 tamamlandı (UI + veri şeması + agent iskeleti). Sıradaki adımlar `PLAN.md` Faz 4'te:
canlı sağlayıcı anahtarları, eksik ekranlar (randevular/raporlar/görüşme listesi — Stitch'te
bekliyor), Batch Dialer worker'ı, Outcome Telemetry cron'u.
