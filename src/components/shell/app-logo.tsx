import { clsx } from "@/lib/clsx";

export function AppLogo({
  className = "h-8 w-auto",
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return showText ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/wordmark.png" alt="educallai" role="img" className={clsx("w-auto", className)} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/icon.png" alt="" className={clsx("w-auto", className)} />
  );
}
