import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tumpu Back Office — Platform Control Center",
  description: "Pusat kendali Account, Subscription, Landing, dan Marketing untuk ekosistem Tumpu POS.",
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="light" data-accent="ocean" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
