import { clsx } from "@/lib/clsx";
import type { AudioPlayerData } from "@/lib/mock/calls";

/* Tailwind tarayıcısının yakalayabilmesi için bar yükseklikleri literal class */
const barHeight: Record<number, string> = {
  3: "h-3",
  4: "h-4",
  5: "h-5",
  6: "h-6",
  7: "h-7",
  8: "h-8",
  9: "h-9",
  10: "h-10",
  11: "h-11",
  12: "h-12",
  13: "h-13",
  14: "h-14",
};

/**
 * Ses oynatıcı — kayıt saklama (audio_url) henüz entegre değil; sahte oynatma/
 * indirme kontrolleri yerine dürüst bilgilendirme + statik dalga görseli sunar.
 * Gerçek kayıt URL'i veri yoluna eklendiğinde buraya gerçek <audio> bağlanacak.
 */
export function AudioPlayer({ audio }: { audio: AudioPlayerData }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5">
      {/* Kanal bilgisi */}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-label-md text-label-md font-semibold text-on-surface">
            {audio.channelTitle}
          </span>
          <span className="truncate font-label-sm text-label-sm text-on-surface-variant">
            {audio.channelSubtitle}
          </span>
        </div>
      </div>

      {/* Dalga görselleştirici (statik görsel) */}
      <div className="w-full rounded-xl bg-surface-container-low px-3 py-2">
        <div className="flex h-14 items-center justify-between gap-1">
          {audio.playedBars.map((height, index) => (
            <span
              key={`played-${index}`}
              className={clsx("anim-bar w-1 rounded-full bg-primary", barHeight[height])}
            />
          ))}
          {/* Konum işaretçisi */}
          <div className="relative flex items-center justify-center">
            <span
              className={clsx(
                "anim-bar w-1 rounded-full bg-primary",
                barHeight[audio.markerBar]
              )}
            />
            <div className="absolute -top-1 h-2.5 w-2.5 rounded-full border-2 border-surface-container-lowest bg-primary" />
          </div>
          {audio.upcomingBars.map((height, index) => (
            <span
              key={`upcoming-${index}`}
              className={clsx(
                "w-1 rounded-full bg-outline-variant",
                barHeight[height]
              )}
            />
          ))}
        </div>
        {/* Sayaç */}
        <div className="mt-1 flex items-center justify-between font-mono-data text-mono-data text-on-surface-variant">
          <span className="font-semibold text-primary">{audio.elapsed}</span>
          <span>{audio.total}</span>
        </div>
      </div>

      {/* Dürüst durum: kayıt saklama entegrasyonu bekleniyor */}
      <div className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2.5 text-on-surface-variant">
        <span className="material-symbols-outlined shrink-0 text-[18px] text-outline">
          volume_off
        </span>
        <span className="font-label-sm text-label-sm leading-snug">
          Kayıt henüz saklanmıyor — oynatma ve indirme, kayıt saklama entegrasyonu
          sonrası açılacak.
        </span>
      </div>
    </div>
  );
}
