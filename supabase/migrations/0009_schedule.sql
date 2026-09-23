-- ═══════════════════════════════════════════════════════════════════
-- 0009_schedule.sql — M10 Ders Programı Yönetimi modülü (2026-09-23)
--   * lessons: mevcut ders tablosuna program alanları
--       - teacher : ders öğretmeni (serbest metin; rol sistemiyle staff'a bağlanacak)
--       - room    : derslik (serbest metin)
--   * Yoklama modülü bu tabloyu zaten kullanır; nullable kolonlar
--     mevcut kayıtları etkilemez.
--   Idempotent çalışır.
-- ═══════════════════════════════════════════════════════════════════

alter table public.lessons add column if not exists teacher text;
alter table public.lessons add column if not exists room text;
