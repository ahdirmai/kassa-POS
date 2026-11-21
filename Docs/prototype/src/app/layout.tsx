import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadra POS — Interactive Prototype (No Backend)",
  description: "Prototype interaktif POS Cafe & Rumah Makan berbasis Next.js tanpa backend (localStorage).",
};

export default function PrototypeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="light" data-accent="ocean">
      <body>
        <div className="mesh" aria-hidden="true">
          <i className="mesh__a" />
          <i className="mesh__b" />
        </div>
        {children}
      </body>
    </html>
  );
}
