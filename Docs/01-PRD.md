# 01 — Product Requirements Document (PRD)
**Produk:** Cadra POS — Sistem Point of Sale Cafe & Rumah Makan  
**Model:** Single Tenant (Multi-Outlet Ready via `outlet_id`)  
**Versi:** 1.0  

---

## 1. Tujuan & Masalah Bisnis
Pemilik cafe dan rumah makan membutuhkan sistem kasir yang:
1. **Cepat dipakai saat jam sibuk** — input 10 item dengan modifier dan kirim ke dapur < 30 detik.
2. **Andal saat internet mati** — kasir tetap bisa bertransaksi tunai secara offline dan sinkron otomatis saat koneksi pulih tanpa duplikasi.
3. **Kontrol penuh atas uang & HPP** — perhitungan pajak PB1 (10%), Service Charge (5%), pembulatan Rp100, rekonsiliasi shift, dan pengurangan stok bahan baku otomatis per resep (BOM).
4. **Pengalaman visual modern** — mengadopsi bahasa desain **Cadra** (glassmorphism, tipografi Urbanist, dark/light mode, 5 aksen warna, kartu menu monogram, dan struk thermal bergerigi).

---

## 2. Persona & Hak Akses (RBAC)
| Peran | Login | Kebutuhan Utama | Akses Utama |
| :--- | :--- | :--- | :--- |
| **Owner** | Email/Password & PIN (`1111`) | Dashboard omzet, HPP, pengaturan pajak, audit log | Semua modul & izin |
| **Manager** | Email/Password & PIN (`2222`) | Approval void/refund, stok/waste, laporan shift | POS, KDS, Admin (tanpa ubah user/setting kritikal) |
| **Kasir** | PIN Cepat (`1234`) | Input pesanan, kelola meja, pembayaran, buka/tutup shift | `/pos` saja (diblokir dari `/admin` & laporan) |
| **Dapur / Bar** | PIN Cepat (`5678`) | Melihat antrean pesanan realtime & menandai siap saji | `/kds` saja |

---

## 3. Scope Fungsional (MVP + Inti Fase 2)

### 3.1 Autentikasi & Keamanan (RBAC Dinamis)
- Login email + password (admin) dan PIN 4–6 digit (kasir/dapur).
- JWT Access Token (15 menit) + Refresh Token rotasi (disimpan hash di DB + httpOnly cookie).
- **RBAC Dinamis**: Owner dapat membuat role kustom (mis. *Supervisor Shift*, *Barista Lead*), mengubah matriks permission per role secara realtime tanpa restart server, serta mengganti role staf dari `/admin/rbac`. Perubahan langsung berlaku lewat invalidasi cache permission.
- Aksi sensitif (**Void Order**, **Refund**) wajib **PIN Approval** dari user manapun yang role-nya memiliki izin `approval.pin` + alasan tertulis yang direkam ke `audit_logs` (immutable).

### 3.2 Manajemen Menu, Varian & Add-On Dinamis
- CRUD penuh Produk (Tambah, Edit, Soft-Delete, URL Foto), Kategori, Varian ukuran/penyajian (`priceDelta`), dan **CRUD penuh Grup Add-On / Modifier Dinamis** (`/admin/menu` → tab *Grup Add-On*: buat grup baru, atur wajib/opsional, min–max pilihan, serta tambah/ubah/hapus opsi add-on & harganya).
- Setiap menu dapat memilih kombinasi Grup Add-On yang berbeda-beda (relasi many-to-many).
- Penanda otomatis **Custom vs 1-Tap Langsung**: menu dengan `> 1` varian atau `≥ 1` modifier group otomatis diberi badge **`Custom`** di `/admin/menu` dan kartu `/pos` (membuka popup customisasi saat diketuk), sedangkan lainnya masuk keranjang dengan 1 ketuk.
- Routing otomatis ke stasiun produksi: **Bar & Kopi**, **Dapur Panas**, **Pastry & Bakery**.
- Toggle cepat status ketersediaan (*Tersedia / Habis*), plus search & filter kategori.

### 3.3 Order, Meja & KDS Realtime
- Tipe order: **Dine-in**, **Takeaway**, **Delivery**.
- CRUD penuh **Area & Denah Meja** (`/admin/tables`: tambah/edit/hapus area dan meja), validasi lock 1 meja = 1 order aktif, pindah meja, gabung meja.
- Kirim ke dapur per batch (*round*); item susulan membentuk round baru.
- **KDS Kanban (`/kds`)**: Tampilan papan Kanban bergaya Cadra (*Antrean Baru* → *Sedang Diproses* → *Siap Saji* → *Selesai/Recall*) lengkap dengan **drag-and-drop** antar kolom maupun tombol 1-tap layar sentuh, ribbon proporsi beban kerja, filter stasiun, tiket realtime via Socket.IO, dan timer SLA.

### 3.4 Pembayaran & Struk
- Metode: **Tunai** (hitung kembalian otomatis), **QRIS (Konfirmasi Manual)**, **Kartu/EDC** (input referensi), **Transfer Bank**, **E-Wallet**.
- > **Catatan Payment Gateway:** Integrasi otomatis Payment Gateway (Midtrans/Xendit) **ditunda ke fase berikutnya** sesuai keputusan terbaru. Interface adapter (`PaymentGatewayAdapter`) dan endpoint webhook idempotent sudah disiapkan agar tinggal diaktifkan nanti.
- Perhitungan default: **Service Charge 5%** → **PB1 10% (setelah service)** → **Pembulatan Rp100**.
- Struk thermal 58mm/80mm print-ready dengan nomor struk unik (`RCP-YYYYMMDD-XXXX` untuk online, `OFF-XXXXXX` untuk offline).

### 3.5 Shift & Kas
- Buka shift dengan modal kas awal, pencatatan *Cash In/Out* (petty cash) dengan alasan, tutup shift dengan input kas fisik aktual, selisih (*expected vs actual*), dan Z-Report.

### 3.6 Mode Offline Dasar
- Katalog menu di-cache di IndexedDB (**Dexie**).
- Saat offline, transaksi tunai disimpan lokal dengan `client_uuid` (UUID v4) dan nomor struk `OFF-`.
- Saat kembali online, antrean otomatis dikirim ke `POST /api/v1/sync/push` secara **idempotent**.

### 3.7 Stok Bahan Baku, Resep (BOM) & HPP (Flexible Measurement)
- CRUD penuh master bahan baku (Tambah, Edit, Soft-Delete dengan reaktivasi SKU) dengan **satuan pengukuran fleksibel** (preset cepat Berat `kg→gram`, Volume `liter→ml`, Sirup `botol→ml (750)`, Kemasan `pack→gram`, Bakery `box→pcs (12)`, Telur `tray→butir (30)`, serta bebas mengetik satuan custom seperti `pump`, `scoop`, `slice`, `iket`, `siung`).
- **Kalkulator Harga Beli** otomatis menghitung biaya per satuan dasar dari harga beli per kemasan.
- **Konversi Satuan Otomatis di Mutasi Stok & Resep (BOM)**: saat restock, waste, stock opname, atau mengisi takaran resep, user bebas memilih satuan input (`kg`/`gram`/`ons`, `liter`/`ml`/`sdm`/`sdt`/`shot`/`oz`/`cup`, atau satuan beli seperti `box`/`botol`/`tray`). Sistem otomatis mengonversi ke satuan dasar bahan (`packages/shared/src/units.ts`), menampilkan live preview HPP & Margin (%), dan mencatat jejak konversinya di `stock_movements`.
- Stok bahan otomatis berkurang saat order `PAID` (append-only di `stock_movements`). Perubahan harga bahan otomatis menyinkronkan HPP semua menu terkait.

### 3.8 Manajemen Akun Staf & Auto-Refresh Sesi
- CRUD penuh Akun Staf di `/admin/rbac` (Tambah staf, Edit nama/email/role, Reset Password & PIN, toggle Aktif/Nonaktif, Soft-delete dengan proteksi anti-hapus diri sendiri / Owner terakhir).
- Frontend otomatis memperbarui JWT access token yang kadaluarsa (15 menit) via `POST /auth/refresh` (httpOnly cookie) tanpa mengganggu kasir.

---

## 4. Roadmap Fase Lanjutan
- **Fase 2 Lanjutan:** Split bill per item/per orang, Promo Engine (Happy Hour, Buy X Get Y, Voucher), Aktivasi Payment Gateway QRIS Dinamis.
- **Fase 3:** Self-Order QR per meja (`/order/[tableToken]`), Pelanggan & Loyalty Poin, Kampanye WhatsApp.
- **Fase 4:** Integrasi GoFood/GrabFood/ShopeeFood, Multi-Outlet penuh, Integrasi Akuntansi (Jurnal/Accurate).
