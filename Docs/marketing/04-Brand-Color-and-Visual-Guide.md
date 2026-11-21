# 04 — Brand Color & Visual Guide Lengkap: Kassa (`kassa.biz.id`)

Panduan visual resmi untuk menjaga konsistensi antara **Aplikasi POS (`app.kassa.biz.id`)**, **Landing Page (`kassa.biz.id`)**, dan seluruh materi **Instagram, Reels, Carousel, & Story**.

**Karakter Visual Kassa:** *Editorial Hospitality-Tech* — hangat seperti kedai kopi specialty, presisi seperti alat kasir modern, bersih tanpa gradien neon berlebihan (*anti-AI-slop*).

---

## 1. Palet Warna Resmi (Color System)

### A. Warna Utama & Aksen (Brand Core)
| Nama Token | HEX | RGB | Peran & Pemakaian |
|---|---|---|---|
| **Deep Espresso** *(Dark Canvas)* | `#0B1013` | `11, 16, 19` | Latar belakang utama untuk post Dark Editorial, cover Reels, slide harga Pro, & Hero. |
| **Espresso Surface** *(Dark Card)* | `#12181B` | `18, 24, 27` | Permukaan kartu, frame mockup HP/browser, dan box callout di mode gelap. |
| **Warm Brass** *(Primary Gold Accent)* | `#D9A962` | `217, 169, 98` | Tombol CTA utama di mode gelap, badge highlight, garis aksen tipis. |
| **Soft Champagne** *(Serif Highlight)* | `#E5BA78` | `229, 186, 120` | Teks italic *Instrument Serif* di atas latar gelap, penekanan kata kunci. |
| **Deep Petrol** *(Signature Teal)* | `#0F5257` | `15, 82, 87` | Aksen utama di atas latar terang (eyebrow, kata penekanan, ikon, garis angka). |
| **Bright Petrol** *(Dark Teal Accent)* | `#38A3A5` | `56, 163, 165` | Aksen teal khusus di atas latar gelap atau elemen interaktif. |

### B. Warna Netral (Editorial Light Canvas)
| Nama Token | HEX | RGB | Peran & Pemakaian |
|---|---|---|---|
| **Warm Parchment** *(Light Canvas)* | `#F6F4EF` | `246, 244, 239` | Latar belakang utama untuk Carousel edukasi (lebih hangat & mahal dari putih polos). |
| **Pure Surface** *(Light Card)* | `#FFFFFF` | `255, 255, 255` | Kartu konten, bingkai screenshot, dan tabel perbandingan di atas Parchment. |
| **Charcoal Ink** *(Primary Text)* | `#121517` | `18, 21, 23` | Judul utama (H1/H2) dan teks utama di mode terang. |
| **Slate Secondary** *(Body Text)* | `#4C5259` | `76, 82, 89` | Paragraf pendukung dan deskripsi singkat. |
| **Muted Stone** *(Caption / Meta)* | `#787E86` | `120, 126, 134` | Label kecil, nomor slide (`01/06`), dan catatan kaki. |
| **Hairline Border** | `#E2DFD7` | `226, 223, 215` | Garis pemisah tipis `1px` antar kartu dan tabel. |

### C. Warna Semantik (Status UI & Data)
| Status | HEX (Text/Icon) | Soft Fill (15%) | Pemakaian di Konten |
|---|---|---|---|
| **Online / Untung / Aman** | `#059669` (Dark: `#34D399`) | `rgba(16, 185, 129, 0.15)` | Badge `SYNCED`, `Margin 73%`, status stok aman, centang positif. |
| **Offline / Peringatan** | `#D97706` (Dark: `#FBBF24`) | `rgba(245, 158, 11, 0.15)` | Badge `OFFLINE`, timer SLA mendekati batas, stok menipis. |
| **Terkunci / Bocor / Error** | `#DC2626` (Dark: `#F87171`) | `rgba(239, 68, 68, 0.15)` | Highlight kebocoran kas, status akses ditolak / terkunci. |

---

## 2. Rasio Warna (Aturan 60–30–10)

### Mode Dark Editorial (Reels Cover, Offer Harga, Mobile POS)
- **60%** `#0B1013` (Deep Espresso — dengan radial glow sangat tipis `#0F5257` 25% di kiri atas & `#C9964C` 15% di kanan atas)
- **30%** `#12181B` (Card/Frame) + `#F4F2EC` (Teks putih hangat)
- **10%** `#D9A962` / `#E5BA78` (Warm Brass untuk CTA & kata italic)

### Mode Light Editorial (Carousel Edukasi HPP, Tips Anti-Bocor, Alur Kerja)
- **60%** `#F6F4EF` (Warm Parchment)
- **30%** `#FFFFFF` (Kartu ber-border `1px #E2DFD7`) + `#121517` (Teks Charcoal)
- **10%** `#0F5257` (Deep Petrol untuk eyebrow, angka step, & kata italic)

> **Tips Grid Instagram (Pola Checkerboard Editorial):**
> Selang-seling cover **Dark (`#0B1013`)** dan **Light (`#F6F4EF`)** antar hari (Hari 1 Dark → Hari 2 Light → Hari 3 Dark → Hari 4 Light → Hari 5 Dark → Hari 6 Dark/Foto → Hari 7 Light) agar profil IG terlihat seperti majalah desain & SaaS kelas atas.

---

## 3. Sistem Tipografi (Typography)

| Peran | Font Utama (Web/Figma) | Alternatif Canva | Gaya & Tracking |
|---|---|---|---|
| **Headline Utama** | `Plus Jakarta Sans` (SemiBold 600 / Bold 700) | `Plus Jakarta Sans` | Tight tracking `-3%`, line-height `1.08` |
| **Aksen Editorial** | `Instrument Serif` (Regular Italic) | `Instrument Serif` / `Playfair Display Italic` | Khusus 2–4 kata kunci penekanan (warna `#E5BA78` di gelap / `#0F5257` di terang) |
| **Body & Caption Slide** | `Plus Jakarta Sans` (Regular 400 / Medium 500) | `Plus Jakarta Sans` | Line-height `1.45`, warna `#4C5259` (light) / `rgba(255,255,255,0.72)` (dark) |
| **Angka, Harga, Kode, Eyebrow** | `JetBrains Mono` (Medium 500) | `JetBrains Mono` / `IBM Plex Mono` | Huruf kapital untuk eyebrow (`tracking +12%`), angka tabular untuk `Rp49.000`, `73%`, `OFF-042` |

### Standar Ukuran Font (Canvas `1080×1350` Carousel 4:5)
- **Eyebrow:** `20–22 px` (`JetBrains Mono`, ALL CAPS)
- **Headline Slide Cover:** `76–88 px` (maks 2–3 baris, 8–12 kata)
- **Headline Slide Isi:** `48–56 px`
- **Body Text:** `28–32 px` (maks 2–3 baris per poin, hindari paragraf panjang)
- **Footer / Nomor Slide:** `20 px` (`01 / 06` di kanan bawah, `Kassa · kassa.biz.id` di kiri bawah)

---

## 4. Logo, Safe Zone & Layout Rules

- **Logo Mark:** Kotak rounded (`border-radius: 22%`) berisi huruf **`K`** bold.
  - Di latar gelap: kotak `#F4F2EC`, huruf `#0B1013`.
  - Di latar terang: kotak `#121517`, huruf `#F6F4EF`.
- **Safe Zone Carousel (`1080×1350`):** Margin luar minimal **`80 px`** di semua sisi.
- **Safe Zone Reels (`1080×1920`):**
  - Kosongkan **`250 px`** dari atas (status bar & header IG).
  - Kosongkan **`380 px`** dari bawah (caption & audio bar IG).
  - Kosongkan **`140 px`** dari sisi kanan (ikon like/comment/share).
  - **Area Cover Grid (`1080×1350` di tengah):** Pastikan judul cover Reels berada tepat di kotak tengah `1080×1350` agar tidak terpotong di profil IG.

---

## 5. Do's & Don'ts (Anti-AI-Slop Checklist)

- **DO:** Gunakan screenshot asli produk Kassa di dalam bingkai bersih (border tipis `1px` + bayangan halus).
- **DO:** Sisakan minimal **30–40% ruang kosong (*whitespace*)** di setiap slide.
- **DO:** Gunakan maksimal **2 warna teks + 1 warna aksen** per slide.
- **DON'T:** Jangan pakai gradien ungu/pink/biru neon atau glow menyala berlebihan.
- **DON'T:** Jangan menumpuk lebih dari 1 ide utama dalam 1 slide Carousel.
- **DON'T:** Jangan pakai ilustrasi kartun 3D generik atau emoji berlebihan di atas desain grafis.
