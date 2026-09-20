# Gecikme Paketi + TYT Telaffuz + Dashboard Canlı Veri — 2026-09-20

> educallai (VeliPilot AI) oturum raporu. Önceki oturum: `2026-09-20-tam-sistem-testi.md`

## 1. Özet

| İş | Sonuç |
|---|---|
| TUR SÜRESİ ölçümü (ttft) | ✅ düzeltildi — Realtime modda **eot→ilk ses 375–462 ms** (hedef <1000 ms) |
| Gecikme (semantic VAD) | ✅ `eagerness="high"` — soru bitişi→ilk ses **5,9 sn → 2,9 sn** |
| TYT telaffuz | ✅ kök neden bulundu, prompt düzeltmesi + e2e teyit ("tyt" olarak transkript) |
| CRM contact bağlama | ✅ kayıtlar `contacts` tablosundaki gerçek satıra bağlı (kullanıcı yeni contact eklemedi) |
| Dashboard canlı veri | ✅ Görüşmeler (liste+detay) ve Veliler kanban Supabase canlı — mock'a otomatik düşer |
| Görsel kabul | ✅ judge 5/5 sayfa pass (1 tur düzeltme: filtre chip sayaçları) |
| Doğrulama | ✅ tsc 0 hata · build 12 route ✓ · pytest 134/134 · voice-e2e ✓ |

## 2. Ajan tarafı (agent/)

### TUR SÜRESİ ölçümü neden hep None'dı?
- `ChatMessage.metrics` bir **TypedDict** (`MetricsReport`); kod `getattr(m, "ttft")` ile
  attribute arıyordu. Ayrıca Realtime (speech-to-speech) modda bu rapor doldurulmuyor.
- Çözüm: `user_state_changed` (listening geçişi) ile eot anı, `agent_state_changed`
  (speaking) ile ilk ses anı yakalanıp kendi ölçümüz loglanıyor: `TUR SÜRESİ(ölçüm)`.
- **Kritik tuzak:** LiveKit event alanları `new_state` (bizim kod `state` okuyordu). Bu
  yüzden `state["speaking"]` hiç set edilmiyordu → dolgu iptali, ambiyans kısma, söz
  kesme tespiti **sessizce ölüydü**. Üç handler düzeltildi.
- `user_input_committed` Realtime modda **hiç tetiklenmiyor** → dolgu sesi + kesilme
  onayı `user_state_changed`'e taşındı (her iki modda çalışır).

### Gecikme
- `turn_detection` **typed object** ile verildi: `openai.types.realtime.
  realtime_audio_input_turn_detection.SemanticVad(eagerness="high", ...)`.
  (Önceki çökme dict'ten kaynaklanıyordu — typed object sorunsuz.)
- Ölçüm: eot→ilk ses **375 ms** / **462 ms** (iki koşu); soru yayın bitişinden ilk sese
  **2,9 sn** (semantic VAD "medium"da 3,7–5,9 sn arasıydı).

### TYT telaffuzu
- Kök neden: **REALTIME_MODE=1'de Cartesia + tts_normalize tamamen bypass** — OpenAI
  sesi kısaltmaları kendi bildiği gibi okuyordu.
- Çözüm: `prompts.py`'ye `OKUNUS_BLOCK` (TYT→"te ye te", AYT, YKS, LGS, educallai→Edukallay)
  eklendi; Cascade modda zaten tts_normalize var, çift uygulama yok.
- e2e teyidi: ajan cevabı Deepgram ile geri transkript edildi → **"tyt"** (doğru Türkçe okunuş).
- Ayrıca izinli araç varken LLM'in "bilgi veremem" deyip danışmana yönlendirdiği tutarsızlık
  gözlendi → YETKİLER bloğuna "aracı çağır, bahane etme" kuralı eklendi; sonraki koşuda
  `quote_pricing` çağrılıp fiyat doğru paylaşıldı (`"on iki bin tl"`).

### Diğer
- `agent_main.py`'de fonksiyon içi ölü kalıntı satırlar (Field tanımları) temizlendi.
- `voice-e2e.py` parametrik: `python scripts/voice-e2e.py [soru.wav]`; worker artık
  `wait(10)` ile düzgün kapanıyor (10 öksüz worker temizlendi).
- Yeni fixture: `agent/test-speech-tyt.wav` (Cartesia sonic-3, TR; raw PCM → düzgün WAV —
  Cartesia "wav" konteyner header'ı bozuk geliyor, raw iste + kendin yaz).

## 3. Dashboard canlı veri (src/lib/server/)

Yeni katman (extra bağımlılık yok, GET fetch; anahtar yoksa/boşsa mock'a düşer):
- `supabase.ts` — REST client + `supabaseLive` bayrağı
- `queries.ts` — `getLiveCalls`, `getLiveCallDetail(id)`, `getLiveLeads`
- `leads-map.ts` — `buildLeadsView` (mock Lead şekline tam eşleme), `computeChipCounts`

Bağlanan sayfalar (her istekte taze, `force-dynamic`):
| Sayfa | Canlı içerik | Rozet |
|---|---|---|
| `/gorusmeler` | conversation_signals 21 kayıt + contact isimleri | "Supabase canlı veri (21 kayıt)" |
| `/gorusmeler/[id]` | gerçek transkript (parse edilmiş) + AI sinyalleri + otomasyon günlüğü | canlı/demo |
| `/veliler` | 8 canlı lead kanbanı + drawer zaman çizelgesi + canlı chip sayaçları | "Supabase canlı veri (8 veli)" |

- Filtr chip sayaçları artık canlı hesaplanıyor (judge tur 1'de mock "Tümü (142)" çelişkisi
  yakalandı → düzeltildi).
- Ses oynatıcı: `audio_url` henüz boş → placeholder (kartta KVKK 6 ay saklama notuyla).
- Kanban sürükle-bırak zaten canlı yazıyordu (`PATCH /api/leads/[id]`, UUID ile).

## 4. CRM doğrulama
- `conversation_signals`'a kayıtlar düşüyor (toplam 21; agent oturum sonu shutdown callback 201).
- Sabit `contact_id ...0001` contacts tablosunda mevcut (Zeynep Kaya satırı) → kayıtlar
  gerçek contact'a bağlı. Kullanıcı YENİ contact eklemedi (8 contact hepsi seed zamanlı) —
  eklediğinde ek işlem gerekmiyor, bağlama zaten çalışıyor.

## 5. Kalan işler (sonraki oturum)
1. **TUR SÜRESİ izleme** — ajan çalışıyor (`agent/agent-live.log`); kullanıcı test ederken
   `grep "TUR SÜRESİ" agent-live.log` ile izle. İlk tur soğuk (~2,9 sn), sonraki turlar <1 sn olmalı.
2. Dashboard'un kalan sayfaları (Ana sayfa KPI, Tahsilat, Deneme, Kampanyalar, Randevular) canlıya.
3. Netgsm aboneliği (gerçek arama) + `audio_url` kayıt dosyalarını bağlama.
4. `/api/config` mode=live geçişi (dashboard "demo" gösteriyor; entegrasyonlar bağlı).
5. STT "YKS→Yerkesi" yazımı (kullanıcı telaffuzuna bağlı) — keyterm iyileştirmesi gerekebilir.
