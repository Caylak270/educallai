-- ============================================================
-- educallai (VeliPilot AI) — TEK DOSYA KURULUM
-- Kullanım: Supabase Dashboard → SQL Editor → New query → bu dosyanın
-- tamamını yapıştır → Run. (Ayrıntı: supabase/README.md)
-- ============================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- educallai (VeliPilot AI) — 0001_core.sql
-- Çekirdek şema: extension'lar, tenant bağlam yardımcıları, üst tablolar
-- (dershaneler, staff), CRM/pipeline (contacts, leads), görüşme sinyalleri,
-- handoff, tahsilat, deneme sonuçları, randevular, kampanyalar, tahsilat aksiyonları.
--
-- Kurallar:
--   * Multi-tenant: her satır dershane_id ile izole, RLS ZORUNLU.
--   * RLS deseni: dershane_id = current_setting('app.current_dershane')::uuid
--     (Bağlam hiç set edilmemişse hata yerine 0 satır dönmesi için
--      current_setting(..., true) + nullif(...) güvenli sarmalayıcı kullanılır.)
--   * Kanaldan bağımsız contacts: WhatsApp ID, Instagram ID ve telefon TEK profilde.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1) Extension'lar ────────────────────────────────────────────────────────
create extension if not exists pgcrypto;  -- gen_random_uuid()
create extension if not exists vector;    -- pgvector: conversation_signals.embedding

-- ── 2) Tenant bağlam yardımcı fonksiyonları ────────────────────────────────
-- RLS policy'lerinin okuduğu oturum değişkenini set eder / temizler.
-- SECURITY DEFINER + sabit search_path (Supabase lint önerisi).

create or replace function public.set_dershane_context(p_dershane_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  select set_config('app.current_dershane', p_dershane_id::text, false);
$$;

create or replace function public.clear_dershane_context()
returns void
language sql
security definer
set search_path = ''
as $$
  -- Boş string'e çekilir; policy'lerdeki nullif(...) bunu NULL yapar → 0 satır.
  select set_config('app.current_dershane', '', false);
$$;

comment on function public.set_dershane_context(uuid) is 'RLS için app.current_dershane oturum değişkenini ayarlar (tenant bağlamı).';
comment on function public.clear_dershane_context() is 'Tenant bağlamını (app.current_dershane) temizler; sonrasında hiçbir satır dönmez.';

-- ── 3) Ortak updated_at trigger fonksiyonu ─────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'Ortak trigger: UPDATE öncesi updated_at alanını now() yapar.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) ÜST TABLOLAR
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 4.1) dershaneler (tenant kök tablo) ────────────────────────────────────
create table public.dershaneler (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  branch_name   text,
  city          text,
  district      text,
  plan          varchar(20) not null default 'temel'
                check (plan in ('temel', 'profesyonel', 'kurumsal')),
  phone         text,
  capabilities  jsonb not null default '{}'::jsonb,   -- AI yetenek matrisi (voice/whatsapp/tahsilat...)
  working_hours jsonb not null default '{}'::jsonb,   -- {gun: {open, close}} — arama saat guard'ı için
  voice_config  jsonb not null default '{}'::jsonb,   -- ses/TTS konfigürasyonu
  iys_registered boolean not null default false,      -- İYS kaydı yapıldı mı
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.dershaneler is 'Tenant (dershane) kök tablosu — tüm tablolar dershane_id ile buna bağlanır.';
comment on column public.dershaneler.plan is 'Abonelik planı: temel | profesyonel | kurumsal';
comment on column public.dershaneler.capabilities is 'AI yetenek matrisi (JSONB): hangi kanal/özellik açık.';
comment on column public.dershaneler.working_hours is 'Çalışma saatleri (JSONB) — AI giden aramalar yalnız bu saatlerde yapılır.';

create trigger trg_dershaneler_updated_at
  before update on public.dershaneler
  for each row execute function public.set_updated_at();

-- ── 4.2) staff ──────────────────────────────────────────────────────────────
create table public.staff (
  id          uuid primary key default gen_random_uuid(),
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  full_name   text not null,
  role        varchar(20) not null default 'danisman'
              check (role in ('mudur', 'danisman', 'resepsiyon')),
  phone       text,
  email       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.staff is 'Dershane personeli (müdür/danışman/resepsiyon) — handoff hedefleri.';
comment on column public.staff.role is 'Rol: mudur | danisman | resepsiyon';

create index idx_staff_dershane on public.staff (dershane_id);
create index idx_staff_active on public.staff (dershane_id) where is_active;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5) CRM ÇEKİRDEĞİ — contacts + leads
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 5.1) contacts (kanaldan bağımsız tek profil) ───────────────────────────
create table public.contacts (
  id             uuid primary key default gen_random_uuid(),
  dershane_id    uuid not null references public.dershaneler(id) on delete cascade,
  phone          text,                    -- +90E.164 önerilir
  whatsapp_id    text,                    -- WhatsApp ID (genelde telefon)
  instagram_id   text,                    -- Instagram kullanıcı ID / kullanıcı adı
  parent_name    text,                    -- veli adı
  parent_gender  varchar(10),             -- kadın | erkek (hitap motoru için)
  student_name   text,                    -- öğrenci adı
  student_grade  text,                    -- '8. Sınıf', '12. Sınıf', 'Mezun'...
  exam_type      varchar(10),             -- TYT | AYT | LGS
  contact_summary text,                   -- AI özet metni
  source         varchar(50),             -- whatsapp | instagram | website | referans | telefon ...
  -- KVKK / İYS açık rıza alanları ─────────────────────────────
  iys_sms_consent      boolean not null default false,  -- İYS ticari SMS rızası
  iys_call_consent     boolean not null default false,  -- İYS arama rızası
  kvkk_consent_at      timestamptz,                     -- açık rıza alınma zamanı
  open_consent_source  varchar(100),                    -- rızanın alındığı kanal/kaynak
  do_not_call          boolean not null default false,  -- KALICI arama yapma bayrağı
  deleted_at           timestamptz,                     -- soft delete (kalıcı silme yasak — bkz. 0002)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- En az bir kanal tanımlayıcısı zorunlu (kanaldan bağımsız tek profil)
  constraint contacts_has_channel_identifier
    check (phone is not null or whatsapp_id is not null or instagram_id is not null)
);

comment on table public.contacts is 'Kanaldan bağımsız veli/öğrenci profili: WhatsApp, Instagram ve telefon TEK satırda.';
comment on column public.contacts.do_not_call is 'KVKK kalıcı bayrak: true ise AI arama yapamaz; 0002 trigger''ı ile sıfırlanamaz.';
comment on column public.contacts.deleted_at is 'Soft delete zamanı. Kalıcı DELETE 0002 trigger''ı ile engellenir (KVKK denetim izi).';

create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

create index idx_contacts_dershane on public.contacts (dershane_id);
create index idx_contacts_phone    on public.contacts (phone);
create index idx_contacts_whatsapp on public.contacts (whatsapp_id);
create index idx_contacts_instagram on public.contacts (instagram_id);
create index idx_contacts_active   on public.contacts (dershane_id) where deleted_at is null;

-- ── 5.2) leads (pipeline) ───────────────────────────────────────────────────
create table public.leads (
  id                    uuid primary key default gen_random_uuid(),
  contact_id            uuid not null references public.contacts(id) on delete cascade,
  dershane_id           uuid not null references public.dershaneler(id) on delete cascade,
  score                 integer not null default 0 check (score between 0 and 100),
  temperature           varchar(10) not null default 'cold'
                        check (temperature in ('hot', 'warm', 'cold', 'lost')),
  enrollment_readiness  numeric(5,2) check (enrollment_readiness between 0 and 100),
  stage                 varchar(20) not null default 'new'
                        check (stage in ('new', 'contacted', 'interested', 'appointment_set',
                                         'visited', 'enrolled', 'lost')),
  missing_must_fields   text[] not null default '{}'::text[],  -- kayıt için eksik zorunlu alanlar
  next_follow_up        timestamptz,
  follow_up_reason      text,
  total_calls           integer not null default 0 check (total_calls >= 0),
  total_messages        integer not null default 0 check (total_messages >= 0),
  last_contact_at       timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint leads_contact_unique unique (contact_id)  -- contact başına tek lead
);

comment on table public.leads is 'Lead pipeline: new → contacted → interested → appointment_set → visited → enrolled | lost';
comment on column public.leads.temperature is 'Lead sıcaklığı: hot | warm | cold | lost';
comment on column public.leads.missing_must_fields is 'Kayıt kapatmak için eksik zorunlu alanlar (AI eksik bilgi sorar).';

create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create index idx_leads_dershane   on public.leads (dershane_id);
create index idx_leads_contact    on public.leads (contact_id);
create index idx_leads_stage      on public.leads (dershane_id, stage);
create index idx_leads_temperature on public.leads (dershane_id, temperature);
create index idx_leads_next_follow_up on public.leads (next_follow_up);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6) GÖRÜŞME SİNYALLERİ + HANDOFF
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 6.1) conversation_signals (görüşme başına sinyal çıkarımı) ─────────────
create table public.conversation_signals (
  id                       uuid primary key default gen_random_uuid(),
  contact_id               uuid not null references public.contacts(id) on delete cascade,
  lead_id                  uuid references public.leads(id) on delete set null,
  dershane_id              uuid not null references public.dershaneler(id) on delete cascade,
  channel                  varchar(20) not null
                           check (channel in ('voice', 'whatsapp', 'instagram', 'sms')),
  direction                varchar(10) not null check (direction in ('inbound', 'outbound')),
  sentiment                varchar(10) check (sentiment in ('positive', 'neutral', 'negative')),
  intent                   text,
  lead_temperature         varchar(10) check (lead_temperature in ('hot', 'warm', 'cold', 'lost')),
  enrollment_readiness     numeric(5,2),
  price_sensitivity        varchar(10) check (price_sensitivity in ('low', 'medium', 'high')),
  student_grade            text,
  exam_type                varchar(10),
  sibling_mentioned        boolean not null default false,
  competitor_mentioned     text,
  capability_limit_reached boolean not null default false,  -- AI yetenek sınırına takıldı mı
  recommend_handoff        boolean not null default false,
  handoff_reason           text,
  payment_objection        text,
  payment_promise          date,                            -- velinin söz verdiği ödeme tarihi
  risk_signal              text,
  do_not_call              boolean not null default false,  -- görüşmede rıza reddi vb. sinyali
  transcript               text,                            -- STT çıktısı
  audio_url                text,                            -- ses kaydı (max 6 ay saklanır — KVKK)
  duration_seconds         integer check (duration_seconds >= 0),
  embedding                vector(1536),                    -- pgvector: semantik arama/benzerlik
  created_at               timestamptz not null default now()
);

comment on table public.conversation_signals is 'Her görüşme/mesaj turundan çıkarılan sinyaller (duygu, niyet, fiyat hassasiyeti, handoff önerisi...).';
comment on column public.conversation_signals.audio_url is 'Ses kaydı URL''i — KVKK: en fazla 6 ay saklanır, sonra silinir.';
comment on column public.conversation_signals.embedding is 'pgvector gömmesi (1536 boyut) — benzer görüşme araması için.';

create index idx_signals_dershane  on public.conversation_signals (dershane_id);
create index idx_signals_contact   on public.conversation_signals (contact_id);
create index idx_signals_lead      on public.conversation_signals (lead_id);
create index idx_signals_created   on public.conversation_signals (dershane_id, created_at desc);
create index idx_signals_embedding on public.conversation_signals
  using hnsw (embedding vector_cosine_ops);

-- ── 6.2) handoff_logs (insana devir + SLA takibi) ──────────────────────────
create table public.handoff_logs (
  id                 uuid primary key default gen_random_uuid(),
  lead_id            uuid not null references public.leads(id) on delete cascade,
  dershane_id        uuid not null references public.dershaneler(id) on delete cascade,
  trigger_reason     text,                      -- AI neden devretti
  assigned_to        uuid references public.staff(id) on delete set null,
  status             varchar(20) not null default 'pending'
                     check (status in ('pending', 'in_progress', 'resolved')),
  staff_action_taken boolean not null default false,
  outcome            varchar(20)
                     check (outcome in ('enrolled', 'appointment_set', 'declined',
                                        'no_answer', 'false_positive')),
  outcome_checked_at timestamptz,
  sla_4h_notified    boolean not null default false,   -- 4 saat SLA bildirimi
  sla_24h_notified   boolean not null default false,   -- 24 saat SLA eskalasyon bildirimi
  created_at         timestamptz not null default now()
);

comment on table public.handoff_logs is 'AI → personel devir kayıtları; outcome ve SLA (4s/24s) bildirim bayraklarıyla.';
comment on column public.handoff_logs.outcome is 'Handoff sonucu: enrolled | appointment_set | declined | no_answer | false_positive';

create index idx_handoff_dershane  on public.handoff_logs (dershane_id);
create index idx_handoff_lead      on public.handoff_logs (lead_id);
create index idx_handoff_status    on public.handoff_logs (dershane_id, status);
create index idx_handoff_assigned  on public.handoff_logs (assigned_to);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7) TAHSİLAT + DENEME + RANDEVU
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 7.1) installment_tracker (taksit durum makinesi) ───────────────────────
create table public.installment_tracker (
  id                   uuid primary key default gen_random_uuid(),
  contact_id           uuid not null references public.contacts(id) on delete cascade,
  dershane_id          uuid not null references public.dershaneler(id) on delete cascade,
  student_name         text,
  total_amount         numeric(12,2) not null check (total_amount >= 0),
  installment_count    integer not null check (installment_count > 0),
  installment_amount   numeric(12,2) not null check (installment_amount >= 0),
  installment_number   integer not null check (installment_number > 0),
  due_date             date not null,
  state                varchar(20) not null default 'UPCOMING'
                       check (state in ('UPCOMING', 'DUE_TODAY', 'OVERDUE_3D', 'OVERDUE_7D',
                                        'OVERDUE_14D', 'OVERDUE_21D', 'OVERDUE_30D',
                                        'ESCALATED', 'PAID')),
  paid_at              timestamptz,
  paid_amount          numeric(12,2),
  whatsapp_sent_count  integer not null default 0 check (whatsapp_sent_count >= 0),
  sms_sent_count       integer not null default 0 check (sms_sent_count >= 0),
  ai_call_count        integer not null default 0 check (ai_call_count >= 0),
  last_action_at       timestamptz,
  created_at           timestamptz not null default now()
);

comment on table public.installment_tracker is 'Taksit başına tahsilat state machine: UPCOMING → DUE_TODAY → OVERDUE_3D/7D/14D/21D/30D → ESCALATED | PAID';
comment on column public.installment_tracker.state is 'Tahsilat durumu (5 aşamalı aksiyon motorunun girdisi): UPCOMING | DUE_TODAY | OVERDUE_3D | OVERDUE_7D | OVERDUE_14D | OVERDUE_21D | OVERDUE_30D | ESCALATED | PAID';

create index idx_installments_dershane on public.installment_tracker (dershane_id);
create index idx_installments_contact  on public.installment_tracker (contact_id);
create index idx_installments_state    on public.installment_tracker (dershane_id, state);
create index idx_installments_due_date on public.installment_tracker (due_date);

-- ── 7.2) exam_results (deneme sınavı analizi) ──────────────────────────────
create table public.exam_results (
  id                  uuid primary key default gen_random_uuid(),
  contact_id          uuid not null references public.contacts(id) on delete cascade,
  dershane_id         uuid not null references public.dershaneler(id) on delete cascade,
  student_name        text,
  exam_date           date not null,
  exam_name           text not null,
  total_net           numeric(6,2),
  math_net            numeric(5,2),
  science_net         numeric(5,2),
  turkish_net         numeric(5,2),
  social_net          numeric(5,2),
  percentile          numeric(5,2),
  ranking             integer,
  category            varchar(20)
                      check (category in ('PLATEAU', 'RISING', 'DECLINING',
                                          'TOP_PERFORMER', 'FIRST_TIMER')),
  trend               varchar(20)
                      check (trend in ('RISING', 'DECLINING', 'PLATEAU')),
  ai_analysis_summary text,
  created_at          timestamptz not null default now()
);

comment on table public.exam_results is 'Deneme sınavı netleri + AI kategori motoru: PLATEAU | RISING | DECLINING | TOP_PERFORMER | FIRST_TIMER';
comment on column public.exam_results.category is 'AI segment kategorisi: PLATEAU | RISING | DECLINING | TOP_PERFORMER | FIRST_TIMER';
comment on column public.exam_results.trend is 'Önceki denemeye göre trend: RISING | DECLINING | PLATEAU (ilk sınavda NULL)';

create index idx_exams_dershane  on public.exam_results (dershane_id);
create index idx_exams_contact   on public.exam_results (contact_id);
create index idx_exams_exam_date on public.exam_results (dershane_id, exam_date desc);
create index idx_exams_category  on public.exam_results (dershane_id, category);

-- ── 7.3) appointments ───────────────────────────────────────────────────────
create table public.appointments (
  id                    uuid primary key default gen_random_uuid(),
  contact_id            uuid not null references public.contacts(id) on delete cascade,
  lead_id               uuid references public.leads(id) on delete set null,
  dershane_id           uuid not null references public.dershaneler(id) on delete cascade,
  scheduled_at          timestamptz not null,
  duration_minutes      integer not null default 30 check (duration_minutes > 0),
  status                varchar(20) not null default 'scheduled'
                        check (status in ('scheduled', 'confirmed', 'completed',
                                          'no_show', 'cancelled', 'rescheduled')),
  created_by            varchar(20) not null default 'manual'
                        check (created_by in ('ai_voice', 'ai_whatsapp', 'manual')),
  calendar_synced       boolean not null default false,
  staff_notified        boolean not null default false,
  parent_reminder_sent  boolean not null default false,
  notes                 text,
  created_at            timestamptz not null default now()
);

comment on table public.appointments is 'Tanışma/etüt randevuları — AI (ses/WhatsApp) veya personel tarafından oluşturulur.';
comment on column public.appointments.created_by is 'Oluşturan: ai_voice | ai_whatsapp | manual';

create index idx_appointments_dershane  on public.appointments (dershane_id);
create index idx_appointments_contact   on public.appointments (contact_id);
create index idx_appointments_lead      on public.appointments (lead_id);
create index idx_appointments_status    on public.appointments (dershane_id, status);
create index idx_appointments_scheduled on public.appointments (scheduled_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8) KAMPANYALAR (outbound batch) + TAHSİLAT AKSİYONLARI
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 8.1) campaigns ──────────────────────────────────────────────────────────
create table public.campaigns (
  id                      uuid primary key default gen_random_uuid(),
  dershane_id             uuid not null references public.dershaneler(id) on delete cascade,
  name                    text not null,
  channel                 varchar(20) not null check (channel in ('voice', 'whatsapp', 'sms')),
  status                  varchar(20) not null default 'draft'
                          check (status in ('draft', 'scheduled', 'running', 'paused', 'completed')),
  total_targets           integer not null default 0 check (total_targets >= 0),
  contacted               integer not null default 0 check (contacted >= 0),
  answered                integer not null default 0 check (answered >= 0),
  appointments            integer not null default 0 check (appointments >= 0),
  voice_id                varchar(100),       -- kullanılacak AI ses kimliği (Cartesia/ElevenLabs)
  script                  text,               -- kampanya konuşma senaryosu
  working_hours_snapshot  jsonb not null default '{}'::jsonb,  -- başlangıçta geçerli çalışma saatleri
  scheduled_at            timestamptz,
  started_at              timestamptz,
  completed_at            timestamptz,
  created_at              timestamptz not null default now()
);

comment on table public.campaigns is 'Toplu giden kampanya (ses/WhatsApp/SMS) — BullMQ outbound dialer tarafından çalıştırılır.';
comment on column public.campaigns.working_hours_snapshot is 'Kampanya başlarken dershane çalışma saatlerinin kopyası (guard için).';

create index idx_campaigns_dershane on public.campaigns (dershane_id);
create index idx_campaigns_status   on public.campaigns (dershane_id, status);

-- ── 8.2) campaign_targets ───────────────────────────────────────────────────
create table public.campaign_targets (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references public.campaigns(id) on delete cascade,
  contact_id      uuid not null references public.contacts(id) on delete cascade,
  dershane_id     uuid not null references public.dershaneler(id) on delete cascade,
  priority_score  numeric(5,2),
  status          varchar(20) not null default 'queued'
                  check (status in ('queued', 'calling', 'answered', 'no_answer',
                                    'busy', 'done', 'failed')),
  attempts        integer not null default 0 check (attempts >= 0),
  next_retry_at   timestamptz,
  last_outcome    varchar(50),
  created_at      timestamptz not null default now(),
  constraint campaign_targets_unique unique (campaign_id, contact_id)
);

comment on table public.campaign_targets is 'Kampanya hedefleri: her contact için arama/iletişim durumu ve retry planı.';

create index idx_campaign_targets_dershane  on public.campaign_targets (dershane_id);
create index idx_campaign_targets_campaign  on public.campaign_targets (campaign_id);
create index idx_campaign_targets_contact   on public.campaign_targets (contact_id);
create index idx_campaign_targets_status    on public.campaign_targets (dershane_id, status);
create index idx_campaign_targets_next_retry on public.campaign_targets (next_retry_at);

-- ── 8.3) collection_actions (tahsilat aksiyon denetim izni) ────────────────
create table public.collection_actions (
  id             uuid primary key default gen_random_uuid(),
  installment_id uuid not null references public.installment_tracker(id) on delete cascade,
  dershane_id    uuid not null references public.dershaneler(id) on delete cascade,
  stage          integer not null check (stage between 1 and 5),  -- 5 aşamalı tahsilat akışı
  channel        varchar(20) not null check (channel in ('whatsapp', 'sms', 'voice')),
  tone           varchar(50),    -- aksiyonun tonu (nazik hatırlatma → resmi ihtar)
  result         varchar(50),    -- aksiyonun sonucu (yanıt alındı, söz alındı, cevapsız...)
  occurred_at    timestamptz not null default now()
);

comment on table public.collection_actions is 'Taksit başına yapılan otomatik/manuel tahsilat aksiyonlarının denetim izni (aşama 1-5).';
comment on column public.collection_actions.stage is 'Tahsilat aşaması: 1 (nazik hatırlatma) → 5 (resmi/eskalasyon).';

create index idx_collection_actions_dershane    on public.collection_actions (dershane_id);
create index idx_collection_actions_installment on public.collection_actions (installment_id);
create index idx_collection_actions_occurred    on public.collection_actions (dershane_id, occurred_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9) RLS — TABLO BAŞINA TENANT İZOLASYON POLİTİKASI
--    Bağlam (app.current_dershane) set edilmemişse POLİTİKA HATA VERMEZ,
--    0 SATIR DÖNER (current_setting(..., true) + nullif güvenli sarmalayıcı).
--    dershaneler + staff policy'leri 0002_rls_hardening.sql'de.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.contacts enable row level security;
create policy contacts_tenant_isolation on public.contacts
  for all to public
  using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);

alter table public.leads enable row level security;
create policy leads_tenant_isolation on public.leads
  for all to public
  using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);

alter table public.conversation_signals enable row level security;
create policy conversation_signals_tenant_isolation on public.conversation_signals
  for all to public
  using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);

alter table public.handoff_logs enable row level security;
create policy handoff_logs_tenant_isolation on public.handoff_logs
  for all to public
  using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);

alter table public.installment_tracker enable row level security;
create policy installment_tracker_tenant_isolation on public.installment_tracker
  for all to public
  using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);

alter table public.exam_results enable row level security;
create policy exam_results_tenant_isolation on public.exam_results
  for all to public
  using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);

alter table public.appointments enable row level security;
create policy appointments_tenant_isolation on public.appointments
  for all to public
  using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);

alter table public.campaigns enable row level security;
create policy campaigns_tenant_isolation on public.campaigns
  for all to public
  using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);

alter table public.campaign_targets enable row level security;
create policy campaign_targets_tenant_isolation on public.campaign_targets
  for all to public
  using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);

alter table public.collection_actions enable row level security;
create policy collection_actions_tenant_isolation on public.collection_actions
  for all to public
  using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);


-- ═════════════════════════════════════════════════════════════
-- 0002 — RLS Sertleştirme
-- ═════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- educallai (VeliPilot AI) — 0002_rls_hardening.sql
-- Sertleştirme katmanı:
--   * dershaneler + staff için RLS ve tenant izolasyon policy'leri
--   * contacts kalıcı silme koruması (yalnız soft delete: deleted_at)
--   * do_not_call kalıcı bayrak koruması (bir kez true → geri alınamaz)
--   * tenant bağlam fonksiyonlarına erişim kısıtı (yalnız servis tarafı)
--   * owner/admin bypass notları ve policy envanteri (yorum olarak)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1) dershaneler: RLS ────────────────────────────────────────────────────
-- Tenant kök tablosu: id değeri bağlamdaki dershane ile eşleşen kayıt görülür.
alter table public.dershaneler enable row level security;

create policy dershaneler_tenant_isolation on public.dershaneler
  for all to public
  using (id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (id = nullif(current_setting('app.current_dershane', true), '')::uuid);

-- ── 2) staff: RLS (personel yalnız KENDİ dershanesini görür) ───────────────
alter table public.staff enable row level security;

create policy staff_tenant_isolation on public.staff
  for all to public
  using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
  with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);

-- ── 3) contacts: kalıcı silme koruması (soft delete kuralı) ────────────────
-- KVKK denetim izi gereği contact kayıtları DELETE ile silinemez;
-- yalnız deleted_at set edilerek soft delete yapılır.
create or replace function public.block_contact_hard_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'KVKK denetimi: contact kalıcı olarak silinemez (id: %). Soft delete için deleted_at alanını kullanın.',
    old.id
    using errcode = 'restrict_violation';
end;
$$;

comment on function public.block_contact_hard_delete() is 'contacts tablosunda kalıcı DELETE işlemini engeller; tek meşru yol soft delete (deleted_at).';

create trigger contacts_block_hard_delete
  before delete on public.contacts
  for each row
  execute function public.block_contact_hard_delete();

-- ── 4) contacts: do_not_call kalıcı bayrak koruması ────────────────────────
-- KVKK: veli bir kez "arama yapma" dediysede bu bayrak geri alınamaz.
create or replace function public.protect_do_not_call()
returns trigger
language plpgsql
as $$
begin
  if old.do_not_call = true and new.do_not_call = false then
    raise exception
      'KVKK: do_not_call bayrağı kalıcıdır ve geri alınamaz (contact id: %).',
      old.id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

comment on function public.protect_do_not_call() is 'do_not_call=true olan contact kaydında bayrağın false yapılmasını engeller.';

create trigger contacts_protect_do_not_call
  before update on public.contacts
  for each row
  execute function public.protect_do_not_call();

-- ── 5) Tenant bağlam fonksiyonlarına erişim kısıtı ─────────────────────────
-- set_dershane_context herkese açık olsaydı, anon/anonim istemciler kendilerine
-- başka bir dershane bağlamı set edip veri okuyabilirdi. Bu yüzden yalnız
-- servis tarafı (Edge Function'larda service_role) çağırabilir.
-- Not: fonksiyon sahibi (postgres/migration sahibi) her zaman çağırabilir —
-- seed ve psql işlemleri etkilenmez.
revoke execute on function public.set_dershane_context(uuid) from public;
revoke execute on function public.set_dershane_context(uuid) from anon;
revoke execute on function public.set_dershane_context(uuid) from authenticated;
grant  execute on function public.set_dershane_context(uuid) to service_role;

revoke execute on function public.clear_dershane_context() from public;
revoke execute on function public.clear_dershane_context() from anon;
revoke execute on function public.clear_dershane_context() from authenticated;
grant  execute on function public.clear_dershane_context() to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6) OWNER / ADMIN BYPASS NOTLARI (yorum — çalıştırılmaz)
-- ═══════════════════════════════════════════════════════════════════════════
-- * service_role (Supabase): BYPASSRLS yetkisiyle gelir; tüm policy'leri atlar.
--   Edge Function'lar / backend yalnız bu rolle bağlanmalı ve kullanıcıyı
--   doğruladıktan sonra set_dershane_context() çağırmalıdır.
-- * postgres (migration/seed sahibi): BYPASSRLS YOKTUR. RLS policy'leri
--   postgres için de geçerlidir; seed'in başında set_dershane_context()
--   çağrılması ZORUNLUDUR (bkz. supabase/seed_demo.sql).
-- * İsteğe bağlı ekstra sertleştirme (şimdilik uygulanmadı):
--     ALTER TABLE public.dershaneler FORCE ROW LEVEL SECURITY;
--   FORCE, tablo sahibi postgres'i de policy'ye tabi kılar; service_role
--   yine BYPASSRLS nedeniyle etkilenmez. Migration'ların Context'siz çalışma
--   riskine karşı varsayılan olarak kapalı bırakıldı.
-- * anon/authenticated rolleri: bağlam set edemez (bölüm 5 revokes) ve
--   bağlamsız policy eşleşmesi 0 satır döndürür → istemci tarafından veri sızmaz.

-- ═══════════════════════════════════════════════════════════════════════════
-- 7) REPO POLICY ENVANTERİ (özet)
-- ═══════════════════════════════════════════════════════════════════════════
-- 0001_core.sql:
--   contacts_tenant_isolation, leads_tenant_isolation,
--   conversation_signals_tenant_isolation, handoff_logs_tenant_isolation,
--   installment_tracker_tenant_isolation, exam_results_tenant_isolation,
--   appointments_tenant_isolation, campaigns_tenant_isolation,
--   campaign_targets_tenant_isolation, collection_actions_tenant_isolation
--   → hepsi: FOR ALL, USING/WITH CHECK (dershane_id = bağlam)
-- 0002_rls_hardening.sql (bu dosya):
--   dershaneler_tenant_isolation (id = bağlam),
--   staff_tenant_isolation (dershane_id = bağlam)
--   + trigger'lar: contacts_block_hard_delete, contacts_protect_do_not_call

