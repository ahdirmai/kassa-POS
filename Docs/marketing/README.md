# Marketing Hub — Kassa (`kassa.biz.id`)

Folder ini berisi seluruh dokumentasi strategi pemasaran, panduan visual resmi, rencana konten 30 hari (Instagram & Threads), prompt video, serta **14 deck Instagram Carousel siap posting (69 slide PNG `1080×1350`)**.

---

## Struktur Dokumentasi & Aset

### Dokumen Strategi & Konten
1. [01-Strategi-Marketing-Kassa.md](./01-Strategi-Marketing-Kassa.md) — Positioning, ICP (Coffee Shop & Rumah Makan), funnel konversi, & KPI.
2. [02-Content-Plan-Instagram-7-Hari.md](./02-Content-Plan-Instagram-7-Hari.md) — Rencana konten Instagram Minggu 1.
3. [03-Content-Plan-Threads-7-Hari.md](./03-Content-Plan-Threads-7-Hari.md) — Rencana 21 post Threads Minggu 1.
4. [04-Brand-Color-and-Visual-Guide.md](./04-Brand-Color-and-Visual-Guide.md) — Palet warna resmi (*Editorial Hospitality-Tech*), tipografi, safe zone `1080×1350` & `1080×1920`.
5. [05-Production-Brief-Instagram-7-Hari.md](./05-Production-Brief-Instagram-7-Hari.md) — Brief produksi detail per konten Minggu 1.
6. [06-Content-Plan-30-Hari-dan-Prompt-Video.md](./06-Content-Plan-30-Hari-dan-Prompt-Video.md) — Kalender 30 hari lengkap (Instagram Reels/Carousel + Threads) & prompt video Google Flow / HyperFrames.
7. [07-Ready-To-Post-Carousels.md](./07-Ready-To-Post-Carousels.md) — Master index & panduan upload untuk **14 Carousel siap post (69 slide PNG)** lengkap DM keyword & quick-copy captions.

### Aset Siap Upload
- **[`carousels/`](./carousels/)** — 14 folder Carousel (`H02-hpp-kopi-susu` hingga `H29-faq-lengkap-kassa`), masing-masing berisi:
  - `slide-01.png` ... `slide-0N.png` (`1080×1350 px`, 4:5 PNG)
  - `caption.txt` (Caption IG siap paste, First Comment, & Companion IG Story)
  - `_generator/` — Script Playwright untuk re-render seluruh 69 slide jika ada update copy.

---

## Integrasi Back Office (`apps/backoffice`)

Pengelolaan status konten, edit caption, preview visual, dan download PNG terintegrasi langsung di Back Office Kassa (**Tab Marketing**):
- **Kanban Konten:** Seluruh 14 Carousel otomatis berada di kolom **Siap Upload** lengkap badge jumlah slide & path aset.
- **Carousel Studio:** Preview interaktif semua 14 deck (69 slide PNG asli dari `apps/backoffice/public/carousels/`) dalam mode **Swipe IG** & **Semua Slide**, dilengkapi tombol **Download PNG** 1-klik.
- **Brand & Warna** + **Script DM:** Logo kit SVG resmi, 1-klik salin HEX, dan template balasan DM/WhatsApp.
