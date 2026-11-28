import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../calculations/order_calculations.dart';
import '../theme/cadra_theme.dart';

class ReceiptLineItem {
  const ReceiptLineItem({
    required this.productName,
    this.variantName,
    required this.quantity,
    required this.lineTotal,
    this.modifiers = const [],
  });

  final String productName;
  final String? variantName;
  final int quantity;
  final int lineTotal;
  final List<String> modifiers;
}

class ReceiptData {
  const ReceiptData({
    required this.receiptNo,
    required this.orderNo,
    required this.createdAt,
    required this.orderType,
    this.tableName,
    this.customerName,
    this.cashierName,
    required this.items,
    required this.subtotal,
    required this.discountAmount,
    required this.serviceChargeAmount,
    required this.taxAmount,
    required this.roundingAmount,
    required this.grandTotal,
    this.paidAmount,
    this.changeAmt,
    this.paymentMethod,
    this.serviceChargePercent = 5,
    this.taxRatePercent = 10,
    this.businessName = 'KOPI & DAPUR SENJA',
    this.address = 'Jl. Kemang Raya No. 48, Jakarta Selatan',
    this.footer = 'Terima kasih telah berkunjung!\nWi-Fi: SenjaGuest / kopi2026',
    this.isOffline = false,
  });

  final String receiptNo;
  final String orderNo;
  final DateTime createdAt;
  final String orderType;
  final String? tableName;
  final String? customerName;
  final String? cashierName;
  final List<ReceiptLineItem> items;
  final int subtotal;
  final int discountAmount;
  final int serviceChargeAmount;
  final int taxAmount;
  final int roundingAmount;
  final int grandTotal;
  final int? paidAmount;
  final int? changeAmt;
  final String? paymentMethod;
  final double serviceChargePercent;
  final double taxRatePercent;
  final String businessName;
  final String address;
  final String footer;
  final bool isOffline;
}

/// Modal Struk Thermal bergerigi yang identik 1:1 dengan `apps/web/src/components/receipt-modal.tsx`.
class ReceiptModal extends StatelessWidget {
  const ReceiptModal({
    super.key,
    required this.receipt,
    this.onPrint,
  });

  final ReceiptData receipt;
  final VoidCallback? onPrint;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final p = CadraTheme.palette(Theme.of(context).brightness, CadraAccent.ocean);
    final paperBg = isDark ? const Color(0xFF1F1F1D) : const Color(0xFFFFFFFF);
    final formattedTime = DateFormat('dd/MM/yyyy, HH.mm.ss').format(receipt.createdAt);

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      backgroundColor: p.raised,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'Struk Pembayaran',
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            if (receipt.isOffline) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: p.warn.withValues(alpha: 0.16),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  'OFFLINE',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: p.warn,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        Text(
                          'Siap cetak thermal 58mm / 80mm',
                          style: TextStyle(fontSize: 12, color: p.muted),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Slot printer (.pr-slot)
              Container(
                height: 10,
                decoration: BoxDecoration(
                  color: isDark ? Colors.black : const Color(0xFF1A1A1A),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),

              // Kertas struk bergerigi (.pr-paper)
              Flexible(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: ClipPath(
                    clipper: _SerratedBottomClipper(),
                    child: Container(
                      decoration: BoxDecoration(
                        color: paperBg,
                        border: Border(
                          left: BorderSide(color: p.line),
                          right: BorderSide(color: p.line),
                        ),
                      ),
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 26),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              receipt.businessName.toUpperCase(),
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                letterSpacing: 1.6,
                              ),
                            ),
                            if (receipt.address.trim().isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                receipt.address,
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 11, color: p.muted),
                              ),
                            ],
                            _dashedDivider(p.line),
                            _infoRow('Struk', receipt.receiptNo, boldValue: true),
                            _infoRow('Order', '${receipt.orderNo} (${receipt.orderType})'),
                            if (receipt.tableName != null &&
                                receipt.tableName!.trim().isNotEmpty)
                              _infoRow('Meja', receipt.tableName!),
                            if (receipt.customerName != null &&
                                receipt.customerName!.trim().isNotEmpty)
                              _infoRow('Pelanggan', receipt.customerName!),
                            _infoRow('Waktu', formattedTime),
                            _dashedDivider(p.line),
                            ...receipt.items.map(
                              (it) => Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            '${it.quantity}× ${it.productName}${it.variantName != null && it.variantName!.isNotEmpty ? ' (${it.variantName})' : ''}',
                                            style: const TextStyle(
                                              fontSize: 12.5,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                          if (it.modifiers.isNotEmpty)
                                            Text(
                                              '+ ${it.modifiers.join(', ')}',
                                              style: TextStyle(
                                                fontSize: 10.5,
                                                color: p.muted,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      formatIdr(it.lineTotal),
                                      style: CadraTheme.tabularStyle.copyWith(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            _dashedDivider(p.line),
                            _infoRow('Subtotal', formatIdr(receipt.subtotal)),
                            if (receipt.discountAmount > 0)
                              _infoRow(
                                'Diskon',
                                '-${formatIdr(receipt.discountAmount)}',
                                valueColor: p.good,
                              ),
                            _infoRow(
                              'Service Charge (${receipt.serviceChargePercent.toStringAsFixed(0)}%)',
                              formatIdr(receipt.serviceChargeAmount),
                            ),
                            _infoRow(
                              'PB1 (${receipt.taxRatePercent.toStringAsFixed(0)}%)',
                              formatIdr(receipt.taxAmount),
                            ),
                            if (receipt.roundingAmount != 0)
                              _infoRow(
                                'Pembulatan',
                                formatIdr(receipt.roundingAmount),
                              ),
                            _dashedDivider(p.line),
                            Row(
                              children: [
                                const Text(
                                  'TOTAL',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const Spacer(),
                                Text(
                                  formatIdr(receipt.grandTotal),
                                  style: CadraTheme.tabularStyle.copyWith(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                            if (receipt.paymentMethod != null) ...[
                              const SizedBox(height: 4),
                              _infoRow(
                                'Bayar (${receipt.paymentMethod})',
                                formatIdr(
                                    receipt.paidAmount ?? receipt.grandTotal),
                                fontSize: 11.5,
                              ),
                            ],
                            if ((receipt.changeAmt ?? 0) > 0)
                              _infoRow(
                                'Kembalian',
                                formatIdr(receipt.changeAmt!),
                                fontSize: 11.5,
                              ),
                            _dashedDivider(p.line),
                            Text(
                              receipt.footer,
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 11, color: p.muted),
                            ),
                            const SizedBox(height: 10),
                            Center(
                              child: Image.asset(
                                'assets/branding/tumpu-monochrome-thermal.png',
                                width: 52,
                                height: 52,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Tutup'),
                  ),
                  const SizedBox(width: 10),
                  FilledButton.icon(
                    onPressed: onPrint ??
                        () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'Format struk 58mm/80mm siap. Printer Bluetooth/LAN ESC/POS akan dihubungkan di Fase 3.',
                              ),
                            ),
                          );
                        },
                    icon: const Icon(Icons.print_rounded, size: 18),
                    label: const Text('Cetak Struk'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(
    String label,
    String value, {
    bool boldValue = false,
    Color? valueColor,
    double fontSize = 12,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(label, style: TextStyle(fontSize: fontSize)),
          const Spacer(),
          Text(
            value,
            style: CadraTheme.tabularStyle.copyWith(
              fontSize: fontSize,
              fontWeight: boldValue ? FontWeight.w800 : FontWeight.w500,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _dashedDivider(Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final dashCount = (constraints.maxWidth / 7).floor();
          return Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(
              dashCount,
              (_) => SizedBox(
                width: 4,
                height: 1,
                child: DecoratedBox(decoration: BoxDecoration(color: color)),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _SerratedBottomClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    const toothWidth = 12.0;
    const toothHeight = 6.0;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width, size.height - toothHeight);

    var x = size.width;
    while (x > 0) {
      final mid = (x - toothWidth / 2).clamp(0.0, size.width);
      final next = (x - toothWidth).clamp(0.0, size.width);
      path.lineTo(mid, size.height);
      path.lineTo(next, size.height - toothHeight);
      x -= toothWidth;
    }

    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}
