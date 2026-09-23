# VeliPilot AI — Ürün Geliştirme Planı (Modüller · UI · Optimizasyon)

> **Kapsam:** Bu plandaki her şey ürün tarafıdır — modüller, UI tasarımı, çalışan özellikler, optimizasyon.
> **Kapsam DIŞI (ana yazılımcıya):** Netgsm SIP/SMS, auth backend, RLS güvenliği, worker/cron altyapısı, kayıt saklama.
> Eş zamanlı ilerlenir; çakışma olmaması için her işte "[BIZ]" / "[ANA-DEV]" etiketi kullanılır.
> Önceki genel plan: `docs/GELISTIRME-PLANI.md` (backend ağırlıklı maddeler orada).

---

## Sorumluluk Ayrımı

| [BIZ] Ürün | [ANA-DEV] Altyapı |
|---|---|
| Modüller, sayfalar, akışlar | Netgsm SIP trunk + SMS/WhatsApp gönderimi |
| UI tasarım sistemi, dark mode | Supabase Auth + login + RLS |
| Çalışmayan butonların işlevsel hâli | Dialer/tahsilat worker + cron |
| Yeni tabloların SQL migration'ı | Gizlilik, kayıt saklama, KVKK süreçleri |
| Demo verisi, performans | Gerçek arama kuyruğu, telefon entegrasyonu |

**Kural:** Biz bir modülü tamamen çalışır hâle getiririz (CRUD + UI + demo veri). Gerçek kanaldan
gönderim/arama gerektiren son adımı `[ANA-DEV]` işaretiyle bırakırız — modül yine de demo modda çalışır.

---

## ADIM 0 — Hızlı Kazanımlar (yarım gün)

Görünürde anında düzelme hissi veren, küçük ve risksize işler:

- [ ] **Veliler filtre chip'leri çalışsın** — `activeChipId` filtrelemeye bağlanmalı (`veliler-crm.tsx:38-51`)
- [ ] **Görüşme detay mock fallback** her id için aynı kaydı dönüyor → bilinmeyen id'de 404 (`mock/calls.ts:349-351`)
- [ ] **Veliler kanban PATCH hatası** sessiz yutuluyor → toast ile bildir (`veliler-crm.tsx:58-62`)
- [ ] **Dashboard "Yenile"** butonu `router.refresh()`'e bağlansın
- [ ] **Görüşme detay "Tekrar Ara"** → `POST /api/calls` (API zaten var)
- [ ] Hiçbir işlevi olmayan butonların listesini çıkar (bkz. Adım 1) — her biri ya çalışacak ya da Adım 1'de gizlenecek

## ADIM 1 — UI Temel Sağlığı (≈1 hafta)

### 1a. Kukla butonların hepsinin işlevsellenmesi

| Buton/Alan | Yapılacak |
|---|---|
| Topbar tarih aralığı | Gerçek tarih seçici → sayfaların verisini filtrelesin (ilk etapta dashboard + gorusmeler) |
| Topbar bildirim çanı | Dropdown panel → `handoff_logs` + doğum günü/vade yaklaşan taksit feed'i |
| Tema değiştirici | **Dark mode** (bkz. 1b) |
| Sidebar collapse | Daraltılabilir sidebar (ikon modu) |
| Mobil arama/filtre | Veliler + gorusmeler'de çalışır mobil arama |
| Ayarlar "Değişiklikleri Kaydet" | Capabilities/Schedule/Compliance → `dershaneler` JSONB alanlarına yaz (mevcut `/api/agent-settings` deseni kopyalanır) |

### 1b. Dark Mode

- Tailwind v4'te `@custom-variant dark` + `.dark` sınıfında M3 koyu token seti (`globals.css` @theme bloğuna ikinci palet)
- `next-themes` (küçük bağımlılık) veya 30 satırlık kendi `ThemeToggle` — FOUC engellemek için `<script>` ile başlangıç sınıfı
- Kabul kriteri: 9 sayfanın tamamı koyu temada kontrast hatasız

### 1c. Yükleme / hata / boş durumları

- Her `(app)` sayfasına `loading.tsx` (iskelet kartlar) + kök `error.tsx`
- Verisiz durumlar için boş-ekran bileşeni (ikon + açıklama + "İlk kaydı ekle" aksiyonu)
- Kabul kriteri: ağ yavaşlatılmışken hiçbir sayfa bomboş donuk kalmıyor

## ADIM 2 — Mevcut Modülleri Tam Fonksiyonel Yapma (≈2 hafta)

Tablolar ve tipler hazır; hepsi "okuma + en az bir yazma" işlevine kavuşacak:

- [ ] **Randevular** — `appointments` okuma; "Yeni Randevu" formu (insert + doğrulama); Detay drawer
- [ ] **Tahsilat** — `installment_tracker` okuma; "Ödendi" → durum güncelleme; "Hatırlat" → `collection_actions` kaydı; tahsilat özeti KPI'ları
- [ ] **Deneme Analizi** — `exam_results` okuma; öğrenci detay geçişi; çağrı butonlarında gerçek `contacts.telephone`
- [ ] **Kampanyalar** — `campaigns` + `campaign_targets` okuma; durdur/devam → PATCH; sihirbaz 3 adımlı olsun + CSV gerçek ayrıştırma (istemci tarafı, bağımlılıksız)
- [ ] **Raporlar** — "PDF İndir": tarayıcı yazdırma görünümü (`@media print` stilleri) ile üretim; harici bağımlılık yok
- [ ] **Genel Bakış (dashboard)** — canlı KPI'lar: aktif veli, haftalık görüşme, dönüşüm hunisi, yaklaşan randevular (mevcut bileşenlere veri bağlama)
- [ ] **Veliler Gelişmiş Filtre** — şehir/sınıf/kaynak/durum çoklu filtre + URL query state (paylaşılabilir filtre linki)
- [ ] **Sayfalama** — gorusmeler (hardcoded 50 kaldır), veliler, tahsilat; "daha fazla yükle" deseni

## ADIM 3 — Yeni Modüller: Dershane Problemlerine Çözümler (≈4-6 hafta)

Her modül: gerçek dershane acısı → çalışan modül. Öncelik sırasına göre:

### M1. Öğrenci Risk Paneli — "Rehberlik Kokpiti" ⭐ en yüksek değer/maliyet
- **Problem:** Dershaneler düşüşteki öğrenciyi çoğu zaman kayıt kaybettikten sonra fark ediyor.
- **Çözüm:** Deneme net eğilimlerinden otomatik risk skoru (mevcut `exam_engine` kategorileri: DECLINING / PLATO / RISING…) → risk sıralı öğrenci listesi, tek tıkla "rehber görüşmesi aç" + not + (Ana-Dev) AI arama kuyruğu.
- **Veri:** `exam_results` mevcut; yeni tablo gerekmez. Görüşme notları için `handoff_logs` genişletilir veya `counselor_notes` tablosu eklenir.
- **UI:** Sol tarafta risk listesi (kırmızı→yeşil), sağda seçili öğrencinin net grafiği + geçmiş görüşmeler.

### M2. Devamsızlık & Yoklama
- **Problem:** "Çocuğum derse geldi mi?" telefonları dershanenin en sık veli teması; elle takip hata yapılıyor.
- **Çözüm:** Ders bazlı hızlı yoklama (tek dokunuş grid'i), kaçıran öğrencinin velisine otomatik bildirim kuyruğu.
- **Veri:** Yeni: `lessons`, `attendance`. SQL migration bizde.
- **UI:** Tarih+ders seç → öğrenci listesi üstünde üç durumlu (geldi/geç geldi/gelmedi) dokunma hedefleri; haftalık devamsızlık özeti.

### M3. 21. Yüzyıl Beceri Karnesi ⭐ farklılaştırıcı
- **Problem:** Veliler sadece net değil, çocuğunun gelişimini görünmek istiyor; dershanelerin bunu gösterdiği bir araç yok.
- **Çözüm:** Her öğrenci için 5 beceride gözlem kaydı: **eleştirel düşünme, iletişim, işbirliği, öz yönetim, dijital okuryazarlık**. Öğretmen/danışman 1-5 hızlı oylama + kısa not. Radar grafiği + dönemsel değişim. Veli görüşmelerinde AI asistanın bu karniyi anlatabilmesi için agent prompt'una beslenir.
- **Veri:** Yeni: `skill_observations` (student, skill, score, note, period).
- **UI:** Öğrenci kartında radar grafiği; veliler sayfası drawer'ında "Beceri Karnesi" sekmesi.

### M4. Sınav Takvimi & Geri Sayım
- **Problem:** TYT/AYT/LGS tarihleri + okul sınavlarını takip kaosu; veli bilgilendirme elle.
- **Çözüm:** Merkezî sınav takvimi; dashboard geri sayım widget'ı; yaklaşan sınav öncesi hatırlatıcı üretimi.
- **Veri:** Yeni: `exam_schedule` (ad, tarih, tür, sınıf). 2026 takvimi seed verisiyle gelir.
- **UI:** Dashboard'a geri sayım kartı; takvim listesi görünümü.

### M5. Veli Bülteni (haftalık özet üreticisi)
- **Problem:** Velilere düzenli bilgilendirme yok; iletişim sadece sorun anında oluyor.
- **Çözüm:** Öğrenci/dershane bazlı haftalık özet metni üretici (deneme sonucu + devamsızlık + beceri karnesi birleşimi) → kopyala-yapıştır veya tek tık WhatsApp şablonu. Gerçek gönderim [ANA-DEV].
- **Veri:** Mevcut tabloların birleşimi; şablonlar `whatsapp_templates` tablosu.
- **UI:** Şablon listesi + önizleme + "kopyala" ve (Ana-Dev sonrası) "gönder".

### M6. Etkinlik Yönetimi (veli semineri / deneme günü / workshop)
- **Problem:** Veli seminerlerine katılım düşük, davet ve kayıt elle yürütülüyor.
- **Çözüm:** Etkinlik oluştur → davetli listesi (contacts'tan) → katılım takibi → sonrası AI arama kuyruğu.
- **Veri:** Yeni: `events`, `event_invites`.

### M7. Ödeme Projeksiyonu (tahsilat modülü eki)
- **Problem:** Dershane gelecek ay kaçacak tahsilatı bilemiyor; nakit akışı tahminsiz.
- **Çözüm:** `installment_tracker` üzerinde vade bazlı nakit akış grafiği + gecikme yaşlandırması (0-30/30-60/60+).
- **Veri:** Yeni tablo yok — sadece analiz görünümü.

### M8. Arkadaşını Getir (Referral)
- **Problem:** Yeni kayıt maliyeti yüksek; mevcut veli ağlığı kullanılmıyor.
- **Çözüm:** Kampanya modülünün özel türü: referral kodu/kayıt kaynağı takibi, ödül durumu.
- **Veri:** `leads.source` değerleri + `referrals` tablosu.

> Her modül için standart iş paketi: SQL migration + tipler → seed/demo veri → API route → sayfa + bileşenler → E2E script kaydı → mock fallback (anahtar yoksa demo modda çalışsın).

## ADIM 4 — Optimizasyon (sürekli, ≈1 hafta toplam)

- [ ] **Sorgu sağlığı:** görüşme detayı tek kişi için 200 contact çekiyor → sunucu tarafı filtre (`queries.ts:183-186`)
- [ ] **Görseller:** `next/image` + statik varlıklarda boyut kontrolü; stitch PNG'leri optimize
- [ ] **Paket disiplini:** yeni bağımlılık ekleme kuralı (grafikler için önce sıfır-bağımlılık SVG; zorunluysa hafif kütüphane)
- [ ] **Lighthouse taban çizgisi** + hedef: mobil ≥ 85, masaüstü ≥ 95 (Performance/Accessibility)
- [ ] **Server component oranı:** mümkün olan her veri çekimini server tarafına taşı; CustomEvent yerine gerektiğinde URL state
- [ ] **Erişilebilirlik turu:** klavye navigasyonu, odak halkaları, kontrast, `aria-label` (özellikle ikon butonlar)

## ADIM 5 — Demo & Devir Teslim Paketi (≈3 gün)

- [ ] **Zengin demo verisi:** her modülde anlatılabilir senaryo ("riskli öğrenci Ali → risk paneli → AI arama → veli bilgilendirildi") — satış demosu akışı
- [ ] **E2E script güncellemesi:** `scripts/e2e-test.mjs` yeni modülleri kapsasın, konsol hatası 0 hedefi korunsun
- [ ] **Ekran kayıtları / render PNG** güncellemesi (`scripts/render-pages.mjs`)
- [ ] **Devir teslim notu:** ortam değişkenleri listesi, API sözleşmeleri, bizim eklediğimiz migration'lar, `[ANA-DEV]` açık işlerin listesi → `docs/HANDOFF` güncellemesi

---

## Önerilen Takvim

| Hafta | Odak |
|---|---|
| 1 | Adım 0 + Adım 1 (UI sağlığı, dark mode) |
| 2-3 | Adım 2 (mevcut modüller tam fonksiyonel) |
| 4 | M1 Risk Paneli + M4 Sınav Takvimi |
| 5 | M2 Devamsızlık + M7 Ödeme Projeksiyonu |
| 6 | M3 Beceri Karnesi |
| 7 | M5 Veli Bülteni + M6/M8 (süre kalırsa) |
| 8 | Adım 4 optimizasyon turu + Adım 5 demo/devir paketi |

**Her haftanın çıkışı:** çalışan, demo edilebilir bir artış + `npm run build` ve E2E yeşil.

---

## ✅ TAMAMLANDI — 2026-09-23 Final Durumu

| Kalem | Durum |
|---|---|
| Adım 0-1 (UI sağlığı, dark mode, widget'lar) | ✅ |
| Adım 2 (9 sayfa canlı veri + CRUD) | ✅ |
| M1 Risk Paneli (`/risk-paneli`) + counselor_notes | ✅ |
| M2 Yoklama (`/yoklama`) + lessons/attendance + wa.me bildirim | ✅ |
| M3 Beceri Karnesi (`/beceri-karnesi`) + skill_observations + radar | ✅ |
| M4 Sınav Takvimi (`/sinav-takvimi`) + dashboard geri sayım | ✅ |
| M5 Veli Bülteni (`/veli-bulteni`) — deneme+yoklama+beceri birleşik | ✅ |
| M6 Etkinlikler (`/etkinlikler`) + davet yönetimi | ✅ |
| M7 Ödeme Projeksiyonu (tahsilat içinde) | ✅ |
| M8 Arkadaşını Getir (`/referanslar`) | ✅ |
| Kampanya sihirbazı 3 adım + CSV parse | ✅ |
| Sayfalama (gorusmeler, veliler) + ⌘K + drawer butonları | ✅ |
| Raporlar canlı telemetri + yazdırma | ✅ |

**Migrations:** 0003 (counselor_notes, exam_schedule) · 0004 (lessons, attendance) · 0005 (skill_observations) · 0006 (events, event_invites, referrals) — hepsi canlı Supabase'de.
**Test:** tsc 0 hata · eslint 0 hata · E2E 43/43 · konsol hatası 0 · `next build` başarılı (25 route).

### Ana yazılımcıya (yayın öncesi)
1. Netgsm SIP aboneliği + LiveKit trunk (gerçek arama)
2. Telefon→contact eşlemesi (agent save_to_crm hardcoded demo ID yazıyor)
3. Supabase Auth + RLS enforcement (service key → user JWT)
4. Dialer/tahsilat worker (dialer.py, collections.py hazır)
5. Dosya tabanlı agent-*.json kanalının Supabase tablosuna taşınması

### Bilinen sorun: Supabase aralıklı 401 (PGRST303 "JWT issued at future") — 2026-09-23
- **Belirti:** Rastgele tablolarda, ~%2 istekte 401; saniyelerce süren dönemler halinde.
- **Kök neden:** `.env.local`'deki anahtar Supabase'in **yeni tip `sb_secret_`** anahtarı. Supabase her istekte bu opaque anahtarı sunucu tarafında kısa ömürlü JWT'ye çeviriyor; kendi altyapısındaki saat tutarsızlığı "iat future" reddi üretiyor. **Bizim kodun hatası değil** (sbSelect artık 4 denemeli artan backoff ile dayanıklı).
- **Kalıcı çözüm (kullanıcı, 2 dk):** Supabase Dashboard → Project Settings → API Keys → **Legacy service_role JWT** anahtarını (`eyJ...` ile başlar) kopyala → `.env.local` içindeki `SUPABASE_SERVICE_KEY` değerini onunla değiştir → dev sunucusunu yeniden başlat. Statik JWT mint edilmediği için bu hata sınıfı tamamen kalkar.
- **✅ UYGULANDI (2026-09-23):** Kullanıcı legacy service_role JWT sağladı, .env.local güncellendi. Doğrulama: 90/90 paralel istek 0 hata · 6 dashboard yüklemesi 0 konsol hatası · E2E 43/43.
- **Ayrıca:** Yerel Windows saati ~5 dk geride — yönetici terminalinde `net start w32time && w32tm /resync` ile senkronla (Supabase hatasıyla ilgisiz ama genel sağlık için).
