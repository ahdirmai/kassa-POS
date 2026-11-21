# 06 — Plan Marketing 30 Hari & Prompt Video (Google Flow + HyperFrames) — Kassa (`kassa.biz.id`)

Rencana konten lengkap **30 hari (Minggu 1–4)** untuk Instagram & Threads, dilengkapi keputusan arsitektur produksi video dan **prompt siap pakai untuk Google Flow (Veo 3)** yang dirancang **ultra-realistis dan tidak terlihat seperti AI**.

---

## 1. Keputusan Produksi Video: Hybrid (Google Flow + HyperFrames)

Untuk menjaga kualitas visual **Editorial Hospitality-Tech** sekaligus menghindari tampilan "AI-slop" (teks melenceng, jari aneh, kulit plastik, warna neon berlebihan), produksi 15 Reels selama 30 hari menggunakan **2 jalur yang tegas**:

| Jalur Produksi | Kapan Dipakai | Pembagian Tugas | Jumlah Reels (30 Hari) |
|---|---|---|---|
| **Hybrid: Google Flow + HyperFrames** *(Utama)* | Reels berbasis *pain point* manusia, suasana kedai/dapur, POV owner, dan *hook* emosional. | **Google Flow (Veo 3)** men-generate **klip B-roll live-action 4–8 detik** yang dokumenter & realistis (tanpa teks UI di dalam video AI). **HyperFrames** menumpuk screenshot UI Kassa asli, animasi interaksi (pill offline, geser KDS, angka HPP), tipografi editorial, dan end-card `#0B1013`. | **11 Reels** (H1, H3, H6, H8, H10, H14, H15, H17, H22, H24, H26, H30 → 12 Reels) |
| **HyperFrames Only** | Reels berbasis demo UI murni, perbandingan angka/harga, audit log, dan product tour cepat. | **100% HyperFrames** (HTML/CSS/GSAP → `1080×1920` 30fps) menggunakan screenshot asli `/screenshots/*.png` dan komponen animasi tajam. Nol risiko teks Rupiah/UI rusak. | **3 Reels** (H12, H19, H21, H28 → 4 Reels) |

> **Kenapa tidak 100% Google Flow saja?**
> Model video generatif (termasuk Veo 3 di Google Flow) masih sering merusak teks kecil, angka Rupiah (`Rp49.000`), dan tombol aplikasi POS. Begitu layar aplikasi di-generate oleh AI, penonton langsung sadar itu video AI dan kepercayaan (trust) terhadap produk SaaS turun drastis.
>
> **Kenapa Hybrid Google Flow + HyperFrames paling optimal?**
> Google Flow menangani **suasana nyata kedai kopi & dapur Indonesia** (manusia, uap kopi, kesibukan kasir, bon kertas berantakan) dengan gaya kamera dokumenter, sementara HyperFrames merender **UI Kassa asli, angka HPP, dan teks hook** secara *pixel-perfect*.

### Aturan Wajib Prompt Google Flow (Anti-AI Look)
Setiap prompt di bawah sudah menerapkan 5 prinsip ini:
1. **Kamera & Lensa Dokumenter:** `Handheld smartphone vertical 9:16 video` / `35mm documentary lens`, ada *micro-shake* alami, bukan gerakan gimbal sinematik berlebihan.
2. **Pencahayaan Natural Indonesia:** Cahaya siang dari jendela kaca kafe + lampu gantung *warm tungsten* (`3000K`), kontras natural, tanpa *teal-orange* berlebihan atau *rim light* studio.
3. **Subjek & Lingkungan Autentik:** Barista/owner Asia Tenggara kasual (apron kanvas, kaus polos), tekstur kulit alami, meja kasir/dapur sedikit berantakan secara realistis (tisu, portafilter, cup plastik, kabel charger).
4. **Larangan Teks di Frame AI:** Selalu tambahkan instruksi agar tidak ada teks/logo terbaca di layar perangkat (`no readable text or logos on screens`) — layar UI asli ditempel di tahap HyperFrames.
5. **Audio Ambience Nyata:** Manfaatkan audio native Veo 3 di Google Flow (desis mesin espresso, bunyi gelas, riuh percakapan kafe pelan, bunyi printer thermal) — tanpa musik *epic trailer*.

---

## 2. Roadmap 4 Minggu (Hari 1–30)

| Minggu | Fokus Funnel | Tema Utama | Target Utama |
|---|---|---|---|
| **Minggu 1 (H1–H7)** | **Awareness & Core Pain** | Wi-Fi mati (Offline), HPP Kopi Susu, KDS anti bon kertas, RBAC anti-bocor, Offer Rp49rb, Mobile POS, Recap 4 Langkah. | Reach organik, Save & Comment keyword (`KASSA`, `HPP`, `KDS`, `AMAN`). |
| **Minggu 2 (H8–H14)** | **Consideration & Operasional** | Tutup shift Z-Report 30 detik, Modal kasir Rp250rb, Pindah meja & Split bill, PB1 10%, PIN 4 digit, 5 kesalahan pilih POS, POV Owner Minggu. | Profile visits, DM konsultasi printer & alur shift. |
| **Minggu 3 (H15–H21)** | **Desire, Profit & Scale** | Resep auto-potong stok, Studi kasus Rumah Makan, Routing Bar vs Dapur, Multi-Outlet 1 dashboard, Audit Void, SOP Opening/Closing, Compare Rp300rb vs Rp49rb. | Daftar Starter Gratis & Trial Pro 14 Hari. |
| **Minggu 4 (H22–H30)** | **Objection & Conversion Push** | Setup 5 menu dalam 5 menit, Starter vs Pro, Tes printer Bluetooth 58/80mm, 4 data wajib akhir bulan, Kenapa cafe ramai tetap tutup, Alur Dine-In/Takeaway, Product Tour 20s, FAQ, Closing Bulan Baru. | Aktivasi outlet & konversi ke Kassa Pro Rp49.000/bln. |

### Target KPI 30 Hari (Bulan Pertama)
- **Total Konten:** 30 Instagram (16 Reels + 14 Carousel) + 44 Threads = **74 konten terstruktur**.
- **Total Reach Organik (30 Hari):** 40.000 – 120.000
- **Klik `kassa.biz.id` / DM Masuk:** 250 – 600
- **Akun Register / Trial Aktif:** 80 – 180 outlet
- **Konversi Berbayar Pro Rp49rb:** 15 – 40 outlet

---

## 3. Jadwal Lengkap Hari 1–30 (Instagram & Threads)

> **Catatan Grid IG (Pola Checkerboard):** Selang-seling cover **Dark (`#0B1013`)** dan **Light (`#F6F4EF`)** agar feed terlihat editorial dan konsisten.

| Hari | IG Format & Tema | Judul Instagram | Engine Video | Tema Threads Harian |
|---|---|---|---|---|
| **H1** | Reels · Dark | Wi-Fi Mati di Jam Ramai? Kasir Tetap Jalan | Google Flow + HyperFrames | Opini Wi-Fi mati · Build-in-public Rp49rb · Reminder gaji owner |
| **H2** | Carousel · Light | Omzet 3 Juta Sehari Tapi Kas Tipis? Hitung HPP Kopi Susu | — | Angka HPP Rp7.450 · Diskusi Excel stok · Soft demo konversi gram/ml |
| **H3** | Reels · Dark | Hapus Bon Kertas di Dapur: Demo Layar Dapur (KDS) | Google Flow + HyperFrames | Hot take bon kertas · KDS pakai tablet lama · Screenshot KDS |
| **H4** | Carousel · Light | 3 Celah Kebocoran Kasir & Kontrol Akses Staf | — | Cerita selisih laci · Tanya SOP void · Screenshot RBAC |
| **H5** | Carousel · Dark | Offer Anchor: All-In Cuma Rp49.000/Bulan (~Rp1.600/Hari) | — | Kontras Rp300rb vs Rp49rb · Beda Starter vs Pro · Semangat shift Jumat |
| **H6** | Reels · Dark | Weekend Rush: Catat Order Pakai HP di Meja Tamu | Google Flow + HyperFrames | Jangan beli mesin kasir 5jt · Mobile POS · Tanya merek printer awet |
| **H7** | Carousel · Light | Recap 4 Langkah: Rapikan Outlet Mulai Senin Besok | — | 3 data wajib cek Minggu · Recap 4 langkah · Open Q&A |
| **H8** | Reels · Dark | Tutup Shift 30 Detik: Anti Selisih Laci Kasir (Z-Report) | Google Flow + HyperFrames | Drama hitung uang jam 11 malam pas tutup outlet |
| **H9** | Carousel · Light | Setup Kasir Modal Rp250rb: HP Lama + Printer Bluetooth | — | Breakdown modal hardware kasir untuk kedai baru |
| **H10** | Reels · Dark | Pindah Meja & Split Bill Tanpa Drama di Jam Makan Siang | Google Flow + HyperFrames | Momen ribet meja rombongan minta pisah struk pas antre |
| **H11** | Carousel · Light | Cara Hitung PB1 10% & Service Charge Otomatis di Struk | — | Masih banyak owner bingung bedain PB1 10% vs PPN |
| **H12** | Reels · Dark | 3 Detik Ganti Shift Pakai PIN 4 Digit (Anti Akun Sharing) | HyperFrames Only | Bahaya 1 akun kasir dipakai ramai-ramai tanpa PIN personal |
| **H13** | Carousel · Light | 5 Kesalahan Fatal Owner Baru Saat Pilih Aplikasi Kasir | — | Jangan cuma lihat gratisnya, cek biaya add-on tersembunyi |
| **H14** | Reels · Dark | POV Owner Cek Omzet & Margin Hari Minggu dari Rumah | Google Flow + HyperFrames | Enaknya hari Minggu tetap tahu omzet tanpa tanya kasir di WA |
| **H15** | Reels · Dark | Resep Kopi Susu & Nasi Goreng Terpotong Otomatis Tiap Order | Google Flow + HyperFrames | Susu habis duluan padahal penjualan biasa aja? Cek waste bar |
| **H16** | Carousel · Light | Studi Kasus Rumah Makan: Hemat 40 Menit/Hari Tanpa Bon Kertas | — | Kenapa rumah makan justru paling butuh KDS dibanding cafe kecil |
| **H17** | Reels · Dark | Barista vs Dapur Panas: Routing Tiket Otomatis Tanpa Teriak | Google Flow + HyperFrames | Kurangi teriak-teriak antar bar & dapur saat jam sibuk |
| **H18** | Carousel · Light | Punya 2–3 Cabang? Kelola Semua Outlet dalam 1 Dashboard | — | Kapan waktu yang tepat buka cabang ke-2 (tanda sistem siap) |
| **H19** | Reels · Dark | Audit Void & Diskon: Kenapa Owner Wajib Kunci Akses Kasir | HyperFrames Only | 1 void fiktif Rp50rb/hari = Rp1,5 juta hilang per bulan |
| **H20** | Carousel · Light | Checklist SOP Opening & Closing Cafe (Siap Simpan!) | — | Share checklist 5 menit sebelum buka & tutup kedai |
| **H21** | Reels · Dark | Perbandingan Biaya POS Rp300rb/bln vs Kassa Pro Rp49rb/bln | HyperFrames Only | Penghematan Rp3 juta/tahun dari biaya langganan POS bisa buat apa? |
| **H22** | Reels · Dark | "Males Input Ulang Menu?" Setup 5 Menu Terlaris Cuma 5 Menit | Google Flow + HyperFrames | Alasan #1 owner menunda pindah POS & cara tes tanpa ribet |
| **H23** | Carousel · Light | Starter Gratis Rp0 vs Pro Rp49rb — Pilih Mana Buat Outlet Kamu? | — | Transparansi penuh: kapan cukup pakai Starter gratis saja |
| **H24** | Reels · Dark | Tes Cetak Struk Bluetooth 58mm & 80mm Langsung dari HP | Google Flow + HyperFrames | Tips memilih kertas thermal 58mm vs 80mm biar struk rapi |
| **H25** | Carousel · Light | 4 Data Wajib Cek Sebelum Akhir Bulan Biar Margin Naik 15% | — | Jangan tunggu akhir tahun buat evaluasi menu yang rugi |
| **H26** | Reels · Dark | Kenapa Banyak Cafe Ramai Tapi Tetap Tutup di Tahun Pertama? | Google Flow + HyperFrames | Ramai belum tentu untung: bedah cashflow vs margin kotor |
| **H27** | Carousel · Light | Alur Lengkap Dine-In, Takeaway & Delivery Tanpa Antre Kasir | — | Pisahkan alur order takeaway biar tamu dine-in gak kesal |
| **H28** | Reels · Dark | Demo 20 Detik: Dari Pelanggan Pesan Sampai Laporan Laba Rugi | HyperFrames Only | Satu sistem dari depan (POS) sampai belakang (stok & laba) |
| **H29** | Carousel · Light | FAQ Lengkap Kassa: Offline, Printer, Multi-Outlet & Data | — | Open Q&A akhir bulan: tanya apa saja soal setup Kassa |
| **H30** | Reels · Dark | Bulan Baru, Outlet Lebih Rapi — Mulai Gratis di kassa.biz.id | Google Flow + HyperFrames | Refleksi 30 hari & ajakan rapikan operasional mulai tanggal 1 |

---

## 4. Prompt Video Siap Pakai (Google Flow + HyperFrames)

Gunakan prompt di bawah langsung di **Google Flow (Veo 3, Aspect Ratio `9:16`)**. Semua prompt ditulis dalam bahasa Inggris karena Veo 3 merespons detail fotografi & fisika jauh lebih akurat dalam bahasa Inggris, sambil tetap mempertahankan **setting & konteks Indonesia**.

---

### H1 — Wi-Fi Mati di Jam Ramai? Kasir Tetap Jalan (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–4s Hook):**
  > `Vertical 9:16 handheld smartphone documentary video inside a cozy, busy Indonesian specialty coffee shop during lunch rush. Medium shot over the shoulder of a young Indonesian female cashier in a dark canvas apron standing behind a wooden espresso counter. She taps a sleek tablet on a metal stand, pauses with a brief realistic look of mild worry as a Wi-Fi router with a blinking red light sits near the corner of the counter, while two blurred customers wait politely in line holding smartphones. Warm natural daylight through storefront glass mixed with soft warm tungsten pendant lights, authentic cluttered cafe counter with ceramic cups, stainless milk pitcher, and thermal receipt printer. Natural skin texture, subtle handheld camera micro-shake, 35mm documentary lens, realistic ambient cafe chatter and espresso machine steam sound. No readable text or logos on screens, no cinematic slow motion, completely authentic unpolished real-life footage.`
- **HyperFrames Overlay (4–22s):** Cut ke screen UI `/screenshots/02-pos.png` → animasi pil `OFFLINE (Amber)` muncul → tap Es Kopi Susu + Nasi Goreng → kode `OFF-042` & struk thermal → status berubah hijau `ONLINE · SYNCED` → End-card `#0B1013` (`Starter Gratis · Pro Rp49rb/bln · kassa.biz.id`).

---

### H3 — Hapus Bon Kertas di Dapur: Demo Layar Dapur KDS (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–4s Hook):**
  > `Vertical 9:16 candid handheld smartphone footage inside a bustling Indonesian restaurant kitchen during lunch peak. Close-up to medium shot of a stainless steel kitchen pass rail overloaded with messy crumpled white paper order tickets clipped haphazardly; one paper ticket slips and falls toward a damp metal prep counter next to steaming woks and plating bowls. An Indonesian line cook in a plain dark t-shirt and apron glances stressed at the paper rail, wiping sweat briefly. Harsh-but-natural overhead kitchen fluorescent mixed with warm steam light, real stainless reflections, slight grease haze, authentic handheld camera shake, realistic sizzling wok and clattering plates audio. No readable text on paper tickets, raw documentary realism, not stylized or glossy.`
- **HyperFrames Overlay (4–18s):** Transisi *snap* bersih ke layar `/screenshots/03-kds.png` → animasi kartu `#108` masuk dengan timer → animasi geser `Masuk → Dimasak → Siap Saji` → End-card `#0B1013`.

---

### H6 — Weekend Rush: Catat Order Pakai HP di Meja Tamu (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–5s Hook):**
  > `Vertical 9:16 handheld documentary video on a lively Saturday evening at an Indonesian modern coffee shop and eatery. Medium shot of a friendly Indonesian male server in a casual olive apron standing beside a wooden table where three young friends are pointing at iced coffees and rice bowls, smiling and ordering. The server holds a regular black Android smartphone naturally in both hands, thumbs tapping smoothly as he takes their order without leaving the table. Warm evening pendant lights, bustling blurred cafe interior in the background, slight organic handheld camera movement, shot on iPhone 15 Pro natural color profile, authentic warm evening café chatter and clinking ice cubes audio. No readable text on the phone screen, candid documentary feel.`
- **HyperFrames Overlay (5–16s):** Zoom-in ke frame HP menampilkan `/screenshots/10-pos-mobile.png` → tap 2 menu → sticky checkout bar → cut ke struk thermal tercetak → End-card `#0B1013`.

---

### H8 — Tutup Shift 30 Detik: Anti Selisih Laci Kasir (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–5s Hook):**
  > `Vertical 9:16 candid handheld smartphone video inside a quiet Indonesian coffee shop late at night after closing, chairs stacked loosely in the background. Medium close-up of a tired Indonesian male cashier at the dimly lit wooden counter counting stacks of Indonesian Rupiah banknotes beside an open metal cash drawer, a pocket calculator, and messy crumpled paper receipts, frowning slightly as he recounts. Practical warm downlight over the counter, subtle shadows, realistic tired facial expression, slight handheld camera sway, quiet late-night refrigerator hum and soft paper rustling sound. Authentic documentary realism, no readable numbers or text, natural film-like grain.`
- **HyperFrames Overlay (5–20s):** Transisi ke UI Tutup Shift & Z-Report Kassa (`/screenshots/04-dashboard.png`) → breakdown Tunai Sistem vs Fisik Laci → badge `SELISIH Rp0 · SHIFT AMAN` → End-card `#0B1013`.

---

### H10 — Pindah Meja & Split Bill Tanpa Drama (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–4s Hook):**
  > `Vertical 9:16 handheld smartphone footage in a bright daytime Indonesian casual restaurant. Medium shot of a group of four Indonesian office workers standing near the cashier counter after lunch, gesturing politely while holding individual wallets and smartphones to split their bill, while another customer waits behind them. Natural window daylight, warm wood and concrete interior, casual everyday clothing, realistic candid expressions, natural handheld micro-shake, ambient restaurant lunchtime chatter and cutlery clinks. No readable text or logos, completely natural documentary video.`
- **HyperFrames Overlay (4–18s):** Tampilkan `/screenshots/06-tables.png` → animasi klik `Meja 04 → Pindah ke Meja 08` & `Split Bill (2 Struk)` → cetak struk terpisah → End-card `#0B1013`.

---

### H12 — 3 Detik Ganti Shift Pakai PIN 4 Digit (`HyperFrames Only`)
- **Engine:** **100% HyperFrames** (tanpa Google Flow — fokus UI keypad PIN cepat & RBAC).
- **Spesifikasi Scene HyperFrames (15 detik, `1080×1920`):**
  - `0–3s`: Hook teks editorial di atas `#0B1013`: *"Masih 1 akun kasir dipakai 4 staf? Ini cara aman ganti shift dalam 3 detik."*
  - `3–9s`: Animasi layar `/screenshots/01-login.png` → tap PIN 4 digit (`• • • •`) → langsung masuk mode Kasir (`Shift Sore · Rina`).
  - `9–12s`: Tampilkan badge terkunci di `/screenshots/08-rbac.png` (Laporan Omzet & Edit Stok tersembunyi).
  - `12–15s`: End-card `#0B1013` (`Coba Gratis di kassa.biz.id`).

---

### H14 — POV Owner Cek Omzet & Margin Hari Minggu dari Rumah (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–5s Hook):**
  > `Vertical 9:16 natural handheld documentary video on a calm Sunday morning inside a modest modern Indonesian home living room. Over-the-shoulder medium shot of an Indonesian man in his early 30s wearing a plain casual t-shirt, sitting relaxed at a wooden dining table with a ceramic mug of black coffee beside him, calmly scrolling on his smartphone with a slight relieved smile. Soft morning sunlight streaming through sheer curtains, real home clutter subtly out of focus in background, natural skin tone, gentle handheld camera movement, quiet morning birds and ceramic mug clink audio. No readable text on phone screen, authentic everyday lifestyle footage.`
- **HyperFrames Overlay (5–18s):** Overlay layar `/screenshots/04-dashboard.png` dalam frame HP bersih → animasi angka Omzet Hari Ini, Margin Kotor `73%`, dan Top Menu → End-card `#0B1013`.

---

### H15 — Resep Kopi Susu Terpotong Otomatis Tiap Order (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–5s Hook):**
  > `Vertical 9:16 close-up handheld documentary video at an Indonesian coffee shop espresso bar. A skilled Indonesian barista's hands pull a rich espresso shot into a small glass, pour creamy fresh milk from a carton and dark palm sugar syrup into a clear iced cup filled with ice cubes on a stainless steel bar counter. Natural side daylight catching the swirling milk and coffee layers, realistic droplets of condensation on the cup, slight authentic handheld camera movement, crisp real audio of espresso extraction, pouring milk, and clinking ice. No brand logos or text on cups or cartons, pure realistic coffee-making B-roll.`
- **HyperFrames Overlay (5–20s):** Split screen / overlay card transparan di atas B-roll → saat cup selesai, animasi stok berkurang real-time (`Espresso -18 gr`, `Fresh Milk -150 ml`, `Gula Aren -25 ml`, `HPP Rp7.450`) → tampilkan `/screenshots/07-stock.png` → End-card `#0B1013`.

---

### H17 — Barista vs Dapur Panas: Routing Tiket Otomatis (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–5s Hook):**
  > `Vertical 9:16 handheld documentary two-beat shot inside a busy Indonesian cafe-bistro. First 2.5 seconds: a barista behind the espresso bar glances down at a mounted black tablet screen and immediately starts steaming milk; smooth natural whip-pan transition to the open kitchen pass 3 meters away where a cook checks a wall-mounted tablet and begins plating a hot rice bowl. Warm natural indoor lighting, genuine café hustle, natural unposed movements, authentic background hiss of milk steamer and kitchen pan sizzle. No readable text on tablets, documentary realism.`
- **HyperFrames Overlay (5–18s):** Split horizontal animasi dari `/screenshots/02-pos.png` → panah routing: `Es Kopi Susu → Layar BAR` & `Nasi Goreng → Layar DAPUR` (`/screenshots/03-kds.png`) → End-card `#0B1013`.

---

### H19 — Audit Void & Diskon: Kenapa Owner Wajib Kunci Akses (`HyperFrames Only`)
- **Engine:** **100% HyperFrames** (fokus kalkulasi kebocoran & UI PIN Manager).
- **Spesifikasi Scene HyperFrames (16 detik, `1080×1920`):**
  - `0–4s`: Angka editorial besar di `#0B1013`: `1 Void fiktif Rp50.000/hari` → animasi ticker naik ke `Rp1.500.000 / bulan` (warna `#DC2626`).
  - `4–12s`: Demo UI `/screenshots/08-rbac.png` → tombol `Void Order` memunculkan modal `Wajib PIN Manager` + catatan log permanen.
  - `12–16s`: End-card `#0B1013` (`Amankan Outlet di kassa.biz.id`).

---

### H21 — Perbandingan Biaya POS Rp300rb/bln vs Kassa Pro Rp49rb/bln (`HyperFrames Only`)
- **Engine:** **100% HyperFrames** (motion graphics angka & perbandingan tabel editorial).
- **Spesifikasi Scene HyperFrames (18 detik, `1080×1920`):**
  - `0–4s`: Hook `#0B1013` + aksen `#E5BA78`: *"Bayar POS Rp300rb/bulan atau Rp49rb/bulan? Cek bedanya dalam 15 detik."*
  - `4–13s`: Animasi stack biaya kompetitor (`POS Rp150rb + Add-on Stok Rp75rb + KDS Rp75rb = Rp300rb/bln · Rp3,6jt/thn`) vs Kassa Pro (`All-In Rp49.000/bln · Hemat Rp3jt/thn · Rp0 Komisi`).
  - `13–18s`: End-card `#0B1013` (`Starter Gratis · Trial Pro 14 Hari · kassa.biz.id`).

---

### H22 — "Males Input Ulang Menu?" Setup 5 Menu Cuma 5 Menit (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–4s Hook):**
  > `Vertical 9:16 handheld smartphone documentary video inside an Indonesian coffee shop before opening hours. Medium shot of a young Indonesian café owner sitting at a clean wooden table with a printed laminated menu sheet beside an iPad and a small black Bluetooth thermal printer. He taps the tablet screen casually while sipping iced americano, looking relaxed and focused. Soft morning daylight through glass window, warm wood tones, authentic lived-in café interior, subtle handheld micro-shake, gentle morning ambient cafe sound. No readable text on the menu or tablet screen.`
- **HyperFrames Overlay (4–18s):** Tampilkan `/screenshots/05-menu.png` → animasi stopwatch `00:00 → 05:00` input 5 menu terlaris → langsung siap transaksi di `/screenshots/02-pos.png` → End-card `#0B1013`.

---

### H24 — Tes Cetak Struk Bluetooth 58mm & 80mm Langsung dari HP (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–5s Hook):**
  > `Vertical 9:16 close-up handheld smartphone video on a dark wooden Indonesian coffee shop counter. A compact matte-black 58mm Bluetooth thermal receipt printer sits next to a smartphone held by an Indonesian cashier's hand. The hand taps the phone screen once, and immediately white thermal receipt paper feeds smoothly out of the printer; the hand tears the receipt cleanly along the serrated metal edge. Natural overhead café lighting, crisp real texture of thermal paper and wood grain, authentic mechanical buzzing sound of a thermal printer and crisp paper tear audio. No readable text on the paper or phone, raw authentic product-in-use footage.`
- **HyperFrames Overlay (5–17s):** Tampilkan `/screenshots/09-settings.png` (pengaturan printer 58mm/80mm) + preview struk rapi dengan logo outlet & PB1 10% → End-card `#0B1013`.

---

### H26 — Kenapa Banyak Cafe Ramai Tapi Tetap Tutup di Tahun Pertama? (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–5s Hook):**
  > `Vertical 9:16 candid handheld documentary video from outside looking slightly through the glass window of a lively Indonesian coffee shop at golden hour. Warm interior lights glow as customers sit chatting over iced coffee and laptops, baristas move briskly behind the bar, while reflections of passing motorbikes faintly glide across the glass. Realistic natural golden-hour light, subtle handheld camera drift, authentic muffled street and café ambiance, raw documentary tone rather than commercial glossy look. No readable store signs or logos.`
- **HyperFrames Overlay (5–22s):** Narasi teks editorial 3 penyebab (1. HPP dikira-kira, 2. Stok bocor tanpa jejak, 3. Biaya langganan & operasional bengkak) → solusi di `/screenshots/04-dashboard.png` → End-card `#0B1013`.

---

### H28 — Demo 20 Detik: Dari Pelanggan Pesan Sampai Laporan Laba Rugi (`HyperFrames Only`)
- **Engine:** **100% HyperFrames** (fast-paced product tour menggunakan 4 screenshot asli Kassa).
- **Spesifikasi Scene HyperFrames (20 detik, `1080×1920`):**
  - `0–3s`: Hook: *"Alur lengkap operasional cafe dalam 20 detik."*
  - `3–7s`: Step 1 — Kasir 1-Tap (`/screenshots/02-pos.png`)
  - `7–11s`: Step 2 — Layar Dapur KDS (`/screenshots/03-kds.png`)
  - `11–15s`: Step 3 — Auto Potong Stok & HPP (`/screenshots/07-stock.png`)
  - `15–18s`: Step 4 — Dashboard Laba & Z-Report (`/screenshots/04-dashboard.png`)
  - `18–20s`: End-card `#0B1013` (`kassa.biz.id`).

---

### H30 — Bulan Baru, Outlet Lebih Rapi — Mulai Gratis Hari Ini (`Hybrid: Google Flow + HyperFrames`)
- **Google Flow Prompt (Clip 0–5s Hook):**
  > `Vertical 9:16 warm handheld documentary video in a sunlit Indonesian specialty coffee shop early in the morning just before opening. A smiling Indonesian café owner flips a small wooden door sign, wipes down the clean espresso counter, and places a clean tablet neatly on its stand next to a steaming cup of freshly brewed coffee. Golden morning sunlight slanting across the wooden counter, crisp dust motes in natural light, gentle handheld camera movement, peaceful morning café prep ambiance with espresso machine warming up. No readable text on signs or screens, genuine optimistic documentary realism.`
- **HyperFrames Overlay (5–18s):** Recap 4 pilar Kassa + Offer penutup bulan (`Starter Gratis selamanya · Pro Rp49.000/bulan All-In · Tanpa Komisi`) → CTA `kassa.biz.id` / Komen `"KASSA"`.
