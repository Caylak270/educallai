# educallai.com (VeliPilot AI / kod adı: DershaneAI) — Master İnşa Planı

> Otonom yürütme planı — 2026-09-19. Kaynak doküman: `educallai.docx` (Master DNA Brief & Teknik Şartname v1.0)
> Tasarım kaynağı: Stitch projesi `17596430985700008125` → `design/screens/*.html` (7 ekran)

## 1. Ürün Özeti

Dershaneler için **7/24 çok kanallı AI sesli + yazılı asistan platformu**: veli arama (outbound/inbound),
tahsilat takibi, deneme sınavı analizi ve WhatsApp otomasyonu — tek panelden. Hedef pazar Türkiye
(Esenyurt/Beylikdüzü dershaneleri), dil Türkçe, para birimi TRY.

**Çift mandat:** (1) Veliyle doğal, sıcak konuşma. (2) Görünmez: her turda sinyal çıkarma
(record_signals), lead puanlama, risk tespiti, otomatik aksiyon.

## 2. Teknoloji Yığını (Şartname'den, değiştirilemez)

| Katman | Teknoloji |
|---|---|
| Sunum | Next.js (App Router, TS) + Tailwind + Vercel |
| Veri | Supabase (PostgreSQL 15+, pgvector, RLS) + Edge Functions |
| Ses taşıma | LiveKit Cloud + Netgsm SIP trunk |
| STT | Deepgram Nova-3 (`lang=tr`, keyterm prompting) |
| LLM | OpenAI GPT-4o mini (birincil, ephemeral cache) / Claude Haiku 4.5 fallback — 2026-09-20 kararı: Anthropic yerine OpenAI |
| TTS | Cartesia Sonic 3.6 + Türkçe tarih/sayı normalizasyon katmanı |
| VAD | Silero VAD (Türkçe kalibrasyonlu) |
| Mesajlaşma | Meta Graph API (WhatsApp resmi), Netgsm SMS, Zernio (sosyal) |
| Kuyruk | Redis / BullMQ (Outbound Batch Dialer) |

## 3. Ekran → Route Haritası

| Stitch ekranı | Route | Kabuk |
|---|---|---|
| 02 Genel Bakış (web) | `/` | Sidebar dashboard |
| 01 Veliler CRM (mobil kanban + drawer) | `/veliler` | Mobil tab bar (responsive) |
| 05 Görüşme Detayı (mobil stack) | `/gorusmeler/[id]` | Mobil stack (responsive) |
| 04 Tahsilat (mobil, 5 aşama) | `/tahsilat` | Mobil tab bar |
| 03 Deneme Analizi (mobil) | `/deneme-analizi` | Mobil tab bar |
| 06 Kampanyalar + Genel Bakış (mobil) | `/kampanyalar` | Mobil tab bar + wizard |
| 07 AI Asistan Yetenekleri (web) | `/ayarlar` | Sidebar dashboard |
| (tasarım bekleniyor) | `/randevular`, `/raporlar`, `/gorusmeler` | Stub |

Mimari karar: Stitch tasarımları mobil ve web kabukları ayrı teslim etti; tek Next.js uygulamasında
**responsive** çözülür — ≥1024px'te sidebar kabuk, altında alt tab bar kabuk. Sayfa içerikleri
tasarım HTML'ine birebir yakın taşınır (Tailwind sınıfları aynı token setiyle).

## 4. Faz Planı

### Faz 0 — Temel (bugün)
- [x] Gereksinim dokümanı parse + Stitch ekranlarını `design/screens/` altına ayır
- [x] Master plan + repo kurulumu + Stitch MCP yapılandırması (`.mcp.json`)
- [x] Next.js scaffold + M3 tasarım tokenları (renk/typography/spacing tailwind.config)
- [x] Uygulama iskeleti: sidebar + mobil tab bar + tüm route stubları

### Faz 1 — UI (bugün, paralel sub-agentlar)
- Ajan A: `/` Genel Bakış (web dashboard) + `/veliler` CRM (kanban, drawer)
- Ajan B: `/tahsilat` (5 aşama) + `/gorusmeler/[id]` (oynatıcı, transkript, sinyaller)
- Ajan C: `/deneme-analizi` (segmentler, SVG trend) + `/kampanyalar` (liste + wizard)
- Ajan D: `/ayarlar` (yetenek matrisi, çalışma saatleri, ses, KVKK, test araması)
- Mock veri katmanı: `src/lib/mock/` (gerçek Supabase bağlanana dek demo verisi)

### Faz 2 — Veri + Backend iskeleti (paralel sub-agentlar)
- E Ajanı: Supabase şeması — `supabase/migrations/` SQL (contacts, leads, conversation_signals,
  handoff_logs, installment_tracker, exam_results, appointments, dershaneler, staff) + RLS policy'leri
  + TypeScript tipleri (`src/lib/types/`)
- F Ajanı: `agent/` Python voice agent iskeleti — Cascade Pipeline (Silero VAD → Deepgram tr →
  Claude Haiku 4.5 → Cartesia), Pattern 1-8 (record_signals şeması, capability matrix, silent lag
  recovery, iç sezgi, VAD TR kalibrasyonu, speech gating, KB prefetch, TR TTS normalizasyonu),
  çalışma saati guard'ı, tahsilat state machine, deneme kategori motoru — **saf mantık kısmı
  test edilebilir** (pytest, anahtarsız)

### Faz 3 — Doğrulama
- `npm run build` + typecheck temiz
- Sayfa render görsel kabulü (judge) — tasarım HTML'ine benzerlik
- Test raporu `docs/raporlar/` + Obsidian oturum kaydı

### Faz 4 — Sonraki oturumlar (bekleyen)
- Stitch'te eksik ekranlar tamamlanınca: `/randevular`, `/raporlar`, Görüşme listesi
- Supabase/LiveKit/Deepgram/Cartesia/Netgsm canlı anahtarları bağlama (checklist: şartname XIII)
- Outbound Batch Dialer worker (BullMQ) + kampanya çalıştırma
- Outcome Telemetry cron + haftalık rapor motoru

## 5. Mimari Desenler (uygulanacak — şartname Bölüm III-IV)

1. **Pattern 1 — record_signals:** tek LLM çağrısında yanıt + yapılandırılmış sinyal JSON
2. **Pattern 2 — Capability Matrix:** dershane bazlı dinamik tool yükleme (anti-halüsinasyon)
3. **Pattern 3 — Silent Lag Recovery:** 4 senaryo (randevu/ödeme/kayıt/deneme) sessiz kontrol
4. **Pattern 4 — İç Sezgi:** geri dönen veli bilgisi strateji olarak enjekte edilir, söylenmez
5. **Pattern 5 — VAD TR kalibrasyonu:** min_speech 0.3s, max_endpointing 6.0s, min_interruption 2 kelime
6. **Pattern 6 — Speech Gating:** açılış selamında mikrofon kapalı
7. **Pattern 7 — KB Prefetch:** interim transkriptten embedding önceden başlatılır
8. **Pattern 8 — TR TTS normalizasyonu:** "12.000 TL" → "on iki bin lira" (deterministik)
9. **Outbound Batch Dialer:** önceliklendirme (sıcaklık, temas yaşı, optimal saat, deneme sayısı)
   + çalışma saati guard'ı + retry policy (cevapsız 3 saat, meşgul 30 dk) + stop koşulları
10. **Tahsilat State Machine:** 5 aşama (vade-3g WhatsApp → vade günü SMS+WA → +3/+7 uyarı →
    +14 nazik AI arama → +30 kararlı AI arama + yetkili bildirimi)
11. **Deneme Fırsat Motoru:** PLATO / RISING / TOP_PERFORMER / DECLINING / FIRST_TIMER
12. **Outcome Telemetry:** handoff +24s sonra takip doğrulama (True/False Positive)

## 6. Uyumluluk (KVKK & İYS) — mimari düzeyde

- İYS onay kontrolü arama öncesi zorunlu katman; rızasız liste araması imkânsız
- Arama başında AI bildirimi zorunlu metni; ses kaydı max 6 ay saklama
- `do_not_call` kalıcı bayrak; çocuk verisi koruma; Supabase RLS dershane izolasyonu

## 7. Raporlama Disiplini

- Her faz sonunda `docs/raporlar/YYYY-MM-DD-<konu>.md`
- Obsidian (`D:\vault`): entity sayfası + oturum özeti + log.md/index.md güncellemesi
