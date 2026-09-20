# VeliPilot AI — Voice Agent (Türkçe Dershane Asistanı)

LiveKit Cloud üzerinde çalışan Türkçe **sesli** dershane/veli danışmanı
agent modülü. Cascade Pipeline: Silero VAD → Deepgram Nova-3 STT
(`lang=tr`, keyterm prompting) → OpenAI GPT-4o mini (birincil; Claude Haiku 4.5 opsiyonel yedek) (ephemeral prompt
caching, GPT-4o mini fallback) → Türkçe TTS normalizasyonu → Cartesia
Sonic 3.6 TTS. Hedef uçtan uca gecikme: **<600 ms** (streaming overlap).

> Kuyruk notu: Batch dialer ve tahsilat kampanyaları **Node/BullMQ**
> tarafında kuyruklanır; bu Python modülü yalnızca agent oturumu ve saf
> karar mantığını içerir. Redis/rq bağımlılığı yoktur.

## Pipeline Şeması

```
                 [Telefon SIP / LiveKit Cloud]
                              │
                              ▼
   ┌────────────────── [Silero VAD] ◄──── Pattern 5 Türkçe kalibrasyon
   │     barge-in kararı:       │
   │     Pattern 6 speech gate  │ konuşma başladı
   │  (min_interruption_words)  ▼
   │                 [Deepgram Nova-3 STT]  lang="tr" + keyterms
   │                     │        │
   │       interim       │        │ final transcript
   │   transcript        │        ▼
   │         │           │   [OpenAI GPT-4o mini (birincil; Claude Haiku 4.5 opsiyonel yedek) LLM]
   │         │           │      FallbackAdapter ──► [GPT-4o mini]
   │         │           │        │            │
   │         │           │        │ ilk cümle  └──► [record_signals]
   │         ▼           │        ▼ token'ları      (Pattern B: paralel,
   │   [KB Prefetch]     │   [Türkçe TTS            akışı bloklamaz)
   │   (Pattern 7)       │    normalizasyonu]
   │   pgvector arama    │        ▼
   │   (async görev)     │   [Cartesia Sonic 3.6 TTS]
   │                     │        │
   └── Sistem 5: ambiyans maskeleme hook'u (outbound, cevaba kadar)
                              ▼
                        [Veliye ses]
```

## Gecikme Bütçesi (hedef < 600 ms)

| Aşama | Bileşen | Bütçe |
|---|---|---|
| Ses transportu | LiveKit Cloud (WebRTC/SIP) | ~40–80 ms |
| Turn algılama | Silero VAD + Pattern 5/6 kalibrasyon | ~150–250 ms |
| STT ilk interim | Deepgram Nova-3 (`tr`, keyterm) | ~100–180 ms |
| LLM ilk token | Haiku 4.5 + prompt cache okuma | ~150–250 ms |
| TTS ilk ses | Cartesia Sonic (streaming) | ~60–100 ms |
| **Toplam (overlap ile)** | — | **< 600 ms** |

**Overlap (paralel akış) nasıl kazanım sağlar:**

1. STT **interim** transcript'i LLM'i beklemeden KB prefetch'i (Pattern 7)
   ateşler; sonuç LLM turuna bağlam olarak yetişir.
2. LLM yanıtını cümle parçalarıyla stream eder; TTS ilk parçayla
   başlar — metnin tamamlanması beklenmez.
3. `record_signals` (Pattern B) ayrı görevde yürür; konuşma akışını
   bloklamaz.
4. `prewarm()`: arama çalarken (ring) STT/LLM/TTS bağlantıları ısıtılır.

## Klasör Yapısı

```
agent/
├── README.md, requirements.txt, .env.example
├── agent/            # çekirdek modüller (tümü harici servis çağırmadan çalışır)
│   ├── config.py         # .env okuma + DERSHANE_KEYTERMS
│   ├── pipeline.py       # Cascade Pipeline iskeleti (LiveKit arayüzü)
│   ├── signals.py        # Pattern 1 record_signals (pydantic + tool şeması)
│   ├── capabilities.py   # Pattern 2 yetenek matrisi + tool filtresi
│   ├── tts_normalize.py  # Pattern 8 Türkçe TTS normalizasyonu (en kapsamlı)
│   ├── vad.py            # Pattern 5 Türkçe VAD kalibrasyonu
│   ├── working_hours.py  # Çağrı saatleri, engelli dönemler, optimal pencere
│   ├── dialer.py         # Sistem 1 outbound öncelik + retry policy
│   ├── collections.py    # Sistem 2 tahsilat 5 aşamalı state machine
│   ├── exam_engine.py    # Sistem 3 net → kategori (PLATO/RISING/...)
│   ├── lag_recovery.py   # Pattern 3 4 senaryo telafi
│   ├── prompts.py        # Persona, çift mandat, iç sezgi (Pattern 4), KVKK
│   └── kb.py             # Pattern 7 KB prefetch iskeleti (pgvector stub)
├── scripts/
│   └── agent_main.py     # canlıya giriş (import edilebilir; anahtar şart)
└── tests/                # pytest — tümü offline çalışır
```

## Kurulum ve Test (Windows / Git Bash)

```bash
python -m venv agent/.venv
agent/.venv/Scripts/python -m pip install pytest pydantic          # test için minimum
agent/.venv/Scripts/python -m pip install -r agent/requirements.txt # canlı ortam

# Tüm testleri çalıştır (harici servis GEREKMEZ):
agent/.venv/Scripts/python -m pytest agent/tests -q
```

Canlı worker çalıştırma (anahtarlar `agent/.env` içinde):

```bash
agent/.venv/Scripts/python -m agent.scripts.agent_main download-files
agent/.venv/Scripts/python -m agent.scripts.agent_main dev
```

## .env Değişkenleri

| Değişken | Açıklama |
|---|---|
| `LIVEKIT_URL` | LiveKit Cloud WS adresi (`wss://...livekit.cloud`) |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | LiveKit proje kimlik bilgileri |
| `DEEPGRAM_API_KEY` | Nova-3 STT (tr + keyterm) anahtarı |
| `ANTHROPIC_API_KEY` | OpenAI GPT-4o mini (birincil; Claude Haiku 4.5 opsiyonel yedek) birincil LLM anahtarı |
| `OPENAI_API_KEY` | GPT-4o mini fallback anahtarı |
| `CARTESIA_API_KEY` | Sonic 3.6 TTS anahtarı |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | pgvector KB + kayıt sinyalleri |
| `NETGSM_USERCODE` / `NETGSM_PASSWORD` / `NETGSM_HEADER` | SMS/WhatsApp bildirimleri |
| `DEMO_DERSHANE_ID` | Demo kiracı kimliği |
| `CARTESIA_VOICE_ID`, `LLM_PRIMARY_MODEL`, ... | Opsiyonel; varsayılanlar `agent/agent/config.py` içinde |

Örnek dosya: [`agent/.env.example`](.env.example)

## Deterministik TTS Normalizasyonu (Pattern 8) — Dönüşüm Tablosu

| Girdi | Çıktı (okunuş) |
|---|---|
| `12000 TL` | on iki bin lira |
| `₺30.000` | otuz bin lira |
| `12.000-15.000 TL` | on iki bin ila on beş bin lira arası |
| `325.45 puan` | üç yüz yirmi beş nokta dört beş puan |
| `72 net` | yetmiş iki net |
| `%85.3` | yüzde seksen beş nokta üç |
| `15/09/2026` | on beş Eylül iki bin yirmi altı |
| `15:30` | on beş otuz |
| `09:00-18:00` | sabah dokuzdan akşam altıya kadar |
| `5x3.000` | beş taksit, her biri üç bin lira |
| `üst %5` | üst yüzde beş |
| `05551234567` | sıfır beş beş beş bir iki üç dört beş altı yedi |

Binlik ayracı olarak nokta ve virgülün **ikisi de** kabul edilir
(`12.000` = `12,000`). Ondalık kısım hane hane okunur.

## Canlıya Çıkış Adımları (Şartname XIII — Checklist Referansı)

1. `.env` anahtarlarını doldur (`agent/.env.example` → `agent/.env`).
2. `pip install -r agent/requirements.txt` + `python -m agent.scripts.agent_main download-files`.
3. Deepgram keyterm listesini (`DERSHANE_KEYTERMS`) kiracı terimleriyle güncelle.
4. VAD kalibrasyonunu gerçek arama kayıtlarıyla doğrula (`agent/agent/vad.py`).
5. `pytest agent/tests -q` → tümü yeşil; özellikle `test_tts_normalize` (Pattern 8) tablosu.
6. TTS normalizasyonunu gerçek veli cümleleriyle (fiyat/tarih/saat) kuru koşu.
7. Working-hours guard'ı takvimle eşle (ramazan/bayram/YKS/LGS tarihleri yıllık güncellenir).
8. Batch dialer öncelik + retry policy'sini BullMQ iş tanımlarına bağla (saf fonksiyonlar hazır).
9. Tahsilat state machine aşamalarını Netgsm şablonlarıyla eşle.
10. Lag recovery izlemesini seans kapanış webhook'una bağla (4 senaryo).
11. KVKK açılış bildiriminin her çağrıda söylendiğini çağrı kayıtlarından doğrula.
12. Gecikme ölçümü: uçtan uca p95 < 600 ms; fallback devreye girme testi (Haiku → GPT-4o mini).
13. İzleme/alerting: `recommend_handoff`, `do_not_call_requested`, `capability_limit_reached` sinyalleri için panel.

## Bilinen Sınırlar / Eksikler

- `pipeline.py` ve `scripts/agent_main.py` içindeki LiveKit plugin
  parametre adları (ör. `keyterms`, `sonic-3.6`) kurulum sürümüne göre
  doğrulanmalıdır — SDK kurulu değilken bu yollar çalıştırılmaz.
- `kb.embed` ve `kb.search_kb_pgvector` stub'tır (canlı sağlayıcı
  bağlanınca doldurulur).
- Tarih sabitleri (bayram/YKS/LGS) 2026 takvimidir; her yıl güncellenir.
- Türkçe ek seçimi (ablative/dative) saat ifadeleri için sabit
  tablolarla yapılır; genel metin ek analizinin kapsamı bilinçli olarak
  sınırlıdır (TTS girdisi LLM çıktısı olduğu için ek sorumluluğu
  birincil olarak LLM'dedir).
