"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  ChefHat,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import { calculateCashChange, calculateOrderTotals, formatIDR, type PaymentMethodType } from "@pos/shared";
import { CadraShell } from "@/components/cadra-shell";
import { ReceiptModal, type ReceiptData } from "@/components/receipt-modal";
import { PinApprovalModal } from "@/components/pin-modal";
import { apiFetch, ApiError } from "@/lib/api";
import {
  catalogKey,
  generateClientUuid,
  getOfflineQueueCounts,
  offlineDb,
  parseTaxConfigFromSettings,
  type CachedCatalog,
} from "@/lib/offline-db";
import { isNetworkError, pullCatalogToCache, registerBackgroundSync } from "@/lib/sync-engine";
import { usePosStore } from "@/stores/pos-store";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";

interface Product {
  id: number;
  sku: string;
  name: string;
  monogram: string;
  tone: string;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  category: { id: number; name: string };
  variants: Array<{ id: number; name: string; priceDelta: number; isDefault: boolean }>;
  modifierGroups: Array<{
    modifierGroup: {
      id: number;
      name: string;
      maxSelect: number;
      modifiers: Array<{ id: number; name: string; price: number }>;
    };
  }>;
}

interface AreaWithTables {
  id: number;
  name: string;
  tables: Array<{
    id: number;
    code: string;
    name: string;
    capacity: number;
    status: string;
    orders: Array<{ id: number; orderNo: string; grandTotal: number }>;
  }>;
}

interface ActiveShift {
  id: number;
  openingCash: number;
  openedAt: string;
  user: { name: string };
  summary: { totalOrders: number; cashSales: number; nonCashSales: number; totalSales: number; expectedCash: number };
}

interface OpenOrder {
  id: number;
  orderNo: string;
  orderType: string;
  status: string;
  grandTotal: number;
  table?: { id: number; code: string; name: string } | null;
  customerName?: string | null;
  items: Array<{ id: number; productName: string; quantity: number; lineTotal: number }>;
}

const TONE_CSS: Record<string, string> = {
  iris: "var(--iris)",
  coral: "var(--coral)",
  amber: "var(--amber)",
  teal: "var(--teal)",
  sky: "var(--sky)",
  rose: "var(--rose)",
  lime: "var(--lime)",
  slate: "var(--slate)",
  plum: "var(--plum)",
};

export default function PosPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { isOnline, setOnline, pushToast, setPendingOffline, setFailedOffline } = useUiStore();
  const pos = usePosStore();

  const [categoryId, setCategoryId] = useState<number | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [modProduct, setModProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedModIds, setSelectedModIds] = useState<number[]>([]);
  const [itemNote, setItemNote] = useState("");

  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [openOrdersModal, setOpenOrdersModal] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState("500000");
  const [closingCashInput, setClosingCashInput] = useState("");

  const [payMethod, setPayMethod] = useState<PaymentMethodType>("CASH");
  const [paidAmountInput, setPaidAmountInput] = useState("");
  const [refNoInput, setRefNoInput] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [voidOrderId, setVoidOrderId] = useState<number | null>(null);

  const { data: catalogSnapshot, isLoading: productsLoading } = useQuery<CachedCatalog>({
    queryKey: ["pos-catalog", user?.outletId],
    queryFn: async () => {
      const key = catalogKey(user?.outletId);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = await offlineDb.catalog.get(key);
        if (cached) return cached;
      }
      try {
        return await pullCatalogToCache(user?.outletId);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) throw err;
        if (isNetworkError(err)) setOnline(false);
        const cached = await offlineDb.catalog.get(key);
        if (cached) return cached;
        return { key, syncedAt: "", categories: [], products: [], areas: [], settings: {} };
      }
    },
  });

  const products = useMemo(() => (catalogSnapshot?.products as Product[]) ?? [], [catalogSnapshot]);
  const cachedAreas = useMemo(() => (catalogSnapshot?.areas as AreaWithTables[]) ?? [], [catalogSnapshot]);
  const taxConfig = useMemo(() => parseTaxConfigFromSettings(catalogSnapshot?.settings), [catalogSnapshot]);

  const { data: liveAreas } = useQuery({
    queryKey: ["tables", user?.outletId],
    queryFn: () => apiFetch<AreaWithTables[]>("/tables"),
    enabled: isOnline,
  });

  const areas = isOnline && liveAreas ? liveAreas : cachedAreas;

  const { data: activeShift } = useQuery({
    queryKey: ["active-shift"],
    queryFn: () => apiFetch<ActiveShift | null>("/shifts/active"),
    enabled: isOnline,
  });

  const { data: openOrders = [] } = useQuery({
    queryKey: ["open-orders"],
    queryFn: () => apiFetch<OpenOrder[]>("/orders?status=OPEN,SENT,SERVED"),
    enabled: isOnline,
  });

  const categories = useMemo(() => {
    const map = new Map<number, string>();
    products.forEach((p) => {
      if (p.category) map.set(p.category.id, p.category.name);
    });
    return [...map.entries()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = categoryId === "ALL" || p.category?.id === categoryId;
      const qOk = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [products, categoryId, search]);

  const totals = useMemo(
    () =>
      calculateOrderTotals(
        pos.items.map((it) => ({
          unitPrice: it.unitPrice,
          modifiersPrice: it.modifiers.reduce((s, m) => s + m.price, 0),
          quantity: it.quantity,
        })),
        pos.discountType && pos.discountValue > 0 ? { type: pos.discountType, value: pos.discountValue } : null,
        taxConfig,
      ),
    [pos.items, pos.discountType, pos.discountValue, taxConfig],
  );

  useEffect(() => {
    if (payModalOpen) {
      setPaidAmountInput(String(totals.grandTotal));
    }
  }, [payModalOpen, totals.grandTotal]);

  const openShiftMut = useMutation({
    mutationFn: () =>
      apiFetch("/shifts/open", {
        method: "POST",
        body: JSON.stringify({ openingCash: Number(openingCashInput) || 0 }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-shift"] });
      setShiftModalOpen(false);
      pushToast("Shift berhasil dibuka", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const closeShiftMut = useMutation({
    mutationFn: () =>
      apiFetch(`/shifts/${activeShift!.id}/close`, {
        method: "POST",
        body: JSON.stringify({ actualCash: Number(closingCashInput) || 0 }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["active-shift"] });
      setShiftModalOpen(false);
      setClosingCashInput("");
      pushToast("Shift ditutup & Z-Report tersimpan", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const handleTileClick = (p: Product) => {
    if (!p.isAvailable) return;
    const hasCustom = p.variants.length > 1 || p.modifierGroups.length > 0;
    if (!hasCustom) {
      const defVar = p.variants[0];
      pos.addItem({
        productId: p.id,
        name: p.name,
        monogram: p.monogram,
        tone: p.tone,
        variantId: defVar?.id ?? null,
        variantName: defVar?.name ?? null,
        unitPrice: p.price + (defVar?.priceDelta ?? 0),
        modifiers: [],
        quantity: 1,
      });
      return;
    }
    const defVar = p.variants.find((v) => v.isDefault) ?? p.variants[0] ?? null;
    setModProduct(p);
    setSelectedVariantId(defVar?.id ?? null);
    setSelectedModIds([]);
    setItemNote("");
  };

  const confirmModifierAdd = () => {
    if (!modProduct) return;
    const variant = modProduct.variants.find((v) => v.id === selectedVariantId) ?? null;
    const allMods = modProduct.modifierGroups.flatMap((g) => g.modifierGroup.modifiers);
    const chosen = allMods.filter((m) => selectedModIds.includes(m.id));
    pos.addItem({
      productId: modProduct.id,
      name: modProduct.name,
      monogram: modProduct.monogram,
      tone: modProduct.tone,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      unitPrice: modProduct.price + (variant?.priceDelta ?? 0),
      modifiers: chosen,
      quantity: 1,
      notes: itemNote.trim() || undefined,
    });
    setModProduct(null);
  };

  const handleSendToKitchen = async () => {
    if (pos.items.length === 0) return;
    try {
      const created = await apiFetch<{ id: number; orderNo: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          orderType: pos.orderType,
          tableId: pos.tableId,
          customerName: pos.customerName || undefined,
          discountType: pos.discountType,
          discountValue: pos.discountValue,
          sendToKitchen: true,
          items: pos.items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            quantity: it.quantity,
            notes: it.notes,
            modifierIds: it.modifiers.map((m) => m.id),
          })),
        }),
      });
      pushToast(`Order ${created.orderNo} dikirim ke dapur (KDS)`, "good");
      pos.clearCart();
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["open-orders"] });
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Gagal kirim ke dapur", "bad");
    }
  };

  const saveOfflineCashOrder = async (paidAmount: number, reasonNote?: string) => {
    const clientUuid = generateClientUuid();
    const offlineReceiptNo = `OFF-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();
    await offlineDb.offlineOrders.add({
      clientUuid,
      outletId: user?.outletId,
      offlineReceiptNo,
      createdAt: nowIso,
      orderType: pos.orderType,
      tableId: pos.tableId,
      tableName: pos.tableLabel,
      customerName: pos.customerName || undefined,
      discountType: pos.discountType,
      discountValue: pos.discountValue,
      items: pos.items.map((it) => ({
        productId: it.productId,
        variantId: it.variantId,
        quantity: it.quantity,
        notes: it.notes,
        modifierIds: it.modifiers.map((m) => m.id),
      })),
      paidAmount,
      grandTotal: totals.grandTotal,
      synced: 0,
      syncStatus: "PENDING",
      retryCount: 0,
      lastError: null,
    });
    const counts = await getOfflineQueueCounts(user?.outletId);
    setPendingOffline(counts.pending);
    setFailedOffline(counts.failed);
    registerBackgroundSync();

    setReceipt({
      receiptNo: offlineReceiptNo,
      orderNo: offlineReceiptNo,
      createdAt: nowIso,
      orderType: pos.orderType,
      tableName: pos.tableLabel,
      cashierName: user?.name,
      items: pos.items.map((it) => ({
        productName: it.name,
        variantName: it.variantName,
        quantity: it.quantity,
        lineTotal: (it.unitPrice + it.modifiers.reduce((s, m) => s + m.price, 0)) * it.quantity,
        modifiers: it.modifiers.map((m) => ({ modifierName: m.name, price: m.price })),
      })),
      subtotal: totals.subtotal,
      discountAmount: totals.totalDiscount,
      serviceChargeAmount: totals.serviceChargeAmount,
      taxAmount: totals.taxAmount,
      roundingAmount: totals.roundingAmount,
      grandTotal: totals.grandTotal,
      paidAmount,
      changeAmt: calculateCashChange(totals.grandTotal, paidAmount),
      paymentMethod: "CASH (OFFLINE)",
    });
    pos.clearCart();
    setPayModalOpen(false);
    pushToast(
      reasonNote ?? `Disimpan offline (${offlineReceiptNo}). Akan otomatis sinkron saat online.`,
      "warn",
    );
  };

  const handleCompletePayment = async () => {
    if (pos.items.length === 0) return;
    const paidAmount = payMethod === "CASH" ? Number(paidAmountInput) || totals.grandTotal : totals.grandTotal;
    if (payMethod === "CASH" && paidAmount < totals.grandTotal) {
      pushToast("Uang tunai kurang dari total tagihan", "bad");
      return;
    }

    // Mode Offline: simpan tunai ke IndexedDB Dexie dengan prefiks OFF-
    if (!isOnline) {
      if (payMethod !== "CASH") {
        pushToast("Mode offline hanya mendukung pembayaran Tunai", "warn");
        return;
      }
      await saveOfflineCashOrder(paidAmount);
      return;
    }

    try {
      // 1. Buat order atau gunakan order aktif
      let orderId = pos.activeOrderId;
      if (!orderId) {
        const created = await apiFetch<{ id: number }>("/orders", {
          method: "POST",
          body: JSON.stringify({
            orderType: pos.orderType,
            tableId: pos.tableId,
            customerName: pos.customerName || undefined,
            discountType: pos.discountType,
            discountValue: pos.discountValue,
            sendToKitchen: true,
            items: pos.items.map((it) => ({
              productId: it.productId,
              variantId: it.variantId,
              quantity: it.quantity,
              notes: it.notes,
              modifierIds: it.modifiers.map((m) => m.id),
            })),
          }),
        });
        orderId = created.id;
      }

      // 2. Pembayaran (QRIS dikonfirmasi manual karena payment gateway ditunda)
      const effectiveMethod = payMethod === "QRIS" ? "EWALLET" : payMethod;
      const payRes = await apiFetch<{ order: ReceiptData & { id: number } }>(`/orders/${orderId}/payments`, {
        method: "POST",
        body: JSON.stringify({
          payments: [
            {
              method: effectiveMethod,
              amount: totals.grandTotal,
              paidAmount,
              referenceNo:
                payMethod === "QRIS"
                  ? refNoInput.trim() || `QRIS-STATIC-${Date.now().toString().slice(-5)}`
                  : refNoInput.trim() || undefined,
            },
          ],
        }),
      });

      setReceipt({
        ...payRes.order,
        tableName: pos.tableLabel,
        cashierName: user?.name,
        paidAmount,
        changeAmt: payMethod === "CASH" ? calculateCashChange(totals.grandTotal, paidAmount) : 0,
        paymentMethod: payMethod === "QRIS" ? "QRIS (Konfirmasi Manual)" : payMethod,
      });

      pos.clearCart();
      setPayModalOpen(false);
      setRefNoInput("");
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["open-orders"] });
      qc.invalidateQueries({ queryKey: ["active-shift"] });
      pushToast("Pembayaran berhasil & stok bahan otomatis terpotong!", "good");
    } catch (err) {
      // Fallback otomatis ke offline jika WiFi tersambung tapi internet/server tidak terjangkau
      if (isNetworkError(err)) {
        setOnline(false);
        if (payMethod === "CASH" && !pos.activeOrderId) {
          await saveOfflineCashOrder(
            paidAmount,
            "Koneksi ke server terputus — transaksi tunai otomatis disimpan offline & akan sinkron saat online.",
          );
          return;
        }
        pushToast("Koneksi ke server terputus. Pembayaran non-tunai memerlukan internet.", "warn");
        return;
      }
      pushToast(err instanceof Error ? err.message : "Pembayaran gagal", "bad");
    }
  };

  return (
    <CadraShell
      title="Kasir POS"
      crumb="Point of Sale"
      mode="pos"
      rightSlot={
        <>
          <button onClick={() => setOpenOrdersModal(true)} className="btn-cadra btn-cadra--ghost">
            <Receipt className="h-4 w-4" />
            Order Aktif ({openOrders.length})
          </button>
          <button onClick={() => setShiftModalOpen(true)} className="btn-cadra btn-cadra--ghost">
            <Wallet className="h-4 w-4" />
            {activeShift ? `Shift Aktif · ${formatIDR(activeShift.summary.totalSales)}` : "Buka Shift"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 pb-20 lg:pb-0 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        {/* Left: Menu Shelf */}
        <section className="cadra-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
            <div className="no-scrollbar flex flex-nowrap sm:flex-wrap items-center gap-1.5 overflow-x-auto pb-0.5">
              <button onClick={() => setCategoryId("ALL")} className="chip shrink-0" data-active={categoryId === "ALL"}>
                Semua Menu
              </button>
              {categories.map(([id, name]) => (
                <button key={id} onClick={() => setCategoryId(id)} className="chip shrink-0" data-active={categoryId === id}>
                  {name}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari menu atau SKU..."
                className="cadra-input cadra-input--search"
              />
            </div>
          </div>

          {productsLoading && products.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--muted)]">Memuat katalog menu...</div>
          ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                disabled={!p.isAvailable}
                onClick={() => handleTileClick(p)}
                className="pos-tile"
                style={{ ["--c" as string]: TONE_CSS[p.tone] ?? "var(--iris)" }}
              >
                <div className="pos-tile__mono group">
                  {p.imageUrl ? (
                    <>
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15" />
                    </>
                  ) : (
                    <b>{p.monogram}</b>
                  )}
                  {(p.variants.length > 1 || p.modifierGroups.length > 0) && (
                    <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-[var(--ink)] px-2 py-0.5 text-[9px] font-bold text-[var(--on-ink)] shadow-sm">
                      Custom
                    </span>
                  )}
                  <span className="absolute bottom-1.5 right-1.5 z-10 rounded-full bg-[var(--raised)] px-2 py-0.5 text-[10px] font-bold text-[var(--text)] shadow-sm">
                    {p.isAvailable ? p.sku : "Habis"}
                  </span>
                </div>
                <div className="line-clamp-2 min-h-[2.4em] px-0.5 text-[13px] font-semibold leading-snug">{p.name}</div>
                <div className="flex items-baseline justify-between px-0.5">
                  <span className="text-[11px] text-[var(--muted)]">{p.category.name.split(" ")[0]}</span>
                  <b className="text-sm font-bold">{formatIDR(p.price)}</b>
                </div>
              </button>
            ))}
          </div>
          )}
        </section>

        {/* Right: Sticky Cart on lg+ OR Slide-up Bottom Sheet on Mobile/Portrait Tablet */}
        {cartSheetOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm lg:hidden"
            onClick={() => setCartSheetOpen(false)}
          />
        )}
        <aside
          className={`cadra-card flex flex-col gap-3.5 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] ${
            cartSheetOpen
              ? "fixed inset-x-0 bottom-0 z-50 max-h-[86dvh] rounded-b-none rounded-t-3xl !bg-[var(--raised)] shadow-2xl pb-[calc(16px+env(safe-area-inset-bottom))] lg:static lg:z-auto lg:rounded-3xl lg:!bg-[var(--glass)]"
              : "hidden lg:flex"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <ShoppingCart className="h-4 w-4" />
              Pesanan Saat Ini
            </h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--well)] px-2.5 py-0.5 text-xs font-bold text-[var(--muted)]">
                {pos.items.reduce((s, i) => s + i.quantity, 0)} item
              </span>
              <button
                onClick={() => setCartSheetOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)] lg:hidden"
                aria-label="Tutup keranjang"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Order Type Switcher */}
          <div className="grid grid-cols-3 gap-1 rounded-full bg-[var(--well)] p-1">
            {(["DINE_IN", "TAKEAWAY", "DELIVERY"] as const).map((t) => (
              <button
                key={t}
                onClick={() => pos.setOrderType(t)}
                className={`min-h-[36px] rounded-full py-1.5 text-xs font-bold transition ${
                  pos.orderType === t ? "bg-[var(--ink)] text-[var(--on-ink)]" : "text-[var(--muted)]"
                }`}
              >
                {t === "DINE_IN" ? "Dine-in" : t === "TAKEAWAY" ? "Takeaway" : "Delivery"}
              </button>
            ))}
          </div>

          {/* Table & Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => setTableModalOpen(true)}
              disabled={pos.orderType !== "DINE_IN"}
              className="btn-cadra btn-cadra--ghost text-xs justify-start truncate"
            >
              <UtensilsCrossed className="h-3.5 w-3.5 shrink-0" />
              {pos.tableLabel ?? "Pilih Meja"}
            </button>
            <input
              value={pos.customerName}
              onChange={(e) => pos.setCustomerName(e.target.value)}
              placeholder="Nama pelanggan..."
              className="cadra-input"
            />
          </div>

          {/* Cart Lines */}
          <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-[var(--line)]">
            {pos.items.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--muted)]">
                Ketuk menu di sebelah kiri untuk menambahkan ke keranjang.
              </div>
            ) : (
              pos.items.map((it) => {
                const modSum = it.modifiers.reduce((s, m) => s + m.price, 0);
                return (
                  <div key={it.key} className="py-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold leading-tight">
                        {it.name} {it.variantName ? <span className="text-xs text-[var(--muted)]">({it.variantName})</span> : null}
                      </div>
                      {it.modifiers.length > 0 && (
                        <div className="text-[11px] text-[var(--primary-ink)]">
                          + {it.modifiers.map((m) => m.name).join(", ")}
                        </div>
                      )}
                      {it.notes && <div className="text-[11px] italic text-[var(--muted)]">“{it.notes}”</div>}
                      <div className="mt-1 text-xs font-bold">{formatIDR((it.unitPrice + modSum) * it.quantity)}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => pos.updateQty(it.key, -1)}
                        className="grid h-10 w-10 place-items-center rounded-full bg-[var(--well)] hover:bg-[var(--line-2)]"
                        aria-label="Kurangi"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{it.quantity}</span>
                      <button
                        onClick={() => pos.updateQty(it.key, 1)}
                        className="grid h-10 w-10 place-items-center rounded-full bg-[var(--well)] hover:bg-[var(--line-2)]"
                        aria-label="Tambah"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Discount Chips */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[var(--muted)]">Diskon</span>
            <div className="flex flex-wrap gap-1.5">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  onClick={() => pos.setDiscount(pct ? "PERCENT" : null, pct)}
                  className="chip !min-h-[38px] !px-3 !text-xs"
                  data-active={(pos.discountType === "PERCENT" ? pos.discountValue : 0) === pct}
                >
                  {pct === 0 ? "0%" : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1 rounded-2xl bg-[var(--surface)] p-3 text-xs">
            <div className="flex justify-between text-[var(--muted)]">
              <span>Subtotal</span>
              <span>{formatIDR(totals.subtotal)}</span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-[var(--good)]">
                <span>Diskon ({pos.discountValue}%)</span>
                <span>-{formatIDR(totals.totalDiscount)}</span>
              </div>
            )}
            {taxConfig.serviceChargePercent > 0 && (
              <div className="flex justify-between text-[var(--muted)]">
                <span>Service Charge ({taxConfig.serviceChargePercent}%)</span>
                <span>{formatIDR(totals.serviceChargeAmount)}</span>
              </div>
            )}
            {taxConfig.taxRatePercent > 0 && (
              <div className="flex justify-between text-[var(--muted)]">
                <span>PB1 ({taxConfig.taxRatePercent}%)</span>
                <span>{formatIDR(totals.taxAmount)}</span>
              </div>
            )}
            {totals.roundingAmount !== 0 && (
              <div className="flex justify-between text-[var(--muted)]">
                <span>Pembulatan</span>
                <span>{formatIDR(totals.roundingAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[var(--line)] pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatIDR(totals.grandTotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <button
              disabled={pos.items.length === 0 || !isOnline}
              onClick={handleSendToKitchen}
              className="btn-cadra btn-cadra--ghost"
            >
              <ChefHat className="h-4 w-4" />
              Dapur
            </button>
            <button
              disabled={pos.items.length === 0}
              onClick={() => {
                setCartSheetOpen(false);
                setPayModalOpen(true);
              }}
              className="btn-cadra btn-cadra--primary"
            >
              Bayar · {formatIDR(totals.grandTotal)}
            </button>
          </div>
          {pos.items.length > 0 && (
            <button onClick={pos.clearCart} className="min-h-[36px] text-center text-xs font-semibold text-[var(--muted)] hover:text-[var(--bad)]">
              <Trash2 className="mr-1 inline h-3.5 w-3.5" />
              Kosongkan keranjang
            </button>
          )}
        </aside>
      </div>

      {/* Floating Bottom Checkout Bar for Mobile & Portrait Tablet (< lg) */}
      {!cartSheetOpen && (
        <div className="fixed inset-x-3 bottom-[74px] md:bottom-[76px] z-35 lg:hidden">
          <button
            onClick={() => setCartSheetOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-[var(--ink)] px-4 py-3 text-[var(--on-ink)] shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <ShoppingCart className="h-5 w-5" />
                {pos.items.length > 0 && (
                  <b className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--coral)] px-1 text-[10px] text-white">
                    {pos.items.reduce((s, i) => s + i.quantity, 0)}
                  </b>
                )}
              </span>
              <div className="text-left leading-tight">
                <div className="text-[11px] opacity-75">
                  {pos.orderType === "DINE_IN" ? (pos.tableLabel ?? "Dine-in") : pos.orderType}
                </div>
                <div className="text-base font-bold">{formatIDR(totals.grandTotal)}</div>
              </div>
            </div>
            <span className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--on-accent)]">
              Lihat Pesanan
            </span>
          </button>
        </div>
      )}

      {/* Modifier & Variant Modal */}
      {modProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setModProduct(null)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold">{modProduct.name}</h3>
                <p className="text-xs text-[var(--muted)]">{formatIDR(modProduct.price)} · Pilih varian &amp; modifier</p>
              </div>
              <button onClick={() => setModProduct(null)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup"><X className="h-4 w-4" /></button>
            </div>

            {modProduct.variants.length > 0 && (
              <div>
                <div className="mb-1.5 text-xs font-bold text-[var(--muted)]">Varian</div>
                <div className="flex flex-wrap gap-2">
                  {modProduct.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className="chip"
                      data-active={selectedVariantId === v.id}
                    >
                      {v.name} {v.priceDelta > 0 ? `+${formatIDR(v.priceDelta)}` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {modProduct.modifierGroups.map(({ modifierGroup: g }) => (
              <div key={g.id}>
                <div className="mb-1.5 text-xs font-bold text-[var(--muted)]">
                  {g.name} <span className="font-normal">(maks {g.maxSelect})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.modifiers.map((m) => {
                    const active = selectedModIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModIds((prev) => {
                            if (active) return prev.filter((id) => id !== m.id);
                            if (g.maxSelect === 1) {
                              const groupIds = g.modifiers.map((x) => x.id);
                              return [...prev.filter((id) => !groupIds.includes(id)), m.id];
                            }
                            return [...prev, m.id];
                          });
                        }}
                        className="chip"
                        data-active={active}
                      >
                        {m.name} {m.price > 0 ? `+${formatIDR(m.price)}` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--muted)]">Catatan Dapur</label>
              <input
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="Contoh: Es dipisah, tanpa daun bawang..."
                className="cadra-input"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setModProduct(null)} className="btn-cadra btn-cadra--ghost">Batal</button>
              <button onClick={confirmModifierAdd} className="btn-cadra btn-cadra--primary">Tambah ke Pesanan</button>
            </div>
          </div>
        </div>
      )}

      {/* Table Map Modal */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setTableModalOpen(false)}>
          <div className="w-full max-w-2xl rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4 max-h-[82vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Pilih Meja</h3>
              <button onClick={() => setTableModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup"><X className="h-4 w-4" /></button>
            </div>
            {areas.map((area) => (
              <div key={area.id} className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{area.name}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {area.tables.map((t) => {
                    const busy = t.status !== "AVAILABLE";
                    return (
                      <button
                        key={t.id}
                        disabled={busy}
                        onClick={() => {
                          pos.setTable(t.id, t.name);
                          setTableModalOpen(false);
                        }}
                        className={`rounded-2xl border p-3 text-left transition ${
                          pos.tableId === t.id
                            ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]"
                            : busy
                              ? "border-amber-500/40 bg-amber-500/10 opacity-70 cursor-not-allowed"
                              : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--iris)]"
                        }`}
                      >
                        <div className="font-bold text-sm">{t.name}</div>
                        <div className="text-[11px] opacity-75">{busy ? "Terisi" : `Kosong · ${t.capacity} kursi`}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setPayModalOpen(false)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Pembayaran</h3>
                <p className="text-xs text-[var(--muted)]">Total Tagihan: <b className="text-[var(--text)]">{formatIDR(totals.grandTotal)}</b></p>
              </div>
              <button onClick={() => setPayModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {([
                ["CASH", "Tunai", Banknote],
                ["QRIS", "QRIS Manual", QrCode],
                ["CARD_EDC", "Kartu / EDC", CreditCard],
                ["TRANSFER", "Transfer Bank", Wallet],
              ] as const).map(([m, label, Icon]) => (
                <button
                  key={m}
                  disabled={!isOnline && m !== "CASH"}
                  onClick={() => setPayMethod(m)}
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-xs font-bold transition ${
                    payMethod === m
                      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]"
                      : "border-[var(--line)] bg-[var(--surface)]"
                  } disabled:opacity-40`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {payMethod === "CASH" ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[var(--muted)]">Uang Diterima (Rp)</label>
                  <input
                    type="number"
                    className="cadra-input text-lg font-bold"
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[totals.grandTotal, 50000, 100000, 150000, 200000].map((amt) => (
                    <button key={amt} onClick={() => setPaidAmountInput(String(amt))} className="chip !min-h-8 !text-xs">
                      {formatIDR(amt)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 px-4 py-3">
                  <span className="text-xs font-bold text-[var(--muted)]">Kembalian</span>
                  <b className="text-xl font-bold text-[var(--good)]">
                    {formatIDR(calculateCashChange(totals.grandTotal, Number(paidAmountInput) || 0))}
                  </b>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-3.5 text-xs">
                <p className="text-[var(--muted)]">
                  {payMethod === "QRIS"
                    ? "Payment gateway belum diaktifkan. Tunjukkan QRIS statis toko lalu konfirmasi setelah pembayaran masuk."
                    : "Masukkan nomor referensi struk EDC / bukti transfer (opsional)."}
                </p>
                <input
                  value={refNoInput}
                  onChange={(e) => setRefNoInput(e.target.value)}
                  placeholder="No. Referensi / Approval Code..."
                  className="cadra-input"
                />
              </div>
            )}

            <button onClick={handleCompletePayment} className="btn-cadra btn-cadra--primary w-full">
              Selesaikan Pembayaran &amp; Cetak Struk
            </button>
          </div>
        </div>
      )}

      {/* Open Orders Modal (with Void PIN Manager) */}
      {openOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setOpenOrdersModal(false)}>
          <div className="w-full max-w-lg rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-3 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Order Aktif / Hold Bill</h3>
              <button onClick={() => setOpenOrdersModal(false)} className="rounded-full p-1.5 hover:bg-[var(--well)]"><X className="h-4 w-4" /></button>
            </div>
            {openOrders.length === 0 ? (
              <p className="py-8 text-center text-xs text-[var(--muted)]">Belum ada order aktif.</p>
            ) : (
              openOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3">
                  <div>
                    <div className="text-sm font-bold">
                      {o.orderNo} · {o.table ? o.table.name : o.orderType}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {o.items.length} item · Status: <b>{o.status}</b> · {formatIDR(o.grandTotal)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={async () => {
                        try {
                          const payRes = await apiFetch<{ order: ReceiptData & { id: number } }>(`/orders/${o.id}/payments`, {
                            method: "POST",
                            body: JSON.stringify({
                              payments: [{ method: "CASH", amount: o.grandTotal, paidAmount: o.grandTotal }],
                            }),
                          });
                          setReceipt({
                            ...payRes.order,
                            tableName: o.table?.name ?? null,
                            cashierName: user?.name,
                            paidAmount: o.grandTotal,
                            changeAmt: 0,
                            paymentMethod: "CASH",
                          });
                          setOpenOrdersModal(false);
                          qc.invalidateQueries({ queryKey: ["orders-open"] });
                          qc.invalidateQueries({ queryKey: ["tables"] });
                          pushToast(`Order ${o.orderNo} berhasil dibayar & lunas!`, "good");
                        } catch (err) {
                          pushToast(err instanceof Error ? err.message : "Gagal memproses pembayaran", "bad");
                        }
                      }}
                      className="btn-cadra btn-cadra--primary !min-h-8 !px-3 !text-xs"
                    >
                      Bayar Lunas
                    </button>
                    <button
                      onClick={() => { setOpenOrdersModal(false); setVoidOrderId(o.id); }}
                      className="btn-cadra btn-cadra--danger !min-h-8 !px-3 !text-xs"
                    >
                      Void
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Shift Open / Close Modal */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setShiftModalOpen(false)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">{activeShift ? "Ringkasan & Tutup Shift" : "Buka Shift Kasir"}</h3>
              <button onClick={() => setShiftModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup"><X className="h-4 w-4" /></button>
            </div>
            {activeShift ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-2xl bg-[var(--surface)] p-3.5 space-y-1.5">
                  <div className="flex justify-between"><span>Kasir</span><b>{activeShift.user.name}</b></div>
                  <div className="flex justify-between"><span>Modal Awal</span><b>{formatIDR(activeShift.openingCash)}</b></div>
                  <div className="flex justify-between"><span>Penjualan Tunai</span><b>{formatIDR(activeShift.summary.cashSales)}</b></div>
                  <div className="flex justify-between"><span>Non-Tunai</span><b>{formatIDR(activeShift.summary.nonCashSales)}</b></div>
                  <div className="flex justify-between border-t border-[var(--line)] pt-1.5 text-sm">
                    <span>Expected Cash di Laci</span><b>{formatIDR(activeShift.summary.expectedCash)}</b>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[var(--muted)]">Hitungan Kas Fisik Aktual (Rp)</label>
                  <input
                    type="number"
                    className="cadra-input"
                    placeholder={String(activeShift.summary.expectedCash)}
                    value={closingCashInput}
                    onChange={(e) => setClosingCashInput(e.target.value)}
                  />
                </div>
                <button onClick={() => closeShiftMut.mutate()} className="btn-cadra btn-cadra--danger w-full">
                  Tutup Shift &amp; Simpan Z-Report
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="mb-1 block font-bold text-[var(--muted)]">Modal Kas Awal (Rp)</label>
                  <input
                    type="number"
                    className="cadra-input"
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                  />
                </div>
                <button onClick={() => openShiftMut.mutate()} className="btn-cadra btn-cadra--primary w-full">
                  Buka Shift Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />

      <PinApprovalModal
        open={voidOrderId !== null}
        title="Void Order"
        description="Membutuhkan PIN Manager/Owner dan dicatat ke Audit Log."
        onCancel={() => setVoidOrderId(null)}
        onConfirm={async (managerPin, reason) => {
          await apiFetch(`/orders/${voidOrderId}/void`, {
            method: "POST",
            body: JSON.stringify({ managerPin, reason }),
          });
          setVoidOrderId(null);
          qc.invalidateQueries({ queryKey: ["open-orders"] });
          qc.invalidateQueries({ queryKey: ["tables"] });
          pushToast("Order berhasil di-void", "warn");
        }}
      />
    </CadraShell>
  );
}
