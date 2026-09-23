-- ═══════════════════════════════════════════════════════════════════
-- 0007_homework.sql — M9 Ödev Takip Sistemi modülü (2026-09-23)
--   * assignments          : atanan ödevler (ödev oturumları)
--   * homework_submissions : öğrenci bazlı teslim durumu (done | partial | missing)
--   Idempotent çalışır.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  title text not null,
  subject text,
  class_level text,
  due_date timestamptz not null,
  description text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_assignments_due
  on public.assignments (due_date desc);

create table if not exists public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  status text not null check (status in ('done', 'partial', 'missing')),
  marked_by text,
  created_at timestamptz not null default now(),
  unique (assignment_id, contact_id)
);

create index if not exists idx_homework_submissions_assignment
  on public.homework_submissions (assignment_id);

-- ── RLS (0001 deseni) ─────────────────────────────────────────────
alter table public.assignments enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'assignments' and policyname = 'assignments_tenant_isolation') then
    create policy assignments_tenant_isolation on public.assignments
      for all to public
      using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;

alter table public.homework_submissions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'homework_submissions' and policyname = 'homework_submissions_tenant_isolation') then
    create policy homework_submissions_tenant_isolation on public.homework_submissions
      for all to public
      using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;
