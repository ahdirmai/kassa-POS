import { describe, expect, it } from "vitest";
import {
  calculateCashChange,
  calculateMarginPercent,
  calculateOrderTotals,
  calculateRecipeHpp,
  formatIDR,
} from "./calculations.js";

describe("calculateOrderTotals", () => {
  it("menghitung subtotal + service 5% + PB1 10% (setelah service) + pembulatan Rp100", () => {
    // 2x Kopi Susu (28.000 + modifier 4.000 = 32.000) = 64.000
    // 1x Nasi Goreng (45.000) = 45.000
    // Subtotal = 109.000
    // Service 5% = 5.450
    // Tax base = 114.450 -> PB1 10% = 11.445
    // Pre-rounding = 125.895 -> Rounded to 100 = 125.900 (+5)
    const res = calculateOrderTotals([
      { unitPrice: 28000, modifiersPrice: 4000, quantity: 2 },
      { unitPrice: 45000, quantity: 1 },
    ]);

    expect(res.subtotal).toBe(109000);
    expect(res.serviceChargeAmount).toBe(5450);
    expect(res.taxBase).toBe(114450);
    expect(res.taxAmount).toBe(11445);
    expect(res.preRoundingTotal).toBe(125895);
    expect(res.roundingAmount).toBe(5);
    expect(res.grandTotal).toBe(125900);
    expect(res.subtotal - res.totalDiscount + res.serviceChargeAmount + res.taxAmount + res.roundingAmount).toBe(
      res.grandTotal,
    );
  });

  it("menghitung diskon persen dan diskon item dengan benar", () => {
    const res = calculateOrderTotals(
      [{ unitPrice: 50000, quantity: 2, itemDiscount: 10000 }],
      { type: "PERCENT", value: 10 },
    );
    // Subtotal 100.000 - itemDiscount 10.000 = 90.000
    // Order discount 10% = 9.000 -> netSubtotal = 81.000
    // Service 5% = 4.050 -> taxBase = 85.050 -> PB1 10% = 8.505
    // Pre-rounding = 93.555 -> Rounded = 93.600 (+45)
    expect(res.netSubtotal).toBe(81000);
    expect(res.serviceChargeAmount).toBe(4050);
    expect(res.taxAmount).toBe(8505);
    expect(res.grandTotal).toBe(93600);
  });

  it("mendukung pajak inclusive dan tanpa pembulatan", () => {
    const res = calculateOrderTotals(
      [{ unitPrice: 115500, quantity: 1 }],
      null,
      { taxInclusive: true, roundingUnit: 0 },
    );
    expect(res.grandTotal).toBe(115500);
    expect(res.serviceChargeAmount).toBe(5000);
    expect(res.taxAmount).toBe(10500);
  });

  it("tidak menghasilkan angka negatif jika diskon melebihi subtotal", () => {
    const res = calculateOrderTotals(
      [{ unitPrice: 20000, quantity: 1 }],
      { type: "FIXED", value: 50000 },
    );
    expect(res.netSubtotal).toBe(0);
    expect(res.grandTotal).toBe(0);
  });
});

describe("helpers", () => {
  it("menghitung kembalian tunai, HPP, margin, dan format IDR", () => {
    expect(calculateCashChange(125900, 150000)).toBe(24100);
    expect(calculateCashChange(125900, 100000)).toBe(0);
    expect(calculateRecipeHpp([{ qty: 18, unitCost: 250 }, { qty: 150, unitCost: 22 }])).toBe(7800);
    expect(calculateMarginPercent(28000, 7800)).toBe(72.1);
    expect(formatIDR(125900)).toBe("Rp125.900");
  });
});
