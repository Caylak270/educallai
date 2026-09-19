/* Hero & AI durum şeridi — design/screens/02-genel-bakis.web.html */

export function HeroStatus() {
  return (
    <div className="flex flex-col items-stretch justify-between gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm xl:flex-row">
      {/* Left: Kurumsel Karşılama */}
      <div className="flex flex-col justify-center space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </span>
          <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-secondary">
            Kurumsal Yönetici Paneli
          </span>
        </div>
        <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">
          Günaydın, Ahmet Bey <span className="inline-block animate-pulse">👋</span>
        </h1>
        <p className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
          <span>Limit Dershane Beylikdüzü Şubesi</span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-outline-variant" />
          <span className="font-medium text-on-surface">14 Ekim 2024, Pazartesi</span>
        </p>
      </div>

      {/* Right: Canlı AI Ses Durumu */}
      <div className="flex flex-col items-start justify-between gap-space-md rounded-xl bg-gradient-to-r from-primary-container/5 via-surface-container-low to-secondary-container/10 p-space-md sm:flex-row sm:items-center">
        <div className="flex items-center gap-space-md">
          {/* Pulse Waveform Avatar */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-sm shadow-primary-container/20">
            <span className="material-symbols-outlined text-[24px]">graphic_eq</span>
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-fixed opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-secondary" />
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-2 py-0.5 font-label-xs text-label-xs font-semibold text-on-secondary-container">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
                AI Asistan Aktif &amp; Dinlemede
              </span>
              <span className="font-label-xs text-label-xs text-on-surface-variant">
                • v4.2 Ses Motoru
              </span>
            </div>
            {/* Aktif görüşme sayısı & ses görselleştirici */}
            <div className="mt-1 flex items-center gap-3">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Şu an 3 görüşme devam ediyor
              </span>
              <div className="flex h-4 w-12 items-end gap-0.5">
                <span className="h-2 w-1 animate-[bounce_0.8s_ease-in-out_infinite] rounded-full bg-secondary" />
                <span className="h-4 w-1 animate-[bounce_0.6s_ease-in-out_infinite_0.1s] rounded-full bg-primary-container" />
                <span className="h-3 w-1 animate-[bounce_0.9s_ease-in-out_infinite_0.2s] rounded-full bg-secondary" />
                <span className="h-1.5 w-1 animate-[bounce_0.7s_ease-in-out_infinite_0.3s] rounded-full bg-primary" />
              </div>
            </div>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
              Bugün <strong className="font-semibold text-on-surface">128 arama</strong> yapıldı •{" "}
              <span className="font-semibold text-secondary">%94 Başarılı Bağlantı</span>
            </p>
          </div>
        </div>
        {/* Canlı İzleme Aksiyonu */}
        <button
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-surface-container-lowest font-label-md text-label-md font-semibold text-primary-container shadow-sm transition-all hover:bg-surface-container sm:w-auto"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          <span>Canlı Görüşme İzle (3)</span>
        </button>
      </div>
    </div>
  );
}
