# 03 — Design System (Cadra POS UI)
Diadaptasi langsung dari template **Cadra** (`/Users/ahdirmai/clone-project/Manufactur`) untuk domain Cafe & Rumah Makan dengan orientasi tablet-first (POS/KDS) dan desktop-first (Admin).

---

## 1. Filosofi Visual
- **Warm Neutral Canvas + Soft Ambient Mesh**: Latar `#efefec` (light) dan `#0b0b0b` (dark) dengan tiga orb blur halus (`.mesh__a/b/c`).
- **Frosted Glass Surfaces**: Kartu menggunakan `--glass` (`#ffffff8f` light / `#ffffff0b` dark), border `--rim`, dan `backdrop-filter: blur(14px)`.
- **Tipografi**: **Urbanist** (weight 400–700) dengan `font-variant-numeric: tabular-nums` wajib pada semua angka harga, qty, dan jam agar kolom selalu sejajar.
- **Target Sentuh**: Minimal `40px–44px` pada tombol utama, chip kategori, dan keypad PIN.

---

## 2. Design Tokens (`tokens.css`)

### Tema & 5 Aksen Warna
Atribut dikontrol pada elemen root `<html data-theme="light|dark" data-accent="ocean|sage|coral|amber|mono">`:

| Accent | `--accent` (Light) | `--iris` (Light) | `--accent` (Dark) | `--iris` (Dark) |
| :--- | :--- | :--- | :--- | :--- |
| `ocean` (default) | `#bcd4f2` | `#2563a8` | `#24476e` | `#6aa6e8` |
| `sage` | `#b9dfcf` | `#23795a` | `#24584a` | `#5cc5a0` |
| `coral` | `#f4c6bb` | `#b8482a` | `#7a3527` | `#f08a6a` |
| `amber` | `#f1dc9f` | `#976806` | `#6b4f12` | `#e2ad45` |
| `mono` | `#dcdcd8` | `#2b2b2a` | `#2c2c2b` | `#d6d6d3` |

### Radius & Spacing
- `--r-card: 24px` (kartu utama, KPI tile, modal)
- `--r-tile: 16px` (tile menu POS, kartu meja)
- `--r-ctl: 999px` (pill tombol, tab navigasi, chip filter, status badge)
- `--gap: 16px`

---

## 3. Pola Komponen Utama

1. **Floating Left Dock (`.cadra-dock`)**
   - Pill vertikal gelap melayang di sisi kiri layar (`60px` lebar) untuk lompat cepat ke Search (`⌘K`), Kasir POS, KDS, Admin, Toggle Light/Dark, Pengaturan, dan Logout.
2. **Top Bar & Pill Tabs (`.cadra-top`, `.ttabs-track`)**
   - Brand mark kiri, navigasi pill tengah (tab aktif solid `--ink` teks `--on-ink`), indikator status Online/Offline + profil user kanan.
3. **Cadra Signature KPI Grid (`.cadra-kpis`)**
   - Tile ke-1: Solid Ink (`--ink` / `--on-ink`) untuk metrik utama (Penjualan Hari Ini).
   - Tile ke-2: Solid Accent (`--accent` / `--on-accent`) untuk metrik sekunder (Transaksi & Avg Bill).
   - Tile ke-3 dst.: Frosted glass (`--glass`).
4. **POS Shelf Photo / Monogram Tile (`.pos-tile`)**
   - Kartu produk menampilkan **foto makanan/minuman** (`imageUrl`, rasio 16:10 `object-cover` dengan zoom halus saat hover + scrim lembut), atau otomatis fallback ke monogram 2 huruf bertema warna `--c` jika foto belum diisi. Dilengkapi badge **`Custom`** di pojok kiri atas untuk menu bervarian/bermodifier, badge SKU / *Habis* di pojok kanan bawah, nama menu 2 baris, dan harga bold tabular.
5. **Serrated Thermal Receipt (`.pr-slot` + `.pr-paper`)**
   - Pratinjau struk keluar dari slot printer dengan tepi bawah bergerigi (CSS `mask`), siap cetak langsung ke printer thermal 58mm/80mm melalui `@media print` (baik di `apps/web` maupun `Docs/prototype`).
6. **Status Pill (`.spill`)**
   - `spill--good` (hijau), `spill--warn` (amber), `spill--bad` (merah/rose), `spill--iris` (aksen), `spill--slate` (netral).
7. **KDS Kanban Board (`.kds-board`, `.kds-col`, `.kds-ticket`, `.kds-ribbon`)**
   - Diadaptasi dari papan pipeline Kanban template Cadra (`.sp-board` / `.sp-col`), lengkap dengan ribbon proporsi status, kolom bertanda titik warna & badge jumlah, drop-zone highlight (`.is-over`), kartu tiket draggable + tombol aksi cepat, dan horizontal snap-scroll di mobile.

---

## 4. Standar Responsiveness (Mobile, Tablet & Desktop)
- **Mobile & Tablet Portrait (`<= 860px`)**:
  - `.cadra-dock` digantikan oleh **Mobile Bottom Navigation Bar** (`.cadra-mobile-nav` dengan `env(safe-area-inset-bottom)`) untuk akses POS, KDS, Admin, Search (`⌘K`), Tema, dan Logout.
  - `.cadra-top` otomatis beralih menjadi layout 2 baris (Brand + Status Online di baris 1, `.ttabs-track` horizontal scrollable penuh di baris 2).
  - Toast stack berpindah ke posisi atas (`top-4`) agar tidak bertabrakan dengan bottom bar.
- **POS Cart (`< 1024px` vs `>= 1024px`)**:
  - Di Mobile & Tablet portrait (`< lg`), keranjang POS tampil sebagai **Floating Bottom Checkout Bar** yang membuka **Slide-up Cart Bottom Sheet**.
  - Di Tablet landscape & Desktop (`lg+`), keranjang sticky memiliki `max-h-[calc(100dvh-2rem)]` dengan daftar item scrollable agar tombol **Bayar** selalu terlihat.
- **Ergonomi Sentuh & Aksesibilitas**:
  - Input `.cadra-input` otomatis `16px` (`min-height: 44px`) pada layar sentuh/mobile untuk mencegah auto-zoom iOS Safari.
  - Tombol aksi, stepper qty `+/-`, dan tombol tutup modal (`X`) berukuran `40px–44px`.
  - Tabel admin memakai `.cadra-table` (`min-width: 640px`, horizontal scroll) dan modal memakai `max-h-[90dvh] overflow-y-auto`.
  - Seluruh warna status memakai CSS tokens (`var(--good)`, `var(--warn)`, `var(--bad)`) untuk menjamin kontras WCAG di Light & Dark mode, dilengkapi `:focus-visible` ring.
