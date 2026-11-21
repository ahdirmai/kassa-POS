# Changelog

Semua perubahan penting pada proyek **Kassa POS Ecosystem** dicatat dalam file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) dan [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

## [1.1.0] - 2026-11-22

### Added
- **PWA Full Support (`apps/web`):**
  - Service Worker (`apps/web/public/sw.js`) dengan precache App Shell (`/pos`, `/login`, `/offline.html`), caching `CacheFirst` untuk static chunks/ikon, `NetworkFirst` + fallback cache untuk navigasi & RSC, `StaleWhileRevalidate` untuk gambar produk, serta dukungan Background Sync (`kassa-offline-sync`).
  - Halaman fallback offline (`apps/web/public/offline.html`).
  - Set lengkap ikon PWA (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `icon.svg`, `favicon.svg`) dari aset branding Kassa.
  - Web App Manifest lengkap (`apps/web/public/manifest.json`) dengan `icons`, `maskable`, `shortcuts`, serta metadata `viewport` & `appleWebApp` untuk iOS/iPadOS.
  - Tombol **Install App** pada top bar saat event `beforeinstallprompt` tersedia.
- **Dedicated Auto Sync Engine & Offline Queue UI (`apps/web`):**
  - `apps/web/src/lib/sync-engine.ts` dengan concurrency lock (mencegah double-push), health check `/health`, dan *poison-pill recovery* (fallback per-item saat 1 transaksi dalam batch gagal agar antrean lain tidak macet).
  - Modal **Status Offline & Auto Sync** (`apps/web/src/components/offline-queue-modal.tsx`) yang dapat dibuka dari indikator `Online / Offline` di top bar untuk melihat antrean pending/gagal/tersinkron serta tombol **Sinkronkan Sekarang** manual.
  - Retry auto-sync periodik (setiap 30 detik), saat event `online` (dengan delay stabilisasi 1.5s), `visibilitychange`, dan pesan Background Sync dari Service Worker, diikuti invalidasi cache TanStack Query.

### Changed
- **Offline POS Mode (`apps/web/src/app/pos/page.tsx`):**
  - Beralih ke `GET /api/v1/sync/pull` untuk meng-cache **produk, kategori, meja (`areas`), dan konfigurasi pajak/service charge (`settings`)** ke IndexedDB (`Dexie` v2).
  - Menambahkan fallback otomatis ke transaksi tunai offline apabila `fetch` gagal karena jaringan terputus meski `navigator.onLine` bernilai `true`.
  - Menggunakan `generateClientUuid()` yang aman di luar Secure Context (HTTP LAN).
  - Menambahkan persistensi keranjang POS (`cadra_pos_cart`) pada Zustand `pos-store`.
- **Offline-Safe Typography:** Memindahkan font `Urbanist` dari Google Fonts CDN `@import` ke `next/font/google` (self-hosted).
- **SW Cache Headers:** Menambahkan header `Cache-Control: no-cache, no-store, must-revalidate` untuk `/sw.js` di `apps/web/next.config.mjs`.

## [1.0.0] - 2026-11-21

### Added
- Production hardening, Docker Compose stack (`dev` & `prod`), Nginx multi-domain, serta pemisahan layanan POS (`api`/`web`) dan Back Office (`admin-api`/`backoffice`).
- Landing Page (`apps/landing`) dengan Digital Menu publik, SEO/UTM tracking, dan integrasi WhatsApp produksi.
