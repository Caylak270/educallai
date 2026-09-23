# VeliPilot AI — Geliştirme Planı (2026-09-22)

> Mevcut durum analizi + önceliklendirilmiş geliştirme yol haritası.
> Master şartname: `PLAN.md`. Bu doküman analiz sonrası güncel boşlukları fazlara ayırır.

---

## 1. Mevcut Durum Özeti

### Çalışan (canlı) kısımlar ✅
- **Voice agent canlı:** LiveKit Cloud + Deepgram nova-3 (tr) + GPT-4o-mini (fallback Claude) + Cartesia sonic-3. Cascade / Realtime / Hybrid üç mod, eot→ilk ses 375–462 ms.
- **Veritabanı canlı:** 12 tablo + tam RLS (0001_core + 0002_rls_hardening) Supabase'e uygulanmış, demo seed yüklü.
- **Dashboard kısmen canlı:** `/veliler` (kanban drag → PATCH `/api/leads/[id]` tek gerçek DB yazması), `/gorusmeler` + `/gorusmeler/[id]` canlı Supabase okuması.
- **Dashboard→Agent kanalı:** `/api/agent-settings` ve `/api/agent-prompt` dosya üzerinden hot-reload; ses testi gerçek LiveKit room'una bağlanıyor.
- **134 pytest** (agent pure-logic modülleri) + Playwright E2E 35/35.

### Demo/kukla kalan kısımlar ⚠️
| Alan | Durum |
|---|---|
| 6/9 sayfa statik mock | `/`, `/randevular`, `/tahsilat`, `/deneme-analizi`, `/kampanyalar`, `/raporlar` — tablolar + tipler hazır ama hiç bağlı değil |
| **Auth yok** | Login yok, middleware yok; okumalar service key (RLS bypass) ve `dershane_id` filtresiz. Sabit kullanıcı "Ahmet Yıldız / Limit Dershane" |
| Sahte kaydetme | Ayarlar kartları, danışman notu, tahsilat Ödendi/Hatırlat, kampanya durdur/devam — hepsi sadece local state + toast |
| Agent tool'ları demo | `quote_pricing` sabit "12.000 TL", `create_appointment`/`check_exam_results`/`transfer_to_human` canned metin — DB'ye yazmıyor |
| Agent CRM kaydı | Hardcoded demo `contact_id`/`dershane_id`, `direction` her zaman "inbound" |
| Telefony | Netgsm SIP trunk bağlı değil (tek ücretli eksik) — gerçek arama yapılamıyor |
| Sistemler 1–3 + 12 | Dialer/tahsilat/deneme motorları **saf karar kütüphanesi**, yürütücü (worker/cron) yok. Outcome Telemetry için sıfır kod |
| Pattern 7 KB | `embed()` + pgvector arama stub; `dershane_kb` tablosu şemada bile yok |
| Kayıt saklama | `audio_url` hiç kullanılmıyor; 6 ay KVKK purge cron'u yok |

---

## 2. Geliştirme Planı

Öncelik sırası: **A → B → C → D → E**. A güvenlik (deploy edilemez durum), B ürün değeri/demosu,
C telefony (öz ürün vaadi), D planlanmış Faz 4, E artırıcılar.

Her madde tahmini boyut: **S** (< yarım gün) · **M** (1–2 gün) · **L** (3+ gün).

### Faz A — Güvenlik ve Doğruluk (deploy ön koşulu)

| # | İş | Boyut | Nerede |
|---|---|---|---|
| A1 | **Supabase Auth + login sayfası + middleware** — session yoksa tüm `(app)` route'ları `/giris`'e yönlensin | L | `src/middleware.ts`, `src/app/(auth)/` |
| A2 | **Çok kiracılı okuma**: service key'i yalnız gerçekten gerekli server işlerinde kullan; normal okumalar user JWT + RLS ile; her sorguya `dershane_id` scope'u (şimdilik tek tenant olsa da yapı kurulsun) | L | `src/lib/server/supabase.ts` |
| A3 | Sabit kullanıcı/tenant kaldır → `auth.users` + `staff` eşlemesi, sidebar/topbar gerçek oturum verisi | M | `sidebar.tsx:36-57`, `topbars.tsx:66-74` |
| A4 | Sahte kaydetmeleri gerçek yap: Ayarlar Capabilities/Schedule/Compliance → `dershaneler.capabilities`/`working_hours` JSONB; danışman notu → `handoff_logs` ya da `conversation_signals.notlar` | M | `ayarlar-view.tsx:68-70`, `actions-panel.tsx:132-143` |
| A5 | loading.tsx / error.tsx / not-found.tsx + skeleton'lar; kanban PATCH hatasının sessiz yutulmasını düzelt (`.catch(() => undefined)`) | S–M | `veliler-crm.tsx:58-62`, tüm `(app)` |
| A6 | `/gorusmeler/[id]` mock fallback'inin **herhangi bir id** için aynı kaydı dönmesi hatasını kaldır → 404 | S | `mock/calls.ts:349-351` |

**Çıktı:** Veri başkasının eline geçmez, kaydet butonları gerçekten kaydeder, deploy edilebilir temel.

### Faz B — Kalan Sayfaları Canlı Veriye Bağla

| # | İş | Boyut | Not |
|---|---|---|---|
| B1 | **Dashboard canlı KPI'lar**: `leads`, `conversation_signals`, `appointments`, `installment_tracker` üzerinden SQL aggregation; "Yenile" gerçek revalidate | M | `(app)/page.tsx:12-35` |
| B2 | **Randevular canlı**: `appointments` tablosu okuma + "Yeni Randevu" formu (insert) + Detay drawer | M | Tablo + tip hazır |
| B3 | **Tahsilat canlı**: `installment_tracker` okuma; "Ödendi" → state PATCH; "Hatırlat" → `collection_actions` insert | M | 9-state makine hazır |
| B4 | **Deneme analizi canlı**: `exam_results` okuma; maske numaralı mock tel yerine gerçek `contacts.telephone` | M | `call-buttons.tsx:39-41` |
| B5 | **Kampanyalar canlı**: `campaigns` + `campaign_targets` okuma; durdur/devam → PATCH; sihirbaz Step 1→N + CSV gerçek parse | L | |
| B6 | **Raporlar**: "PDF İndir" en azından istemci tarafı print-to-PDF; ileride server-generated | S–M | |
| B7 | `/api/calls` GET'i canlı modda `conversation_signals`'dan okusun | S | `route.ts:114-119` |
| B8 | **Sayfalama + arama**: gorusmeler (limit=50 hardcode), veliler, tahsilat | M | `queries.ts:94` |
| B9 | **Veliler filtre chip'leri çalışsın** + Gelişmiş Filtre drawer gerçek filtre | M | `veliler-crm.tsx:38-51` |
| B10 | Görüşme detay: gerçek timestamp'ler (varsa), `audio_url` oynatma, "Tekrar Ara" → `POST /api/calls` | M | `[id]/page.tsx:63-71` |

**Çıktı:** 9 sayfanın 9'u da canlı; demo etiketi yalnız anahtar yoksa.

### Faz C — Voice Agent'ı Üretime Hazırla (ürünün kalbi)

| # | İş | Boyut | Not |
|---|---|---|---|
| C1 | **Netgsm SIP trunk** kurulumu + LiveKit outbound/inbound trunk config — gerçek PSTN arama | M (para) | Tek ücretli eksik; HANDOFF item |
| C2 | **Tool'ları DB'ye bağla**: `quote_pricing` → `dershaneler.voice_config.fiyatlandirma`; `create_appointment` → insert + çakışma kontrolü; `check_exam_results` → `exam_results` sorgu; `transfer_to_human` → `handoff_logs` insert + bildirim | L | `agent_main.py` ~105: "demo" yorumu |
| C3 | **Telefon→contact lookup**: arama gelince/çıkarken numaradan `contacts` eşle; hardcoded demo ID'ler kalksın; `direction` doğru yazılsın | M | `save_to_crm()` |
| C4 | **Pattern 7 KB devreye al**: `dershane_kb` tablosu ekle (migration), OpenAI embedding + pgvector arama implement | M–L | `kb.py` stub |
| C5 | **Pattern 3 + 4 bağla**: session sonunda lag recovery değerlendir → aksiyon listesi; `build_system_prompt`'a gerçek `contact_summary` geç | M | `lag_recovery.py` ıssız |
| C6 | **Kayıt saklama**: LiveKit room recording → Supabase Storage → `audio_url`; 6 ay KVKK purge cron | M | KVKK şartı |
| C7 | Dialer öncesi **İYS/onay + do_not_call kontrolü** yürütme yolu | S | Kolonlar var, enforcement yok |
| C8 | pipeline.py + agent_main.py testleri; `agent/tests`'e ekle | M | Şu an test yok |

**Çıktı:** Ajan demo kişilikten gerçek asistana döner; ilk gerçek veli araması yapılabilir.

### Faz D — Sistemler 1–3 Yürütücü Katmanı (PLAN.md Faz 4)

| # | İş | Boyut | Not |
|---|---|---|---|
| D1 | **Dialer worker**: kuyruk seçimi. Vercel'te QStash/Vercel Cron + upsert tabanlı basit scheduler önerilir (BullMQ/Redis ek yük); `dialer.py` skoru zaten hazır | L | Kural: 3 deneme, meşgul→30 dk, cevapsız→3 sa |
| D2 | **Tahsilat scheduler**: 5 aşamalı tetikleyici — WhatsApp/SMS gönderici (Netgsm API) + AI arama | L | `collections.py` hazır |
| D3 | **Deneme motoru ingestion**: `exam_results` değişince kategori/trend backfill + riskli öğrenci için çağrı kuyruğa | M | `exam_engine.py` hazır |
| D4 | **Outcome Telemetry (Sistem 12)**: +24h handoff doğrulama cron'u, SLA 4h/24h bildirim | M | Alanlar var, kod sıfır |
| D5 | WhatsApp yazılı kanal (Meta Graph API): inbound bot + outbound şablonları | L | Şartnamede var |

**Çıktı:** "7/24 otonom platform" vaadi tamamlanır.

### Faz E — Artırıcılar / Kalite

| # | İş | Boyut |
|---|---|---|
| E1 | CI (GitHub Actions): tsc + eslint + pytest + next build her PR'da | S–M |
| E2 | Bildirim merkezi + tema toggle + tarih aralığı — no-op butonları çalışır yap veya kaldır | S |
| E3 | Onboarding akışı: yeni dershane kaydı → seed wizard | M |
| E4 | Realtime dashboard: Supabase Realtime ile canlı çağrı feed'i | M |
| E5 | `working_hours.py` 2027 takvim güncelleme otomasyonu | S |
| E6 | Deepgram `keyterms` deprecated uyarısı için parametre güncelle | S |
| E7 | Dosya tabanlı ayar kanalı (`agent-*.json` write) serverless'ta kırılır → Supabase tablosuna taşı (`agent_config`) | M |

---

## 3. Önerilen Sıra (pragmatik yol)

1. **A5 + A6 + B9** (hızlı kazanımlar, yarım gün) — görünür düzelme
2. **A1–A3** (auth + tenant) — deploy edilebilirlik
3. **A4 + B1–B4** (dashboard tamamen canlı) — demo/satış değeri
4. **C1–C3** (telefony + gerçek tool'lar) — ürünün özü
5. **C4–C8 → D** (otomasyon sistemleri)
6. **E** sürekli arka planda

---

## 4. Açık Riskler / Karar Bekleyenler

- **Netgsm aboneliği** (C1) satın alma kararı — planın kalanı teknik olarak bağımsız ama gerçek arama buna kilitli.
- **Kuyruk teknolojisi** (D1): Redis/BullMQ mu, QStash/Vercel Cron mu? Vercel deploy hedefi için ikincisi önerilir.
- **RLS modeli**: mevcut RLS `app.current_dershane` session GUC'u bekliyor; Supabase Auth JWT ile `request.jwt.claims` tabanlı yeniden tasarım gerekebilir (A2'nin parçası).
- **LLM tercihi**: şartnamede Claude Haiku birincil; 2026-09-20'de GPT-4o-mini'ye geçildi (belgelenmiş karar) — şartname güncellenmeli.
