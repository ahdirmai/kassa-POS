# Dokumentasi & Prototype — Kassa (`kassa.biz.id` / `app.kassa.biz.id`)

Folder ini berisi seluruh dokumentasi teknis & produk serta **Prototype interaktif Next.js tanpa Backend**.

## Daftar Dokumen
1. [01-PRD.md](./01-PRD.md) — Product Requirements Document, Persona, RBAC, & Scope Fase 1–4.
2. [02-System-Design.md](./02-System-Design.md) — Arsitektur Monorepo, Kalkulasi Total, Offline Sync Idempotent, Realtime Socket.IO, & Strategi Payment Gateway.
3. [03-Design-System.md](./03-Design-System.md) — Cadra POS Design System (Tokens, Light/Dark, 5 Aksen, Glassmorphism, POS Tiles, Struk Thermal).
4. [04-Database-Schema.md](./04-Database-Schema.md) — Skema MySQL 8 InnoDB, ERD, BIGINT Rupiah, Indeks, & Ledger Append-Only.
5. [05-API-Spec.md](./05-API-Spec.md) — Daftar Endpoint REST `/api/v1` & Event Socket.IO.
6. [06-Runbook-and-Deployment.md](./06-Runbook-and-Deployment.md) — Panduan Setup Lokal, Dummy Data, & Checklist UAT/Go-Live.
7. [07-Deployment-Guide.md](./07-Deployment-Guide.md) — Panduan Deployment Produksi (Cloud VPS Docker + Nginx/HTTPS, On-Premise Mini PC LAN, Backup Cron, & Security Hardening).

## Manual Book Pengguna (HTML & PDF + Screenshot Asli)
- **PDF Siap Pakai / Cetak (Kassa):** [`Docs/Kassa-Manual-Book.pdf`](./Kassa-Manual-Book.pdf)
- **Sumber HTML & 10 Screenshot Retina:** [`Docs/manual-book/index.html`](./manual-book/index.html)

## Landing Page & Marketing (`kassa.biz.id`)
- **Folder Terpisah (Standalone Next.js):** [`landing/`](../landing/) (`pnpm dev` → `http://localhost:3005`)
- **Strategi Marketing & Content Plan 7 Hari (IG & Threads):** [`Marketing/`](../Marketing/)

## Prototype Interaktif (Next.js Tanpa Backend)
Lokasi: [`Docs/prototype/`](./prototype/)

```bash
cd Docs/prototype
pnpm install
pnpm dev
# Buka http://localhost:3001
```
Prototype berjalan 100% di sisi client (`localStorage`) dengan desain visual Cadra, simulasi kasir POS, modifier, denah meja, pembayaran tunai/QRIS manual, struk thermal bergerigi, KDS dapur, stok/HPP, shift, dan dashboard owner.
