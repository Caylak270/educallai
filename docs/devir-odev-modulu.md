# Devir Notu — Ödev Takibi Modülü (`/odevler`)

Proje ana yazılımcıya (ana yazılımcı) devredilmeden önceki durum. Bu dosya, modülün
ne yaptığını ve **kalıcı mimari kararları** (roller, auth, realtime) bağlarken
nereden başlanacağını özetler. Tarih: 2026-09-23.

## Veri modeli (Supabase)

- `assignments` — ödevler (0007): `title, subject, class_level, due_date, description, created_by`
  - `class_level` serbest metin (örn. "12. Sınıf"); `"Tüm Sınıflar"` değeri herkese görünür demektir.
  - `created_by` serbest metin öğretmen adıdır — `staff` tablosuna FK **değildir**.
- `homework_submissions` — öğrenci işaretleri (0007) + medya (0008):
  - `status`: `done | partial | missing` (öğretmen işareti)
  - `photo_path`: Storage yolu, `student_note`, `submitted_at` (öğrenci teslimi)
  - `checked_at`: öğretmenin son işaretleme anı
  - `unique (assignment_id, contact_id)` — tüm yazmalar **upsert**'tir.
- Storage bucket `odev-fotograflari` (**private**): yollar `${assignmentId}/${contactId}-${ts}`;
  okuma yalnız 60 dk imzalı URL ile.

## API uçları

| Uç | İş |
|---|---|
| `POST /api/homework` | Ödev oluştur (`{title, subject?, classLevel?, dueDate, description?, createdBy?}`) |
| `DELETE /api/homework?id=` | Ödev + işaretler (cascade) + Storage klasörü |
| `POST /api/homework/marks` | Öğretmen işaretleri (upsert; fotoğraf alanlarını korur, `checked_at` yazar) |
| `POST /api/homework/photo` | Öğrenci fotoğrafı (multipart; image/* ≤5 MB) |
| `GET /api/homework/photo?path=` | 60 dk imzalı okuma URL'i |

Tüm route'lar mevcut proje desenindedir: 400/422 doğrulama → demo modda
`{ok, persisted:false, mode:"demo"}` → canlıda `{ok, persisted:true, mode:"live"}`.

## Kod haritası

- `src/lib/server/homework-storage.ts` — Storage erişiminin **tek noktası**.
- `src/lib/server/odev-performans.ts` — öğrenci başına ödev performansı hesabının **tek kaynağı** (M9.2).
- `src/components/pages/odevler/odevler-view.tsx` — öğretmen görünümü + rol anahtarı.
- `src/components/pages/odevler/ogrenci-view.tsx` — öğrenci görünümü (seçim + fotoğraf yükleme).
- `src/lib/mock/homework.ts` — canlı veri yokken demo roster (Supabase boşken bile ekran dolu görünür).
- E2E: `scripts/e2e-test.mjs` bölüm 14 (idempotent — kendi test ödevini siler).

## Ödev performansının diğer modüllere yansıması (M9.2)

Tek hesap: `odevPerformansHaritasi(submissions)` → `{total, done, partial, missing}`.

| Modül | Nerede | Ne gösterir |
|---|---|---|
| Risk Paneli | `getLiveRiskStudents` + `risk-map.ts` | Faktör: eksik ≥%50 → +20; 1+ eksik → +10; hepsi yapıldı → −5. Detayda "Ödev performansı" kartı + listede renkli rozet |
| Beceri Karnesi | `beceri-karnesi/page.tsx` + view | "Ödev Disiplini: X/Y yapıldı (Z eksik)" şeridi (radara dokunulmaz) |
| Veli Bülteni | `bulletin-map.ts` + `renderBulletin` | "📝 Ödev durumu: X/Y yapıldı, Z eksik" satırı |
| Dashboard | risk widget `buildRiskList` kullanır | Otomatik yansır |

Yeni bir modüle performans bağlanacaksa yalnız bu helper import edilmeli.

## Bilinçli basitleştirmeler (kalıcı çözüm devirde)

1. **Kimlik/rol yok.** "Öğretmen ↔ Öğrenci" bir görünüm anahtarıdır
   (`localStorage: educallai-odev-rolu`, `educallai-odev-ogrenci`).
   Gerçek rol sistemi geldiğinde: `odevler-view.tsx`'te `rol` state'i oturum
   rolünden türetilir; `ogrenci-view.tsx`'te öğrenci seçici kaldırılıp
   `ogrenciId` oturumdan gelir. Dershanede öğrenci kimliği = `contacts` satırı;
   öğrenci hesabı ↔ `contact_id` eşlemesi auth tablosuyla kurulmalı.
2. **Yetki kontrolü yok.** API route'ları ve `homework-storage.ts` şu an
   herkesi "müdür" sayar. Rol geldiğinde: yükleme/silme/URL üretimine
   `homework-storage.ts` içinden (tek nokta) kontrol eklenmeli; işaretleme
   yalnız öğretmen/müdür; fotoğraf yükleme yalnız o `contact_id`'nin kendisi.
3. **Öğretmen = serbest metin.** `staff` tablosunda `ogretmen` rolü yok
   (`mudur | danisman | resepsiyon`). Kalıcı çözüm: `StaffRole`'a `ogretmen`
   eklenip `created_by` → `staff_id` FK'ye dönüşür.
4. **Saat opsiyonel** = boşsa `23:59` (gün sonu) kaydedilir; arayüz yerel
   saat 23:59 ise yalnız tarih gösterir. İstenirse ayrı `is_all_day` kolonu
   eklenebilir (şu an gösterim sezgisel).
5. **"Eş zamanlı" takip** = işlem sonrası `router.refresh()` + force-dynamic
   sayfa. Canlı websocket (Supabase Realtime) bağlanmadı.
6. **Fotoğraf gizliliği**: bucket özel + imzalı URL (60 dk) ama URL bilen
   herkes açabilir; kalıcı çözümde imza süresi kısalabilir ve yalnız ilgili
   öğrenci/öğretmene sunulabilir.

## Ders Programı (M10 — `/ders-programi`)

- **M10.1 ile program SABİT haftalık şablondur:** `schedule_slots` tablosu (0010) — `day_of_week (1-7)`, `start_time ("HH:MM")`, `duration_minutes`, `teacher`, `room`, `class_level`. Bir ders bir kez tanımlanır, her hafta otomatik görünür.
- `lessons` tablosu artık yalnız yoklama (M2) ders oturumları içindir; programdan AYRIDIR. 0009'daki `lessons.teacher/room` kolonları kalıcıdır ama şablon `schedule_slots`'ı referans alır.
- `POST /api/schedule` çakışma kontrolü: **aynı gün** + kesişen saat (`slotBaş < yeniSon && yeniBaş < slotSon`) + aynı **öğretmen / derslik / sınıf** → 409.
- Bilinçli basitleştirmeler: slot **düzenleme yok** (sil+yeniden oluştur); şablon → yoklama ders üretimi (haftalık otomatik instance) yok — devir listesinde.
- **Devirde yapılacak (kullanıcı talebi):** program düzenleme **her sınıf için ayrı** olacak; **öğretmen yalnız kendi girdiği sınıfların** slotlarını düzenleyebilecek (rol + sınıf eşlemesi; API+UI'da tek noktadan yetki kontrolü). Veri modeli `class_level`/`teacher` alanlarıyla buna hazır.
- Modül 3 (Öğretmen Bordro) `schedule_slots.teacher` + `duration_minutes` (haftalık × hafta sayısı) üzerinden hesaplanacak.

## Öğretmen Bordro (M11 — `/ogretmen-bordro`)

- Veri: `schedule_slots` (haftalık saat kaynağı) + `teacher_rates` (0011: `teacher`, `hourly_rate`, `unique(dershane_id, teacher)`).
- Hesap tek kaynak: `src/lib/server/bordro.ts` → `bordroHesapla(slots, rates, haftaSayisi)`. Aylık = haftalık saat × hafta sayısı (arayüzden 1-5 seçilir, varsayılan 4).
- API: `POST /api/bordro/oran` (upsert) + `DELETE ?teacher=` (temizlik).
- Devirde: `teacher` → staff FK; gerçek takvim/izin/devamsızlık; "öğretmen yalnız kendi sınıflarını görür/düzenler" yetkisi buraya da uygulanır.

## Test

`node scripts/e2e-test.mjs` (dev server ayakta iken) — ödev bölümü test
verisini kendi siler (idempotent). Son doğrulama: 2× 49/49 + GUI turu 7/7
(ayrıntı oturum raporunda).
