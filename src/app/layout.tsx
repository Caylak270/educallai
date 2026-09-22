import type { Metadata } from "next";
import {
  Inter,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500"],
});

/* Web sitesindeki fiyat/metrik gösterimleri için modern rakam fontu */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://educallai.com"),
  title: {
    default: "educallai — Dershane AI Hub",
    template: "%s | educallai",
  },
  description:
    "Dershaneler için 7/24 AI sesli asistan: veli arama, tahsilat takibi, deneme analizi ve WhatsApp otomasyonu — tek platformda.",
  openGraph: {
    siteName: "educallai",
    locale: "tr_TR",
    type: "website",
  },
  icons: {
    icon: [{ url: "/brand/icon.png", type: "image/png" }],
  },
};

/** Tema tercihini ilk boyamadan önce uygular (FOUC engeli). */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("educallai-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
