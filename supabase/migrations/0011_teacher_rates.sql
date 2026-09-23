-- ═══════════════════════════════════════════════════════════════════
-- 0011_teacher_rates.sql — M11 Öğretmen Bordro modülü (2026-09-23)
--   * teacher_rates: öğretmen bazlı saat ücreti.
--     teacher serbest metindir; schedule_slots.teacher ile eşleşir.
--     (Rol sistemi gelince teacher → staff FK'sine dönüşür.)
--   Idempotent çalışır.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.teacher_rates (
  id uuid primary key default gen_random_uuid(),
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  teacher text not null,
  hourly_rate numeric not null default 0 check (hourly_rate >= 0),
  updated_at timestamptz not null default now(),
  unique (dershane_id, teacher)
);

-- ── RLS (0001 deseni) ─────────────────────────────────────────────
alter table public.teacher_rates enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'teacher_rates' and policyname = 'teacher_rates_tenant_isolation') then
    create policy teacher_rates_tenant_isolation on public.teacher_rates
      for all to public
      using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;
