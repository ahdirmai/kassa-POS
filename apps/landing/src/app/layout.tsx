import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kassa — Sistem POS All-In untuk Cafe & Rumah Makan",
  description:
    "Sistem kasir POS offline-ready, Kitchen Display Kanban realtime, stok bahan & HPP otomatis, multi-outlet, dan Menu Digital SEO dalam satu sistem mulai Rp0–Rp49rb/bln.",
  metadataBase: new URL("https://kassa.biz.id"),
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  keywords: [
    "aplikasi kasir cafe",
    "POS rumah makan",
    "sistem kasir offline",
    "KDS dapur realtime",
    "hitung HPP cafe",
    "menu digital QR",
    "Kassa POS",
  ],
  openGraph: {
    title: "Kassa — Sistem POS All-In untuk Cafe & Rumah Makan",
    description:
      "Kasir cepat offline-ready, dapur KDS realtime, stok HPP otomatis, dan Menu Digital SEO mulai Rp0–Rp49rb/bln.",
    url: "https://kassa.biz.id",
    siteName: "Kassa POS",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/screenshots/04-dashboard.png",
        width: 1200,
        height: 630,
        alt: "Dashboard Kassa POS — Kasir, Dapur KDS, dan Stok HPP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kassa — Sistem POS All-In untuk Cafe & Rumah Makan",
    description:
      "Kasir cepat offline-ready, dapur KDS realtime, stok HPP otomatis, dan Menu Digital SEO.",
    images: ["/screenshots/04-dashboard.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
