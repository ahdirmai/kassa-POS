import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-urbanist",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efefec" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1013" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Kassa — POS Cafe & Rumah Makan",
  description:
    "Kassa (app.kassa.biz.id) — Sistem Point of Sale Cafe & Rumah Makan dengan mode offline, KDS Kanban realtime, dan kontrol HPP.",
  manifest: "/manifest.json",
  applicationName: "Kassa POS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kassa POS",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      data-theme="light"
      data-accent="ocean"
      className={urbanist.variable}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
