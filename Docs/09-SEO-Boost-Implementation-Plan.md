# Implementation Plan: SEO Boost & Organic Growth Engine (`apps/landing`)

**Status:** Ready for Implementation  
**Assignee:** `agent core-app`  
**Target App:** `apps/landing` (`https://tumpu.biz.id`)  
**Brand & Visual Reference:** `docs/marketing/04-Brand-Color-and-Visual-Guide.md` & `assets/branding/BRAND-IDENTITY.md`  
**Content Source (Repurpose):** `docs/marketing/carousels/` & `docs/marketing/07-Ready-To-Post-Carousels.md`

---

## 1. Tujuan & Konteks

Saat ini `apps/landing` sudah memiliki fondasi Technical SEO dasar (`metadata`, `SoftwareApplication` & `FAQPage` JSON-LD, `robots.ts`, `sitemap.ts`, dan halaman Menu Digital tenant `/p/[slug]`). Namun pertumbuhan trafik organik masih tertahan karena:
1. **Hanya ada 1 halaman utama (`/`)** untuk menargetkan seluruh kata kunci F&B (kasir cafe, POS rumah makan, KDS, HPP, printer thermal).
2. **Belum ada halaman edukasi (`/blog`) atau *free interactive tool*** (`/kalkulator-hpp`) sebagai *link magnet* untuk owner F&B Indonesia.
3. **Core Web Vitals & Caching belum optimal:** Homepage memakai `force-dynamic`, gambar PNG belum dioptimasi (`images.unoptimized: true`), dan OG Image masih screenshot mentah.
4. **Internal linking & Entity Schema (`Organization`, `WebSite`) belum lengkap.**

Plan ini merinci implementasi bertahap (Fase 1–5) yang dapat langsung dikerjakan oleh `agent core-app` di `apps/landing`.

---

## 2. Fase 1 — Technical SEO, Caching & Core Web Vitals (Quick Wins)

### 2.1. Ubah Homepage dari `force-dynamic` ke ISR + On-Demand Revalidation
- **File:** `apps/landing/src/app/page.tsx`
  - Ganti `export const dynamic = "force-dynamic";` menjadi `export const revalidate = 60;` agar TTFB cepat dan mudah di-cache oleh edge/browser.
- **File:** `apps/landing/src/app/api/content/route.ts`
  - Panggil `revalidatePath("/")` dari `next/cache` setiap kali admin menyimpan perubahan konten landing page agar update tetap instan.

### 2.2. Custom Dynamic OG Image (`1200×630`)
- **File Baru:** `apps/landing/src/app/opengraph-image.tsx` (dan `twitter-image.tsx` atau re-export) menggunakan `ImageResponse` dari `next/og`.
- **Desain (*Editorial Hospitality-Tech*):**
  - Canvas `#0B1013` (Deep Espresso) dengan aksen radial glow tipis `#0F5257` & `#D9A962`.
  - Logo Tumpu + eyebrow `SISTEM POS ALL-IN F&B INDONESIA`.
  - Headline besar: **Kasir Offline, Layar Dapur & HPP Otomatis.**
  - Pill highlight `#D9A962`: `Starter Rp0 · Pro Rp49.000/bln · Tanpa Komisi`.
- **File:** `apps/landing/src/app/layout.tsx`
  - Pastikan `openGraph.images` dan `twitter.images` mengarah ke OG Image baru (atau biarkan file convention `opengraph-image.tsx` otomatis bekerja).

### 2.3. Entity Schema (`Organization` + `WebSite`) & Google Search Console Tag
- **File:** `apps/landing/src/app/layout.tsx`
  - Tambahkan dukungan verifikasi Google Search Console via env:
    ```ts
    verification: {
      google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
    },
    ```
  - Tambahkan `robots` default (`index: true, follow: true, googleBot: { "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }`).
- **File:** `apps/landing/src/app/page.tsx` (atau komponen `GlobalJsonLd.tsx` di `layout.tsx`)
  - Tambahkan JSON-LD `Organization` (`name: "Tumpu"`, `url: "https://tumpu.biz.id"`, `logo: "https://tumpu.biz.id/icon-512.png"`, `contactPoint` WhatsApp/support, `sameAs` IG/Threads).
  - Tambahkan JSON-LD `WebSite` (`name: "Tumpu POS"`, `url: "https://tumpu.biz.id"`).

### 2.4. Optimasi Performa Mobile (LCP & INP)
- **File:** `apps/landing/src/components/LandingClient.tsx`
  - Pastikan `HeroThreeCanvas` dimuat secara lazy (`next/dynamic(..., { ssr: false })`) dan hanya aktif di desktop / non-`prefers-reduced-motion` agar tidak membebani LCP & CPU mobile.
- **Gambar Screenshot:**
  - Kompresi atau sediakan versi `.webp` untuk screenshot besar di `apps/landing/public/screenshots/` (misalnya `02-pos.png` yang >2 MB) atau aktifkan optimasi `next/image` bila kompatibel dengan Docker standalone build. Pastikan setiap `<img>` memiliki `width`, `height`, `alt` deskriptif, dan `loading="lazy"` (kecuali gambar *above-the-fold*).

---

## 3. Fase 2 — 5 Halaman Pillar SEO *High-Intent*

Buat 1 komponen template modular yang rapi agar seluruh halaman pillar konsisten dengan gaya *Editorial Hospitality-Tech* Tumpu dan mudah dirawat:
- **Komponen Shared:** `apps/landing/src/components/seo/SeoLandingPage.tsx`
  - Header/Navbar terhubung ke homepage & halaman pillar lain.
  - Breadcrumb visual + JSON-LD `BreadcrumbList`.
  - Hero spesifik sesuai *search intent* (H1 tunggal, subheadline tajam, 2 CTA: **Coba Gratis** → `https://pos.tumpu.biz.id/register` & **Konsultasi WA**).
  - Visual screenshot asli Tumpu relevan (`/screenshots/*.png`).
  - Seksi *Pain Point → Solusi Tumpu* (3–4 blok).
  - Seksi *Perbandingan / Breakdown Fitur* + Harga Transparan (`Starter Rp0` vs `Pro Rp49.000/bln`).
  - Seksi *FAQ Spesifik Halaman* + JSON-LD `FAQPage`.
  - Seksi *Related Pages* (internal links ke halaman pillar lain, `/kalkulator-hpp`, dan `/blog`).

### Daftar 5 Route Pillar Wajib Dibuat

| No | Route (`apps/landing/src/app/...`) | Target Kata Kunci Utama | Meta Title (≤ 60 char) | Screenshot Utama |
|---|---|---|---|---|
| 1 | `/aplikasi-kasir-cafe/page.tsx` | aplikasi kasir cafe, pos coffee shop murah, kasir kedai kopi | Aplikasi Kasir Cafe & Coffee Shop — Offline & HPP \| Tumpu | `02-pos.png`, `07-stock.png` |
| 2 | `/pos-rumah-makan/page.tsx` | aplikasi kasir rumah makan, pos restoran, split bill resto | Aplikasi Kasir & POS Rumah Makan + Layar Dapur \| Tumpu | `06-tables.png`, `03-kds.png` |
| 3 | `/layar-dapur-kds/page.tsx` | kitchen display system indonesia, layar dapur cafe, kds resto | Layar Dapur (KDS) Kanban Realtime Tanpa Bon Kertas \| Tumpu | `03-kds.png` |
| 4 | `/hitung-hpp-otomatis/page.tsx` | aplikasi stok bahan baku cafe, hitung hpp otomatis f&b | Aplikasi Stok Bahan Baku & Hitung HPP Otomatis F&B \| Tumpu | `07-stock.png`, `04-dashboard.png` |
| 5 | `/bandingkan-pos/page.tsx` | aplikasi kasir murah tanpa komisi, perbandingan harga pos cafe | Bandingkan Biaya POS Cafe: Rp300rb vs Rp49rb All-In \| Tumpu | `04-dashboard.png` |

**Aturan Wajib Tiap Halaman Pillar:**
- Ekspor `metadata: Metadata` lengkap (`title`, `description`, `alternates.canonical`, `openGraph`, `twitter`).
- Render JSON-LD `BreadcrumbList` + `FAQPage` + `SoftwareApplication`.
- Semua angka harga konsisten dengan kebijakan Tumpu terbaru: **Starter Rp0 selamanya** (1 outlet, total 3 akun khusus Kasir POS) dan **Pro Rp49.000/outlet/bulan** (Multi-Outlet, All-In KDS, Stok & HPP, RBAC, Rp0 komisi transaksi).

---

## 4. Fase 3 — Free Interactive Tool (*Link Magnet*): `/kalkulator-hpp`

Owner coffee shop dan rumah makan Indonesia sangat sering mencari *"kalkulator HPP cafe"*, *"cara hitung HPP kopi susu"*, dan *"cara hitung PB1 10%"*. Halaman tool gratis ini berfungsi sebagai magnet trafik organik, bookmark, dan konversi trial.

### Spesifikasi Route & Komponen
- **Route:** `apps/landing/src/app/kalkulator-hpp/page.tsx` (Server Component dengan `metadata` + JSON-LD `WebApplication` & `FAQPage`).
- **Client Component:** `apps/landing/src/components/seo/HppCalculatorClient.tsx`.

### Fitur Interaktif Wajib
1. **Preset 1-Klik Menu F&B Nyata:**
   - *Es Kopi Susu Aren* (Espresso 18 gr, Fresh Milk 150 ml, Gula Aren 25 ml, Cup + Es Batu → HPP Rp7.450, Jual Rp28.000, Margin ~73%).
   - *Nasi Goreng Spesial* (Beras, Telur, Ayam, Bumbu, Kemasan).
   - *Matcha Latte Iced* (Matcha Powder, Fresh Milk, Simple Syrup, Cup).
2. **Input Konversi Satuan Beli → Takaran Resep:**
   - User input **Harga Beli** (mis. Rp200.000), **Ukuran Beli** (mis. `1 kg` / `1000 gr` / `1 L` / `750 ml` / `1 pcs`), dan **Takaran per Porsi** (mis. `18 gr`).
   - Sistem otomatis menghitung **Biaya per Porsi** untuk setiap baris bahan (bisa tambah/hapus baris bahan secara dinamis).
3. **Output Ringkasan Profit & Rekomendasi Harga Jual:**
   - **Total HPP / Porsi (Rp)**
   - **Harga Jual Input** vs **Rekomendasi Harga Jual** (target Food Cost 25%, 30%, 35%).
   - **Laba Kotor / Porsi (Rp)** & **Margin Kotor (%)** dengan indikator warna semantik (Hijau ≥ 65%, Amber 45–64%, Merah < 45%).
   - **Toggle Simulasi PB1 10% & Service Charge 5%** (Inklusif vs Eksklusif) menampilkan preview struk mini.
4. **Aksi & Conversion Bridge:**
   - Tombol **Salin Ringkasan HPP (Teks WA)** agar owner bisa langsung share ke partner/tim.
   - Banner CTA kontekstual di bawah hasil: *"Capek hitung HPP manual di Excel? Di Tumpu Pro (Rp49rb/bln), stok & HPP terpotong otomatis setiap transaksi lunas."* → tombol **Coba Gratis 14 Hari**.
5. **Konten Edukasi Pendukung di Bawah Kalkulator:**
   - Panduan singkat rumus HPP F&B, benchmark food cost cafe (25–30%) vs rumah makan (35–45%), dan 4 FAQ (dengan `FAQPage` schema).

---

## 5. Fase 4 — SEO Content Hub (`/blog` & `/blog/[slug]`)

Bangun blog statis/SSG ringan langsung di `apps/landing` tanpa dependensi CMS eksternal agar build cepat dan mudah di-maintain.

### Struktur File
- `apps/landing/src/data/blog-posts.ts` — tipe `BlogPost` (`slug`, `title`, `description`, `publishedAt`, `updatedAt`, `category`, `readingTimeMinutes`, `keywords`, `coverImage`, `relatedSlugs`, `sections: Array<{ heading: string; paragraphs: string[]; bullets?: string[]; callout?: string }>`, `faqs?: Array<{ q: string; a: string }>`).
- `apps/landing/src/app/blog/page.tsx` — Halaman indeks blog dengan filter kategori (`Edukasi HPP`, `Operasional Outlet`, `Hardware & Printer`, `Manajemen Staf`), metadata SEO, dan `CollectionPage` JSON-LD.
- `apps/landing/src/app/blog/[slug]/page.tsx` — Halaman artikel lengkap dengan `generateStaticParams()`, `generateMetadata()`, `Article` + `BreadcrumbList` + `FAQPage` JSON-LD, Table of Contents, inline CTA ke `/kalkulator-hpp` atau `pos.tumpu.biz.id/register`, serta 3 *Artikel Terkait*.

### Batch 1 Artikel Pillar (Repurpose dari `docs/marketing/carousels/`)
Minimal **8 artikel** di Batch 1 (sisanya dapat ditambahkan bertahap hingga 14+ artikel):

| No | Slug (`/blog/...`) | Target Keyword | Internal Link Wajib |
|---|---|---|---|
| 1 | `cara-hitung-hpp-es-kopi-susu-aren` | cara hitung hpp kopi susu, margin coffee shop | `/kalkulator-hpp`, `/hitung-hpp-otomatis` |
| 2 | `beda-pb1-10-persen-dan-ppn-cafe-resto` | beda pb1 dan ppn restoran, pajak pb1 10% | `/pos-rumah-makan`, `/kalkulator-hpp` |
| 3 | `setup-kasir-cafe-modal-250rb-printer-bluetooth` | setup kasir cafe murah, printer thermal bluetooth 58mm | `/aplikasi-kasir-cafe`, `/bandingkan-pos` |
| 4 | `3-celah-kebocoran-kasir-dan-cara-mencegahnya` | cara mencegah kecurangan kasir cafe, anti fraud pos | `/aplikasi-kasir-cafe` |
| 5 | `5-kesalahan-fatal-memilih-aplikasi-kasir-cafe` | tips memilih aplikasi kasir cafe, pos tanpa biaya add-on | `/bandingkan-pos`, `/aplikasi-kasir-cafe` |
| 6 | `checklist-sop-opening-dan-closing-cafe` | sop opening closing cafe, tutup shift kasir z-report | `/aplikasi-kasir-cafe`, `/pos-rumah-makan` |
| 7 | `hemat-waktu-rumah-makan-dengan-layar-dapur-kds` | manfaat kitchen display system rumah makan | `/layar-dapur-kds`, `/pos-rumah-makan` |
| 8 | `4-data-wajib-cek-akhir-bulan-owner-cafe` | evaluasi bulanan cafe, cara menaikkan margin resto | `/hitung-hpp-otomatis`, `/kalkulator-hpp` |

---

## 6. Fase 5 — Sitemap, Internal Linking & Backlink Loop

### 6.1. Perbarui Sitemap Dinamis
- **File:** `apps/landing/src/app/sitemap.ts`
  - Tambahkan seluruh 5 halaman pillar (`priority: 0.9`, `changeFrequency: "weekly"`).
  - Tambahkan `/kalkulator-hpp` (`priority: 0.9`, `changeFrequency: "monthly"`).
  - Tambahkan `/blog` (`priority: 0.85`, `changeFrequency: "weekly"`) dan semua `/blog/[slug]` dari `BLOG_POSTS` (`priority: 0.8`, `changeFrequency: "monthly"`).
  - Pertahankan rute dinamis Menu Digital tenant `/p/[slug]` (`priority: 0.85`).

### 6.2. Perkuat Internal Linking di Header & Footer
- **File:** `apps/landing/src/components/LandingClient.tsx`
  - Tambahkan tautan navigasi ke **Kalkulator HPP** dan **Blog** di navbar/menu.
  - Tambahkan kolom **Solusi & Sumber Daya** di Footer homepage yang menautkan langsung ke seluruh 5 halaman pillar, `/kalkulator-hpp`, dan `/blog` agar Googlebot menemukan semua halaman dalam 1–2 klik dari `/`.

### 6.3. Optimasi *Powered-By Backlink* di Menu Digital Tenant
- **File:** `apps/landing/src/components/DigitalMenuClient.tsx`
  - Pastikan footer halaman `/p/[slug]` memiliki tautan bersih `rel="noopener"` (tanpa `nofollow` karena satu domain internal) menuju `https://tumpu.biz.id` dengan anchor deskriptif: `"Menu Digital & Sistem POS oleh Tumpu"`.

---

## 7. Checklist Pasca-Deploy (Untuk Owner / Digital Marketing)

Setelah `agent core-app` menyelesaikan kode dan di-deploy ke `https://tumpu.biz.id`:
1. **Google Search Console (GSC):**
   - Verifikasi domain `tumpu.biz.id` (DNS TXT atau `NEXT_PUBLIC_GSC_VERIFICATION`).
   - Submit sitemap `https://tumpu.biz.id/sitemap.xml`.
   - Klik *Request Indexing* untuk `/`, 5 halaman pillar, `/kalkulator-hpp`, dan `/blog`.
2. **Bing Webmaster Tools:** Import langsung dari Google Search Console (1 klik).
3. **Rich Results Test:** Uji `/` dan `/kalkulator-hpp` serta 1 artikel `/blog/[slug]` di `https://search.google.com/test/rich-results` untuk memastikan 0 error pada JSON-LD.
4. **Distribusi Backlink Awal:**
   - Pasang link `tumpu.biz.id` di Bio Instagram, Threads, YouTube, dan profil komunitas F&B.
   - Dorong setiap outlet pengguna Tumpu menaruh link Menu Digital `tumpu.biz.id/p/<slug>` di **Google Maps (Google Business Profile)** & Bio IG mereka.

---

## 8. Acceptance Criteria & Verifikasi (`agent core-app`)

Sebelum menandai selesai, `agent core-app` wajib memastikan:
- [ ] `pnpm --filter @pos/landing exec tsc --noEmit` lulus tanpa error.
- [ ] `pnpm --filter @pos/landing build` berhasil (seluruh halaman pillar, `/kalkulator-hpp`, `/blog`, dan `/blog/[slug]` ter-generate statis/ISR dengan sukses).
- [ ] `GET /sitemap.xml` memuat `/`, 5 halaman pillar, `/kalkulator-hpp`, `/blog`, semua `/blog/[slug]`, dan `/p/[slug]`.
- [ ] `GET /robots.txt` mengizinkan crawl semua halaman publik dan memblokir `/admin`, `/api/`, `/preview`.
- [ ] Setiap halaman baru memiliki H1 tunggal, canonical URL absolut `https://tumpu.biz.id/...`, meta description unik (120–160 karakter), dan JSON-LD valid.
- [ ] Kalkulator HPP di `/kalkulator-hpp` berfungsi penuh (preset, tambah/hapus bahan, konversi kg/L ke gram/ml, margin %, simulasi PB1 10%, dan tombol salin hasil).
- [ ] Tidak ada regresi pada homepage `/` maupun halaman Menu Digital `/p/[slug]`.
