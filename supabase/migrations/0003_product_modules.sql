-- ═══════════════════════════════════════════════════════════════════
-- 0003_product_modules.sql — Ürün modülleri (2026-09-23)
--   * counselor_notes : M1 Öğrenci Risk Paneli — rehberlik görüşme notları
--   * exam_schedule   : M4 Sınav Takvimi — merkezî + kurum sınavları
--   Kimlikler 0001_core.sql desenleriyle uyumlu; çalıştırma idempotent.
-- ═══════════════════════════════════════════════════════════════════

-- ── M1: Rehberlik görüşme notları ─────────────────────────────────
create table if not exists public.counselor_notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  author text,
  note text not null,
  follow_up_at timestamptz,
  outcome text,
  created_at timestamptz not null default now()
);

create index if not exists idx_counselor_notes_contact
  on public.counselor_notes (contact_id, created_at desc);

alter table public.counselor_notes enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'counselor_notes' and policyname = 'counselor_notes_tenant_isolation') then
    create policy counselor_notes_tenant_isolation on public.counselor_notes
      for all to public
      using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;

-- ── M4: Sınav takvimi ─────────────────────────────────────────────
-- dershane_id NULL → merkezî sınav (tüm kiracılar görebilir)
create table if not exists public.exam_schedule (
  id uuid primary key default gen_random_uuid(),
  dershane_id uuid references public.dershaneler(id) on delete cascade,
  name text not null,
  exam_type text not null check (exam_type in ('TYT', 'AYT', 'LGS', 'OKUL', 'DENEME')),
  exam_date date not null,
  is_estimated boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_exam_schedule_date
  on public.exam_schedule (exam_date);

alter table public.exam_schedule enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'exam_schedule' and policyname = 'exam_schedule_tenant_isolation') then
    create policy exam_schedule_tenant_isolation on public.exam_schedule
      for all to public
      using (dershane_id is null or dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;
