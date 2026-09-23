-- ═══════════════════════════════════════════════════════════════════
-- 0004_attendance.sql — M2 Devamsızlık & Yoklama modülü (2026-09-23)
--   * lessons    : dersler (yoklama oturumları)
--   * attendance : öğrenci bazlı ders durumu (present | late | absent)
--   Idempotent çalışır.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  name text not null,
  subject text,
  class_level text,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 60,
  created_at timestamptz not null default now()
);

create index if not exists idx_lessons_scheduled
  on public.lessons (scheduled_at desc);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  status text not null check (status in ('present', 'late', 'absent')),
  marked_by text,
  created_at timestamptz not null default now(),
  unique (lesson_id, contact_id)
);

create index if not exists idx_attendance_lesson
  on public.attendance (lesson_id);

-- ── RLS (0001 deseni) ─────────────────────────────────────────────
alter table public.lessons enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'lessons' and policyname = 'lessons_tenant_isolation') then
    create policy lessons_tenant_isolation on public.lessons
      for all to public
      using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;

alter table public.attendance enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'attendance' and policyname = 'attendance_tenant_isolation') then
    create policy attendance_tenant_isolation on public.attendance
      for all to public
      using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;
