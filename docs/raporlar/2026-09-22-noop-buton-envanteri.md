# No-op (İşlevsiz) Buton Envanteri — 2026-09-22

> Adım 1 (UI Temel Sağlığı) girdisi. Adım 0'da düzeltilenler aşağıda ✓ işaretli.
> Kaynak: bileşen taraması + 2026-09-22 tarihli ürün analizi.
>
> **GÜNCELLEME 2026-09-23:** Bu envanterdeki tüm kalan maddeler (Adım 2 kapsamı dahil)
> tamamlandı; ayrıca tüm arayüz yeniden taranıp 50+ ölü/sahte buton gerçek işlevlere
> bağlandı ve uçtan uca test edildi. Ayrıntılar:
> `docs/raporlar/2026-09-23-buton-baglama-ve-tam-arayuz-testi.md`

## Adım 0'da Düzeltilenler (bugün)

| Buton/Alan | Dosya | Yapılan |
|---|---|---|
| ✓ Veliler filtre chip'leri | `veliler-crm.tsx` | `chipTags` ile gerçek filtreleme; canlı sayaçla birebir eşleşme (E2E eklendi) |
| ✓ Kanban aşama taşıma hatası | `veliler-crm.tsx` | Hata toast'u + optimistik geri alma |
| ✓ Görüşme detay mock fallback | `mock/calls.ts`, `[id]/page.tsx` | Yalnız bilinen demo id'ler örnek kayda düşer, bilinmeyen id 404 |
| ✓ uuid olmayan id ile Supabase 400 | `queries.ts` | uuid kontrolü ile gereksiz sorgu kaldırıldı (konsol hatası kaynağıydı) |
| ✓ Dashboard "Yenile" | `live-feed.tsx` | `RefreshButton` → `router.refresh()` (ortak bileşen: `components/ui/refresh-button.tsx`) |
| ✓ "Tekrar Ara" (görüşme detay) | `recall-button.tsx` | `POST /api/calls` gerçek çağrı + durum metni |
| ✓ Drawer timeline duplicate key | `parent-detail-drawer.tsx` | `key={title}` → benzersiz key |
| ✓ Görüşme listesi arama staleness | `call-list-browser.tsx` | useMemo `list` dependency eklendi |

## Adım 1'de Yapılanlar (2026-09-22, Adım 1 tamamlandı)

- ✓ **Dark mode** — M3 koyu palet `globals.css`'e eklendi (`html.dark` token override); ThemeToggle FOUC'suz (root layout inline script + CSS tabanlı ikon geçişi); `@layer base/utilities` düzeltildi (Google CDN'inin katmansız `display:inline-block` kuralı ikonlarda `hidden` utility'sini ezmişti — ikonlar artık sarmalayıcı span ile gizleniyor)
- ✓ **Topbar bildirim çanı** — `NotificationsMenu` + `GET /api/notifications` (bekleyen handoff'lar + 7 gün içindeki/geciken taksitler; demo modda örnek akış)
- ✓ **Topbar tarih aralığı** — `DateRangeMenu` (Bugün/7/30/90 gün); seçim localStorage + CustomEvent ile yayınlanır, Görüşmeler listesi `sortKey` üzerinden gerçekten süzer
- ✓ **Sidebar collapse** — ikon modu (68px), tercih localStorage'da; topbar ve içerik alanı Transition ile uyum sağlar (`AppFrame`)
- ✓ **Mobil "Ara"** → `/veliler?odak=ara` (arama kutusuna otomatik odak); mobil tem düğmesi eklendi
- ✓ **Ayarlar "Değişiklikleri Kaydet"** — `POST/GET /api/dershane-config` → `dershaneler.capabilities` + `dershaneler.working_hours.ui` (canlı DB'ye yazıldığı doğrulandı); demo modda dürüst geri bildirim
- ✓ **TestCallCard** — gerçek `POST /api/calls`; demo/canlı moda göre sonuç metni
- ✓ **loading.tsx / error.tsx / not-found.tsx / EmptyState** — tüm (app) segmentinde iskelet + hata sınırı; global 404
- ✓ "Yeni Kampanya" → `/kampanyalar` bağlantısı

### Kalan (Adım 2'ye taşındı)

- Topbar tarih aralığının dashboard/veliler verisine de bağlanması (şimdilik yalnız Görüşmeler)
- Gelişmiş Filtre drawer'ı (veliler) + drawer "Randevu Oluşturma" `console.log`'u
- Danışman notu kalıcılığı (görüşme detay) — tablo kararı gerekiyor
- Ses oynatıcı `audio_url` ([ANA-DEV] kayıt saklamaya bağlı)
- GlobalSearch ⌘K kısayolu dekoratif

## Adım 1 öncesi tespitler (arşiv)

### Topbar (tüm sayfalar) — `components/shell/topbars.tsx`
- [ ] Tarih aralığı seçici (`:11-49` civarı) → gerçek seçici; dashboard + gorusmeler verisini filtrelesin
- [ ] Bildirim çanı → dropdown panel (öneri: `handoff_logs` + yaklaşan taksit vadesi feed'i)
- [ ] Tema değiştirici → **dark mode** (M3 koyu palet + `@custom-variant dark`; Adım 1b)

### Sidebar — `components/shell/sidebar.tsx`
- [ ] Collapse/daralt butonu (`:20-27`) → ikon modu
- [ ] Sabit kullanıcı "Ahmet Yıldız / Müdür" (`:36-57`) → gerçek oturum (auth = [ANA-DEV]; o güne kadar "Demo Kullanıcı" etiketi önerilir)

### Ayarlar — `components/pages/ayarlar/`
- [ ] CapabilitiesCard / ScheduleCard / ComplianceCard "Değişiklikleri Kaydet" → yalnız toast, kalıcılık yok (`ayarlar-view.tsx:68-70`) → `dershaneler` JSONB alanlarına yaz (mevcut `/api/agent-settings` deseniyle)
- [ ] TestCallCard `setTimeout` simülasyonu (`test-call-card.tsx:23-32`) → gerçek `POST /api/calls` (RecallButton/AiCallToastButton deseni)

### Veliler
- [ ] "Gelişmiş Filtre" butonu (`veliler-crm.tsx`) → çoklu filtre drawer'ı (Adım 2: URL query state)
- [ ] Drawer "Randevu Oluşturma" yalnız `console.log` (`parent-detail-drawer.tsx:257`) → `appointments` insert (Adım 2 ile birlikte)

### Görüşme detay
- [ ] Danışman notu "Kaydet" yalnız local state (`actions-panel.tsx:132-143`) → kalıcı not saklama (tablo kararı: `handoff_logs` genişletme veya `counselor_notes`)
- [ ] Ses oynatıcı dekoratif — `audio_url` hiç akmıyor (`queries.ts:253` `playedBars: []`) → kayıt saklama [ANA-DEV]'e bağlı

### Kampanyalar / Raporlar (Adım 2 kapsamı)
- [ ] Sihirbaz "İleri" butonu + CSV yükleme sahte chip (`wizard-card.tsx:103-121`)
- [ ] "PDF İndir" butonları (`raporlar`) → `@media print` yaklaşımı

## Notlar / Bilinen Veri Sorunları

- **Ajan CRM'i tek kontağa yazıyor:** Python agent `save_to_crm()` hardcoded demo `contact_id` kullanıyor → 51 görüşmenin 49'u "Zeynep Kaya"ya bağlı. Görüşme listesi araması "zeynep" 49 satır dönüyor. Çözüm C3 (telefon→contact lookup) — [ANA-DEV]/agent tarafı.
- **E2E canlı veriyi değiştiriyor:** sürükle-bırak testi PATCH'i canlıya yazıyor; tekrarlı koşular aşama dağılımını kaydırıyor. Uzun vadede E2E için ayrı demo şema/tenant düşünülmeli.
- **Dev sunucusu bayat bundle riski:** HMR bazen bileşen güncellemesini kaçırdı (bugün başıma geldi); doğrulamadan önce sunucuyu tazeleyin.

## Doğrulama Durumu (2026-09-22, Adım 0 sonu)

- `tsc --noEmit`: 0 hata
- `eslint`: 0 hata / 4 uyarı (dokunulmayan dosyalarda önceden var: `scripts/e2e-test.mjs`, `app/layout.tsx` font, `ayarlar/compliance-card.tsx`)
- E2E: **36/36 geçti** (chip filtre testi dahil, yeni eklenen) · konsol/ağ hatası: 0
