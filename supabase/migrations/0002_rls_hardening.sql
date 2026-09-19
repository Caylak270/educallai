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
