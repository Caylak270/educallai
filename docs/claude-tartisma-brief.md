# VeliPilot (educallai) — Claude Tartışma Brief'i

> Aşağıdaki metni Claude'e olduğu gibi yapıştır. Proje: Türkiye'de dershaneler için
> velilere sesli AI arama asistanı (Next.js dashboard + LiveKit Agents 1.8.2 Python worker).

## MEVCUT MİMARİ (canlı, çalışır durumda)

### İki çalışma modu (dashboard'dan A/B seçilir)

**Mod A — Cascade (doğal ses):**
Silero VAD (TR kalibrasyonu) → Deepgram Nova-3 STT (lang=tr, keyterm prompting)
→ GPT-4o mini (OpenAI) → Cartesia sonic-3 TTS (TR kadın/erkek ses, streaming
Türkçe sayı/kısaltma normalizasyon katmanı)
- Ölçülen: veli sustu → ilk ses ≈ 1,4 sn (soğuk ilk tur 2,9 sn; LLM+TTS websocket
  ön-ısıtma eklendi). Karar→ses ≈ 814 ms.

**Mod B — Realtime (en hızlı):**
OpenAI gpt-realtime (speech-to-speech, voice=marin) + OpenAI ServerVAD
(silence=180ms, prefix=150ms) + gpt-4o-mini-transcribe (whisper-1 yerine)
- Ölçülen: veli sustu → ilk ses ≈ 441 ms (180ms VAD penceresi + ~260ms model).
  VAD matrisi: 120ms'de cümle arası bölme başlıyor, 80ms'de kelime başı kesiliyor.
  preemptive_generation açık.

### Altyapı
- LiveKit Cloud — ama endpoint İsrail'e çözünüyor (proje adı "frankfurt" olmasına
  rağmen): veli(TR Bursa)↔SFU RTT ölçümü 115–246 ms. Plan: TR KVM VDS'e LiveKit OSS
  self-host (Tahmini kazanç: Realtime 440→~300-350ms; Cascade 1.4→~1.0-1.1s).
  Dispatch: ajan isimli (velipilot-live) + python agent_dispatch API (çalışıyor).
- Ajan worker: kullanıcının kendi TR PC'si (Bursa). Supabase canlı (transkript+sinyal
  yazımı). Netgsm SIP henüz yok (abonelik bekliyor) — telefon bacağı kapalı.
- Dashboard: Next.js 16 — canlı ayar kartları var: ses seçimi (Cartesia kadın/erkek +
  OpenAI sesleri), konuşma hızı (Cartesia speed), tur kapatma ms, ajan promptu
  (ad/greeting/serbest talimat/kaçınma kuralları/fallback/örnek diyaloglar — her
  görüşme başında dosyadan taze okunur), mikrofonla sesli test butonu.

### TTS normalizasyonu (Cascade modda)
Deterministik Türkçe katman: para/tarih/saat/yüzde/telefon → okunuş; kısaltmalar
(TYT→"te ye te", YKS→"ye ke se", educallai→"Edukallay"). Realtime modda bu katman
YOK (OpenAI sesi kendi okuyor) — kısaltma okunuşları prompt talimatıyla veriliyor.

## SORUNLAR / KISITLAR

1. OpenAI kredisi bitti (429 credit_balance_exhausted) — iki mod da OpenAI'a
   bağımlı olduğu için ajan tamamen sessiz kaldı. Tek-sağlayıcı riski canlı yakalandı.
   Yedek LLM hattı yok (Anthropic anahtarı hiç eklenmedi).
2. Realtime moddaki OpenAI sesi Türkçede kullanıcıya "robotik/kötü ton" geliyor;
   Cascade'deki Cartesia TR sesi doğal ama +~1 sn gecikme.
3. SFU İsrail rotası ~120ms tek yön ekliyor; TR VDS'e LiveKit OSS self-host planı var.
4. 250ms uçtan uca hedef: VAD penceresi (~180ms güvenli alt sınır) + model ilk ses
   (~260ms) yüzünden Realtime'da bile ~440ms taban; cascade'de fiziksel olarak imkansız.

## BİLİNEN SEÇENEKLER (değerlendirmeni istediğim)

1. **Hybrid mod önerisi:** OpenAI Realtime'ı SADECE LLM olarak kullanmak
   (modalities=["text"], ses üretmesin) + sesi Cartesia sonic-3'e verdirmek:
   "Realtime beyni + Cartesia sesi". Beklenti: Cascade'den hızlı (LLM ilk token
   Realtime hızında), Realtime'dan doğal (ses Cartesia). LiveKit'te bu desen
   destekli mi, gecikme gerçekten Cascade'den iyi olur mu, maliyet/fiyat nasıl?
2. Cartesia voice cloning (kendi referans sesimizden klon) — doğallık tavanı;
   sonic-3'te TR klon kalitesi ve gecikme etkisi nedir?
3. Cartesia sonic-turbo (varsa) TR kalitesi vs sonic-3 — hız/doğallık trade-off.
4. Claude Haiku 4.5'i ana motora almak (cascade): gecikme/kalite/maliyet —
   OpenAI kredi riskinden bağımsızlaşma. FallbackAdapter ile GPT-4o mini yedekte kalır.
5. ElevenLabs Türkçe (multilingual v2 / v3) vs Cartesia — doğallık karşılaştırması
   ve streaming TTFB gerçekçi değerleri.
6. TR VDS LiveKit OSS self-host: dikkat edilecekler (TURN, TLS, band, Netgsm SIP
   jitter), Cloud'a göre gecikme/fark.
7. Başka önerin: "en doğal ses + en düşük ms" kombinasyonu için 2026 itibarıyla
   TR dili için en iyi stack önerin.

## SORU
Bu mimaride "en doğal ses + en düşük ms"i aynı anda almanın en pratik yolu hangisi?
Özellikle 1 numaralı hybrid deseni (Realtime text-only LLM + Cartesia TTS) önerir
misin? Varsa uygulama tuzakları (LiveKit Agents 1.8.2) nelerdir?
