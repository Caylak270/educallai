import { clsx } from "@/lib/clsx";

export function AppLogo({
  className = "h-8 w-auto",
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <svg
      viewBox={showText ? "0 0 160 40" : "0 0 48 48"}
      fill="none"
      className={clsx(!showText && "h-8 w-8", className)}
      aria-label="educallai"
      role="img"
    >
      {showText ? (
        <>
          <rect width="36" height="36" y="2" rx="10" fill="#4F46E5" />
          <path
            d="M11 15C11 12.7909 12.7909 11 15 11H21C23.2091 11 25 12.7909 25 15V21C25 23.2091 23.2091 25 21 25H16L12 28V24.5C11.38 23.85 11 22.98 11 22V15Z"
            fill="#14B8A6"
          />
          <path
            d="M15 18V18.01M18 16V20M21 17V19"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <text
            x="44"
            y="26"
            fontFamily="Plus Jakarta Sans, Inter, sans-serif"
            fontSize="20"
            fontWeight="800"
            fill="#1E1B4B"
            letterSpacing="-0.5"
          >
            educall
            <tspan fill="#4F46E5">ai</tspan>
          </text>
        </>
      ) : (
        <>
          <rect width="48" height="48" rx="12" fill="#4F46E5" />
          <path
            d="M14 16C14 13.7909 15.7909 12 18 12H30C32.2091 12 34 13.7909 34 16V26C34 28.2091 32.2091 30 30 30H22L16 35V30H18C15.7909 30 14 28.2091 14 26V16Z"
            fill="white"
            fillOpacity="0.2"
          />
          <rect x="18" y="19" width="2.5" height="6" rx="1.25" fill="#14B8A6" />
          <rect x="22.5" y="16" width="2.5" height="12" rx="1.25" fill="#FFFFFF" />
          <rect x="27" y="18" width="2.5" height="8" rx="1.25" fill="#14B8A6" />
        </>
      )}
    </svg>
  );
}
