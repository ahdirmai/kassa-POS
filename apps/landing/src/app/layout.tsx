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
  title: "Kassa — Sistem POS untuk Cafe & Rumah Makan (kassa.biz.id)",
  description:
    "Sistem kasir POS, Kitchen Display Kanban realtime, manajemen stok bahan baku & HPP, serta RBAC dinamis untuk cafe dan rumah makan. Tetap jalan saat internet padam.",
  metadataBase: new URL("https://kassa.biz.id"),
  openGraph: {
    title: "Kassa — Sistem POS untuk Cafe & Rumah Makan",
    description:
      "Kasir cepat, dapur realtime, stok terukur, dan laporan bersih dalam satu sistem kerja.",
    url: "https://kassa.biz.id",
    siteName: "Kassa",
    locale: "id_ID",
    type: "website",
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
