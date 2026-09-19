# Supabase — VeliPilot AI Veri Katmanı

PostgreSQL 15+ / pgvector / Row-Level Security. Kaynak: Master DNA Brief & Teknik Şartname v1.0, Bölüm VII.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `migrations/0001_core.sql` | 12 tablo (dershaneler, staff, contacts, leads, conversation_signals, handoff_logs, installment_tracker, exam_results, appointments, campaigns, campaign_targets, collection_actions) + tenant bağlam fonksiyonları + RLS + indeksler + CHECK constraint'ler |
| `migrations/0002_rls_hardening.sql` | dershaneler/staff izolasyonu, contacts kalıcı silme engeli (soft delete zorunlu), `do_not_call` bayrağı koruması |
| `seed_demo.sql` | Demo veri: Limit Dershane — Beylikdüzü + personel + veliler + görüşmeler + taksitler + deneme sonuçları + kampanya |

## Kurulum

```bash
# 1) Supabase projesi oluştur (supabase.com — Free tier yeterli)
supabase init
supabase link --project-ref <PROJE_REF>

# 2) Migration'ları uygula
supabase db push

# 3) Demo veriyi yükle (opsiyonel, lokal/geliştirme)
psql "$DATABASE_URL" -f supabase/seed_demo.sql
```

## Tenant (RLS) Bağlamı

Her tabloda policy şu kalıbı okur:

```sql
dershane_id = current_setting('app.current_dershane', true)::uuid
```

Bağlam set edilmemişse `nullif` sarmalayıcı sayesinde **0 satır** döner (hata değil). Edge Function / servis içinden kullanım:

```ts
// service role key ile (RLS'i bypass etmez — bağlamı set etmeniz gerekir)
await supabase.rpc("set_dershane_context", { p_dershane_id: dershaneId });
// ... sorgular ...
await supabase.rpc("clear_dershane_context");
```

> `service_role` anahtarı RLS'i bypass eder; uygulama katmanı mutlaka `set_dershane_context` çağırmalı ve kullanıcı→dershane eşleşmesini doğrulamalıdır.

## TypeScript Tipleri

`src/lib/types/db.ts` — 0001_core.sql ile birebir eşleşen Row tipleri ve enum union'ları.
Canlı şemadan otomatik üretim için: `npx supabase gen types typescript --linked > src/lib/types/db.generated.ts`

## KVKK / İYS Uyum Notları

- **Ses kaydı**: `conversation_signals.audio_url` — azami **6 ay** saklanır; silme cron'u üretime çıkmadan önce kurulmalı.
- **do_not_call**: `contacts.do_not_call` kalıcı bayrak; 0002'deki trigger false'a dönmesini engeller. AI dialer her aramadan önce bu bayrağı kontrol eder.
- **İYS**: SMS gönderimi için `dershaneler.iys_registered` + contact bazında `iys_sms_consent` zorunlu.
- **Çocuk verisi**: öğrenciler 18 yaş altı — özel koruma; yalnızca zorunlu alanlar işlenir.
- **Silme**: contacts'ta kalıcı DELETE engellenir; anonimleştirme prosedürü ayrı çalışır (KVKK mad. 7).
