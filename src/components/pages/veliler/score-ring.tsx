import { clsx } from "@/lib/clsx";

/* Lead skor halkası (SVG ring) */
export function ScoreRing({
  value,
  ringClass,
  labelClass,
}: {
  value: number;
  ringClass: string;
  labelClass: string;
}) {
  return (
    <div className="flex shrink-0 flex-col items-end">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-surface-container-highest"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className={ringClass}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeDasharray={`${value}, 100`}
            strokeLinecap="round"
            strokeWidth="3.2"
          />
        </svg>
        <span className="absolute font-mono-data text-[11px] font-semibold text-on-surface">
          {value}
        </span>
      </div>
      <span
        className={clsx(
          "font-label-sm text-[9px] font-semibold",
          labelClass
        )}
      >
        Skor
      </span>
    </div>
  );
}
