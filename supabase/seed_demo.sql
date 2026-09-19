-- ═══════════════════════════════════════════════════════════════════════════
-- educallai (VeliPilot AI) — seed_demo.sql
-- Demo veri: 1 dershane (Limit Dershane — Beylikdüzü), 3 personel,
-- 8 contact + lead (farklı pipeline aşamaları), 3 görüşme sinyali,
-- 5 taksit (farklı tahsilat state'leri), 10 deneme sonucu (trend çıkarır),
-- 3 randevu, 1 kampanya + 5 hedef.
--
-- Notlar:
--   * Tüm UUID'ler sabit literaldir → tekrar çalıştırılabilirliğe uygun;
--     çakışma durumunda satır atlanır (on conflict do nothing).
--   * RLS zorunlu olduğundan insert'ler ÖNCE set_dershane_context() ile
--     tenant bağlamı set edilerek yapılır (postgres rolü BYPASSRLS değildir).
--   * due_date'ler CURRENT_DATE'e göre hesaplanır → state'ler her zaman
--     gerçekçi kalır.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- Tenant bağlamı: demo dershane
select set_dershane_context('11111111-1111-4111-8111-111111111111');

-- ── 1) Dershane ─────────────────────────────────────────────────────────────
insert into public.dershaneler (id, name, branch_name, city, district, plan, phone,
                                capabilities, working_hours, voice_config, iys_registered)
values (
  '11111111-1111-4111-8111-111111111111',
  'Limit Dershane', 'Beylikdüzü Şubesi', 'İstanbul', 'Beylikdüzü', 'profesyonel',
  '+905321110000',
  '{
    "voice_outbound": true,
    "voice_inbound": true,
    "whatsapp": true,
    "instagram_dm": true,
    "tahsilat_arama": true,
    "deneme_analizi": true,
    "kalan_kontor": 1250
  }'::jsonb,
  '{
    "pazartesi_cuma": {"open": "09:00", "close": "20:00"},
    "cumartesi":      {"open": "10:00", "close": "18:00"},
    "pazar":          null
  }'::jsonb,
  '{
    "voice_id": "sonic-tr-female-01",
    "stt": "deepgram-nova-3-tr",
    "llm": "claude-haiku-4.5",
    "hitap": "sıcak ve saygılı"
  }'::jsonb,
  true
) on conflict (id) do nothing;

-- ── 2) Staff (3 kişi) ───────────────────────────────────────────────────────
insert into public.staff (id, dershane_id, full_name, role, phone, email, is_active) values
  ('22222222-2222-4222-8222-000000000001',
   '11111111-1111-4111-8111-111111111111',
   'Mehmet Yıldız', 'mudur', '+905321110011', 'mehmet@limitdershane.com', true),
  ('22222222-2222-4222-8222-000000000002',
   '11111111-1111-4111-8111-111111111111',
   'Selin Arslan', 'danisman', '+905321110012', 'selin@limitdershane.com', true),
  ('22222222-2222-4222-8222-000000000003',
   '11111111-1111-4111-8111-111111111111',
   'Emre Güneş', 'resepsiyon', '+905321110013', 'emre@limitdershane.com', true)
on conflict (id) do nothing;

-- ── 3) Contacts (8 veli — kanaldan bağımsız tek profil) ────────────────────
insert into public.contacts (id, dershane_id, phone, whatsapp_id, instagram_id,
                             parent_name, parent_gender, student_name, student_grade,
                             exam_type, contact_summary, source,
                             iys_sms_consent, iys_call_consent, kvkk_consent_at,
                             open_consent_source, do_not_call, deleted_at) values
  ('33333333-3333-4333-8333-000000000001',
   '11111111-1111-4111-8111-111111111111',
   '+905321112001', '+905321112001', null,
   'Zeynep Kaya', 'kadın', 'Mert Kaya', '12. Sınıf', 'TYT',
   'TYT netleri son 3 denemede düşüşte; veli taksit esnekliği istiyor, kayda sıcak.',
   'whatsapp', true, true, now() - interval '21 days', 'whatsapp_bot', false, null),
  ('33333333-3333-4333-8333-000000000002',
   '11111111-1111-4111-8111-111111111111',
   '+905321112002', '+905321112002', null,
   'Ahmet Yılmaz', 'erkek', 'Elif Yılmaz', '8. Sınıf', 'LGS',
   'LGS hedefi <%1 likili okullar; denemelerde yükselişte, tanışma randevusu alındı.',
   'website', true, true, now() - interval '30 days', 'web_form', false, null),
  ('33333333-3333-4333-8333-000000000003',
   '11111111-1111-4111-8111-111111111111',
   '+905321112003', '+905321112003', null,
   'Fatma Demir', 'kadın', 'Burak Demir', 'Mezun', 'AYT',
   'Mezun öğrenci, tam kayıt kapandı; 1. taksit ödendi.',
   'referans', true, true, now() - interval '45 days', 'ofis_ziyareti', false, null),
  ('33333333-3333-4333-8333-000000000004',
   '11111111-1111-4111-8111-111111111111',
   '+905321112004', '+905321112004', null,
   'Mustafa Şahin', 'erkek', 'Zehra Şahin', '11. Sınıf', 'TYT',
   'Fiyat karşılaştırması yapıyor; rakip dershane bahsetti, bilgilendirme mesajı gönderildi.',
   'instagram', true, true, now() - interval '14 days', 'instagram_dm', false, null),
  ('33333333-3333-4333-8333-000000000005',
   '11111111-1111-4111-8111-111111111111',
   '+905321112005', '+905321112005', null,
   'Ayşe Çelik', 'kadın', 'Emre Çelik', '12. Sınıf', 'AYT',
   'Yeni lead; web formundan ücret bilgisi istedi, henüz aranmadı.',
   'website', true, false, now() - interval '2 days', 'web_form', false, null),
  ('33333333-3333-4333-8333-000000000006',
   '11111111-1111-4111-8111-111111111111',
   '+905321112006', '+905321112006', null,
   'Hasan Aydın', 'erkek', 'Yusuf Aydın', '8. Sınıf', 'LGS',
   'Dershaneyi gezdi; burs sınavı sorusu ile danışmana devredildi.',
   'telefon', true, true, now() - interval '10 days', 'inbound_arama', false, null),
  ('33333333-3333-4333-8333-000000000007',
   '11111111-1111-4111-8111-111111111111',
   '+905321112007', '+905321112007', null,
   'Elif Koç', 'kadın', 'Nisa Koç', '9. Sınıf', 'TYT',
   'Bütçesi uygun değil; arama yapılmasını rica etti (kalıcı).',
   'instagram', false, false, now() - interval '60 days', 'instagram_dm', true, null),
  ('33333333-3333-4333-8333-000000000008',
   '11111111-1111-4111-8111-111111111111',
   null, null, 'murat.ozdemir',
   'Murat Özdemir', 'erkek', 'Kerem Özdemir', 'Mezun', 'TYT',
   'Yalnızca Instagram üzerinden iletişim; mezun programına ilgi duyuyor.',
   'instagram', true, false, now() - interval '5 days', 'instagram_dm', false, null)
on conflict (id) do nothing;

-- ── 4) Leads (8 lead — 7 aşamanın tamamı temsil edilir) ────────────────────
insert into public.leads (id, contact_id, dershane_id, score, temperature,
                          enrollment_readiness, stage, missing_must_fields,
                          next_follow_up, follow_up_reason,
                          total_calls, total_messages, last_contact_at) values
  ('44444444-4444-4444-8444-000000000001',
   '33333333-3333-4333-8333-000000000001',
   '11111111-1111-4111-8111-111111111111',
   87, 'hot', 72.50, 'interested', ARRAY['kimlik_no', 'adres']::text[],
   now() + interval '1 day', 'Taksit planı teklifi sunulacak.',
   3, 12, now() - interval '5 hours'),
  ('44444444-4444-4444-8444-000000000002',
   '33333333-3333-4333-8333-000000000002',
   '11111111-1111-4111-8111-111111111111',
   78, 'hot', 65.00, 'appointment_set', ARRAY['kimlik_no']::text[],
   now() + interval '2 days', 'Tanışma randevusu öncesi hatırlatma.',
   2, 8, now() - interval '1 day'),
  ('44444444-4444-4444-8444-000000000003',
   '33333333-3333-4333-8333-000000000003',
   '11111111-1111-4111-8111-111111111111',
   95, 'hot', 100.00, 'enrolled', ARRAY[]::text[],
   null, null,
   5, 15, now() - interval '7 days'),
  ('44444444-4444-4444-8444-000000000004',
   '33333333-3333-4333-8333-000000000004',
   '11111111-1111-4111-8111-111111111111',
   55, 'warm', 40.00, 'contacted', ARRAY['kimlik_no', 'adres', 'veli_meslek']::text[],
   now() + interval '2 days', 'Rakip fiyat listesi karşılaştırması paylaşılacak.',
   1, 5, now() - interval '3 days'),
  ('44444444-4444-4444-8444-000000000005',
   '33333333-3333-4333-8333-000000000005',
   '11111111-1111-4111-8111-111111111111',
   30, 'cold', 15.00, 'new', ARRAY['ogrenci_okul', 'kimlik_no', 'adres']::text[],
   now() + interval '6 hours', 'İlk tanışma araması yapılacak.',
   0, 1, now() - interval '2 days'),
  ('44444444-4444-4444-8444-000000000006',
   '33333333-3333-4333-8333-000000000006',
   '11111111-1111-4111-8111-111111111111',
   82, 'hot', 80.00, 'visited', ARRAY['kimlik_no']::text[],
   now() + interval '3 days', 'Ziyaret sonrası burs cevabı iletilecek.',
   4, 9, now() - interval '3 hours'),
  ('44444444-4444-4444-8444-000000000007',
   '33333333-3333-4333-8333-000000000007',
   '11111111-1111-4111-8111-111111111111',
   10, 'lost', 5.00, 'lost', ARRAY[]::text[],
   null, null,
   2, 4, now() - interval '20 days'),
  ('44444444-4444-4444-8444-000000000008',
   '33333333-3333-4333-8333-000000000008',
   '11111111-1111-4111-8111-111111111111',
   68, 'warm', 55.00, 'interested', ARRAY['adres', 'onceki_okul']::text[],
   now() + interval '1 day', 'Mezun programı detayları Instagram üzerinden iletilecek.',
   0, 7, now() - interval '1 day')
on conflict (id) do nothing;

-- ── 5) Görüşme sinyalleri (3 adet) ──────────────────────────────────────────
insert into public.conversation_signals (id, contact_id, lead_id, dershane_id,
                                         channel, direction, sentiment, intent,
                                         lead_temperature, enrollment_readiness,
                                         price_sensitivity, student_grade, exam_type,
                                         sibling_mentioned, competitor_mentioned,
                                         capability_limit_reached, recommend_handoff,
                                         handoff_reason, payment_objection,
                                         payment_promise, risk_signal, do_not_call,
                                         transcript, audio_url, duration_seconds, created_at) values
  ('55555555-5555-4555-8555-000000000001',
   '33333333-3333-4333-8333-000000000001',
   '44444444-4444-4444-8444-000000000001',
   '11111111-1111-4111-8111-111111111111',
   'voice', 'outbound', 'positive', 'deneme_sonucu_bilgilendirme',
   'hot', 72.50, 'medium', '12. Sınıf', 'TYT',
   false, 'Özdebir Dershanesi', false, false,
   null,
   'Taksit tutarı biraz yüksek geldi, esnek plan sordu.',
   null, null, false,
   'AI: Merhaba Zeynep Hanım, ben Limit Dershane asistanı... Veli: Mert''in son denemedeki netleri düştü mü? AI: Evet, 8 net düşüş var, etüt planladık. Veli: Taksitleri biraz esnetebilir misiniz?',
   'https://cdn.educallai.demo/audio/signal-0001.mp3', 184, now() - interval '5 hours'),
  ('55555555-5555-4555-8555-000000000002',
   '33333333-3333-4333-8333-000000000003',
   '44444444-4444-4444-8444-000000000003',
   '11111111-1111-4111-8111-111111111111',
   'whatsapp', 'inbound', 'positive', 'kayit_onayi',
   'hot', 100.00, 'low', 'Mezun', 'AYT',
   true, null, false, false,
   null, null, now() + interval '15 days', null, false,
   'Veli: Merhaba, sözleşmeyi bugün imzaladık. İlk taksiti de yatırdım. Kardeşim için de bilgi alabilir miyim?',
   null, null, null, now() - interval '1 day'),
  ('55555555-5555-4555-8555-000000000003',
   '33333333-3333-4333-8333-000000000006',
   '44444444-4444-4444-8444-000000000006',
   '11111111-1111-4111-8111-111111111111',
   'voice', 'inbound', 'neutral', 'randevu_talebi',
   'hot', 80.00, 'high', '8. Sınıf', 'LGS',
   false, null, false, true,
   'Veli ücret hesabı ve burs detayı istedi — danışman devri önerildi.',
   null, null, null, false,
   'Veli: Burs sınavı sonucuma göre ücret ne olur? AI: Kesin ücret için danışmanımız netleştirecek...',
   'https://cdn.educallai.demo/audio/signal-0003.mp3', 96, now() - interval '3 hours')
on conflict (id) do nothing;

-- ── 6) Taksitler (5 adet — 5 farklı state) ──────────────────────────────────
insert into public.installment_tracker (id, contact_id, dershane_id, student_name,
                                        total_amount, installment_count, installment_amount,
                                        installment_number, due_date, state,
                                        paid_at, paid_amount,
                                        whatsapp_sent_count, sms_sent_count, ai_call_count,
                                        last_action_at) values
  ('66666666-6666-4666-8666-000000000001',
   '33333333-3333-4333-8333-000000000001',
   '11111111-1111-4111-8111-111111111111',
   'Mert Kaya', 24000.00, 8, 3000.00, 3,
   current_date + 12, 'UPCOMING', null, null, 0, 0, 0, null),
  ('66666666-6666-4666-8666-000000000002',
   '33333333-3333-4333-8333-000000000002',
   '11111111-1111-4111-8111-111111111111',
   'Elif Yılmaz', 18000.00, 6, 3000.00, 4,
   current_date, 'DUE_TODAY', null, null, 1, 0, 0, now() - interval '2 hours'),
  ('66666666-6666-4666-8666-000000000003',
   '33333333-3333-4333-8333-000000000004',
   '11111111-1111-4111-8111-111111111111',
   'Zehra Şahin', 21000.00, 7, 3000.00, 2,
   current_date - 7, 'OVERDUE_7D', null, null, 1, 1, 1, now() - interval '2 days'),
  ('66666666-6666-4666-8666-000000000004',
   '33333333-3333-4333-8333-000000000006',
   '11111111-1111-4111-8111-111111111111',
   'Yusuf Aydın', 16000.00, 4, 4000.00, 3,
   current_date - 21, 'OVERDUE_21D', null, null, 2, 2, 2, now() - interval '1 day'),
  ('66666666-6666-4666-8666-000000000005',
   '33333333-3333-4333-8333-000000000003',
   '11111111-1111-4111-8111-111111111111',
   'Burak Demir', 24000.00, 8, 3000.00, 1,
   current_date - 30, 'PAID', now() - interval '27 days', 3000.00, 1, 0, 0,
   now() - interval '27 days')
on conflict (id) do nothing;

-- ── 7) Deneme sonuçları (10 adet — trend çıkaracak şekilde) ────────────────
-- Mert Kaya: 5 deneme, DECLINING senaryosu (62.40 → 47.30)
insert into public.exam_results (id, contact_id, dershane_id, student_name, exam_date,
                                 exam_name, total_net, math_net, science_net, turkish_net,
                                 social_net, percentile, ranking, category, trend,
                                 ai_analysis_summary) values
  ('77777777-7777-4777-8777-000000000001',
   '33333333-3333-4333-8333-000000000001',
   '11111111-1111-4111-8111-111111111111',
   'Mert Kaya', current_date - 57, 'Özdebir TYT Deneme-1',
   62.40, 16.20, 14.10, 18.50, 13.60, 71.50, 1240, 'PLATEAU', null,
   'İlk ölçüm; matematik temel sorunları belirlendi, baz plan oluşturuldu.'),
  ('77777777-7777-4777-8777-000000000002',
   '33333333-3333-4333-8333-000000000001',
   '11111111-1111-4111-8111-111111111111',
   'Mert Kaya', current_date - 43, 'Özdebir TYT Deneme-2',
   63.10, 16.40, 14.20, 19.00, 13.50, 72.80, 1180, 'PLATEAU', 'RISING',
   'Küçük iyileşme; Türkçe paragraf pratiği sürdürülmeli.'),
  ('77777777-7777-4777-8777-000000000003',
   '33333333-3333-4333-8333-000000000001',
   '11111111-1111-4111-8111-111111111111',
   'Mert Kaya', current_date - 29, 'Özdebir TYT Deneme-3',
   60.20, 15.10, 13.90, 18.20, 13.00, 66.40, 1450, 'DECLINING', 'DECLINING',
   'Matematikte 1.3 net gerileme; konu tekrarı planlandı.'),
  ('77777777-7777-4777-8777-000000000004',
   '33333333-3333-4333-8333-000000000001',
   '11111111-1111-4111-8111-111111111111',
   'Mert Kaya', current_date - 15, 'Özdebir TYT Deneme-4',
   54.80, 13.70, 12.80, 16.80, 11.50, 55.20, 1890, 'DECLINING', 'DECLINING',
   'İki deneme üst üste 5+ net düşüş; veli bilgilendirme araması yapıldı.'),
  ('77777777-7777-4777-8777-000000000005',
   '33333333-3333-4333-8333-000000000001',
   '11111111-1111-4111-8111-111111111111',
   'Mert Kaya', current_date - 1, 'Özdebir TYT Deneme-5',
   47.30, 12.10, 11.40, 14.20, 9.60, 43.90, 2430, 'DECLINING', 'DECLINING',
   'Kritik düşüş devam ediyor (toplam -15.1 net); acil etüt + veli görüşmesi önerildi.');

-- Elif Yılmaz: 3 deneme, RISING senaryosu (58.00 → 71.00, LGS)
insert into public.exam_results (id, contact_id, dershane_id, student_name, exam_date,
                                 exam_name, total_net, math_net, science_net, turkish_net,
                                 social_net, percentile, ranking, category, trend,
                                 ai_analysis_summary) values
  ('77777777-7777-4777-8777-000000000006',
   '33333333-3333-4333-8333-000000000002',
   '11111111-1111-4111-8111-111111111111',
   'Elif Yılmaz', current_date - 30, 'LGS Deneme-1',
   58.00, 15.00, 13.00, 17.00, 13.00, 68.00, 950, 'FIRST_TIMER', null,
   'İlk ölçüm; inkılap ve fen alanlarında açıklar belirlendi.'),
  ('77777777-7777-4777-8777-000000000007',
   '33333333-3333-4333-8333-000000000002',
   '11111111-1111-4111-8111-111111111111',
   'Elif Yılmaz', current_date - 16, 'LGS Deneme-2',
   63.50, 16.50, 14.50, 18.00, 14.50, 74.20, 780, 'RISING', 'RISING',
   'Matematikte güçlü artış; fen deney soruları çalışılmalı.'),
  ('77777777-7777-4777-8777-000000000008',
   '33333333-3333-4333-8333-000000000002',
   '11111111-1111-4111-8111-111111111111',
   'Elif Yılmaz', current_date - 2, 'LGS Deneme-3',
   71.00, 18.00, 17.00, 20.00, 16.00, 85.60, 410, 'RISING', 'RISING',
   'Üst yüzde 85; hedef okul grubu bir üst segmente yükseltildi.');

-- Burak Demir: 1 deneme, TOP_PERFORMER
insert into public.exam_results (id, contact_id, dershane_id, student_name, exam_date,
                                 exam_name, total_net, math_net, science_net, turkish_net,
                                 social_net, percentile, ranking, category, trend,
                                 ai_analysis_summary) values
  ('77777777-7777-4777-8777-000000000009',
   '33333333-3333-4333-8333-000000000003',
   '11111111-1111-4111-8111-111111111111',
   'Burak Demir', current_date - 5, 'AYT Sayısal Deneme-1',
   88.60, 22.80, 22.00, 24.00, 19.80, 98.40, 85, 'TOP_PERFORMER', null,
   'Üst yüzde 2; olimpiyat seviyesi soru bankasına geçildi.');

-- Zehra Şahin: 1 deneme, FIRST_TIMER
insert into public.exam_results (id, contact_id, dershane_id, student_name, exam_date,
                                 exam_name, total_net, math_net, science_net, turkish_net,
                                 social_net, percentile, ranking, category, trend,
                                 ai_analysis_summary) values
  ('77777777-7777-4777-8777-000000000010',
   '33333333-3333-4333-8333-000000000004',
   '11111111-1111-4111-8111-111111111111',
   'Zehra Şahin', current_date - 8, 'TYT Deneme-7',
   51.20, 12.80, 12.00, 15.40, 11.00, 48.30, 1820, 'FIRST_TIMER', null,
   'İlk deneme; süre yönetimi eğitimi planlandı.');

-- ── 8) Randevular (3 adet) ──────────────────────────────────────────────────
insert into public.appointments (id, contact_id, lead_id, dershane_id, scheduled_at,
                                 duration_minutes, status, created_by,
                                 calendar_synced, staff_notified, parent_reminder_sent,
                                 notes) values
  ('88888888-8888-4888-8888-000000000001',
   '33333333-3333-4333-8333-000000000002',
   '44444444-4444-4444-8444-000000000002',
   '11111111-1111-4111-8111-111111111111',
   now() + interval '2 days', 45, 'confirmed', 'ai_voice',
   true, true, true,
   'Tanışma görüşmesi + LGS seviye testi. Danışman: Selin Arslan.'),
  ('88888888-8888-4888-8888-000000000002',
   '33333333-3333-4333-8333-000000000006',
   '44444444-4444-4444-8444-000000000006',
   '11111111-1111-4111-8111-111111111111',
   now() + interval '4 days', 30, 'scheduled', 'ai_whatsapp',
   false, false, false,
   'Burs sınavı sonucu görüşmesi; ücret hesabı hazırlanacak.'),
  ('88888888-8888-4888-8888-000000000003',
   '33333333-3333-4333-8333-000000000003',
   '44444444-4444-4444-8444-000000000003',
   '11111111-1111-4111-8111-111111111111',
   now() - interval '7 days', 60, 'completed', 'manual',
   true, true, true,
   'Kayıt sözleşmesi imzalandı; taksit planı sistem işlendi.')
on conflict (id) do nothing;

-- ── 9) Kampanya (1) + hedefleri (5) ─────────────────────────────────────────
insert into public.campaigns (id, dershane_id, name, channel, status,
                              total_targets, contacted, answered, appointments,
                              voice_id, script, working_hours_snapshot,
                              scheduled_at, started_at, completed_at)
values (
  '99999999-9999-4999-8999-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'Deneme Sonrası Veli Bilgilendirme (Sesli)',
  'voice', 'running',
  5, 4, 2, 1,
  'sonic-tr-female-01',
  'Merhaba {veli_ad}, ben Limit Dershane eğitim asistanı. {ogrenci_ad} beyin son deneme sonucunu paylaşıp gelişim planını anlatmak istiyorum. Uygun bir zaman var mı?',
  '{
    "pazartesi_cuma": {"open": "09:00", "close": "20:00"},
    "cumartesi":      {"open": "10:00", "close": "18:00"},
    "pazar":          null
  }'::jsonb,
  now() - interval '2 days', now() - interval '1 day', null
) on conflict (id) do nothing;

insert into public.campaign_targets (id, campaign_id, contact_id, dershane_id,
                                     priority_score, status, attempts, next_retry_at,
                                     last_outcome) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
   '99999999-9999-4999-8999-000000000001',
   '33333333-3333-4333-8333-000000000001',
   '11111111-1111-4111-8111-111111111111',
   92.00, 'done', 1, null, 'randevu_alindi'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000002',
   '99999999-9999-4999-8999-000000000001',
   '33333333-3333-4333-8333-000000000002',
   '11111111-1111-4111-8111-111111111111',
   88.00, 'answered', 1, null, 'arandi_bilgi_verildi'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000003',
   '99999999-9999-4999-8999-000000000001',
   '33333333-3333-4333-8333-000000000003',
   '11111111-1111-4111-8111-111111111111',
   45.00, 'no_answer', 2, now() + interval '3 hours', 'cevapsiz'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000004',
   '99999999-9999-4999-8999-000000000001',
   '33333333-3333-4333-8333-000000000004',
   '11111111-1111-4111-8111-111111111111',
   61.00, 'busy', 1, now() + interval '1 hour', 'mesgul'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000005',
   '99999999-9999-4999-8999-000000000001',
   '33333333-3333-4333-8333-000000000005',
   '11111111-1111-4111-8111-111111111111',
   38.00, 'queued', 0, null, null)
on conflict (id) do nothing;

commit;

-- Bağlam oturumda açık kalır (session-scoped set_config): aynı psql oturumunda
-- demo sorguları doğrudan çalışır. Kapatmak için:
--   select clear_dershane_context();
