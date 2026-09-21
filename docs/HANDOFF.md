# educallai — Oturum Devir Raporu (Yeni Chat İçin)

> Tarih: 2026-09-20 (2. oturum güncellemesi) · Repo: D:\educallai · Bu dosya yeni oturumun giriş noktasıdır.

## 1. Sistem Ne?

**VeliPilot AI (educallai)** — dershaneler için Türkçe sesli AI asistan. Kullanıcı
LiveKit Console'dan mikrofonla konuşur, ajan gerçek zamanlı yanıtlar; görüşme
sonunda transkript + duygu sinyalleri Supabase'e otomatik yazılır.

Tam şartname: `educallai.docx` (kullanıcı sağlar) · Özet: `PLAN.md`
Son oturum raporu: `docs/raporlar/2026-09-20-canli-veri-gecikme-telaffuz.md`

## 2. Çalışan Durum (bu repoda şimdi)

| Bileşen | Durum |
|---|---|
| Dashboard (Next.js 16, localhost:3000) | ✅ 10 sayfa; Görüşmeler+Veliler CANLI Supabase verisi |
| Sesli ajan (Realtime mod, semantic VAD high) | ✅ canlı; eot→ilk ses ~400ms (hedef <1000ms tuttu) |
| Supabase (12 tablo + RLS + demo veri) | ✅ canlı |
| LiveKit Frankfurt projesi | ✅ canlı (en düşük gecikme yolu) |
| Cartesia TTS (TR kadın sesi) | ✅ doğrulandı (Cascade modda) |
| Deepgram STT (nova-3, tr) | ✅ doğrulandı (%98,4) |
| OpenAI GPT-4o mini + Realtime + embedding | ✅ doğrulandı |
| E2E ses test aracı | ✅ `agent/scripts/voice-e2e.py [soru.wav]` — parametrik |

## 3. Nasıl Çalıştırılır

```bash
cd D:\educallai\agent
AGENT_NAME=velipilot-live .venv\Scripts\python scripts\agent_main.py dev
# LiveKit Console (educallai-i46ygd0c projesi) → Start session → konuş
# NOT: ajan artık İSİMLİ (velipilot-live) — Console'dan da bu ajan seçilir;
# dashboard sesli test dispatch'i bu ismi bekler (dispatch_agent.py)
```
Dashboard: `cd D:\educallai && npm run start` → localhost:3000

**Dashboard sesli test (Ayarlar → Sesli Test):** token `/api/agent-test-token`
üretilir + `dispatch_agent.py` ajanı `agent-test-*` odasına dispatch eder →
tarayıcı mikrofonla katılır → ajan agent-settings.json'daki SON ayarlarla
konuşur. Test transkripti CRM'e yazılır.

⚠️ `.env.local` ile `agent/.env` LiveKit projeleri AYNI olmalı (frankfurt-ap460t13).
2026-09-21'de iki farklı proje olduğu fark edildi: dashboard başka projeye token
üretiyordu, ajan asla katılamıyordu. Düzeltildi — değiştirirsen ikisini birden değiştir.

## 4. Kritik Bilgiler (yeniden öğrenme!)

### Mimaride TEK KAYNAK KURALI
`agent_main.py` **pipeline bileşenlerinin kopyasını Kurma** — `comps.vad/stt/llm/tts`
(sıcak önbellek) kullan. Bugün çift kopya yüzünden TTS fix'i bypass edilmişti.

### Bilinen tuzaklar (tekrarlama!)
- livekit `prewarm_fnc` **SENKRON** olmalı (Callable[[JobProcess], Any]) — async
  yazılırsa sessizce hiç çalışmaz ("was never awaited"); sıcak bileşen kurulumu
  atlanır, her oturum soğuk başlar. Ağ ısıtması için entrypoint başında
  asyncio.create_task ile _warm_network kullan (bkz. agent_main.py)
- Fonksiyon içi `import asyncio` + sonradan kullanım → UnboundLocalError
  → import'lar entrypoint'in EN BAŞINA
- `state` sözlüğü kullanımdan sonra tanımlanma → başta başlat
- Args sınıfları (pydantic) fonksiyon içinde TANIMLANMA — livekit tip ipuçlarını
  global scope'ta çözer → NameError. Module level'a koy.
- `turn_detection` **dict geçme** → çökme; **typed object** geç:
  `openai.types.realtime.realtime_audio_input_turn_detection.SemanticVad(eagerness="high")`
- LiveKit event alan adları `new_state`/`old_state` (`state` DEĞİL!) — yanlış okursan
  speaking/interrupt mantığı sessizce ölür (1. oturumda yaşandı)
- `user_input_committed` Realtime modda TETİKLENMEZ → `user_state_changed` kullan
- `ChatMessage.metrics` TypedDict ve Realtime modda BOŞ → gecikmeyi kendi ölç
  (agent_main.py'deki TUR SÜRESİ(ölçüm) düzeni)
- Cartesia: TR'de `word_timestamps` desteklenmez (sessiz ses döner) → False;
  TTS "wav" konteyner header'ı bozuk geliyor → raw PCM iste, WAV'ı kendin yaz
- headless Chrome `--window-size` 500px altına inmez → playwright kullan
- Bash'te JSON içinde `\\n` yazarsan gerçek newline olur → dosyadan oku ya da Edit aracı
- voice-e2e her koşuda worker başlatır → kapanmazsa öksüz birikir (worker.wait eklendi;
  gerekirse `taskkill /IM python.exe` yerine agent_main filtreli PowerShell ile temizle)

### Realtime mod telaffuz kuralı
REALTIME_MODE=1'de Cartesia + tts_normalize BYPASS edilir (OpenAI sesi konuşur).
Kısaltma okunuşları `prompts.py > OKUNUS_BLOCK` ile prompt'tan verilir (TYT→"te ye te"
vb.) — e2e ile teyitli. Cascade modda tts_normalize zaten çevirir, çift uygulama yok.

### Ses kuralı v2 (uygulandı)
- KVKK: kısa doğal cümle ("ben yapay zekayım, kayıt altındayız, tamam mı?")
- Duygu yansıtma: endişeli→güvence, heyecanlı→enerji (etiket yazma, tonda göster)
- Kesilme: sus → "Efendim?/Buyrun" → velinin yönünden devam
- Dolgu: 1,0 sn'de yanıt yoksa "Bir saniye, bakayım" / "Hımm."
- Telaffuz: educallai→Edukallay, TYT→te ye te, YKS→ye ke se (tts_normalize.py)

## 5. Sıradaki İşler (öncelik sırasıyla)

1. **Gecikme izleme**: kullanıcı test ederken `grep "TUR SÜRESİ" agent/agent-live.log`
   (eot→ilk ses ~400ms ölçülüyor; ilk tur soğuk ~2,9 sn — hedef <1000ms)
2. **Dashboard'un kalan sayfaları canlıya**: Ana sayfa KPI, Tahsilat, Deneme, Kampanyalar,
   Randevular (kalıp hazır: `src/lib/server/{supabase,queries,leads-map}.ts` + mock fallback)
3. **Netgsm aboneliği**: gerçek telefon araması (tek ücretli eksik)
4. **`audio_url` bağlama**: görüşme kayıt dosyalarını Supabase Storage'a + detay oynatıcısına
5. **`/api/config` mode=live** geçişi (entegrasyonlar bağlı ama mode=demo gösteriyor)
6. STT "YKS"→"Yerkesi" yazımı (kullanıcı telaffuzu) — keyterm iyileştirmesi değerlendir

## 6. Dosya Haritası

- `agent/scripts/agent_main.py` — ajan giriş noktası (tüm mantık)
- `agent/agent/*.py` — pipeline, prompts, tts_normalize, capabilities...
- `agent/.env` — CANLI anahtarlar (Supabase/LiveKit/OpenAI/Deepgram/Cartesia) — COMMIT ETME!
- `src/` — dashboard · `supabase/` — şema+seed · `scripts/voice-e2e.py` — otomatik ses testi
- `docs/render/` — sayfa kanıtları · `docs/raporlar/` — oturum raporları

## 7. Kullanıcı Tercihleri

- Türkçe konuşma, kısa ve öz
- Her büyük değişiklikten önce çalıştırıp KENDİN doğrula, sonra kullanıcıya sor
- Ses doğallığı çok önemli — robotik his geldiyse prompt + TTS parametre ayarı
- Gecikme hedefi: uçtan uca <1000ms (250ms aşırı hedef)
