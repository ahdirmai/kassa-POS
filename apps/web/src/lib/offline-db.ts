import Dexie, { type Table } from "dexie";

export interface CachedCatalog {
  key: string; // "catalog"
  syncedAt: string;
  categories: unknown[];
  products: unknown[];
  areas: unknown[];
  settings: Record<string, string>;
}

export interface OfflineTransaction {
  clientUuid: string;
  outletId?: number;
  offlineReceiptNo: string;
  createdAt: string;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableId?: number | null;
  customerName?: string;
  discountType?: "PERCENT" | "FIXED" | null;
  discountValue?: number;
  items: Array<{
    productId: number;
    variantId?: number | null;
    quantity: number;
    notes?: string;
    modifierIds?: number[];
  }>;
  paidAmount: number;
  grandTotal: number;
  synced: number; // 0 = pending, 1 = synced
}

class CadraOfflineDB extends Dexie {
  catalog!: Table<CachedCatalog, string>;
  offlineOrders!: Table<OfflineTransaction, string>;

  constructor() {
    super("cadra_pos_offline_v1");
    this.version(1).stores({
      catalog: "key",
      offlineOrders: "clientUuid, synced, createdAt",
    });
  }
}

export const offlineDb = new CadraOfflineDB();

export function catalogKey(outletId?: number): string {
  return `catalog:${outletId ?? "default"}`;
}

export async function getPendingOfflineCount(outletId?: number): Promise<number> {
  const pending = await offlineDb.offlineOrders.where("synced").equals(0).toArray();
  if (outletId === undefined) return pending.length;
  return pending.filter((p) => p.outletId === undefined || p.outletId === outletId).length;
}
