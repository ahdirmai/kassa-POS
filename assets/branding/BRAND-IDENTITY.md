# Kassa (`kassa.biz.id`) — Official Brand Identity Kit

**Konsep Resmi:** *Editorial Hospitality-Tech* — hangat seperti kedai kopi specialty, presisi seperti sistem kasir modern, bersih tanpa gradien neon (*anti-AI-slop*).
**Logo Terpilih:** **Opsi 1** — Monogram geometris **`K`** dengan *architectural receipt-notch* di bagian atas dan garis aksen *chevron* **Warm Brass (`#D9A962`)** di sisi kanan, di dalam badge kotak rounded **Deep Espresso (`#0B1013`)**.

---

## 1. Inventaris Aset Vector (SVG Siap Produksi)

Semua file SVG tersimpan di `/Users/ahdirmai/Pos/assets/branding/` dan 100% scalable tanpa pecah:

| File | Kegunaan | Latar |
|---|---|---|
| `kassa-icon-dark.svg` | App Icon utama (`512×512`), PWA icon, dark header | Deep Espresso `#0B1013` |
| `kassa-icon-light.svg` | App Icon versi terang (`512×512`), dokumen cetak | Warm Parchment `#F6F4EF` |
| `kassa-mark-transparent.svg` | Mark `K` murni tanpa kotak (watermark, video end-card) | Transparan (untuk latar gelap) |
| `kassa-lockup-dark.svg` | Logo horizontal lengkap (`K` + `Kassa`) mode gelap | Deep Espresso `#0B1013` |
| `kassa-lockup-light.svg` | Logo horizontal lengkap (`K` + `Kassa`) mode terang | Warm Parchment `#F6F4EF` |
| `kassa-monochrome-thermal.svg` | Logo 1-warna hitam murni untuk **struk thermal 58/80mm** & stempel | Putih `#FFFFFF` |
| `favicon.svg` | Favicon browser (`64×64`, stroke dioptimalkan untuk 16–32px) | Deep Espresso `#0B1013` |
| `brand-tokens.css` | CSS Custom Properties resmi untuk `apps/web`, `apps/landing`, `apps/backoffice` | — |

---

## 2. Sistem Warna Resmi

| Token CSS | Nama | HEX | Pemakaian |
|---|---|---|---|
| `--kassa-espresso` | **Deep Espresso** | `#0B1013` | Canvas gelap utama, badge logo, cover Reels |
| `--kassa-espresso-surface` | **Espresso Surface** | `#141B1F` | Permukaan kartu gelap & frame mockup |
| `--kassa-brass` | **Warm Brass** | `#D9A962` | Aksen chevron logo, CTA utama mode gelap |
| `--kassa-champagne` | **Soft Champagne** | `#E5BA78` | Teks italic serif di atas gelap, eyebrow |
| `--kassa-petrol` | **Deep Petrol** | `#0F5257` | Aksen utama di atas latar terang (`#F6F4EF`) |
| `--kassa-parchment` | **Warm Parchment** | `#F6F4EF` | Canvas terang editorial & warna huruf `K` |
| `--kassa-charcoal` | **Charcoal Ink** | `#121517` | Teks utama & wordmark di mode terang |

---

## 3. Tipografi Resmi

- **Headline & Wordmark:** `Plus Jakarta Sans` (SemiBold 600 / Bold 700, tracking `-0.03em`)
- **Aksen Editorial:** `Instrument Serif Italic` (atau `Playfair Display Italic`)
- **Angka, Harga & Eyebrow:** `JetBrains Mono` (Medium 500 / Bold 700, `tabular-nums`)

---

## 4. Aturan Penggunaan Logo (Clear Space & Minimum Size)

- **Clear Space:** Minimal `25%` dari lebar badge ikon di sekeliling logo.
- **Ukuran Minimum:**
  - Digital icon: `24 × 24 px` (gunakan `favicon.svg` di bawah `32 px`).
  - Lockup horizontal: lebar minimal `120 px`.
  - Struk thermal 58/80mm: wajib gunakan `kassa-monochrome-thermal.svg` (1-bit hitam-putih tanpa warna emas/abu-abu agar tidak bergaris saat dicetak).
- **Larangan:** Jangan mengubah rasio aspek, jangan mengganti warna chevron emas ke warna neon, dan jangan memberi efek drop-shadow berat atau bevel 3D.
