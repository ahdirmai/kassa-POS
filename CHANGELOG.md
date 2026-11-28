# Changelog

Semua perubahan penting pada proyek **Tumpu POS Ecosystem** dicatat dalam file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) dan [Conventional Commits](https://www.conventionalcommits.org/).

## [Unreleased]

## [1.4.0] - 2026-11-22

### Added
- **Strict Email Confirmation & Multi-Provider Mailer (`apps/api`, `apps/web`, `@pos/shared`):**
  - Menambahkan kolom `User.emailVerifiedAt` dan tabel `EmailVerificationToken` (SHA-256 token hash, masa berlaku 24 jam, sekali pakai) pada `apps/api/prisma/schema.prisma`.
  - Menambahkan adapter email multi-provider di `apps/api/src/lib/mailer.ts` yang mendukung **Resend API** (dengan `Idempotency-Key` dan retry exponential backoff untuk error jaringan/`429`/`5xx`), **SMTP (`nodemailer`)**, serta **Console Mode** otomatis untuk pengembangan lokal.
  - Menambahkan endpoint `POST /api/v1/auth/verify-email` (validasi token & langsung menerbitkan sesi login untuk lanjut ke `/onboarding`) dan `POST /api/v1/auth/resend-verification` (dengan proteksi cooldown 60 detik / `429 RESEND_COOLDOWN`).
  - Memperbarui `POST /api/v1/auth/register` agar mewajibkan konfirmasi email (`requiresEmailVerification: true`) dan `POST /api/v1/auth/login` agar menolak akun yang belum terverifikasi (`403 EMAIL_NOT_VERIFIED`).
  - Menambahkan halaman `apps/web/src/app/verify-email/page.tsx`, layar "Cek Kotak Masuk Email Anda" dengan tombol kirim ulang di `apps/web/src/app/register/page.tsx`, serta tombol kirim ulang cepat saat error `EMAIL_NOT_VERIFIED` di `apps/web/src/app/login/page.tsx`.
  - Akun seed (`apps/api/prisma/seed.ts`) dan akun staf yang dibuat Owner (`apps/api/src/modules/rbac/rbac.routes.ts`) otomatis terverifikasi.
  - Menambahkan konfigurasi env email (`APP_WEB_URL`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`, `SMTP_*`) pada `.env.example`, `apps/api/src/config/env.ts`, dan `docker/docker-compose.prod.yml`.

### Changed
- **Onboarding & Demo Seeder Photos (`@pos/shared`, `apps/api`):**
  - Menambahkan foto produk (`imageUrl`) ke seluruh 19 template menu di `packages/shared/src/onboarding.ts` dan menyimpannya saat dynamic onboarding seeder berjalan (`apps/api/src/modules/onboarding/onboarding.routes.ts`), serta menambahkan `heroImageUrl` untuk Digital Menu demo `kopi-senja` di `apps/api/prisma/seed.ts`.
- **Direct WhatsApp Upgrade CTA (`apps/web/src/app/admin/outlets/page.tsx`):**
  - Mengarahkan tombol aktivasi/upgrade Tumpu Pro langsung ke WhatsApp resmi Tumpu (`62895388220777` / `NEXT_PUBLIC_SUPPORT_WA`) dengan pesan otomatis berisi nama bisnis, slug tenant, email owner, dan jumlah outlet.

## [1.3.0] - 2026-11-22

### Added
- **14 Ready-to-Post Instagram Carousels (`docs/marketing/carousels/`, 69 Slide PNG `1080×1350`):**
  - Menghasilkan seluruh 14 deck Carousel Instagram dari rencana konten 30 hari Tumpu (`H2`, `H4`, `H5`, `H7`, `H9`, `H11`, `H13`, `H16`, `H18`, `H20`, `H23`, `H25`, `H27`, `H29`) dalam format PNG `1080×1350` (4:5) sesuai panduan visual *Editorial Hospitality-Tech* lengkap dengan screenshot produk asli dan logo Tumpu.
  - Menyertakan `caption.txt` siap salin di setiap folder (caption final, CTA + keyword DM, hashtag, first comment, jadwal tayang WIB, dan ide IG Story pendamping) serta skrip generator di `docs/marketing/carousels/_generator/` untuk kebutuhan re-render cepat.
  - Menambahkan panduan master & checklist publikasi di `docs/marketing/07-Ready-To-Post-Carousels.md` dan memperbarui `docs/marketing/README.md`.
- **Back Office Marketing Kanban & Carousel Studio (`apps/backoffice`):**
  - Menambahkan field `defaultStatus`, `assetPath`, dan `slideCount` pada `ContentPost` (`apps/backoffice/src/data/marketing-data.ts`) dengan seluruh 14 konten Carousel otomatis berstatus `siap` (**Siap Upload**) dan caption tersinkronisasi.
  - Memperbarui `MarketingSection.tsx` agar `getStatus` menghormati `defaultStatus` dan `ContentKanban.tsx` dengan badge `Siap Post · N Slide PNG` serta tombol 1-klik salin path aset di modal detail.
  - Memperluas `CarouselStudio.tsx` dari 4 deck menjadi seluruh **14 deck (`H2`–`H29`)** menggunakan PNG `1080×1350` di `apps/backoffice/public/carousels/` lengkap dengan tombol **Download PNG** per slide.

## [1.2.0] - 2026-11-22

### Changed
- **Official Brand Identity & Favicon Rollout (`apps/web`, `apps/landing`, `apps/backoffice`, `apps/mobile`, `docs`):**
  - Menerapkan seluruh aset identitas visual resmi dari `assets/branding/` (Monogram `K` geometris dengan *Warm Brass* `#D9A962` chevron di atas *Deep Espresso* `#0B1013`) dan token CSS (`brand-tokens.css`) secara konsisten di seluruh produk.
  - **Favicon & App Icons:** Mengganti dan melengkapi `favicon.svg`, `favicon.ico` (multi-ukuran 16/32/48px), `icon.svg`, `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`, dan `icon-maskable-512.png` di `apps/web`, `apps/landing`, `apps/backoffice`, serta `<link rel="icon">` di dokumen HTML (`docs/manual-book`, `docs/pitch-deck`, `docs/audit-report`).
  - **POS Web (`apps/web`):** Mengganti mark teks `K` pada header shell, login, register, dan onboarding dengan komponen `TumpuBrandMark` (`/branding/tumpu-icon-dark.svg`), menyelaraskan warna `manifest.json` & `viewport` (`#F6F4EF` / `#0B1013`), menambahkan logo struk 1-bit (`tumpu-monochrome-thermal.svg`) pada `ReceiptModal`, serta meningkatkan versi cache Service Worker (`v2`) untuk precache aset branding.
  - **Landing Page (`apps/landing`):** Mengganti `src/app/icon.svg` lama dengan favicon resmi, memperbarui logo di navbar, footer, landing admin login/dashboard, footer Digital Menu, serta simulator struk thermal (`ThermalReceiptWidget`).
  - **Back Office (`apps/backoffice`):** Menambahkan favicon & ikon aplikasi, mengganti mark teks `K` pada shell, login, dan footer slide `CarouselStudio`, menyelaraskan warna *Espresso Surface* (`#141B1F`), serta menambahkan galeri preview & unduh **Official Brand Logo Kit (SVG)** di tab *Marketing → Brand & Warna*.
  - **Mobile App (`apps/mobile`):** Mengganti seluruh ikon launcher bawaan Flutter di Android (`mipmap-mdpi` s.d. `mipmap-xxxhdpi` + splash `launch_background.xml`) dan iOS (`AppIcon.appiconset` 15 ukuran + `LaunchImage.imageset` & `LaunchScreen.storyboard`), mendaftarkan `assets/branding/` di `pubspec.yaml`, serta menerapkan logo resmi di splash loading, layar login, AppBar utama, dan preview struk thermal.
  - **Dokumentasi (`docs/`):** Mengganti seluruh badge teks `K` pada `manual-book`, `pitch-deck`, dan `audit-report` dengan vektor logo resmi Tumpu.

## [1.1.0] - 2026-11-22

### Added
- **PWA Full Support (`apps/web`):**
  - Service Worker (`apps/web/public/sw.js`) dengan precache App Shell (`/pos`, `/login`, `/offline.html`), caching `CacheFirst` untuk static chunks/ikon, `NetworkFirst` + fallback cache untuk navigasi & RSC, `StaleWhileRevalidate` untuk gambar produk, serta dukungan Background Sync (`tumpu-offline-sync`).
  - Halaman fallback offline (`apps/web/public/offline.html`).
  - Set lengkap ikon PWA (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `icon.svg`, `favicon.svg`) dari aset branding Tumpu.
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
