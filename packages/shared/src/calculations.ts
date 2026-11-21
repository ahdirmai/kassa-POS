import {
  DEFAULT_TAX_CONFIG,
  type CalcLineItemInput,
  type OrderDiscountInput,
  type OrderTotalsResult,
  type TaxConfig,
} from "./types.js";

/**
 * Menghitung total order secara deterministik dalam bilangan bulat Rupiah (BIGINT-safe).
 * Aturan default sesuai keputusan brief:
 * - PB1 10% + Service Charge 5%
 * - Belum termasuk harga (taxInclusive = false)
 * - Pajak dihitung setelah service charge (taxAfterService = true)
 * - Pembulatan ke kelipatan Rp100 terdekat
 */
export function calculateOrderTotals(
  items: CalcLineItemInput[],
  discount?: OrderDiscountInput | null,
  config: Partial<TaxConfig> = {},
): OrderTotalsResult {
  const cfg: TaxConfig = { ...DEFAULT_TAX_CONFIG, ...config };

  let subtotal = 0;
  let itemDiscountTotal = 0;

  for (const item of items) {
    const qty = Math.max(0, Math.round(item.quantity));
    const unitTotal = Math.max(0, Math.round(item.unitPrice) + Math.round(item.modifiersPrice ?? 0));
    const lineGross = unitTotal * qty;
    const lineDisc = Math.min(lineGross, Math.max(0, Math.round(item.itemDiscount ?? 0)));
    subtotal += lineGross;
    itemDiscountTotal += lineDisc;
  }

  const afterItemDiscount = Math.max(0, subtotal - itemDiscountTotal);

  let orderDiscountAmount = 0;
  if (discount && discount.value > 0) {
    if (discount.type === "PERCENT") {
      const clampedPct = Math.min(100, Math.max(0, discount.value));
      orderDiscountAmount = Math.round((afterItemDiscount * clampedPct) / 100);
    } else {
      orderDiscountAmount = Math.min(afterItemDiscount, Math.round(discount.value));
    }
  }

  const totalDiscount = itemDiscountTotal + orderDiscountAmount;
  const netSubtotal = Math.max(0, subtotal - totalDiscount);

  let serviceChargeAmount = 0;
  let taxBase = netSubtotal;
  let taxAmount = 0;
  let preRoundingTotal = netSubtotal;

  if (cfg.taxInclusive) {
    // Harga sudah termasuk service + pajak
    const sRate = cfg.serviceChargePercent / 100;
    const tRate = cfg.taxRatePercent / 100;
    const divisor = cfg.taxAfterService ? (1 + sRate) * (1 + tRate) : 1 + sRate + tRate;
    const baseNet = Math.round(netSubtotal / divisor);
    serviceChargeAmount = Math.round(baseNet * sRate);
    taxBase = cfg.taxAfterService ? baseNet + serviceChargeAmount : baseNet;
    taxAmount = Math.max(0, netSubtotal - baseNet - serviceChargeAmount);
    preRoundingTotal = netSubtotal;
  } else {
    serviceChargeAmount = Math.round((netSubtotal * cfg.serviceChargePercent) / 100);
    taxBase = cfg.taxAfterService ? netSubtotal + serviceChargeAmount : netSubtotal;
    taxAmount = Math.round((taxBase * cfg.taxRatePercent) / 100);
    preRoundingTotal = netSubtotal + serviceChargeAmount + taxAmount;
  }

  let grandTotal = preRoundingTotal;
  let roundingAmount = 0;

  if (cfg.roundingUnit > 0) {
    grandTotal = Math.round(preRoundingTotal / cfg.roundingUnit) * cfg.roundingUnit;
    roundingAmount = grandTotal - preRoundingTotal;
  }

  return {
    subtotal,
    itemDiscountTotal,
    orderDiscountAmount,
    totalDiscount,
    netSubtotal,
    serviceChargeAmount,
    taxBase,
    taxAmount,
    preRoundingTotal,
    roundingAmount,
    grandTotal,
  };
}

/**
 * Menghitung kembalian tunai (minimal 0).
 */
export function calculateCashChange(grandTotal: number, paidAmount: number): number {
  return Math.max(0, Math.round(paidAmount) - Math.round(grandTotal));
}

/**
 * Menghitung HPP (COGS) satu menu dari daftar bahan resep.
 */
export function calculateRecipeHpp(
  recipeItems: Array<{ qty: number; unitCost: number }>,
): number {
  const raw = recipeItems.reduce((sum, r) => sum + r.qty * r.unitCost, 0);
  return Math.round(raw);
}

/**
 * Menghitung margin kotor (%) dari harga jual & HPP.
 */
export function calculateMarginPercent(sellPrice: number, hpp: number): number {
  if (sellPrice <= 0) return 0;
  return Number((((sellPrice - hpp) / sellPrice) * 100).toFixed(1));
}

/**
 * Format Rupiah (Rp125.000).
 */
export function formatIDR(amount: number): string {
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded).toLocaleString("id-ID");
  return rounded < 0 ? `-Rp${abs}` : `Rp${abs}`;
}
