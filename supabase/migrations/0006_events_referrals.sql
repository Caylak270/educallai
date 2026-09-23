-- ═══════════════════════════════════════════════════════════════════
-- 0006_events_referrals.sql — M6 Etkinlik Yönetimi + M8 Referral
--   * events        : veli semineri, deneme günü, workshop
--   * event_invites : etkinlik davetlileri + katılım durumu
--   * referrals     : arkadaşını getir takibi
--   Idempotent çalışır.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  name text not null,
  event_type text not null default 'seminer'
    check (event_type in ('seminer', 'deneme_gunu', 'workshop', 'diger')),
  event_date timestamptz not null,
  capacity int,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_date on public.events (event_date);

create table if not exists public.event_invites (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  status text not null default 'davetli'
    check (status in ('davetli', 'katildi', 'iptal')),
  created_at timestamptz not null default now(),
  unique (event_id, contact_id)
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  referrer_contact_id uuid not null references public.contacts(id) on delete cascade,
  new_lead_name text not null,
  new_lead_phone text,
  status text not null default 'yeni'
    check (status in ('yeni', 'iletisim', 'kayit', 'iptal')),
  reward_note text,
  created_at timestamptz not null default now()
);

-- ── RLS (0001 deseni) ─────────────────────────────────────────────
alter table public.events enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'events' and policyname = 'events_tenant_isolation') then
    create policy events_tenant_isolation on public.events
      for all to public
      using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;

alter table public.event_invites enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'event_invites' and policyname = 'event_invites_tenant_isolation') then
    create policy event_invites_tenant_isolation on public.event_invites
      for all to public
      using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;

alter table public.referrals enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'referrals' and policyname = 'referrals_tenant_isolation') then
    create policy referrals_tenant_isolation on public.referrals
      for all to public
      using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;
