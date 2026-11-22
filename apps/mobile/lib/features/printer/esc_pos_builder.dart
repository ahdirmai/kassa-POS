import 'dart:convert';
import 'package:intl/intl.dart';
import '../../core/calculations/order_calculations.dart';
import '../../core/widgets/receipt_modal.dart';

/// Pure Dart ESC/POS command builder untuk printer thermal 58mm (32 kolom) & 80mm (48 kolom).
/// Kompatibel 100% di Android & iOS (baik lewat Bluetooth maupun LAN TCP:9100).
class EscPosBuilder {
  static const List<int> _init = [0x1B, 0x40]; // ESC @
  static const List<int> _alignLeft = [0x1B, 0x61, 0x00];
  static const List<int> _alignCenter = [0x1B, 0x61, 0x01];
  static const List<int> _boldOn = [0x1B, 0x45, 0x01];
  static const List<int> _boldOff = [0x1B, 0x45, 0x00];
  static const List<int> _sizeNormal = [0x1D, 0x21, 0x00];
  static const List<int> _sizeDoubleH = [0x1D, 0x21, 0x01];
  static const List<int> _cutFull = [0x1D, 0x56, 0x42, 0x00]; // GS V 66 0

  static int columnsForPaper(int paperWidthMm) => paperWidthMm >= 80 ? 48 : 32;

  static String formatTwoColumn(String left, String right, int width) {
    final cleanLeft = _sanitizeAscii(left);
    final cleanRight = _sanitizeAscii(right);
    if (cleanLeft.length + cleanRight.length + 1 >= width) {
      final maxLeft = (width - cleanRight.length - 1).clamp(1, width);
      final trimmedLeft = cleanLeft.length > maxLeft
          ? cleanLeft.substring(0, maxLeft)
          : cleanLeft;
      return '$trimmedLeft $cleanRight';
    }
    final spaces = width - cleanLeft.length - cleanRight.length;
    return '$cleanLeft${' ' * spaces}$cleanRight';
  }

  static List<int> buildReceipt(
    ReceiptData receipt, {
    int paperWidthMm = 58,
    bool autoCut = true,
  }) {
    final width = columnsForPaper(paperWidthMm);
    final divider = '-' * width;
    final bytes = <int>[..._init];

    void line(String text) {
      bytes.addAll(latin1.encode('${_sanitizeAscii(text)}\n'));
    }

    // Header outlet
    bytes.addAll([..._alignCenter, ..._boldOn, ..._sizeDoubleH]);
    line(receipt.businessName.toUpperCase());
    bytes.addAll([..._sizeNormal, ..._boldOff]);
    if (receipt.address.trim().isNotEmpty) {
      for (final wrapped in _wrapText(receipt.address, width)) {
        line(wrapped);
      }
    }

    bytes.addAll(_alignLeft);
    line(divider);
    line(formatTwoColumn('Struk', receipt.receiptNo, width));
    line(formatTwoColumn('Order', '${receipt.orderNo} (${receipt.orderType})', width));
    if (receipt.tableName != null && receipt.tableName!.trim().isNotEmpty) {
      line(formatTwoColumn('Meja', receipt.tableName!, width));
    }
    if (receipt.customerName != null && receipt.customerName!.trim().isNotEmpty) {
      line(formatTwoColumn('Pelanggan', receipt.customerName!, width));
    }
    line(formatTwoColumn(
      'Waktu',
      DateFormat('dd/MM/yy HH:mm').format(receipt.createdAt),
      width,
    ));
    line(divider);

    // Items
    for (final it in receipt.items) {
      final variantSuffix =
          it.variantName != null && it.variantName!.isNotEmpty
              ? ' (${it.variantName})'
              : '';
      final itemTitle = '${it.quantity}x ${it.productName}$variantSuffix';
      final priceText = formatIdr(it.lineTotal);
      if (_sanitizeAscii(itemTitle).length + priceText.length + 1 <= width) {
        line(formatTwoColumn(itemTitle, priceText, width));
      } else {
        for (final wrapped in _wrapText(itemTitle, width)) {
          line(wrapped);
        }
        line(formatTwoColumn('', priceText, width));
      }
      if (it.modifiers.isNotEmpty) {
        for (final modLine in _wrapText('  + ${it.modifiers.join(', ')}', width)) {
          line(modLine);
        }
      }
    }

    line(divider);
    line(formatTwoColumn('Subtotal', formatIdr(receipt.subtotal), width));
    if (receipt.discountAmount > 0) {
      line(formatTwoColumn(
          'Diskon', '-${formatIdr(receipt.discountAmount)}', width));
    }
    line(formatTwoColumn(
      'Service (${receipt.serviceChargePercent.toStringAsFixed(0)}%)',
      formatIdr(receipt.serviceChargeAmount),
      width,
    ));
    line(formatTwoColumn(
      'PB1 (${receipt.taxRatePercent.toStringAsFixed(0)}%)',
      formatIdr(receipt.taxAmount),
      width,
    ));
    if (receipt.roundingAmount != 0) {
      line(formatTwoColumn(
          'Pembulatan', formatIdr(receipt.roundingAmount), width));
    }
    line(divider);

    bytes.addAll(_boldOn);
    line(formatTwoColumn('TOTAL', formatIdr(receipt.grandTotal), width));
    bytes.addAll(_boldOff);

    if (receipt.paymentMethod != null) {
      line(formatTwoColumn(
        'Bayar (${receipt.paymentMethod})',
        formatIdr(receipt.paidAmount ?? receipt.grandTotal),
        width,
      ));
    }
    if ((receipt.changeAmt ?? 0) > 0) {
      line(formatTwoColumn('Kembalian', formatIdr(receipt.changeAmt!), width));
    }

    line(divider);
    bytes.addAll(_alignCenter);
    for (final fLine in receipt.footer.split('\n')) {
      for (final wrapped in _wrapText(fLine, width)) {
        line(wrapped);
      }
    }

    // Feed 3 baris + auto-cut
    bytes.addAll(latin1.encode('\n\n\n'));
    if (autoCut) {
      bytes.addAll(_cutFull);
    }
    return bytes;
  }

  static List<int> buildTestPrint({
    required String outletName,
    int paperWidthMm = 58,
    bool autoCut = true,
  }) {
    final width = columnsForPaper(paperWidthMm);
    final divider = '=' * width;
    final bytes = <int>[..._init, ..._alignCenter, ..._boldOn, ..._sizeDoubleH];
    bytes.addAll(latin1.encode('${_sanitizeAscii(outletName.toUpperCase())}\n'));
    bytes.addAll([..._sizeNormal, ..._boldOff]);
    bytes.addAll(latin1.encode('$divider\n'));
    bytes.addAll(latin1.encode('KASSA POS — TEST PRINT OK\n'));
    bytes.addAll(latin1.encode('Kertas: ${paperWidthMm}mm ($width kolom)\n'));
    bytes.addAll(latin1.encode(
        '${DateFormat('dd/MM/yyyy HH:mm:ss').format(DateTime.now())}\n'));
    bytes.addAll(latin1.encode('$divider\n\n\n'));
    if (autoCut) {
      bytes.addAll(_cutFull);
    }
    return bytes;
  }

  static String _sanitizeAscii(String input) {
    return input
        .replaceAll('×', 'x')
        .replaceAll('–', '-')
        .replaceAll('—', '-')
        .replaceAll('“', '"')
        .replaceAll('”', '"')
        .replaceAll('•', '*')
        .replaceAll(RegExp(r'[^\x20-\x7E]'), '');
  }

  static List<String> _wrapText(String text, int width) {
    final clean = _sanitizeAscii(text).trim();
    if (clean.length <= width) return [clean];
    final out = <String>[];
    var rest = clean;
    while (rest.length > width) {
      var cut = rest.lastIndexOf(' ', width);
      if (cut <= 0) cut = width;
      out.add(rest.substring(0, cut).trimRight());
      rest = rest.substring(cut).trimLeft();
    }
    if (rest.isNotEmpty) out.add(rest);
    return out;
  }
}
