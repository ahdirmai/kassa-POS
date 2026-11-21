# 04 — Database Schema (MySQL 8 InnoDB)
Sumber kebenaran skema: `apps/api/prisma/schema.prisma`

---

## 1. Konvensi Utama
- **Engine & Charset:** InnoDB, `utf8mb4_unicode_ci`.
- **Uang dalam Rupiah:** Semua kolom nominal menggunakan `BIGINT` (bilangan bulat rupiah, tanpa desimal) untuk menghindari galat floating-point.
- **Single Tenant Multi-Outlet Ready:** Setiap tabel transaksional memiliki kolom `outletId` (default `1`).
- **Offline Idempotency:** `Order.clientUuid CHAR(36) UNIQUE` + tabel `SyncLog(clientUuid UNIQUE)`.
- **Snapshot Harga:** `OrderItem` menyimpan snapshot `productName`, `variantName`, `unitPrice`, `unitCost`, dan `OrderItemModifier` menyimpan snapshot harga modifier saat transaksi.
- **Append-Only Ledger:** `StockMovement` dan `AuditLog` hanya menerima operasi `INSERT`.

---

## 2. Diagram Entitas (ERD Inti)

```mermaid
erDiagram
  Outlet ||--o{ User : has
  Role ||--o{ User : assigns
  Role ||--o{ RolePermission : has
  Permission ||--o{ RolePermission : grants

  Category ||--o{ Product : groups
  Station ||--o{ Product : routes
  Product ||--o{ ProductVariant : has
  Product ||--o| Recipe : defined_by
  Recipe ||--o{ RecipeItem : contains
  Ingredient ||--o{ RecipeItem : used_in
  Ingredient ||--o{ StockMovement : ledger

  Area ||--o{ DiningTable : contains
  Outlet ||--o{ Shift : runs
  Shift ||--o{ CashMovement : tracks
  Shift ||--o{ Order : records
  DiningTable ||--o{ Order : hosts

  Order ||--o{ OrderRound : batches
  Order ||--o{ OrderItem : contains
  OrderItem ||--o{ OrderItemModifier : customizes
  OrderRound ||--o{ KitchenTicket : dispatches
  Order ||--o{ Payment : settled_by
  Payment ||--o{ Refund : refunded_by
```

---

## 3. Indeks Wajib
- `Order`: `@@index([outletId, createdAt])`, `@@index([status])`, `@@index([tableId])`, `clientUuid @unique`, `receiptNo @unique`
- `OrderItem`: `@@index([orderId])`
- `Payment`: `@@index([orderId])`, `@@index([referenceNo])`
- `KitchenTicket`: `@@index([outletId, stationId, status])`, `@@index([orderId])`
- `StockMovement`: `@@index([ingredientId, createdAt])`, `@@index([outletId, createdAt])`
- `AuditLog`: `@@index([outletId, createdAt])`, `@@index([entityType, entityId])`
- `SyncLog`: `clientUuid @unique`
