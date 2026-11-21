import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kassa Back Office — Platform Control Center",
  description: "Pusat kendali Account, Subscription, Landing, dan Marketing untuk ekosistem Kassa POS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="light" data-accent="ocean" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
