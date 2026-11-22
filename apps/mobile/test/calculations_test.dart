import 'package:flutter_test/flutter_test.dart';
import 'package:kassa_pos/core/calculations/order_calculations.dart';

void main() {
  group('calculateOrderTotals (identik dengan packages/shared)', () {
    test('menghitung subtotal + service 5% + PB1 10% (setelah service) + pembulatan Rp100', () {
      final res = calculateOrderTotals(const [
        CalcLineItemInput(unitPrice: 28000, modifiersPrice: 4000, quantity: 2),
        CalcLineItemInput(unitPrice: 45000, quantity: 1),
      ]);

      expect(res.subtotal, 109000);
      expect(res.serviceChargeAmount, 5450);
      expect(res.taxBase, 114450);
      expect(res.taxAmount, 11445);
      expect(res.preRoundingTotal, 125895);
      expect(res.roundingAmount, 5);
      expect(res.grandTotal, 125900);
      expect(
        res.subtotal -
            res.totalDiscount +
            res.serviceChargeAmount +
            res.taxAmount +
            res.roundingAmount,
        res.grandTotal,
      );
    });

    test('menghitung diskon persen dan diskon item dengan benar', () {
      final res = calculateOrderTotals(
        const [
          CalcLineItemInput(unitPrice: 50000, quantity: 2, itemDiscount: 10000),
        ],
        discount: const OrderDiscountInput(
          type: DiscountType.percent,
          value: 10,
        ),
      );

      expect(res.netSubtotal, 81000);
      expect(res.serviceChargeAmount, 4050);
      expect(res.taxAmount, 8505);
      expect(res.grandTotal, 93600);
    });

    test('mendukung pajak inclusive dan tanpa pembulatan', () {
      final res = calculateOrderTotals(
        const [CalcLineItemInput(unitPrice: 115500, quantity: 1)],
        config: const TaxConfig(taxInclusive: true, roundingUnit: 0),
      );

      expect(res.grandTotal, 115500);
      expect(res.serviceChargeAmount, 5000);
      expect(res.taxAmount, 10500);
    });

    test('tidak menghasilkan angka negatif jika diskon melebihi subtotal', () {
      final res = calculateOrderTotals(
        const [CalcLineItemInput(unitPrice: 20000, quantity: 1)],
        discount: const OrderDiscountInput(
          type: DiscountType.fixed,
          value: 50000,
        ),
      );

      expect(res.netSubtotal, 0);
      expect(res.grandTotal, 0);
    });
  });

  group('helpers', () {
    test('menghitung kembalian tunai, HPP, margin, dan format IDR', () {
      expect(calculateCashChange(125900, 150000), 24100);
      expect(calculateCashChange(125900, 100000), 0);
      expect(
        calculateRecipeHpp([(qty: 18, unitCost: 250), (qty: 150, unitCost: 22)]),
        7800,
      );
      expect(calculateMarginPercent(28000, 7800), 72.1);
      expect(formatIdr(125900), 'Rp125.900');
      expect(formatIdr(-5000), '-Rp5.000');
    });
  });
}
