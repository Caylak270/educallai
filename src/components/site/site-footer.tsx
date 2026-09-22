import { WA_START_TRIAL } from "@/components/site/links";

export function SiteFooter() {
  return (
    <footer className="w-full bg-obsidian-canvas pb-space-xl pt-space-3xl text-inverse-on-surface">
      <div className="mx-auto max-w-[1240px] px-margin-mobile lg:px-margin">
        <div className="grid grid-cols-1 gap-space-xl border-b border-obsidian-border pb-space-2xl md:grid-cols-2 lg:grid-cols-5">
          {/* Marka */}
          <div className="space-y-space-md lg:col-span-2">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/icon.png" alt="" className="h-8 w-auto" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/wordmark.png"
                alt="educallai"
                className="h-6 w-auto brightness-0 invert"
              />
            </div>
            <p className="max-w-sm font-body-sm text-body-sm text-outline-variant">
              Kolejler, özel dershaneler ve kurs merkezleri için 7/24 otonom veli
              karşılayan, kayıt randevusu oluşturan ve WhatsApp üzerinden anlık
              bilgilendirme yapan yeni nesil yapay zeka ses santrali altyapısı.
            </p>
            <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
              <span className="inline-flex items-center gap-1 rounded border border-obsidian-border bg-obsidian-surface px-2.5 py-1 font-label-sm text-label-sm text-voice-teal">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>{" "}
                KVKK %100 Uyumlu
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-obsidian-border bg-obsidian-surface px-2.5 py-1 font-label-sm text-label-sm text-voice-teal">
                <span className="material-symbols-outlined text-[14px]">sync_alt</span> İYS
                Entegre
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-obsidian-border bg-obsidian-surface px-2.5 py-1 font-label-sm text-label-sm text-voice-teal">
                <span className="material-symbols-outlined text-[14px]">shield</span> ISO
                27001 Bulut
              </span>
            </div>
          </div>

          {/* Çözümler */}
          <div>
            <h3 className="mb-space-md font-title-md text-title-md text-surface-container-lowest">
              Çözümler
            </h3>
            <ul className="space-y-space-sm font-body-sm text-body-sm text-outline-variant">
              <li>
                <a className="transition-colors hover:text-surface-container-lowest" href="#ozellikler">
                  7/24 Sesli Veli Çağrı Karşılama
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-surface-container-lowest" href="#ozellikler">
                  WhatsApp Otomasyon Asistanı
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-surface-container-lowest" href="#ozellikler">
                  Kayıt ve Bursluluk Sınav Takvimi
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-surface-container-lowest" href="#ozellikler">
                  Gecikmiş Taksit &amp; Muhasebe Hatırlatıcı
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-surface-container-lowest" href="#kayip-gelir-hesapla">
                  Cevapsız Çağrı Gelir Simülatörü
                </a>
              </li>
            </ul>
          </div>

          {/* Kurumsal & Güvenlik */}
          <div>
            <h3 className="mb-space-md font-title-md text-title-md text-surface-container-lowest">
              Kurumsal &amp; Güvenlik
            </h3>
            <ul className="space-y-space-sm font-body-sm text-body-sm text-outline-variant">
              <li>
                <a className="transition-colors hover:text-surface-container-lowest" href="#kurum-yorumlari">
                  Müşteri Başarı Hikayeleri
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-surface-container-lowest" href="#teklif">
                  Teklif &amp; Görüşme
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-surface-container-lowest" href="#sss">
                  Sıkça Sorulan Sorular
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-surface-container-lowest" href="/web">
                  KVKK ve Veri İşleme Metni
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-surface-container-lowest" href="/web">
                  Açık Rıza ve Bilgi Güvenliği
                </a>
              </li>
            </ul>
          </div>

          {/* Hızlı İletişim */}
          <div>
            <h3 className="mb-space-md font-title-md text-title-md text-surface-container-lowest">
              Hızlı İletişim
            </h3>
            <ul className="space-y-space-sm font-body-sm text-body-sm text-outline-variant">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-whatsapp-green">
                  call
                </span>
                <a
                  className="font-mono-data text-mono-data transition-colors hover:text-surface-container-lowest"
                  href="tel:08508859122"
                >
                  0850 885 91 22
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary-fixed-dim">
                  mail
                </span>
                <a
                  className="transition-colors hover:text-surface-container-lowest"
                  href="mailto:kurumsal@educallai.com"
                >
                  kurumsal@educallai.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-whatsapp-green">
                  chat
                </span>
                <a
                  className="transition-colors hover:text-surface-container-lowest"
                  href={WA_START_TRIAL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp Kurumsal Destek
                </a>
              </li>
              <li className="pt-space-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-wide text-tertiary-fixed-dim">
                  Destek Saatleri
                </span>
                <p className="mt-0.5 font-mono-data text-mono-data text-outline-variant">
                  Hafta İçi 08:30 - 20:30 (Canlı)
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-space-md pt-space-lg sm:flex-row">
          <p className="text-center font-body-sm text-body-sm text-outline-variant sm:text-left">
            © 2025 educallai Teknoloji A.Ş. Tüm hakları saklıdır. Milli Eğitim
            mevzuatına ve KVKK standartlarına tam uyumludur.
          </p>
          <div className="flex items-center gap-space-lg font-label-sm text-label-sm text-outline-variant">
            <a className="transition-colors hover:text-surface-container-lowest" href="/web">
              Kullanım Koşulları
            </a>
            <a className="transition-colors hover:text-surface-container-lowest" href="/web">
              Gizlilik Politikası
            </a>
            <a className="transition-colors hover:text-surface-container-lowest" href="/web">
              İYS Entegrasyonu
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
