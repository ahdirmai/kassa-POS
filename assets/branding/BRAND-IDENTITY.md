# Tumpu (`tumpu.biz.id`) — Official Brand Identity Kit

**Konsep Resmi:** *Editorial Precision Business Suite* — hangat, arsitektural, dan universal sebagai fondasi operasional seluruh ekosistem produk **Tumpu** (**Tumpu POS**, **Tumpu Work / Project Management**, dan **Tumpu People / HRIS**).
**Logo Terpilih:** Monogram geometris **`T`** dengan palang atas presisi, pilar tengah penumpu beban (*central load-bearing pillar*), dan sayap kantilever kanan **Warm Brass (`#D9A962`)** di dalam badge kotak rounded **Deep Espresso (`#0B1013`)**.

---

## 1. Inventaris Aset Vector (SVG Siap Produksi)

Semua file SVG tersimpan di `/Users/ahdirmai/Pos/assets/branding/` dan 100% scalable tanpa pecah:

| File | Kegunaan | Latar |
|---|---|---|
| `tumpu-icon-dark.svg` | App Icon utama (`512×512`), PWA icon, dark header | Deep Espresso `#0B1013` |
| `tumpu-icon-light.svg` | App Icon versi terang (`512×512`), dokumen cetak | Warm Parchment `#F6F4EF` |
| `tumpu-mark-transparent.svg` | Mark `T` murni tanpa kotak (watermark, video end-card) | Transparan (untuk latar gelap) |
| `tumpu-lockup-dark.svg` | Logo horizontal lengkap (`T` + `Tumpu`) mode gelap | Deep Espresso `#0B1013` |
| `tumpu-lockup-light.svg` | Logo horizontal lengkap (`T` + `Tumpu`) mode terang | Warm Parchment `#F6F4EF` |
| `tumpu-monochrome-thermal.svg` | Logo 1-warna hitam murni untuk **struk thermal 58/80mm** & stempel | Putih `#FFFFFF` |
| `favicon.svg` | Favicon browser (`64×64`, dioptimalkan untuk 16–32px) | Deep Espresso `#0B1013` |
| `brand-tokens.css` | CSS Custom Properties resmi untuk `apps/web`, `apps/landing`, `apps/backoffice` | — |

---

## 2. Sistem Warna Resmi

| Token CSS | Nama | HEX | Pemakaian |
|---|---|---|---|
| `--tumpu-espresso` | **Deep Espresso** | `#0B1013` | Canvas gelap utama, badge logo, cover Reels |
| `--tumpu-espresso-surface` | **Espresso Surface** | `#141B1F` | Permukaan kartu gelap & frame mockup |
| `--tumpu-brass` | **Warm Brass** | `#D9A962` | Aksen sayap kantilever logo, CTA utama mode gelap |
| `--tumpu-champagne` | **Soft Champagne** | `#E5BA78` | Teks italic serif di atas gelap, eyebrow |
| `--tumpu-petrol` | **Deep Petrol** | `#0F5257` | Aksen utama di atas latar terang (`#F6F4EF`) |
| `--tumpu-parchment` | **Warm Parchment** | `#F6F4EF` | Canvas terang editorial & warna huruf `T` |
| `--tumpu-charcoal` | **Charcoal Ink** | `#121517` | Teks utama & wordmark di mode terang |

---

## 3. Arsitektur Sub-Produk Ekosistem Tumpu

- **Tumpu POS** (`pos.tumpu.biz.id`) — Kasir & Operasional Outlet (Offline-First, KDS, Multi-Outlet)
- **Tumpu Work** — Project, Task Management, & Checklist SOP Outlet
- **Tumpu People** — HRIS, Absensi, Jadwal Shift & Payroll
