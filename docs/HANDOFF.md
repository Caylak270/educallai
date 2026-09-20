# educallai — Oturum Devir Raporu (Yeni Chat İçin)

> Tarih: 2026-09-20 · Repo: D:\educallai · Bu dosya yeni oturumun giriş noktasıdır.

## 1. Sistem Ne?

**VeliPilot AI (educallai)** — dershaneler için Türkçe sesli AI asistan. Kullanıcı
LiveKit Console'dan mikrofonla konuşur, ajan gerçek zamanlı yanıtlar; görüşme
sonunda transkript + duygu sinyalleri Supabase'e otomatik yazılır.

Tam şartname: `educallai.docx` (kullanıcı sağlar) · Özet: `PLAN.md`

## 2. Çalışan Durum (bu repoda şimdi)

| Bileşen | Durum |
|---|---|
| Dashboard (Next.js 16, localhost:3000) | ✅ 10 sayfa canlı |
| Sesli ajan (Realtime mod) | ✅ uçtan uca konuşma doğrulandı |
| Supabase (12 tablo + RLS + demo veri) | ✅ canlı |
| LiveKit Frankfurt projesi | ✅ canlı (en düşük gecikme yolu) |
| Cartesia TTS (TR kadın sesi) | ✅ doğrulandı |
| Deepgram STT (nova-3, tr) | ✅ doğrulandı (%98,4) |
| OpenAI GPT-4o mini + Realtime + embedding | ✅ doğrulandı |
| E2E ses test aracı | ✅ `scripts/voice-e2e.py` |

## 3. Nasıl Çalıştırılır

```bash
cd D:\educallai\agent
.venv\Scripts\python scripts\agent_main.py dev
# LiveKit Console (educallai-i46ygd0c projesi) → Start session → konuş
```
Dashboard: `cd D:\educallai && npm run start` → localhost:3000

## 4. Kritik Bilgiler (yeniden öğrenme!)

### Mimaride TEK KAYNAK KURALI
`agent_main.py` **pipeline bileşenlerinin kopyasını Kurma** — `comps.vad/stt/llm/tts`
(sıcak önbellek) kullan. Bugün çift kopya yüzünden TTS fix'i bypass edilmişti.

### Bilinen tuzaklar (tekrarlama!)
- Fonksiyon içi `import asyncio` + sonradan kullanım → UnboundLocalError
  → import'lar entrypoint'in EN BAŞINA
- `state` sözlüğü kullanımdan sonra tanımlanma → başta başlat
- Args sınıfları (pydantic) fonksiyon içinde TANIMLANMA — livekit tip ipuçlarını
  global scope'ta çözer → NameError. Module level'a koy.
- `turn_detection` dict geçme — eklenti typed object istiyor (şu an default kullan)
- Cartesia: TR'de `word_timestamps` desteklenmez (sessiz ses döner) → False
- headless Chrome `--window-size` 500px altına inmez → playwright kullan
- Bash'te JSON içinde `\\n` yazarsan gerçek newline olur → dosyadan oku ya da Edit aracı

### Ses kuralı v2 (uygulandı)
- KVKK: kısa doğal cümle ("ben yapay zekayım, kayıt altındayız, tamam mı?")
- Duygu yansıtma: endişeli→güvence, heyecanlı→enerji (etiket yazma, tonda göster)
- Kesilme: sus → "Efendim?/Buyrun" → velinin yönünden devam
- Dolgu: 1,0 sn'de yanıt yoksa "Bir saniye, bakayım" / "Hımm."
- Telaffuz: educallai→Edukallay, TYT→te ye te, YKS→ye ke se (tts_normalize.py)

## 5. Sıradaki İşler (öncelik sırasıyla)

1. **Gecikme ölçümü**: kullanıcı test ederken logdan `TUR SÜRESİ` oku
   (hedef <1000ms; şu an ilk ses ~1-2,8s)
2. **CRM doğrulama**: kullanıcı konuşunca Supabase `conversation_signals`
   tablosuna kayıt düşmeli (REST: `GET /rest/v1/conversation_signals`)
3. **Dashboard-canlı DB bağlantısı**: mock veri → Supabase (Next.js tarafı)
4. **Netgsm aboneliği**: gerçek telefon araması (tek ücretli eksik)
5. **EU LiveKit**: kullanıcı yeni Frankfurt projesi açarsa `agent/.env` güncelle

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
