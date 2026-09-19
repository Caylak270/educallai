# Tam Sistem Test Raporu — 2026-09-20

> educallai (VeliPilot AI) uçtan uca doğrulama. Çalışma: `D:\educallai`, commit: test sonrası HEAD.
> Test aracı: `scripts/e2e-test.mjs` (Playwright + sistem Chrome) + API curl seti + pytest.

## 1. Özet

| Katman | Sonuç |
|---|---|
| TypeScript (tsc --noEmit) | ✅ 0 hata |
| Üretim build (Next.js 16) | ✅ 12 route derlendi |
| Voice agent testleri (pytest) | ✅ 134/134 geçti |
| E2E tarayıcı testleri | ✅ **35/35 geçti** |
| Konsol/ağ hatası (10 sayfa × masaüstü + 7 sayfa × mobil) | ✅ 0 |
| Mobil yatay taşma (7 sayfa, 390px) | ✅ 0 |

## 2. E2E kapsamı (35 test)

**Route'lar (10):** `/`, `/veliler`, `/gorusmeler`, `/gorusmeler/[id]`, `/tahsilat`,
`/deneme-analizi`, `/kampanyalar`, `/randevular`, `/raporlar`, `/ayarlar` → hepsi 200 + beklenen içerik.

**Etkileşimler (25):**
- Veliler: kanban 7 sütun, kart sayıları, Pano/Liste geçişi, **sürükle-bırak aşama taşıma**
  (İlgilendi → Yeni doğrulandı, geri alındı), arama ("zeynep" → 1 sonuç; anlamsız sorgu → boş durum)
- Veli drawer: açılma + "Şimdi Ara (AI Asistan)" → `POST /api/calls` → "Başlatıldı" feedback
- Dashboard: sıcak lead "Ara" butonu → API → "Başlatıldı"
- Global arama: "murat" + Enter → `/veliler?q=murat` yönlendirme + sorgu kutusuna dolma
- Tahsilat: Gecikenler filtresi (3 kart)
- Kampanyalar: Duraklatıldı sekmesi (sadece duraklatılmış kampanya)
- Görüşme detayı: Transkript → AI Sinyalleri → Aksiyonlar sekme geçişleri
- Görüşme listesi: metin araması (1 sonuç) + kanal filtresi
- Ayarlar: yetki satırına tıklayınca toggle + "N/6 Yetki Aktif" sayacı + kaydet toast'ı
- Deneme analizi: "AI ile Ara" → API çağrısı + toast sonucu
- Mobil (390px): 7 sayfada status 200 + yatay taşma yok

## 3. API testleri

| Uç | Durum |
|---|---|
| `GET /api/config` | ✅ mode=demo, entegrasyon durumu + eksik anahtar listesi |
| `POST /api/calls` (geçerli) | ✅ 201, kayıt oluşturuldu (demo) |
| `POST /api/calls` (geçersiz numara) | ✅ 422 + Türkçe hata mesajı |
| `GET /api/calls` | ✅ kayıt listeleniyor |
| `PATCH /api/leads/[id]` | ✅ demo onayı (Supabase bağlıysa kalıcı yazar) |

## 4. Bulunan ve düzeltilen sorunlar

1. **Maskeli telefon numaraları API'de 422 veriyordu** (mock verilerde `412 ** **` gibi gizli
   numaralar sunucu doğrulamasını geçemiyordu) → sıcak leadler ve deneme analizi butonlarında
   E.164 sanitizasyonu eklendi; 10 haneden az rakam varsa güvenli demo numarası kullanılır.
2. **Ayarlar yetki satırı yalnız switch'ten açılıyordu** → satır metnine tıklamak da toggle
   yapacak şekilde UX iyileştirmesi yapıldı.
3. *(Test seti tarafında)* LeadCard kök elemanı `div` olduğu için liste sayımı metin bazlı
   yapıldı; sekme panel metinleri mock kaynaklı gerçek başlıklarla eşlendi.

## 5. Canlıya geçiş için gereken anahtarlar

`.env.example` şablonu hazır. Durum anlık sorgusu: `GET /api/config`.

| Anahtar | Sağlayıcı | Amaç | Maliyet |
|---|---|---|---|
| SUPABASE_URL + SERVICE_KEY | supabase.com | Gerçek veri (leads, calls, taksitler) | Ücretsiz tier |
| LIVEKIT_URL/API_KEY/SECRET | livekit.io | Arama köprüsü (oda + SIP) | Ücretsiz tier |
| NETGSM_USERCODE/PASSWORD | netgsm.com.tr | Telefon hattı (SIP) + SMS | Abonelik |
| DEEPGRAM_API_KEY | deepgram.com | Türkçe STT | $200 ücretsiz kredi |
| ANTHROPIC_API_KEY | console.anthropic.com | Konuşma LLM'i (Haiku 4.5) | Kullandıkça |
| CARTESIA_API_KEY | cartesia.ai | Türkçe TTS | Ücretsiz başlangıç |

Supabase + LiveKit + Netgsm üçlüsü dolunca `mode=live`'a geçer: "Ara" butonları gerçek telefon
araması başlatır, kanban taşıması DB'ye yazar.

## 6. Kalan bilinen sınırlar (bilinçli)

- Veriler henüz mock (`src/lib/mock/`) — Supabase anahtarı sonrası veri katmanı bağlanacak
- Giden aramanın agent tarafı (`agent/`) iskelet + test aşamasında; canlı arama köprüsü
  LiveKit env'leri geldikçe devreye girer
- `/randevular`, `/raporlar`, `/gorusmeler` ekranları yeni tasarım dilinde elle yapıldı
  (Stitch tasarımı bu üçü için üretilmedi)
