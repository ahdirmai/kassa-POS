import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Kassa — POS Cafe & Rumah Makan",
  description: "Kassa (app.kassa.biz.id) — Sistem Point of Sale Cafe & Rumah Makan dengan mode offline, KDS Kanban realtime, dan kontrol HPP.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="light" data-accent="ocean" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
