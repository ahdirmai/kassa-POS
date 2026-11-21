export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
export type OrderStatus = "DRAFT" | "OPEN" | "SENT" | "SERVED" | "PAID" | "CLOSED" | "VOID";
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "WAITING_PAYMENT";
export type PaymentMethodType = "CASH" | "QRIS" | "CARD_EDC" | "TRANSFER" | "EWALLET";
export type PaymentStatus = "PENDING" | "SETTLED" | "FAILED" | "REFUNDED";
export type KitchenStatus = "NEW" | "PREPARING" | "READY" | "BUMPED";
export type ShiftStatus = "OPEN" | "CLOSED";
export type CashMovementType = "CASH_IN" | "CASH_OUT";
export type StockMovementType = "SALE_DEDUCT" | "PURCHASE_IN" | "ADJUSTMENT" | "WASTE" | "OPNAME";

export interface TaxConfig {
  taxRatePercent: number; // default 10 (PB1 10%)
  serviceChargePercent: number; // default 5 (Service 5%)
  taxInclusive: boolean; // default false (belum termasuk harga)
  taxAfterService: boolean; // default true (pajak dihitung setelah service charge)
  roundingUnit: number; // default 100 (pembulatan ke Rp100, 0 = tidak dibulatkan)
}

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  taxRatePercent: 10,
  serviceChargePercent: 5,
  taxInclusive: false,
  taxAfterService: true,
  roundingUnit: 100,
};

export interface CalcLineItemInput {
  unitPrice: number; // integer rupiah (harga produk + varian)
  quantity: number;
  modifiersPrice?: number; // total harga modifier per 1 unit item
  itemDiscount?: number; // potongan langsung per baris dalam rupiah
}

export interface OrderDiscountInput {
  type: "PERCENT" | "FIXED";
  value: number; // persen (0-100) atau nominal rupiah
}

export interface OrderTotalsResult {
  subtotal: number;
  itemDiscountTotal: number;
  orderDiscountAmount: number;
  totalDiscount: number;
  netSubtotal: number;
  serviceChargeAmount: number;
  taxBase: number;
  taxAmount: number;
  preRoundingTotal: number;
  roundingAmount: number;
  grandTotal: number;
}

export interface PermissionMeta {
  code: PermissionCode;
  group: string;
  label: string;
  description: string;
}

export const PERMISSIONS = [
  "pos.access",
  "order.create",
  "order.void",
  "discount.apply",
  "discount.unlimited",
  "payment.refund",
  "approval.pin",
  "shift.manage",
  "kds.view",
  "menu.manage",
  "table.manage",
  "stock.view",
  "stock.adjust",
  "report.view",
  "settings.manage",
  "user.manage",
  "role.manage",
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number];

export const PERMISSION_CATALOG: PermissionMeta[] = [
  { code: "pos.access", group: "POS & Kasir", label: "Akses Kasir POS", description: "Membuka halaman kasir dan melihat katalog menu" },
  { code: "order.create", group: "POS & Kasir", label: "Buat & Kirim Order", description: "Membuat pesanan, kirim ke dapur, dan menerima pembayaran" },
  { code: "discount.apply", group: "POS & Kasir", label: "Diskon Standar", description: "Menerapkan diskon standar di kasir" },
  { code: "discount.unlimited", group: "POS & Kasir", label: "Diskon Tanpa Batas", description: "Menerapkan diskon di atas batas kasir" },
  { code: "shift.manage", group: "POS & Kasir", label: "Kelola Shift & Kas", description: "Buka/tutup shift dan catat petty cash" },
  { code: "order.void", group: "Otorisasi Sensitif", label: "Void Order", description: "Membatalkan order aktif atau sudah dikirim ke dapur" },
  { code: "payment.refund", group: "Otorisasi Sensitif", label: "Refund Pembayaran", description: "Melakukan refund sebagian atau penuh" },
  { code: "approval.pin", group: "Otorisasi Sensitif", label: "Approval via PIN", description: "PIN dapat digunakan untuk menyetujui void/refund kasir" },
  { code: "kds.view", group: "Dapur & Operasional", label: "Akses KDS", description: "Melihat dan memproses tiket dapur/bar" },
  { code: "menu.manage", group: "Dapur & Operasional", label: "Kelola Menu", description: "Tambah, ubah produk, harga, dan ketersediaan" },
  { code: "table.manage", group: "Dapur & Operasional", label: "Kelola Meja", description: "Kelola denah meja, pindah dan gabung meja" },
  { code: "stock.view", group: "Stok & Laporan", label: "Lihat Stok & HPP", description: "Melihat saldo bahan baku, resep, dan margin" },
  { code: "stock.adjust", group: "Stok & Laporan", label: "Adjust & Waste Stok", description: "Mencatat pembelian masuk, waste, dan stock opname" },
  { code: "report.view", group: "Stok & Laporan", label: "Lihat Laporan & Audit", description: "Akses dashboard owner, laporan penjualan, dan audit log" },
  { code: "settings.manage", group: "Sistem & RBAC", label: "Pengaturan Bisnis", description: "Mengubah tarif PB1, service charge, dan profil outlet" },
  { code: "user.manage", group: "Sistem & RBAC", label: "Kelola Staf & User", description: "Tambah staf, ubah role user, dan reset PIN" },
  { code: "role.manage", group: "Sistem & RBAC", label: "Kelola Role & Permission", description: "Membuat role baru dan mengatur matriks hak akses dinamis" },
];
