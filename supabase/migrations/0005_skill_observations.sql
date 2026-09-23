-- ═══════════════════════════════════════════════════════════════════
-- 0005_skill_observations.sql — M3 Beceri Karnesi modülü (2026-09-23)
--   21. yüzyıl becerileri gözlem kayıtları (1-5 hızlı oylama + not).
--   Beceriler: critical_thinking | communication | collaboration |
--              self_management | digital_literacy
--   Idempotent çalışır.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.skill_observations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  skill text not null check (skill in (
    'critical_thinking', 'communication', 'collaboration',
    'self_management', 'digital_literacy'
  )),
  score int not null check (score between 1 and 5),
  note text,
  period text,
  observed_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_skill_obs_contact
  on public.skill_observations (contact_id, created_at desc);

alter table public.skill_observations enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'skill_observations' and policyname = 'skill_observations_tenant_isolation') then
    create policy skill_observations_tenant_isolation on public.skill_observations
      for all to public
      using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;
