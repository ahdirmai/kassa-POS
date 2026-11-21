# Kassa POS Ecosystem

Monorepo terpadu untuk seluruh ekosistem **Kassa** dengan pemisahan ketat antara layanan **Tenant POS (`app` / `app-api`)** dan **Platform Back Office (`admin` / `admin-api`)**:

```text
Pos/
├── apps/
│   ├── api/            # POS API (`app-api.kassa.biz.id`, port 4000) — Express + Prisma + MySQL 8 + Socket.IO
│   ├── admin-api/      # Back Office API (`admin-api.kassa.biz.id`, port 4001) — Platform Auth, Tenants, Billing, Audit
│   ├── web/            # POS Web App (`app.kassa.biz.id`, port 3000) — Next.js 15
│   ├── landing/        # Landing Page (`kassa.biz.id`, port 3005) — Next.js 15
│   └── backoffice/     # Back Office Web (`admin.kassa.biz.id`, port 3006) — Next.js 15
├── packages/
│   └── shared/         # @pos/shared — Zod schemas, kalkulasi total, konversi satuan, & PLAN_POLICIES
├── docker/             # Docker Compose (dev & prod), Nginx multi-domain, Dockerfiles
├── docs/               # PRD, System Design, Deployment Guide, Manual Book, & Strategi Marketing
└── assets/             # Aset video & media produksi marketing
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

Lihat riwayat perubahan lengkap di [CHANGELOG.md](./CHANGELOG.md).
