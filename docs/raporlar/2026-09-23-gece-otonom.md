# Gece Otonom Oturumu — Ajan Stabilizasyonu + STOAIX Prompt Kalıbı (2026-09-23)

> Kullanıcı yatmadan önce verilen görev: ajanı çalışır duruma getir, "office" arka plan
> sesini sağla, STOAIX mantığıyla en iyi prompt kalıbını bul, tüm testleri yap ve sistemi
> çalışır bırakmak.

## 1. "Çalışmıyor" sorununun kökleri (3 ayrı bulgu)

1. **Çift worker:** sistem Python'ı ile (`C:\...\Python312\python.exe`) ikinci bir ajan
   worker başlatılmıştı — env'siz/eklentisiz. LiveKit job'ları iki worker'a dağılıyordu;
   testler bazen çalışan, bazen bozuk worker'a düşüyordu. → Tek worker: venv +
   `AGENT_NAME=velipilot-live`.
2. **BVC gürültü engelleme:** `RoomInputOptions(noise_cancellation=BVC())` eklendiğinde
   RoomIO input stream takılıyor, veli sesi STT'ye ulaşmıyordu → geçici kaldırıldı
   (ayrı incelenecek; canlı etkisi: gürültü filtresi şimdilik yok).
3. **Gemini ücretsiz kotası:** RPM limiti (429 "Too Many Requests", retry 19s) test
   trafiğinde ilk turu 7 sn'e kadar şişiriyordu. → `thinking_budget=0` eklendi
   (hız + kota dostu); yoğun kullanım için ücretli Gemini ya da OpenAI kredisi gerekli.

## 2. "Kafayı yedi" şikâyeti düzeltmeleri

- **Proaktif karşılama:** veli odaya girince ajan yöneticinin İLK KARŞILAMA'sını
  söyleyemediği için veli "merhaba" → dolgu "şimdi bakıyorum" çarpıklığı yaşanıyordu.
  Proaktif `session.say` RoomIO'yu takıyordu → geçici devre dışı; ajan ilk yanıtında
  greeting ile açılıyor (kanıt: e2e "merhaba iyi günler…" ile başlıyor). RoomIO ile
  proaktif say yöntemi ayrı incelenecek.
- **Dolgu spam'i:** "Bir saniye, bakayım / şimdi bakıyorum" kalıpları çıkarıldı;
  kalanlar kısa nötr ("Hımm.", "Bir saniye."); **tur başına tek** (`filler_said`),
  bekleme 0,9 sn.

## 3. Arka plan sesi (office)
Ambiyans task'i zaten çalışıyor (kahverengi gürültü + klavye); **fare çift-tık**
patlamaları eklendi, master %50 → %65 — dershane/ofis ortam hissi güçlendirildi.

## 4. STOAIX mantığıyla prompt kalıbı (agent-prompt.json — CANLI)

Test edilip seçilen kalıp (2.752 kr blok):

- **ROL:** "Sen Limit Dershane'nin kayıt danışmanı Alper'sin…"
- **İLK İLKELER:** önce dinle; 1-2 cümle; en fazla bir soru; fiyat = aylık
  12.000 TL + 10 taksit + ücretsiz seviye tespiti; bilgi yoksa tahmin etme.
- **KONUŞMA AKIŞI:** selam → sınıf/hedef → endişeyi yansıt → cumartesi ziyaret →
  ad-telefon + record_signals.
- **YAPMA:** IVR kalıbı yok, tekrar soru yok, vaat yok.
- **Kaçınma kuralları:** garanti → "Her öğrencinin gelişimi bireyseldir…";
  rakip kıyas → program önerisine yönlendir.
- **Fallback:** "Danışmanımızı bağlayayım mı?" · **Örnek diyaloglar:** 3 adet.

## 5. Test kanıtları (voice-e2e, gerçek ses → cevap transkript)

| Senaryo | Ajanın cevabı | Sonuç |
|---|---|---|
| "TYT fiyatları ne kadar?" | "…aylık **on iki bin lira**dan başlamaktadır ve **on taksit** … öğrenciniz şu an hangi sınıfta" | ✅ kalıp birebir |
| "Kesin sonuç garantisi var mı?" | "Merhaba iyi günler. **Her öğrencinin gelişimi bireyseldir.** Uzmanımız değerlendirip net bir yol haritası verir. Çocuğunuz kaçıncı sınıfta" | ✅ kaçınma kuralı + akış |
| "Sizin adınız ne?" | "Benim adım Alper…" | ✅ kimlik |

LLM gecikmesi (Gemini 2.5 flash): toplam 0,86 sn (llm_metrics).

## 6. Sabah durum / talimat

- Ajan CANLI: tek worker (venv + `AGENT_NAME=velipilot-live`), ayarlar:
  doğal mod + Cartesia kadın + hız 1.0 + tur 180 ms + KVKK bildirimi KAPALI
  (kullanıcı tercihi — karttan açılabilir).
- Console'dan ya da dashboard **Sesli Test**'ten konuşulabilir; loglar
  `agent/agent-live.log`'da, tur süreleri `TUR SÜRESİ` satırında.
- Kalıcı karar bekleyenler: (a) OpenAI kredisi (Realtime/hybrid açar),
  (b) Anthropic anahtarı (yedek hat), (c) Gemini ücretli kota (test hızını
  sabitler), (d) BVC/RoomIO incelemesi, (e) TR VDS LiveKit (bölge gecikmesi),
  (f) Netgsm aboneliği (gerçek arama).
- Commit'ler: `6fd4f1b`, `7841fe2`, `abf432f`, `7f30606`, `2c2f8cf`, `928368f`,
  `3a5d841`, `7a0eefd` (ayrıntılar git log).
