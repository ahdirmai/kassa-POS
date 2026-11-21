import { create } from "zustand";
import type { OrderType } from "@pos/shared";

export interface CartModifier {
  id: number;
  name: string;
  price: number;
}

export interface CartItem {
  key: string;
  productId: number;
  name: string;
  monogram: string;
  tone: string;
  variantId?: number | null;
  variantName?: string | null;
  unitPrice: number;
  modifiers: CartModifier[];
  quantity: number;
  notes?: string;
}

interface PosState {
  orderType: OrderType;
  tableId: number | null;
  tableLabel: string | null;
  customerName: string;
  discountType: "PERCENT" | "FIXED" | null;
  discountValue: number;
  activeOrderId: number | null;
  items: CartItem[];
  setOrderType: (t: OrderType) => void;
  setTable: (id: number | null, label: string | null) => void;
  setCustomerName: (name: string) => void;
  setDiscount: (type: "PERCENT" | "FIXED" | null, value: number) => void;
  setActiveOrderId: (id: number | null) => void;
  addItem: (item: Omit<CartItem, "key">) => void;
  updateQty: (key: string, delta: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
}

export const usePosStore = create<PosState>((set) => ({
  orderType: "DINE_IN",
  tableId: null,
  tableLabel: null,
  customerName: "",
  discountType: null,
  discountValue: 0,
  activeOrderId: null,
  items: [],
  setOrderType: (orderType) =>
    set((s) => ({
      orderType,
      tableId: orderType === "DINE_IN" ? s.tableId : null,
      tableLabel: orderType === "DINE_IN" ? s.tableLabel : null,
    })),
  setTable: (tableId, tableLabel) => set({ tableId, tableLabel, orderType: tableId ? "DINE_IN" : "TAKEAWAY" }),
  setCustomerName: (customerName) => set({ customerName }),
  setDiscount: (discountType, discountValue) => set({ discountType, discountValue }),
  setActiveOrderId: (activeOrderId) => set({ activeOrderId }),
  addItem: (item) =>
    set((s) => {
      const modKey = item.modifiers.map((m) => m.id).sort().join(",");
      const key = `${item.productId}:${item.variantId ?? 0}:${modKey}:${item.notes ?? ""}`;
      const existing = s.items.find((x) => x.key === key);
      if (existing) {
        return {
          items: s.items.map((x) => (x.key === key ? { ...x, quantity: x.quantity + item.quantity } : x)),
        };
      }
      return { items: [...s.items, { ...item, key }] };
    }),
  updateQty: (key, delta) =>
    set((s) => ({
      items: s.items
        .map((x) => (x.key === key ? { ...x, quantity: x.quantity + delta } : x))
        .filter((x) => x.quantity > 0),
    })),
  removeItem: (key) => set((s) => ({ items: s.items.filter((x) => x.key !== key) })),
  clearCart: () =>
    set({
      items: [],
      tableId: null,
      tableLabel: null,
      customerName: "",
      discountType: null,
      discountValue: 0,
      activeOrderId: null,
    }),
}));
