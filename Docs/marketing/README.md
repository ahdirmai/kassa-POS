# Marketing Hub — Kassa (`kassa.biz.id`)

Folder ini berisi **Aplikasi Next.js Marketing Manager** beserta seluruh dokumentasi strategi pemasaran & konten 7 hari untuk Instagram dan Threads.

## Struktur Folder

- **[`manager/`](./manager/)** — **Next.js 15 Marketing Management App** (`http://localhost:3006`):
  - **Kalender & Brief (28 Konten: 7 IG + 21 Threads):** Tracking status (`Draft`, `Produksi`, `Siap Upload`, `Published`), edit caption langsung, tambah konten baru, filter platform/hari, backup JSON (`localStorage`), dan 1-klik salin copy.
  - **Carousel Studio (4:5 · 1080×1350):** Preview interaktif seluruh 4 deck Carousel (19 slide) lengkap foto F&B HD & screenshot Kassa — mode Swipe IG (`←/→`), mode Semua Slide, dan siap Print/PDF.
  - **Preview Grid IG 7 Hari**, **Brand Color Guide (1-klik copy HEX)**, dan **Script DM/WhatsApp**.
- **[`docs/`](./docs/)** — Dokumentasi Markdown lengkap:
  1. [01-Strategi-Marketing-Kassa.md](./docs/01-Strategi-Marketing-Kassa.md)
  2. [02-Content-Plan-Instagram-7-Hari.md](./docs/02-Content-Plan-Instagram-7-Hari.md)
  3. [03-Content-Plan-Threads-7-Hari.md](./docs/03-Content-Plan-Threads-7-Hari.md)
  4. [04-Brand-Color-and-Visual-Guide.md](./docs/04-Brand-Color-and-Visual-Guide.md)
  5. [05-Production-Brief-Instagram-7-Hari.md](./docs/05-Production-Brief-Instagram-7-Hari.md)
- **[`legacy-html/`](./legacy-html/)** — Versi arsip HTML statis (`content-hub.html` & `carousel-preview.html`).

## Menjalankan Next.js Marketing Manager
```bash
cd Marketing/manager
pnpm install --ignore-workspace
pnpm dev
# Buka http://localhost:3006
```
