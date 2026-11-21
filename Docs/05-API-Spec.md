# 05 — Spesifikasi API (`/api/v1`) & Socket.IO

Base URL lokal: `http://localhost:4000/api/v1`  
Format error konsisten: `{ "code": "ERROR_CODE", "message": "Pesan bahasa Indonesia", "details": ... }`

---

## 1. Daftar Endpoint REST

### Auth (`/auth`)
| Method | Path | Deskripsi | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Login email + password | Publik |
| `POST` | `/auth/pin-login` | Login cepat kasir/dapur via PIN 4–6 digit | Publik |
| `POST` | `/auth/refresh` | Rotasi refresh token → access token baru | Cookie / Body |
| `POST` | `/auth/logout` | Revoke refresh token | Opsional |
| `GET` | `/auth/me` | Profil & daftar permission user aktif | Bearer JWT |

### Menu (`/menu`)
| Method | Path | Deskripsi | Permission |
| :--- | :--- | :--- | :--- |
| `GET` | `/menu/categories` | Daftar kategori aktif | Authenticated |
| `GET` | `/menu/stations` | Daftar stasiun produksi (Bar, Dapur, Pastry) | Authenticated |
| `GET` | `/menu/modifier-groups` | Daftar grup add-on / modifier & jumlah menu pemakai | Authenticated |
| `POST/PATCH/DELETE` | `/menu/modifier-groups`, `/menu/modifier-groups/:id` | CRUD dinamis Grup Add-On & daftar opsi + harga (Audit Log) | `menu.manage` |
| `GET` | `/menu/products` | Daftar produk lengkap (varian, modifier, resep) | Authenticated |
| `POST` | `/menu/products` | Tambah produk baru beserta `variants` & `modifierGroupIds` | `menu.manage` |
| `PATCH` | `/menu/products/:id` | Update produk, varian & modifier group (Audit Log) | `menu.manage` |
| `DELETE` | `/menu/products/:id` | Soft-delete produk (Audit Log) | `menu.manage` |
| `PATCH` | `/menu/products/:id/availability` | Toggle cepat Tersedia/Habis | Authenticated |

### Meja & Area (`/tables`)
| Method | Path | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/tables` | Daftar area beserta meja & order aktifnya |
| `POST/PATCH/DELETE` | `/tables/areas`, `/tables/areas/:id` | CRUD Area / lantai (`table.manage`) |
| `POST/PATCH/DELETE` | `/tables`, `/tables/:id` | CRUD Meja & kapasitas (`table.manage`) |
| `POST` | `/tables/:id/move` | Pindah order aktif ke meja kosong lain |
| `POST` | `/tables/merge` | Gabung order dari dua meja aktif |

### Order & Pembayaran
| Method | Path | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/orders?status=OPEN,SENT` | Daftar order (filter status) |
| `GET` | `/orders/:id` | Detail order, item, pembayaran, tiket KDS |
| `POST` | `/orders` | Buat order baru (validasi meja & kalkulasi total di server) |
| `POST` | `/orders/:id/items` | Tambah item susulan ke order terbuka |
| `POST` | `/orders/:id/send` | Kirim item pending ke dapur (buat `OrderRound` + `KitchenTicket`) |
| `POST` | `/orders/:id/void` | Void order (wajib `managerPin` + `reason`, tercatat di `audit_logs`) |
| `POST` | `/orders/:id/payments` | Pembayaran tunggal / split (otomatis `PAID` + potong stok resep) |
| `POST` | `/payments/:id/refund` | Refund sebagian/penuh (wajib `managerPin` + `reason`) |
| `POST` | `/webhooks/payment/:provider` | Webhook gateway idempotent (siap dipakai saat gateway aktif) |

### Shift, KDS, Stok, Laporan, Settings, RBAC Dinamis & Sync
- **Shift:** `GET /shifts/active`, `GET /shifts`, `POST /shifts/open`, `POST /shifts/cash-movements`, `POST /shifts/:id/close`
- **KDS:** `GET /kds/tickets?station=BAR|KITCHEN|PASTRY|ALL`, `PATCH /kds/tickets/:id/status`
- **Stok & HPP:** `GET/POST /stock/ingredients`, `PATCH/DELETE /stock/ingredients/:id`, `GET /stock/movements`, `POST /stock/adjust` (mendukung `inputUnit` fleksibel + `OPNAME` fisik aktual), `GET /stock/recipes`, `PUT /stock/recipes/:productId` (mendukung `unit` takaran fleksibel per baris, konversi otomatis ke satuan dasar) (`stock.adjust`)
- **Laporan:** `GET /reports/dashboard`, `GET /reports/sales?from=&to=` (`report.view`)
- **Settings:** `GET /settings`, `PATCH /settings` (`settings.manage`), `GET /settings/audit-logs`
- **RBAC Dinamis & Akun:** `GET /rbac/permissions`, `GET/POST /rbac/roles`, `PATCH/DELETE /rbac/roles/:id` (`role.manage`), `GET/POST /rbac/users`, `PATCH/DELETE /rbac/users/:id` (`user.manage`)
- **Offline Sync:** `GET /sync/pull`, `POST /sync/push`

---

## 2. Socket.IO Events
- Room join otomatis via query `?outletId=1&station=BAR`
- Events server → client:
  - `order:updated` (`{ type, orderId }`)
  - `table:updated` (`{ type, tableId }`)
  - `kds:updated` (`{ type, ticketId, status }`)
