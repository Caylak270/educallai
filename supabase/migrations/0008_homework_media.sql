-- ═══════════════════════════════════════════════════════════════════
-- 0008_homework_media.sql — M9.1 Ödev Takibi geliştirmesi (2026-09-23)
--   * homework_submissions: öğrenci fotoğraf teslimi + öğretmen kontrolü
--       - photo_path   : Storage 'odev-fotograflari' bucket yolu (özel,
--                        erişim yalnız 60 dk imzalı URL ile)
--       - student_note : öğrencinin kısa teslim notu
--       - submitted_at : öğrencinin fotoğrafı yüklediği an
--       - checked_at   : öğretmenin son işaretleme (kontrol) anı
--   * storage bucket 'odev-fotograflari' (private)
--   Idempotent çalışır.
--   Not: Yetki/rol kontrolleri bilinçli olarak API katmanına bırakıldı
--   (bkz. docs/devir-odev-modulu.md — ana yazılımcıya kalanlar).
-- ═══════════════════════════════════════════════════════════════════

alter table public.homework_submissions add column if not exists photo_path text;
alter table public.homework_submissions add column if not exists student_note text;
alter table public.homework_submissions add column if not exists submitted_at timestamptz;
alter table public.homework_submissions add column if not exists checked_at timestamptz;

insert into storage.buckets (id, name, public)
values ('odev-fotograflari', 'odev-fotograflari', false)
on conflict (id) do nothing;
