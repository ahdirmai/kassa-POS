import 'dart:math' as math;

enum DiscountType { percent, fixed }

class TaxConfig {
  const TaxConfig({
    this.taxRatePercent = 10,
    this.serviceChargePercent = 5,
    this.taxInclusive = false,
    this.taxAfterService = true,
    this.roundingUnit = 100,
  });

  final double taxRatePercent;
  final double serviceChargePercent;
  final bool taxInclusive;
  final bool taxAfterService;
  final int roundingUnit;

  static const TaxConfig defaultConfig = TaxConfig();

  factory TaxConfig.fromSettings(Map<String, dynamic> settings) {
    dynamic readKey(String camel, String snake) =>
        settings[camel] ?? settings[snake];

    double parseDouble(String camel, String snake, double fallback) {
      final raw = readKey(camel, snake);
      if (raw == null) return fallback;
      if (raw is num) return raw.toDouble();
      return double.tryParse(raw.toString()) ?? fallback;
    }

    bool parseBool(String camel, String snake, bool fallback) {
      final raw = readKey(camel, snake);
      if (raw == null) return fallback;
      if (raw is bool) return raw;
      final str = raw.toString().toLowerCase();
      if (str == 'true' || str == '1') return true;
      if (str == 'false' || str == '0') return false;
      return fallback;
    }

    int parseInt(String camel, String snake, int fallback) {
      final raw = readKey(camel, snake);
      if (raw == null) return fallback;
      if (raw is int) return raw;
      if (raw is num) return raw.round();
      return int.tryParse(raw.toString()) ?? fallback;
    }

    return TaxConfig(
      taxRatePercent: parseDouble('taxRatePercent', 'tax_rate_percent', 10),
      serviceChargePercent:
          parseDouble('serviceChargePercent', 'service_charge_percent', 5),
      taxInclusive: parseBool('taxInclusive', 'tax_inclusive', false),
      taxAfterService: parseBool('taxAfterService', 'tax_after_service', true),
      roundingUnit: parseInt('roundingUnit', 'rounding_unit', 100),
    );
  }
}

class CalcLineItemInput {
  const CalcLineItemInput({
    required this.unitPrice,
    this.modifiersPrice = 0,
    required this.quantity,
    this.itemDiscount = 0,
  });

  final int unitPrice;
  final int modifiersPrice;
  final int quantity;
  final int itemDiscount;
}

class OrderDiscountInput {
  const OrderDiscountInput({
    required this.type,
    required this.value,
  });

  final DiscountType type;
  final double value;
}

class OrderTotalsResult {
  const OrderTotalsResult({
    required this.subtotal,
    required this.itemDiscountTotal,
    required this.orderDiscountAmount,
    required this.totalDiscount,
    required this.netSubtotal,
    required this.serviceChargeAmount,
    required this.taxBase,
    required this.taxAmount,
    required this.preRoundingTotal,
    required this.roundingAmount,
    required this.grandTotal,
  });

  final int subtotal;
  final int itemDiscountTotal;
  final int orderDiscountAmount;
  final int totalDiscount;
  final int netSubtotal;
  final int serviceChargeAmount;
  final int taxBase;
  final int taxAmount;
  final int preRoundingTotal;
  final int roundingAmount;
  final int grandTotal;
}

/// Port 1:1 dari `packages/shared/src/calculations.ts`.
/// Memastikan perhitungan total order di Flutter identik 100% dengan backend & web.
/// Catatan: JS `Math.round(x)` untuk bilangan positif identik dengan `x.round()` di Dart.
OrderTotalsResult calculateOrderTotals(
  List<CalcLineItemInput> items, {
  OrderDiscountInput? discount,
  TaxConfig config = TaxConfig.defaultConfig,
}) {
  var subtotal = 0;
  var itemDiscountTotal = 0;

  for (final item in items) {
    final qty = math.max(0, item.quantity);
    final unitTotal = math.max(0, item.unitPrice + item.modifiersPrice);
    final lineGross = unitTotal * qty;
    final lineDisc = math.min(lineGross, math.max(0, item.itemDiscount));
    subtotal += lineGross;
    itemDiscountTotal += lineDisc;
  }

  final afterItemDiscount = math.max(0, subtotal - itemDiscountTotal);

  var orderDiscountAmount = 0;
  if (discount != null && discount.value > 0) {
    if (discount.type == DiscountType.percent) {
      final clampedPct = math.min(100.0, math.max(0.0, discount.value));
      orderDiscountAmount = ((afterItemDiscount * clampedPct) / 100).round();
    } else {
      orderDiscountAmount = math.min(afterItemDiscount, discount.value.round());
    }
  }

  final totalDiscount = itemDiscountTotal + orderDiscountAmount;
  final netSubtotal = math.max(0, subtotal - totalDiscount);

  var serviceChargeAmount = 0;
  var taxBase = netSubtotal;
  var taxAmount = 0;
  var preRoundingTotal = netSubtotal;

  if (config.taxInclusive) {
    final sRate = config.serviceChargePercent / 100.0;
    final tRate = config.taxRatePercent / 100.0;
    final divisor =
        config.taxAfterService ? (1 + sRate) * (1 + tRate) : 1 + sRate + tRate;
    final baseNet = (netSubtotal / divisor).round();
    serviceChargeAmount = (baseNet * sRate).round();
    taxBase = config.taxAfterService ? baseNet + serviceChargeAmount : baseNet;
    taxAmount = math.max(0, netSubtotal - baseNet - serviceChargeAmount);
    preRoundingTotal = netSubtotal;
  } else {
    serviceChargeAmount =
        ((netSubtotal * config.serviceChargePercent) / 100.0).round();
    taxBase =
        config.taxAfterService ? netSubtotal + serviceChargeAmount : netSubtotal;
    taxAmount = ((taxBase * config.taxRatePercent) / 100.0).round();
    preRoundingTotal = netSubtotal + serviceChargeAmount + taxAmount;
  }

  var grandTotal = preRoundingTotal;
  var roundingAmount = 0;

  if (config.roundingUnit > 0) {
    grandTotal =
        (preRoundingTotal / config.roundingUnit).round() * config.roundingUnit;
    roundingAmount = grandTotal - preRoundingTotal;
  }

  return OrderTotalsResult(
    subtotal: subtotal,
    itemDiscountTotal: itemDiscountTotal,
    orderDiscountAmount: orderDiscountAmount,
    totalDiscount: totalDiscount,
    netSubtotal: netSubtotal,
    serviceChargeAmount: serviceChargeAmount,
    taxBase: taxBase,
    taxAmount: taxAmount,
    preRoundingTotal: preRoundingTotal,
    roundingAmount: roundingAmount,
    grandTotal: grandTotal,
  );
}

/// Menghitung kembalian tunai (minimal 0).
int calculateCashChange(int grandTotal, int paidAmount) {
  return math.max(0, paidAmount - grandTotal);
}

/// Menghitung HPP (COGS) satu menu dari daftar bahan resep.
int calculateRecipeHpp(List<({double qty, double unitCost})> recipeItems) {
  final raw = recipeItems.fold<double>(
    0,
    (sum, r) => sum + (r.qty * r.unitCost),
  );
  return raw.round();
}

/// Menghitung margin kotor (%) dari harga jual & HPP.
double calculateMarginPercent(int sellPrice, int hpp) {
  if (sellPrice <= 0) return 0;
  final raw = ((sellPrice - hpp) / sellPrice) * 100;
  return double.parse(raw.toStringAsFixed(1));
}

/// Format Rupiah (Rp125.900).
String formatIdr(num amount) {
  final rounded = amount.round();
  final digits = rounded.abs().toString();
  final buffer = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    final posFromRight = digits.length - i;
    buffer.write(digits[i]);
    if (posFromRight > 1 && posFromRight % 3 == 1) {
      buffer.write('.');
    }
  }
  return rounded < 0 ? '-Rp$buffer' : 'Rp$buffer';
}
