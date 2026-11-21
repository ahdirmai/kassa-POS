# 06 — Runbook, Setup & Deployment

## 1. Setup Pengembangan Lokal (Fullstack)

### Prasyarat
- Node.js 20+
- pnpm 10+
- Docker Desktop (untuk MySQL 8 & Redis 7)

### Langkah Menjalankan
```bash
# 1. Jalankan MySQL 8 (port 3316) & Redis 7 (port 6380)
pnpm docker:up

# 2. Install seluruh workspace
pnpm install

# 3. Generate Prisma Client, push schema & seed data awal
pnpm --filter @pos/api db:generate
pnpm db:push
pnpm db:seed

# 4. Jalankan unit test kalkulasi (@pos/shared)
pnpm test

# 5. Jalankan API (port 4000) & Web (port 3000) bersamaan
pnpm dev
```

### Akun Seed Default (Kopi & Dapur Senja)
| Peran | Email | Password | PIN Cepat |
| :--- | :--- | :--- | :--- |
| Owner | `owner@senja.id` | `password123` | `1111` |
| Manager | `manager@senja.id` | `password123` | `2222` |
| Kasir (Shift Pagi) | `kasir@senja.id` | `password123` | `1234` |
| Kasir (Shift Sore) | `sinta@senja.id` | `password123` | `3456` |
| Dapur / Bar | `dapur@senja.id` | `password123` | `5678` |

### Reset Database Fresh (Untuk Demo / Showcase)
```bash
cd apps/api && npx prisma db push --force-reset --accept-data-loss && pnpm db:seed
```

### Dummy Data Operasional (`pnpm db:seed`)
Script seed bersifat idempotent dan otomatis mengisi:
- 14 menu lengkap dengan **foto makanan/minuman HD (Unsplash)**, varian, modifier group, dan stasiun KDS (Bar, Dapur Panas, Pastry).
- 3 area & 12 meja (3 meja terisi order aktif).
- 8 bahan baku + resep BOM (2 bahan diset di bawah stok minimum untuk simulasi alert stok kritis).
- 1 shift kemarin (`CLOSED`) + 1 shift hari ini (`OPEN` + petty cash).
- 12 order lunas hari ini (tersebar 08:30–18:30 untuk chart jam ramai), 1 order `VOID`, 3 order aktif dengan tiket KDS (`NEW`/`PREPARING`/`READY`), mutasi stok, dan audit log.

---

## 2. Menjalankan Prototype Tanpa Backend (`Docs/prototype`)
Untuk demo UI/UX atau review klien tanpa MySQL/Express:
```bash
cd Docs/prototype
pnpm install
pnpm dev
# Buka http://localhost:3001
```
Semua state (transaksi, meja, tiket KDS, stok bahan, shift, tema/aksen) berjalan 100% di browser dengan `localStorage` dan tombol **Reset Data Demo**.

---

## 3. Backup & Restore MySQL 8 (Operasional)
```bash
# Backup harian terkompresi
docker exec cadra_pos_mysql mysqldump -u pos_user -ppos_password pos_cafe | gzip > backup-$(date +%F).sql.gz

# Uji Restore
gunzip -c backup-2026-11-19.sql.gz | docker exec -i cadra_pos_mysql mysql -u pos_user -ppos_password pos_cafe
```

---

## 4. Checklist QA & Go-Live (Definition of Done)
- [ ] Unit test `@pos/shared` lulus 100% (PB1 10%, Service 5%, pembulatan Rp100, diskon, HPP).
- [ ] Uji E2E alur: Buka Shift → Order Dine-in + Modifier → Kirim Dapur (KDS) → Bayar Tunai → Cetak Struk 58/80mm → Stok Bahan Berkurang → Tutup Shift (Z-Report).
- [ ] Uji Mode Offline: Matikan jaringan di DevTools → Transaksi Tunai (`OFF-`) → Nyalakan jaringan → Verifikasi sinkron otomatis tanpa duplikasi.
- [ ] Uji RBAC: Akun Kasir (`1234`) tidak dapat memanggil `GET /api/v1/reports/sales` (HTTP 403).
- [ ] Uji Void & Audit Log: Void order gagal jika PIN salah, berhasil dengan PIN Manager (`2222`) dan tercatat di tabel `AuditLog`.
