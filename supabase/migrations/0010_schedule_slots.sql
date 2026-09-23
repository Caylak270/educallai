-- ═══════════════════════════════════════════════════════════════════
-- 0010_schedule_slots.sql — M10.1 Sabit Haftalık Ders Programı (2026-09-23)
--   * schedule_slots: TEKRARLANAN haftalık program şablonu.
--     Bir ders bir kez tanımlanır (örn. Pazartesi 15:00 / 60 dk),
--     her hafta otomatik görünür.
--       - day_of_week      : 1=Pazartesi … 7=Pazar
--       - start_time       : "HH:MM" (yerel saat, metin)
--       - duration_minutes : 15-240 dk
--   * lessons tablosu dokunulmadan kalır (yoklama ders oturumları).
--   Idempotent çalışır.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.schedule_slots (
  id uuid primary key default gen_random_uuid(),
  dershane_id uuid not null references public.dershaneler(id) on delete cascade,
  name text not null,
  subject text,
  class_level text,
  teacher text,
  room text,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  start_time text not null,
  duration_minutes int not null default 60 check (duration_minutes between 15 and 240),
  created_at timestamptz not null default now()
);

create index if not exists idx_schedule_slots_dershane
  on public.schedule_slots (dershane_id, day_of_week);

-- ── RLS (0001 deseni) ─────────────────────────────────────────────
alter table public.schedule_slots enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'schedule_slots' and policyname = 'schedule_slots_tenant_isolation') then
    create policy schedule_slots_tenant_isolation on public.schedule_slots
      for all to public
      using (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid)
      with check (dershane_id = nullif(current_setting('app.current_dershane', true), '')::uuid);
  end if;
end $$;
