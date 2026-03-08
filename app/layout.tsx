import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Noto_Serif_Ethiopic } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";

// ── Fonts ─────────────────────────────────────────────────────────────────────

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const notoSerif = Noto_Serif_Ethiopic({
  variable: "--font-noto-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// ── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "የዝማሬ ማዕድ | Ethiopian Orthodox Tewahedo Mezmurs",
    template: "%s | የዝማሬ ማዕድ",
  },
  description:
    "The ultimate digital sanctuary for Ethiopian Orthodox Tewahedo Mezmurs. Listen to over 1,500+ hymns, discover Zemarian, and curate your spiritual playlists.",
  applicationName: "የዝማሬ ማዕድ",
  keywords: [
    "Ethiopian Orthodox",
    "Mezmur",
    "Tewahedo",
    "የኦርቶዶክስ መዝሙር",
    "Zemari",
    "Ge'ez",
  ],
  authors: [{ name: "የዝማሬ ማዕድ" }],
  openGraph: {
    type: "website",
    locale: "am_ET",
    siteName: "የዝማሬ ማዕድ",
    title: "የዝማሬ ማዕድ | Ethiopian Orthodox Tewahedo Mezmurs",
    description: "The ultimate digital sanctuary for Ethiopian Orthodox Tewahedo Mezmurs. Listen to over 1,500+ hymns, discover Zemarian, and curate your spiritual playlists.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0807" },
    { media: "(prefers-color-scheme: light)", color: "#ede9e0" },
  ],
  width: "device-width",
  initialScale: 1,
};

// ── Root Layout ───────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="am" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/*
         * Anti-flash script:
         * Runs synchronously before first paint — reads localStorage and applies
         * the correct data-theme attribute so there is NEVER a flash of the wrong theme.
         * Falls back to OS preference if no saved theme exists.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var s=localStorage.getItem('mezmur-theme');
              var d=window.matchMedia('(prefers-color-scheme: light)').matches?'holy-parchment':'sacred-night';
              document.documentElement.setAttribute('data-theme',s||d);
            }catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${notoSerif.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
