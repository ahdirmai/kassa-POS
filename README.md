# Kassa POS Ecosystem

Monorepo terpadu untuk seluruh ekosistem **Kassa** dengan pemisahan ketat antara layanan **Tenant POS (`app` / `app-api`)** dan **Platform Back Office (`admin` / `admin-api`)**:

```text
Pos/
├── apps/
│   ├── api/            # POS API (`app-api.kassa.biz.id`, port 4000) — Express + Prisma + MySQL 8 + Socket.IO
│   ├── admin-api/      # Back Office API (`admin-api.kassa.biz.id`, port 4001) — Platform Auth, Tenants, Billing, Audit
│   ├── web/            # POS Web App (`app.kassa.biz.id`, port 3000) — Next.js 15
│   ├── landing/        # Landing Page (`kassa.biz.id`, port 3005) — Next.js 15
│   ├── backoffice/     # Back Office Web (`admin.kassa.biz.id`, port 3006) — Next.js 15
│   └── mobile/         # POS Mobile App (Android & iOS) — Flutter
├── packages/
│   └── shared/         # @pos/shared — Zod schemas, kalkulasi total, konversi satuan, & PLAN_POLICIES
├── docker/             # Docker Compose (dev & prod), Nginx multi-domain, Dockerfiles
├── docs/               # PRD, System Design, Deployment Guide, Manual Book, & Strategi Marketing
└── assets/
    └── branding/       # Official Brand Identity Kit (SVG icons, lockups, favicon, thermal mark, brand-tokens.css)
```

## Cara Menjalankan Lokal

```bash
# 1. Install dependensi monorepo
pnpm install

# 2. Jalankan MySQL & Redis (Docker)
pnpm docker:up

# 3. Push schema & seed (termasuk akun Superadmin Back Office)
pnpm db:push
pnpm db:seed

# 4. Jalankan semua aplikasi sekaligus
pnpm dev
```

| Layanan | Perintah Individual | URL Lokal | Domain Produksi |
|---|---|---|---|
| **POS API** (`apps/api`) | `pnpm dev:api` | `http://localhost:4000` | `app-api.kassa.biz.id` |
| **Back Office API** (`apps/admin-api`) | `pnpm dev:admin-api` | `http://localhost:4001` | `admin-api.kassa.biz.id` |
| **POS Web** (`apps/web`) | `pnpm dev:web` | `http://localhost:3000` | `app.kassa.biz.id` |
| **Landing Page** (`apps/landing`) | `pnpm dev:landing` | `http://localhost:3005` | `kassa.biz.id` |
| **Back Office Web** (`apps/backoffice`) | `pnpm dev:backoffice` | `http://localhost:3006` | `admin.kassa.biz.id` |

## PWA, Mode Offline & Auto Sync (`apps/web`)

Aplikasi kasir POS (`apps/web`, fokus rute `/pos`) sudah mendukung **Progressive Web App (PWA)** dan operasional tanpa internet:

- **Installable PWA:** Dilengkapi `manifest.json`, ikon standar & `maskable` (192px/512px/Apple Touch Icon), font `Urbanist` self-hosted (`next/font/google`), serta tombol **Install App** di top bar.
- **Offline App Shell (`/pos`):** Service Worker (`public/sw.js`) meng-cache App Shell `/pos`, static chunks, dan gambar produk agar kasir tetap bisa me-refresh atau membuka `/pos` saat internet mati.
- **Full Catalog Cache (IndexedDB / Dexie):** Menggunakan `GET /api/v1/sync/pull` untuk menyimpan katalog produk, kategori, daftar meja (`areas`), dan konfigurasi pajak/service charge (`settings`) secara lokal. Keranjang POS juga persisten di perangkat.
- **Offline Cash Checkout & Auto Sync:** Pembayaran tunai saat offline (atau saat WiFi terhubung namun server tidak terjangkau) otomatis tersimpan di IndexedDB dengan nomor struk `OFF-xxxxxx`, lalu disinkronkan otomatis ke `POST /api/v1/sync/push` saat koneksi kembali (dengan concurrency lock, periodic retry 30 detik, Background Sync, *poison-pill* fallback per-item, dan modal inspeksi/sync manual di indikator status top bar).

## Brand Identity & Aset Resmi (`assets/branding`)

Seluruh aplikasi (`apps/web`, `apps/landing`, `apps/backoffice`, `apps/mobile`) dan dokumen HTML (`docs/`) menggunakan paket identitas visual resmi **Kassa** (*Editorial Hospitality-Tech* — Monogram `K` dengan aksen *Warm Brass* `#D9A962` di atas *Deep Espresso* `#0B1013`):

- **Sumber Tunggal (Source of Truth):** [`assets/branding/`](./assets/branding/) — berisi `favicon.svg`, `kassa-icon-dark.svg`, `kassa-icon-light.svg`, `kassa-lockup-dark.svg`, `kassa-lockup-light.svg`, `kassa-mark-transparent.svg`, `kassa-monochrome-thermal.svg`, `brand-tokens.css`, dan panduan lengkap di [`assets/branding/BRAND-IDENTITY.md`](./assets/branding/BRAND-IDENTITY.md).
- **Web & PWA:** Setiap aplikasi Next.js menyertakan `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, ikon PWA, `brand-tokens.css`, serta salinan SVG di `public/branding/`.
- **Mobile (Flutter):** Ikon launcher Android (`mipmap-*`), iOS (`AppIcon.appiconset`), splash screen (`launch_background.xml` / `LaunchScreen.storyboard`), dan aset UI/struk thermal di `apps/mobile/assets/branding/`.

## Marketing Hub & Konten Carousel Siap Post (`docs/marketing`)

Seluruh strategi pemasaran 30 hari, brief produksi, dan aset konten Instagram siap tayang tersedia di [`docs/marketing/`](./docs/marketing/) dan terintegrasi dengan **Back Office → Marketing**:

- **14 Deck Instagram Carousel (69 Slide PNG `1080×1350`):** Tersimpan di [`docs/marketing/carousels/`](./docs/marketing/carousels/) (`H02`–`H29`) lengkap dengan `caption.txt` siap salin (caption, CTA + keyword DM, hashtag, first comment, & ide IG Story) serta panduan master di [`docs/marketing/07-Ready-To-Post-Carousels.md`](./docs/marketing/07-Ready-To-Post-Carousels.md).
- **Kanban & Carousel Studio (`apps/backoffice`):** Seluruh 14 konten Carousel otomatis berstatus **Siap Upload** pada papan Kanban, dapat dipreview dalam mode *Swipe IG* maupun *Semua Slide*, dan diunduh langsung per slide PNG dari tab *Carousel Studio*.

## Email Confirmation & Transactional Email (`apps/api` & `apps/web`)

Registrasi Owner baru mewajibkan konfirmasi email (*strict verification*) sebelum dapat login:

- **Alur:** `POST /api/v1/auth/register` → kirim tautan konfirmasi ke `/verify-email?token=...` (berlaku 24 jam, token sekali pakai) → `POST /api/v1/auth/verify-email` otomatis mengaktifkan akun dan mengarahkan ke `/onboarding` (lengkap dengan foto produk pada 19 template menu seeder). Akun staf yang dibuat Owner via RBAC otomatis terverifikasi.
- **Provider (`apps/api/src/lib/mailer.ts`):** Mode `EMAIL_PROVIDER=auto` otomatis memilih **Resend API** jika `RESEND_API_KEY` diisi (rekomendasi untuk domain Cloudflare `noreply@kassa.biz.id`, lengkap dengan `Idempotency-Key` & retry backoff), **SMTP (`nodemailer`)** jika `SMTP_HOST` diisi, atau **Console Mode** di dev lokal.
- **Konfigurasi Env:** Lihat variabel `APP_WEB_URL`, `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`, dan `SMTP_*` di [`.env.example`](./.env.example).

## Landing Page / Digital Menu Pro & Upgrade via WhatsApp

- **Digital Menu Publik (`kassa.biz.id/p/[slug]`):** Fitur khusus paket **Kassa Pro** yang dikelola dari `app.kassa.biz.id/admin/digital-menu`, lengkap dengan SSR Next.js, metadata SEO dinamis, JSON-LD Schema.org (`CafeOrCoffeeShop`, `hasMenu`, `BreadcrumbList`), dynamic `sitemap.xml`, dan `robots.txt`.
- **Upgrade Pro via WhatsApp:** Tombol aktivasi paket Kassa Pro pada `app.kassa.biz.id/admin/outlets` langsung mengarah ke WhatsApp resmi Kassa (`62895388220777` / `NEXT_PUBLIC_SUPPORT_WA`) dengan pesan otomatis berisi profil bisnis & tenant.

Lihat riwayat perubahan lengkap di [CHANGELOG.md](./CHANGELOG.md).
