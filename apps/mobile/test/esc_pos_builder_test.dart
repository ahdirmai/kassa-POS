import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:tumpu_pos/core/widgets/receipt_modal.dart';
import 'package:tumpu_pos/features/printer/esc_pos_builder.dart';

void main() {
  group('EscPosBuilder', () {
    test('formatTwoColumn menyusun lebar 32 kolom (58mm) dan 48 kolom (80mm)', () {
      final line58 = EscPosBuilder.formatTwoColumn('Subtotal', 'Rp109.000', 32);
      expect(line58.length, 32);
      expect(line58.startsWith('Subtotal'), isTrue);
      expect(line58.endsWith('Rp109.000'), isTrue);

      final line80 = EscPosBuilder.formatTwoColumn('TOTAL', 'Rp125.900', 48);
      expect(line80.length, 48);
    });

    test('buildReceipt menghasilkan ESC/POS valid dengan header, item, total & auto-cut', () {
      final receipt = ReceiptData(
        receiptNo: 'RCP-20261122-0001',
        orderNo: 'ORD-001',
        createdAt: DateTime(2026, 11, 22, 10, 30),
        orderType: 'DINE_IN',
        tableName: 'Meja 01',
        items: const [
          ReceiptLineItem(
            productName: 'Kopi Susu Senja',
            variantName: 'Iced',
            quantity: 2,
            lineTotal: 64000,
            modifiers: ['Oat Milk'],
          ),
        ],
        subtotal: 64000,
        discountAmount: 0,
        serviceChargeAmount: 3200,
        taxAmount: 6720,
        roundingAmount: 80,
        grandTotal: 74000,
        paidAmount: 100000,
        changeAmt: 26000,
        paymentMethod: 'CASH',
      );

      final bytes = EscPosBuilder.buildReceipt(receipt, paperWidthMm: 58, autoCut: true);
      // Starts with ESC @ (0x1B 0x40)
      expect(bytes[0], 0x1B);
      expect(bytes[1], 0x40);
      // Ends with GS V 66 0 (auto-cut)
      expect(bytes.sublist(bytes.length - 4), [0x1D, 0x56, 0x42, 0x00]);

      final decoded = latin1.decode(bytes);
      expect(decoded, contains('KOPI & DAPUR SENJA'));
      expect(decoded, contains('RCP-20261122-0001'));
      expect(decoded, contains('2x Kopi Susu Senja (Iced)'));
      expect(decoded, contains('+ Oat Milk'));
      expect(decoded, contains('Rp74.000'));
      expect(decoded, contains('Rp26.000'));
    });
  });
}
