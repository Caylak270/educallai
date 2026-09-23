# Öğrenci Ekosistemi — Mimari Analiz ve Uygulama Planı

**Tarih:** 2026-09-23
**Kapsam:** Bir öğrenciye ait her kaydın (ödev, yoklama, deneme, etkinlik, tahsilat, görüşme…) tüm modüllere değişken olarak yansıması; gelişimin sistem genelinde takibi.
**Bölünüm:** Frontend bizim; auth/güvenlik/denetleme/derin backend main yazılımcı ana yazılımcı'ye devredilecek (spec aşağıda, Bölüm 7).
**Bağlam:** Repo'da paralel iki oturum çalışıyor — bu rapor yalnızca analiz + plan içerir, kaynak dosya değiştirilmedi.

---

## 1. Durum tespiti — bugün sistemde ne var

### 1.1 Temel güçlü yan: öğrenci kimliği zaten tek
Öğrenci = `contacts` satırı; **13 tablo `contact_id` ile bağlı** (`src/lib/types/db.ts`):
`leads, conversation_signals, installment_tracker, exam_results, appointments, campaign_targets, counselor_notes, attendance, skill_observations, event_invites, referrals (referrer_contact_id), homework_submissions` + `contacts` kendisi.
→ Ekosistem için **yeni şema gerekmıyor**; veri modeli hazır.

### 1.2 Mevcut 17 modül (`src/components/shell/sidebar-nav.tsx`)
Genel Bakış, Kampanyalar, Veliler (CRM), Görüşmeler (+detay), Tahsilat, Deneme Analizi, Randevular, Raporlar, Risk Paneli, Yoklama, Ödev Takibi, Beceri Karnesi, Veli Bülteni, Etkinlikler, Arkadaşını Getir, Sınav Takvimi, Ayarlar.

### 1.3 Veri akış deseni (dokunmuyoruz, üzerine inşa ediyoruz)
- Her sayfa **server component** (`force-dynamic`) → `src/lib/server/queries.ts` içindeki `getLive*Data()` canlı Supabase'den okur → bağlantı yoksa **mock fallback** (`src/lib/mock/*`).
- Sunucu mapper'lar: `src/lib/server/*-map.ts` (dashboard, leads, tahsilat, exams, risk, bulletin…).
- Yazma: API route'ları demo modda `persisted:false`, canlıda `persisted:true` döner; client `router.refresh()` ile tazeler. Global client state **yok** (zustand/context sıfır).

### 1.4 İlk nokta-atışı zaten var: M9.2
Ödev performansı **tek hesap noktasından** (`src/lib/server/odev-performans.ts` → `odevPerformansHaritasi`) 4 yere yansıyor:
1. **Risk Paneli** — eksik ≥%50 → +20, eksik var → +10, hepsi yapıldı → −5 (`risk-map.ts:116-129`)
2. **Beceri Karnesi** — "Ödev Disiplini" şeridi (`beceri-karnesi/page.tsx:33-37`)
3. **Veli Bülteni** — "📝 Ödev durumu: 3/8 yapıldı, 2 eksik" (`bulletin-map.ts:38-40`)
4. **Dashboard** — risk widget üzerinden dolaylı.

**Kritik gözlem:** Bu deseni (tek kaynak + çok tüketici) ödev için kurduk; **genel kurallı değil**. Diğer sinyaller ya nokta-atışı ya hiç yansımıyor.

### 1.5 Yansıma matrisi — bugünkü durum

| Sinyal (tablo) | Bugün tüketen modüller | **Eksik yansıma** |
|---|---|---|
| Ödev (`homework_submissions`) | Risk, Karne, Bülten | Deneme Analizi satırı, Veliler kanban rozeti, beslenme akışı |
| Deneme (`exam_results`) | Deneme Analizi, Risk, Bülten | **Karne şeridi yok**, kanban, akış |
| Yoklama (`attendance`) | Yoklama, Bülten | **Risk skoru yok**, Karne yok, akış yok |
| Beceri (`skill_observations`) | Karne, Bülten | Risk, akış |
| **Etkinlik (`event_invites`)** | yalnız Etkinlikler sayfası | **Hiçbir yere yansımıyor** (bülten, karne, risk, akış) |
| **Tahsilat (`installment_tracker`)** | Tahsilat, Dashboard kartı, bildirim | **Risk skoru yok**, kanban rozeti, bülten, karne |
| Görüşme (`conversation_signals`) | Görüşmeler, Dashboard, Raporlar, Risk, CRM | Karne, Bülten |
| Randevu (`appointments`) | Randevular, Dashboard | Öğrenci 360 görünümü |
| Danışman notu (`counselor_notes`) | Görüşme detay, Risk | 360 |

Ayrıca: **Genel öğrenci faaliyet logu / "öğrenci 360" ekranı yok.** Dashboard canlı akışı yalnız `conversation_signals` kaynaklı.

---

## 2. Problem tanımı

"Öğrenci ödevini yapmıyorsa beceri karnesinde görünsün" örneği bugün ödev için çözülü; ama sistem ilkesel değil: her yeni sinyal için her tüketici modüle **elle** kod yazılıyor. İstenen: **herhangi bir kayıt → tüm ekosisteme otomatik yansıma** ve her öğrencinin gelişiminin her modülden izlenebilmesi.

## 3. Mimari öneri — "Öğrenci Durum Katmanı" (yıldız deseni)

Modüller birbirini **okumayı bıraksın**; hepsi tek bir türetme katmanını okusun:

```
                    [ 13 contact_id'li tablo ]      ← TEK GERÇEK KAYNAK (mevcut, değişmez)
                              │
              ┌───────────────▼────────────────┐
              │  src/lib/server/               │
              │  ogrenci-durumu.ts  (YENİ)     │  ← TEK HESAP KATMANI (saf fonksiyonlar)
              │  • ogrenciDurumHaritasi()      │    contact_id → { odev, yoklama, deneme,
              │  • ogrenciFaaliyetAkisi()      │      beceri, tahsilat, etkinlik, gorusme,
              │  • ogrenciRiskSkoru()          │      randevu, riskSkoru, rozetler[] }
              └───────────────┬────────────────┘
                              │  (server component'ler prop ile akıtır)
   ┌──────────┬───────────┬───┴────────┬─────────────┬─────────────┐
   ▼          ▼           ▼            ▼             ▼             ▼
 Risk      Karne      Bülten      Dashboard     Deneme        Veliler
 Paneli   (Gelişim)              + canlı akış   Analizi       CRM / …
                                    + Öğrenci 360 çekmecesi (her modülde aynı bileşen)
```

### Tasarım ilkeleri
1. **Türet, kopyalama.** Kayıtlar kendi tablosunda yaşar; durum okuma anında hesaplanır. (M9.2'nin `odev-performans.ts` deseni genelleştiriliyor.) Demo/canlı ayrımı yapmayan saf fonksiyonlar → hem mock hem Supabase'de aynı davranış, test edilebilir.
2. **Tek dil.** Her modülde aynı terimler/sınıflar: ödev `done|partial|missing`, yoklama `present|late|absent`, katılım `davetli|katildi|iptal`. Rozet metinleri tek yerden (`ogrenci-durumu.ts` türevleri).
3. **Risk skoru tek kaynağa taşınır.** Bugün `risk-map.ts`'in kendi içindeki skorlama, `ogrenciRiskSkoru()` olarak durum katmanına alınır; Risk Paneli, Dashboard ve Karne aynı skoru gösterir. Yeni faktörler (tahsilat gecikmesi, devamsızlık, etkinlik katılmama) tek noktadan eklenir.
4. **Faaliyet akışı türetilir, log tablosu şart değil.** Her tablodaki kayıt zaten zaman damgalı → `ogrenciFaaliyetAkisi()` hepsini birleştirip öğrenci başına kronolojik "faaliyet" listesi üretir (ödev teslim edildi, derse gelmedi, denemede düştü, etkinliğe katıldı, taksit ödendi, AI arandı…). Geriye dönük **denetim izi** istenirse ayrı `activity_log` tablosu ana yazılımcı aşamasında trigger'la eklenir (Bölüm 7) — frontend'i bozmaz.

### Yeni/etkilenen dosyalar (öngörülen)
| Dosya | İş | Durum |
|---|---|---|
| `src/lib/server/ogrenci-durumu.ts` | Durum + faaliyet + risk tek kaynağı | **Yeni** |
| `src/lib/types/ogrenci.ts` | `OgrenciDurumu`, `OgrenciFaaliyeti`, `Rozet` tipleri | **Yeni** |
| `src/components/ogrenci/ogrenci-cekmecesi.tsx` | Öğrenci 360 drawer (paylaşılan, her modülde) | **Yeni** |
| `src/components/ogrenci/rozetler.tsx` | Ödev/yoklama/tahsilat/etkinlik rozetleri | **Yeni** |
| `src/lib/server/risk-map.ts` | Skorlama → `ogrenciRiskSkoru()`'ya devir | Değişir |
| `src/lib/server/bulletin-map.ts` | + etkinlik/tahsilat satırları | Değişir |
| Modül `page.tsx`'leri | Durum katmanından besleme (prop geçişleri) | Küçük diff'ler |
| `scripts/e2e-test.mjs` | Yansıma testleri (M9.2 bölümü deseni) | Genişler |

---

## 4. Kullanıcıda görünecek somut sonuçlar

1. **Öğrenci 360 çekmecesi:** Herhangi bir modülde öğrenci adına tıkla → tek panelde: ödev durumu, yoklama, son deneme trendi, beceri radarı özeti, tahsilat, etkinlik katılımı, son görüşmeler + **kronolojik faaliyet akışı**. (İstediğin "her modülde değişken olarak yansıma"nın birleşik yüzü.)
2. **Beceri Karnesi → Gelişim Karnesi:** Radar + ödev + yoklama + deneme + etkinlik + tahsilat şeritleri aynı sayfada; yazdırılabilir (veli toplantısı çıktısı).
3. **Risk Paneli zenginleşir:** Sadece deneme+duygu+ödev değil; devamsızlık, tahsilat gecikmesi, etkinlik katılmama da skora girer — tek fonksiyondan.
4. **Veli Bülteni tamamlanır:** Etkinlik ("🎯 Geçen hafta Seminer'e katıldı") + tahsilat nazik hatırlatma satırı eklenir.
5. **Dashboard:** Canlı akış yalnız aramaları değil **tüm öğrenci hareketlerini** gösterir; "bugün müdahale gereken öğrenciler" listesi.
6. **CRM kanbanı:** Lead satırlarında öğrenci rozetleri (ödev eksik, 2 devamsızlık, borç var) → danışman aramadan önce tam görür.

## 5. Uygulama planı (frontend — sırayla, her aşama ayrı commit)

> Paralel oturumlar nedeniyle kural: **paylaşılan dosyalarda minimal diff, aşama başına commit, her aşamada `tsc` + `eslint` + ilgili e2e bölümü.**

- **A1 — Çekirdek (temel taşı):** `ogrenci-durumu.ts` + tipler; mevcut `getLive*Data()` çıktılarından beslenir (queries.ts'ye dokunmadan, parametreden). Birim testleri + e2e bölümü. *Kabul:* saf fonksiyonlar mock ve canlı veriyle aynı sonucu veriyor.
- **A2 — Öğrenci 360 çekmecesi:** Paylaşılan drawer bileşeni; pilot 3 modül: Veliler kanbanı, Görüşmeler listesi, Tahsilat borçluları. *Kabul:* üç modülden de aynı öğrenci verisi açılıyor.
- **A3 — Yansıma matrisini kapat (Bölüm 1.5'teki "Eksik" kolonu):** etkinlik→bülten+karne, yoklama→risk+karne, tahsilat→risk+kanban rozeti, deneme→karne, ödev→deneme analizi satırı. *Kabul:* e2e "yansıma" bölümü tüm çiftler için yeşil (M9.2 test deseni).
- **A4 — Gelişim Karnesi:** Beceri Karnesi sayfası tüm şeritler + faaliyet akışı + yazdırma ile hub'a dönüşür.
- **A5 — Dashboard ekosistem akışı:** Birleşik öğrenci hareketleri feed'i + müdahale listesi (hero-status'un canlıya bağlanması da bu aşamada değerlendirilir).
- **A6 — Tüm sistem turu:** `node scripts/e2e-test.mjs` tam tur ×2 yeşil + GUI ekran turu (`render-pages.mjs`) + bu raporun güncellenmesi.

## 6. Karar gerekiyor (başlamadan önce netleşmeli)
- **Eşikler:** Risk skorunda tahsilat/devamsızlık ağırlıkları (öneri: gecikmiş taksit +15, ayda ≥2 devamsızlık +10, 3 etkinlik üst üste katılmama +5; M9.2 ödev ağırlıkları sabit kalır).
- **360 çekmecesi yönlendirmesi:** "Öğrenci detayına git" hangi sayfaya? (Öneri: Gelişim Karnesi hub'ı.)
- **Veli Bülteninde tahsilat:** Borç satırı bültenlerde görünsün mü? (Hassas konu — dershane tercihi sorulmalı.)

## 7. ana yazılımcı'ye devir spec'i (backend/güvenlik/denetleme)
Frontend türetme modelini **bozmayan**, üzerine koyan işler:
1. **Auth + roller:** Öğretmen/öğrenci/veli/yönetici; şu anki localStorage rol anahtarı (`educallai-odev-rolu`) gerçek auth'a bağlanır.
2. **RLS sertleştirme:** `0002_rls_hardening.sql` üstüne tüm 13 tablo için rol bazlı politikalar; `homework_submissions` satır sahipliği.
3. **`activity_log` tablosu + trigger'lar:** 13 tabloda INSERT/UPDATE → denetim izi; ileride "geriye dönük karne" ve uyuşmazlık çözümü için. (Frontend türetmeye devam eder; log yalnız denetim içindir.)
4. **Realtime yayılım:** Supabase Realtime aboneliği → `router.refresh()` yerine anlık yansıma ("her değişiklik tüm ekosisteme"nin canlı hali).
5. **Performans:** Agregasyonun materialized view / pg_cron ile optimize edilmesi; sayfa başına 13 tablo okumasının azaltılması.
6. **Storage/gizlilik:** `odev-fotograflari` imzalı URL erişim denetimi; transcript KVKK 6 ay temizleme job'ı; telefon maskeleme kurallarının sunucuya taşınması.
7. **API sağlamlaştırma:** Şema doğrulama (zod), rate limit, idempotency; `persisted:false` demo sözleşmesinin korunması.
8. **Agent entegrasyonu:** Arama bitince (`agent/` pipeline'ı) ilgili modüllere "state değişti" sinyali (webhook/DB notify).

## 8. Bu raporun kaynakları
- Keşif: `src/app/(app)/*`, `src/lib/server/*`, `src/lib/types/db.ts`, `src/lib/mock/*`, `supabase/migrations/0001-0008`, `scripts/e2e-test.mjs`, `docs/devir-odev-modulu.md`
- Oturum bağlamları: sess_21b176bd (ödev modülü + M9.2), sess_b1c2c790 (tahsilat modülü)
- İlgili önceki raporlar: `docs/raporlar/2026-09-23-buton-baglama-ve-tam-arayuz-testi.md`, `docs/devir-odev-modulu.md`

---

## 9. Uygulama Günlüğü

### 2026-09-23 — A1 + A2 (çekirdek katman + ilk ekosistem kartı) TAMAMLANDI

**Yeni dosyalar (3):**
- `src/lib/types/ogrenci.ts` — `OgrenciDurumu`, `OgrenciFaaliyeti`, `OgrenciGirdiler`, `OgrenciRozeti` vb. tipler. Yapısal (duck-typed) girdi tipleri sayesinde `getLive*Data()` çıktıları olduğu gibi geçer; mock/canlı farkı yok.
- `src/lib/server/ogrenci-durumu.ts` — **tek hesap katmanı**: `ogrenciDurumHaritasi()` 8 kaynağı (ödev, yoklama, deneme, beceri, tahsilat, etkinlik, görüşme, randevu) öğrenci başına tek `OgrenciDurumu`'nda birleştirir (özetler + 40'lık faaliyet akışı); `ogrenciRozetleri()` rozet dilinin tek kaynağı. Saf fonksiyon: DB erişimi yok, `Date.now` yok. Ödev toplamları M9.2'nin `odevPerformansHaritasi`'sini yeniden kullanır (tek kaynak bozulmadı). Ürün kararı: yoklamada yalnız `absent`/`late` akışa girer (rutin "katıldı" akışı doldurmasın), ödenmemiş gelecek taksit sayılır ama akışa girmez.
- `src/components/ogrenci/ogrenci-ekosistem-paneli.tsx` — paylaşılan "Öğrenci 360 · Ekosistem Kartı" client bileşeni: rozet şeridi + 8 istatistik kutusu + birleşik faaliyet akışı. Her modül bu tek bileşeni yerleştirerek aynı öğrenci kartını sunar.

**Değişen dosya (1):**
- `src/app/(app)/beceri-karnesi/page.tsx` — 6 kaynağı `Promise.all` ile paralel okuyup durum haritasını üretir; panel Beceri Karnesi'nin altına yerleşir (PageShell hizası korunur). Gelişim karnesi hub'ının ilk sürümü.

**Doğrulama:** `tsc --noEmit` temiz · eslint 0 hata 0 uyarı (4 dosya) · dev server'da `/beceri-karnesi` HTTP 200, canlı modda render kanıtlı: panel HTML'de "Öğrenci 360", 22 beceri gözlemi, 5 deneme, 2 etkinlik katılımı, 2 gecikmiş + 1 ödenmiş taksit tek akışta görünür.

**Commit NOTU:** Bu turda commit YAPILMADI — tespit: M9 katmanı (`odev-performans.ts`, `risk-map.ts`, `beceri-karnesi/`, `odevler/` vb.) ve `queries.ts`/`db.ts` değişiklikleri hâlâ **untracked/uncommitted** durumda. Yeni dosyalarım bu katmana tip import'u yapıyor; tek başına alınırsa kopuk commit olur, ortak dosyalara dokunuş ise paralel oturumun işini karıştırır. Öneri: M9 oturumu kendi katmanını commit'ledikten sonra tüm ekosistem işi tek özellik-commit'i olarak alınsın.

**Sonraki adımlar (plan sırasıyla):** A2'nin 3 pilot modüle yayılması (Veliler kanbanı, Görüşmeler, Tahsilat borçluları — paralel oturum çakışmasına göre sıralanacak) → A3 yansıma matrisi (risk-map'e yoklama/tahsilat/etkinlik faktörleri, bültene etkinlik satırı; bülten tahsilat satırı dershane onayına kadar beklemede) → A4 karne başlığı/yazdırma → A5 dashboard birleşik akış.

### 2026-09-23 — B turu: A3 ilk dilim + A2 yayılımı TAMAMLANDI

**Risk skoru artık ekosistem faktörlü (A3 ilk dilim):**
- `src/lib/server/risk-map.ts` — `buildRiskList(rows, durumlar?)` opsiyonel ekosistem parametresi aldı; ödev bloğunun ardından: **2+ devamsızlık +10**, **gecikmiş taksit var +15**, **3+ davete hiç katılmama +5** (plandaki ağırlık önerileri aynen). `durumlar` yoksa davranış birebir eski hali (mock/demo güvenli).
- `src/app/(app)/risk-paneli/page.tsx` — `getLiveRiskStudents()` + `getOgrenciEkosistemi()` paralel; risk panelinde artık Tahsilat ve Yoklama modüllerindeki kayıtlar skoru etkiliyor.

**Tek noktadan okuma yardımcısı:**
- `src/lib/server/ogrenci-ekosistem.ts` (YENİ) — `getOgrenciEkosistemi()`: 6 kaynağı paralel okuyup `ogrenciDurumHaritasi` ile birleştirir, `{contacts (do_not_call filtreli), durumlar}` döner; herhangi biri canlı değilse `null` (dürüst demo düşüşü). 360 kartı yerleştirecek tüm modüllerin ortak girişi.

**Öğrenci 360 kartı yayıldı (A2):** `/odevler` ve `/yoklama` sayfalarına yerleştirildi (her ikisi de view altında, PageShell ile hizalı). Kart şu 3 modülde: Beceri Karnesi, Ödev Takibi, Yoklama. Hedef listedeki Veliler kanbanı / Görüşmeler / Tahsilat **bilinçli ertelendi** — bu dosyalar paralel oturumun aktif düzenleme alanında (M işaretli).

**Doğrulama:** `tsc --noEmit` temiz · eslint 7 dosyada 0 hata/0 uyarı · dev server'da `/risk-paneli`, `/odevler`, `/yoklama` → üçü HTTP 200. **Yansıma kanıtları (canlı veri):** risk panelinde gerçek öğrencide "gecikmiş taksit (+15)" faktörü uygulandı; odevler sayfası akışında 22 beceri gözlemi, 2 etkinlik katılımı, 2 gecikmiş taksit, 2 devamsızlık faaliyeti birleşik görünüyor.

**Bir sonraki tur için:** (1) Veliler kanbanı + Görüşmeler + Tahsilat'a kart (paralel oturumın dosyaları merge olunca), (2) bültene etkinlik satırı (`bulletin-map.ts` + `veli-bulteni/page.tsx`), (3) A4 karne yazdırma, (4) A5 dashboard birleşik akış + hero-status canlıya bağlama, (5) `scripts/e2e-test.mjs`'e ekosistem bölümü (M9 oturumunun e2e düzeltmeleri gönderildikten sonra).

### 2026-09-23 — C turu: A2 TAMAMLANDI + A3 bülten dilimi TAMAMLANDI

**Kullanıcı bilgisi:** Bu turda paralel çalışma yalnızca **ders-programı** modülünde (`src/app/(app)/ders-programi/` + `sidebar-nav.tsx` — hiç dokunulmadı). Veliler/Görüşmeler/Tahsilat dosyaları serbest kaldığı için ertelenen işler yapıldı.

**Öğrenci 360 kartı artık 6 modülde:** Bu tur eklenenler: `/veliler` (CRM altında — danışman aramadan önce öğrencinin tüm durumu), `/gorusmeler` (liste altında), `/tahsilat` (toplu arama tetikleyicisi altında). Önceki tur: beceri-karnesi, odevler, yoklama. Kart tek bileşen (`ogrenci-ekosistem-paneli.tsx`) + tek veri girişi (`getOgrenciEkosistemi()`).

**Veli Bülteni etkinlik satırı (A3):** `buildBulletins` opsiyonel `events` + `invites` parametreleri aldı (geriye dönük uyumlu — mevcut çağrılar/e2e bozulmaz). Tek katılım: `🎯 Katılım: <etkinlik adı>`; çoklu: `🎯 Katılım: N etkinliğe katıldı · son: <ad>`. `renderBulletin` devam satırının ardına ekler. Yansıma matrisinde "etkinlik → bülten" hücresi kapandı.

**Değişen dosyalar:** `veliler/page.tsx`, `gorusmeler/page.tsx`, `tahsilat/page.tsx` (M durumundaydı; yalnız ekleme), `veli-bulteni/page.tsx`, `bulletin-map.ts` (untracked).

**Doğrulama:** `tsc --noEmit` temiz · eslint (6 dosya) 0 hata/0 uyarı · dev server: `/veliler`, `/gorusmeler`, `/tahsilat`, `/veli-bulteni` → dördü HTTP 200; üç sayfada 360 kartı render kanıtlı, bültende canlı veriyle `🎯 Katılım: Veli Bilgilendirme Semineri: Sınav Sistemi 2027` satırı görünüyor.

**Kalan (öncelik sırasıyla):** (1) A4 — karnenin yazdırılabilir/PDF görünümü + "Gelişim Karnesi" başlık kararı, (2) A5 — dashboard birleşik öğrenci hareketleri akışı + hero-status canlıya bağlanması (dashboard dosyaları buton-chat'inden yeni geldi; öncelikli kontrol gerekir), (3) e2e ekosistem bölümü, (4) **ders-programı entegrasyonu** — o modülün ders/program verisi `ogrenci-durumu.ts`'e `lessons` kaynağı olarak bağlanmalı ki program değişiklikleri ekosisteme yansısın (modülü yazan chate iletilecek not), (5) son boş hücreler: randevu→bülten, counselor_notes→360 kartı not şeridi.

### 2026-09-23 — D turu: A4 + A5 TAMAMLANDI

**A4 — Karnenin yazdırılması:** Yeni CSS YAZILMADI; projenin mevcut deseni yeniden kullanıldı (`PrintSectionButton` + `print-target` + globals.css'teki `body.printing-report` kuralları — Raporlar sayfasından bilinen desen). 360 kartına "Yazdır" butonu eklendi (yalnız dolu kartta görünür); veli toplantısı çıktısı olarak tek kart basılır.

**A5 — Dashboard birleşik öğrenci hareketleri:** Yeni bileşen `src/components/ogrenci/ogrenci-hareket-akisi.tsx` (`OgrenciHareketAkisi`, `HareketSatiri`): tüm öğrencilerin tüm modül faaliyetleri kronolojik tek akışta (ilk 15). Panel ile ikon/renk/tarih formatı **paylaşımlı** (panel dosyasından export: `TIP_IKONU`, `YON_NOKTA`, `formatTarih` — tek dil ilkesi). `src/app/(app)/page.tsx` (dashboard, M dosya — yalnız ekleme) `getOgrenciEkosistemi()` ile besler; canlı akış bölümünün (LiveFeed yalnız aramalar) altında 6. bölüm olarak durur. Dashboard'daki canlı akış artık yalnız aramaları değil TÜM öğrenci hareketlerini kapsıyor.

**Doğrulama:** `tsc --noEmit` temiz · eslint 3 dosya 0/0 · dev server: `/` ve `/beceri-karnesi` HTTP 200; dashboard HTML'inde gerçek öğrenci adlarıyla birleşik hareketler (örn. Mert Kaya, Yusuf Aydın), karnede "Yazdır" + `ogrenci-360-karti` hedefi render kanıtlı. Yazdırma çıktısının görsel kontrolü (tarayıcı print önizleme) kullanıcıya önerilir — desen Raporlar sayfasında zaten sahada.

**Aşama durumu:** A1 ✅ A2 ✅ (6 modülde kart) A3 ✅-ilk-dilimler (risk faktörleri + bülten etkinlik satırı; kalan hücreler: randevu→bülten, counselor_notes→360 kartı) A4 ✅ A5 ✅-ilk-sürüm (hero-status canlıya bağlama ayrı iş). e2e bölümü ve commit, öteki oturumların işleri gönderdikten sonra tek özellik-commit'i olarak.

### 2026-09-23 — E turu: Öğrenci 360 AYRI MODÜL oldu (kullanıcı kararı)

**Kullanıcı kararı:** Kart her sayfanın altında dağılmasın; kendi modül sayfasında yalnız orada görünsün.

**Yapılan:**
- `src/app/(app)/ogrenci-360/page.tsx` (YENİ) — "Öğrenci 360" modül sayfası: PageHeader + OgrenciEkosistemPaneli; `getOgrenciEkosistemi()` ile beslenir.
- `src/components/shell/sidebar-nav.tsx` — nav'a `{ href: "/ogrenci-360", label: "Öğrenci 360", icon: "person_search" }` eklendi (Beceri Karnesi'nin ardına; ders-programi chat'inin girdisine dokunulmadı).
- 6 sayfadan kart yerleşimi GERİ ALINDI: beceri-karnesi (orijinal haline döndü), odevler, yoklama, veliler, gorusmeler, tahsilat. Kart artık yalnız `/ogrenci-360`'ta.
- Dashboard'daki "Öğrenci Hareketleri" birleşik akışı KALDI (o, öğrenci kartı değil; genel bakış bileşeni — A5).

**Doğrulama:** `tsc --noEmit` temiz · eslint 8 dosya 0/0 · curl: `/ogrenci-360` HTTP 200 + kart içeriği canlı veriyle (devamsızlık rozetli); 6 sayfada kart kalmadığı (0 geçiş) ve hepsinin 200 döndüğü kanıtlı. Tarayıcı (IAB) DOM ağacında nav girdisi "person_search Öğrenci 360 → /ogrenci-360" render kanıtlı.

**Bilinen ortam notu:** Gömülü test tarayıcısında (IAB) bu dev server'ın TÜM dinamik sayfaları (dokunulmamış /odevler dahil) "Sayfa yükleniyor..." fallback'inde kalıyor; oysa sunucu aynı isteklere 1,5 sn'de tam render HTML döndürüyor (curl + tarayıcı-içi fetch ikisi de tam içerik aldı, chunk hataları sıfır). Kod değil, IAB+dev-stream uyumsuzluğu — kullanıcının normal tarayıcısında etkilenmemesi beklenir; görülürse dev server restart yeterli olur.

### 2026-09-23 — F turu: DERS PROGRAMI modülü devralındı ve tamamlandı

**Bağlam:** Kullanıcı bildirdi — ders-programı modülünü yazan chat başka modüle geçti; modül bana devredildi. Mevcut temel (öteki chat'ten): `0009/0010` migration'ları (lessons.teacher/room + schedule_slots tablosu, RLS'li), POST/DELETE API (çakışma denetimi 409), haftalık ızgara view'ı, mock fallback — hepsi çalışır durumdaydı.

**Eksik olarak tespit edilen ve TAMAMLANAN:**
1. **Düzenleme (PATCH):** `src/app/api/schedule/route.ts`'e `PATCH /api/schedule?id=` eklendi — POST ile aynı doğrulama; çakışma denetiminde slotun kendisi `.neq("id", id)` ile hariç tutulur. View'da slot kartındaki kalem ikonu → form önceden doldurulmuş açılır; "Değişiklikleri Kaydet" + Vazgeç akışı; demo modda yerel güncelleme (id-başına-map ile override).
2. **Bugün vurgusu:** Bugünün günü sütunu primary çerçeve + "Bugün" rozeti (client tarafı tarih — SSR determinizmi gerekmez).
3. **Filtreler:** Sınıf ve öğretmen seçicileri ("Tümü" dahil); ızgara + özet filtre üzerinden.
4. **Haftalık özet şeridi:** ders/hafta · saat/hafta · öğretmen · derslik sayısı (filtreli üzerinden); filtre boşsa bilgilendirme satırı.
5. **Ekosistem entegrasyonu (F4):** `getOgrenciEkosistemi()` artık `program` (schedule_slots) da döndürür (modül canlı değilse ekosistemi düşürmeden boş liste). Öğrenci 360 kartında **"Haftalık Ders Programı"** şeridi: seçili öğrencinin student_grade'i ile class_level eşleşirse (tr-TR küçük harf eşitlik) o sınıfın programı gün+saat sıralı görünür. Program ↔ öğrenci yansıması: program değişikliği 360 kartına otomatik yansır.

**Değişen dosyalar:** `api/schedule/route.ts`, `ders-programi-view.tsx`, `ogrenci-ekosistem.ts`, `ogrenci-ekosistem-paneli.tsx`, `ogrenci-360/page.tsx`. Migration'a gerek yok (0010 yeterli).

**Doğrulama:** `tsc --noEmit` temiz · eslint 5 dosya 0/0 · `/ders-programi` ve `/ogrenci-360` HTTP 200. **Canlı DB API turu (temizlikle):** POST → `persisted:true`, PATCH → `persisted:true`, DELETE → `persisted:true`; tablo teste öncesi/hazarada boştu, sonra da boş. Izgara öğeleri (özet/Bugün/filtre/düzenle) slot varken render kanıtlı; 360 şeridi sınıf eşleşince render kanıtlı.

**Test notu (hata değil):** İlk turda Git Bash'ten curl'a Türkçe karakterli JSON gövdesi kodlama bozulmasıyla gitmiş, DB'de bozuk classLevel birikmişti — bu yüzden şerit eşleşmedi; `\u0131` kaçışlı JSON ile temiz test başarılı. Test kayıtları silindi.

**Kalan (modül sahipliğim süresince):** (1) Derslik/öğretmen doluluk görünümü (opsiyonel), (2) schedule_slots → lessons haftalık üretim köprüsü (yoklama oturumlarının programdan otomatik açılması — orta iş, backend devri kapsamına da alınabilir), (3) e2e bölümü, (4) ana yazılımcı devri spec'ine schedule_slots RLS (0010'da hazır) ve rol bazlı yazma yetkisi notu.

### 2026-09-24 — G turu: Ders programı KÖPRÜ + DOLULUK + e2e TAMAMLANDI

**1. Program → Yoklama köprüsü:** Yeni `src/app/api/schedule/generate/route.ts` — `POST {weekStart?}`: schedule_slots'u seçilen haftanın lessons oturumlarına çevirir (yoklama bu tablodan çalışır). Çift kayıt koruması: `ad|sınıf|normalizeli-ISO-saat` anahtarı — aynı hafta için tekrar çağrım created:0/skipped:N döner. weekStart verilmezse bu haftanın Pazartesi'si (sunucu yerel saati; **tz politikası ana yazılımcı devri notu**). View'a "Oturum üret: Bu Hafta / Gelecek Hafta" butonları eklendi; sonucu bilgilendirme satırında sayarla bildirir.

**2. Haftalık Doluluk kartı:** Izgara altında; öğretmen ve derslik bazında haftalık saat yükü, max'a göre oransal barlarla (filtrelerden etkilenir).

**3. Modüle özel e2e:** `scripts/program-e2e.mjs` (YENİ, fetch tabanlı, tahsilat-e2e deseniyle self-cleanup): sayfa render'ları, slot CRUD, 3 çakışma tipinin 409'u, PATCH çakışma reddi + çakışmasız güncelleme, generate created/skipped + tekrar çağrımda çift kayıt yok, DELETE — **12/12 geçti**, cleanup 2 üretilmiş oturumu sildi, DB eski halinde.

**Doğrulama:** eslint 3 dosya 0/0. `tsc --noEmit` genel turda TEK hata `ogretmen-bordro/ogretmen-bordro-view.tsx`'te — o, öteki chat'in AKTİF geliştirdiği yeni modül (öğretmen bordro); bizim dosyalar temiz, o dosyaya dokunulmadı. Doluluk kartı + üretim butonları render kanıtlı (geçici 2 dersle; sonra silindi).

**Modül durumu:** Ders Programı CRUD-complete + ekosistem'e bağlı (360 kartı program şeridi). Kalan opsiyoneller: devamsızlıkla birleşik ders devamsızlık trendi, RLS/rol yazma yetkileri (ana yazılımcı), tz politikası.
