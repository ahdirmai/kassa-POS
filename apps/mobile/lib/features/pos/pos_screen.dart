import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/calculations/order_calculations.dart';
import '../../core/providers.dart';
import '../../core/theme/cadra_theme.dart';
import '../../core/widgets/receipt_modal.dart';
import '../printer/printer_service.dart';
import 'pos_models.dart';
import 'pos_provider.dart';

class PosScreen extends ConsumerWidget {
  const PosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pos = ref.watch(posControllerProvider);
    final ctrl = ref.read(posControllerProvider.notifier);
    final accent = ref.watch(cadraAccentProvider);
    final p = CadraTheme.palette(Theme.of(context).brightness, accent);
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isWide = screenWidth >= 760;
    final gridCols = screenWidth >= 1200 ? 4 : (isWide ? 3 : 2);

    final catalogSection = Column(
      children: [
        if (!pos.isOnline || pos.pendingOfflineCount > 0)
          Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: (pos.isOnline ? p.iris : p.warn).withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Icon(
                  pos.isOnline ? Icons.sync_rounded : Icons.wifi_off_rounded,
                  size: 18,
                  color: pos.isOnline ? p.iris : p.warn,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    !pos.isOnline
                        ? 'Mode Offline — transaksi Tunai disimpan lokal (${pos.pendingOfflineCount} pending)'
                        : '${pos.pendingOfflineCount} transaksi offline menunggu sinkronisasi',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: pos.isOnline ? p.iris : p.warn,
                    ),
                  ),
                ),
                if (pos.isOnline && pos.pendingOfflineCount > 0)
                  TextButton(
                    onPressed: () async {
                      final synced = await ctrl.syncPendingOfflineOrders();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('$synced transaksi offline berhasil disinkronkan'),
                          ),
                        );
                      }
                    },
                    child: const Text('Sync'),
                  ),
              ],
            ),
          ),
        if (pos.activeShift == null && !pos.isLoading && pos.isOnline)
          Container(
            width: double.infinity,
            margin: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: p.warn.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline_rounded, size: 18, color: p.warn),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Shift kasir belum dibuka. Buka shift di tab Shift agar kas tercatat rapi.',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: p.warn,
                    ),
                  ),
                ),
              ],
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  onChanged: ctrl.setSearch,
                  decoration: const InputDecoration(
                    hintText: 'Cari menu atau SKU...',
                    prefixIcon: Icon(Icons.search_rounded),
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Badge(
                isLabelVisible: pos.openOrders.isNotEmpty,
                label: Text('${pos.openOrders.length}'),
                child: IconButton.filledTonal(
                  tooltip: 'Order Aktif (Open / Sent)',
                  onPressed: () => _openActiveOrdersSheet(context, ref),
                  icon: const Icon(Icons.receipt_long_rounded),
                ),
              ),
              const SizedBox(width: 4),
              IconButton.filledTonal(
                tooltip: 'Muat ulang menu',
                onPressed: ctrl.loadInitialData,
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 44,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: const Text('Semua'),
                  selected: pos.selectedCategoryId == null,
                  onSelected: (_) => ctrl.setCategory(null),
                ),
              ),
              ...pos.categories.map(
                (cat) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(cat.name),
                    selected: pos.selectedCategoryId == cat.id,
                    onSelected: (_) => ctrl.setCategory(cat.id),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: pos.isLoading
              ? const Center(child: CircularProgressIndicator())
              : pos.error != null && pos.products.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(pos.error!, textAlign: TextAlign.center),
                            const SizedBox(height: 12),
                            FilledButton(
                              onPressed: ctrl.loadInitialData,
                              child: const Text('Coba Lagi'),
                            ),
                          ],
                        ),
                      ),
                    )
                  : GridView.builder(
                      padding: EdgeInsets.fromLTRB(
                        16,
                        4,
                        16,
                        isWide ? 24 : 96,
                      ),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: gridCols,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: isWide ? 1.04 : 0.92,
                      ),
                      itemCount: pos.filteredProducts.length,
                      itemBuilder: (ctx, i) {
                        final product = pos.filteredProducts[i];
                        return _ProductTile(
                          product: product,
                          palette: p,
                          onTap: () => _handleProductTap(context, ref, product),
                        );
                      },
                    ),
        ),
      ],
    );

    if (isWide) {
      return Row(
        children: [
          Expanded(flex: screenWidth >= 1100 ? 7 : 6, child: catalogSection),
          VerticalDivider(width: 1, color: p.line),
          Expanded(
            flex: screenWidth >= 1100 ? 3 : 4,
            child: _CartPanel(
              onCheckout: () => _openPaymentSheet(context, ref),
              onPickTable: () => _openTablePicker(context, ref),
              onPickDiscount: () => _openDiscountDialog(context, ref),
            ),
          ),
        ],
      );
    }

    return Stack(
      children: [
        catalogSection,
        if (pos.cart.isNotEmpty)
          Positioned(
            left: 16,
            right: 16,
            bottom: 14,
            child: Material(
              elevation: 6,
              borderRadius: BorderRadius.circular(999),
              color: p.ink,
              child: InkWell(
                borderRadius: BorderRadius.circular(999),
                onTap: () => _openCartBottomSheet(context, ref),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 14,
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: p.accent,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '${pos.totalItemsCount} item',
                          style: TextStyle(
                            color: p.onAccent,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          pos.selectedTableLabel != null
                              ? 'Keranjang • ${pos.selectedTableLabel}'
                              : 'Lihat Keranjang',
                          style: TextStyle(
                            color: p.onInk,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      Text(
                        formatIdr(pos.totals.grandTotal),
                        style: CadraTheme.tabularStyle.copyWith(
                          color: p.onInk,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Future<void> _handleProductTap(
    BuildContext context,
    WidgetRef ref,
    ProductModel product,
  ) async {
    if (!product.isAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${product.name} sedang habis')),
      );
      return;
    }

    final ctrl = ref.read(posControllerProvider.notifier);
    if (!product.isCustom) {
      final defaultVariant =
          product.variants.isNotEmpty ? product.variants.first : null;
      ctrl.addToCart(product: product, variant: defaultVariant);
      return;
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => _CustomizeProductSheet(product: product),
    );
  }

  Future<void> _openCartBottomSheet(BuildContext context, WidgetRef ref) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => SizedBox(
        height: MediaQuery.sizeOf(ctx).height * 0.88,
        child: _CartPanel(
          onCheckout: () {
            Navigator.pop(ctx);
            _openPaymentSheet(context, ref);
          },
          onPickTable: () => _openTablePicker(ctx, ref),
          onPickDiscount: () => _openDiscountDialog(ctx, ref),
        ),
      ),
    );
  }

  Future<void> _openTablePicker(BuildContext context, WidgetRef ref) async {
    final areas = ref.read(posControllerProvider).areas;
    final ctrl = ref.read(posControllerProvider.notifier);
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Text(
                  'Pilih Meja (Dine-in)',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    ctrl.selectTable(null, null);
                    Navigator.pop(ctx);
                  },
                  child: const Text('Tanpa Meja'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: areas.map((area) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          area.name,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: area.tables.map((t) {
                            return ChoiceChip(
                              label: Text(
                                t.isOccupied
                                    ? '${t.name} (Terisi)'
                                    : '${t.name} (${t.capacity} org)',
                              ),
                              selected: ref
                                      .read(posControllerProvider)
                                      .selectedTableId ==
                                  t.id,
                              onSelected: t.isOccupied
                                  ? null
                                  : (_) {
                                      ctrl.selectTable(t.id, t.name);
                                      Navigator.pop(ctx);
                                    },
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openDiscountDialog(BuildContext context, WidgetRef ref) async {
    final pos = ref.read(posControllerProvider);
    var type = pos.discountType ?? DiscountType.percent;
    final valCtrl = TextEditingController(
      text: pos.discountValue > 0 ? pos.discountValue.toStringAsFixed(0) : '',
    );

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Diskon Order'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SegmentedButton<DiscountType>(
                segments: const [
                  ButtonSegment(
                      value: DiscountType.percent, label: Text('Persen (%)')),
                  ButtonSegment(
                      value: DiscountType.fixed, label: Text('Nominal (Rp)')),
                ],
                selected: {type},
                onSelectionChanged: (v) => setState(() => type = v.first),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: valCtrl,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: type == DiscountType.percent
                      ? 'Persentase Diskon (0–100)'
                      : 'Nominal Diskon (Rp)',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                ref.read(posControllerProvider.notifier).setDiscount(null, 0);
                Navigator.pop(ctx, false);
              },
              child: const Text('Hapus'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Terapkan'),
            ),
          ],
        ),
      ),
    );

    if (ok == true) {
      final parsed = double.tryParse(valCtrl.text.trim()) ?? 0;
      ref.read(posControllerProvider.notifier).setDiscount(type, parsed);
    }
  }

  Future<void> _openPaymentSheet(
    BuildContext context,
    WidgetRef ref, {
    OpenOrderModel? existingOrder,
  }) async {
    final receipt = await showModalBottomSheet<ReceiptData>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => _PaymentSheet(existingOrder: existingOrder),
    );
    if (receipt != null && context.mounted) {
      await showDialog<void>(
        context: context,
        builder: (ctx) => ReceiptModal(
          receipt: receipt,
          onPrint: () async {
            final err = await ref
                .read(thermalPrinterServiceProvider)
                .printReceipt(receipt);
            if (!ctx.mounted) return;
            ScaffoldMessenger.of(ctx).showSnackBar(
              SnackBar(
                content: Text(err ?? 'Struk berhasil dikirim ke printer thermal!'),
              ),
            );
          },
        ),
      );
    }
  }

  Future<void> _openActiveOrdersSheet(BuildContext context, WidgetRef ref) async {
    await ref.read(posControllerProvider.notifier).refreshOpenOrders();
    if (!context.mounted) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (ctx) => Consumer(
        builder: (ctx, ref, _) {
          final orders = ref.watch(posControllerProvider).openOrders;
          final p = CadraTheme.palette(
            Theme.of(ctx).brightness,
            ref.watch(cadraAccentProvider),
          );
          return SizedBox(
            height: MediaQuery.sizeOf(ctx).height * 0.78,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
                  child: Row(
                    children: [
                      Text(
                        'Order Aktif (${orders.length})',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: orders.isEmpty
                      ? Center(
                          child: Text(
                            'Tidak ada order terbuka saat ini',
                            style: TextStyle(color: p.muted),
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: orders.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 10),
                          itemBuilder: (_, i) {
                            final o = orders[i];
                            return Card(
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            '${o.orderNo} • ${o.tableName ?? o.orderType}',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                        ),
                                        Text(
                                          formatIdr(o.grandTotal),
                                          style: CadraTheme.tabularStyle.copyWith(
                                            fontWeight: FontWeight.w800,
                                            color: p.iris,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      o.items
                                          .map((it) =>
                                              '${it.quantity}× ${it.productName}')
                                          .join(', '),
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        color: p.muted,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Row(
                                      children: [
                                        OutlinedButton(
                                          onPressed: () => _openVoidPinDialog(
                                            ctx,
                                            ref,
                                            o.id,
                                            o.orderNo,
                                          ),
                                          child: Text(
                                            'Void (PIN)',
                                            style: TextStyle(color: p.bad),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: FilledButton(
                                            onPressed: () {
                                              Navigator.pop(ctx);
                                              _openPaymentSheet(
                                                context,
                                                ref,
                                                existingOrder: o,
                                              );
                                            },
                                            child: const Text('Bayar'),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _openVoidPinDialog(
    BuildContext context,
    WidgetRef ref,
    int orderId,
    String orderNo,
  ) async {
    final pinCtrl = TextEditingController();
    final reasonCtrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Void Order $orderNo'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Memerlukan PIN Manager/Owner (izin approval.pin).',
              style: TextStyle(fontSize: 12.5),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: pinCtrl,
              obscureText: true,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'PIN Approval'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: reasonCtrl,
              decoration: const InputDecoration(
                labelText: 'Alasan Void (wajib)',
                hintText: 'Contoh: Pelanggan batal pesan',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Konfirmasi Void'),
          ),
        ],
      ),
    );
    if (ok == true) {
      final err = await ref.read(posControllerProvider.notifier).voidOrderWithPin(
            orderId: orderId,
            managerPin: pinCtrl.text,
            reason: reasonCtrl.text,
          );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(err ?? 'Order $orderNo berhasil di-void'),
          ),
        );
      }
    }
  }
}

class _ProductTile extends StatelessWidget {
  const _ProductTile({
    required this.product,
    required this.palette,
    required this.onTap,
  });

  final ProductModel product;
  final CadraPalette palette;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: product.isAvailable ? 1 : 0.45,
      child: Material(
        color: palette.raised,
        borderRadius: BorderRadius.circular(CadraTheme.rTile),
        child: InkWell(
          borderRadius: BorderRadius.circular(CadraTheme.rTile),
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(CadraTheme.rTile),
              border: Border.all(color: palette.line),
            ),
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: product.imageUrl != null &&
                                product.imageUrl!.startsWith('http')
                            ? Image.network(
                                product.imageUrl!,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    _monogramBox(),
                              )
                            : _monogramBox(),
                      ),
                      if (product.isCustom)
                        Positioned(
                          top: 6,
                          left: 6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: palette.ink.withValues(alpha: 0.85),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              'Custom',
                              style: TextStyle(
                                color: palette.onInk,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      if (!product.isAvailable)
                        Positioned(
                          bottom: 6,
                          right: 6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: palette.bad,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Text(
                              'Habis',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  product.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13.5,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  formatIdr(product.price),
                  style: CadraTheme.tabularStyle.copyWith(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    color: palette.iris,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _monogramBox() {
    return Container(
      color: palette.accent.withValues(alpha: 0.5),
      alignment: Alignment.center,
      child: Text(
        product.displayMonogram,
        style: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w800,
          color: palette.onAccent,
        ),
      ),
    );
  }
}

class _CustomizeProductSheet extends ConsumerStatefulWidget {
  const _CustomizeProductSheet({required this.product});

  final ProductModel product;

  @override
  ConsumerState<_CustomizeProductSheet> createState() =>
      _CustomizeProductSheetState();
}

class _CustomizeProductSheetState
    extends ConsumerState<_CustomizeProductSheet> {
  ProductVariantModel? _selectedVariant;
  final Map<int, Set<int>> _selectedByGroup = {};
  final _notesCtrl = TextEditingController();
  int _qty = 1;

  @override
  void initState() {
    super.initState();
    if (widget.product.variants.isNotEmpty) {
      _selectedVariant = widget.product.variants.firstWhere(
        (v) => v.isDefault,
        orElse: () => widget.product.variants.first,
      );
    }
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  List<ModifierModel> get _selectedModifiers {
    final result = <ModifierModel>[];
    for (final g in widget.product.modifierGroups) {
      final ids = _selectedByGroup[g.id] ?? const <int>{};
      result.addAll(g.modifiers.where((m) => ids.contains(m.id)));
    }
    return result;
  }

  bool get _isValid {
    for (final g in widget.product.modifierGroups) {
      final count = (_selectedByGroup[g.id] ?? const <int>{}).length;
      if (g.isRequired && count < (g.minSelect > 0 ? g.minSelect : 1)) {
        return false;
      }
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final unitTotal = widget.product.price +
        (_selectedVariant?.priceDelta ?? 0) +
        _selectedModifiers.fold<int>(0, (s, m) => s + m.price);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.product.name,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            if (widget.product.variants.isNotEmpty) ...[
              const Text(
                'Pilih Varian',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: widget.product.variants.map((v) {
                  final selected = _selectedVariant?.id == v.id;
                  final deltaLabel = v.priceDelta == 0
                      ? ''
                      : ' (+${formatIdr(v.priceDelta)})';
                  return ChoiceChip(
                    label: Text('${v.name}$deltaLabel'),
                    selected: selected,
                    onSelected: (_) => setState(() => _selectedVariant = v),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],
            ...widget.product.modifierGroups.map((g) {
              final chosen = _selectedByGroup[g.id] ?? <int>{};
              return Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${g.name} ${g.isRequired ? "(Wajib)" : "(Opsional, maks ${g.maxSelect})"}',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: g.modifiers.map((m) {
                        final isPicked = chosen.contains(m.id);
                        return FilterChip(
                          label: Text(
                            m.price > 0
                                ? '${m.name} (+${formatIdr(m.price)})'
                                : m.name,
                          ),
                          selected: isPicked,
                          onSelected: (checked) {
                            setState(() {
                              final next = {...chosen};
                              if (checked) {
                                if (g.maxSelect == 1) {
                                  next
                                    ..clear()
                                    ..add(m.id);
                                } else if (next.length < g.maxSelect) {
                                  next.add(m.id);
                                }
                              } else {
                                next.remove(m.id);
                              }
                              _selectedByGroup[g.id] = next;
                            });
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
              );
            }),
            TextField(
              controller: _notesCtrl,
              decoration: const InputDecoration(
                labelText: 'Catatan dapur (opsional)',
                hintText: 'Contoh: Less sugar, es sedikit',
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                IconButton.outlined(
                  onPressed: _qty > 1 ? () => setState(() => _qty--) : null,
                  icon: const Icon(Icons.remove_rounded),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Text(
                    '$_qty',
                    style: CadraTheme.tabularStyle.copyWith(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                IconButton.outlined(
                  onPressed: () => setState(() => _qty++),
                  icon: const Icon(Icons.add_rounded),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: _isValid
                        ? () {
                            ref.read(posControllerProvider.notifier).addToCart(
                                  product: widget.product,
                                  variant: _selectedVariant,
                                  modifiers: _selectedModifiers,
                                  quantity: _qty,
                                  notes: _notesCtrl.text,
                                );
                            Navigator.pop(context);
                          }
                        : null,
                    child: Text('Tambah • ${formatIdr(unitTotal * _qty)}'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CartPanel extends ConsumerWidget {
  const _CartPanel({
    required this.onCheckout,
    required this.onPickTable,
    required this.onPickDiscount,
  });

  final VoidCallback onCheckout;
  final VoidCallback onPickTable;
  final VoidCallback onPickDiscount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pos = ref.watch(posControllerProvider);
    final ctrl = ref.read(posControllerProvider.notifier);
    final accent = ref.watch(cadraAccentProvider);
    final p = CadraTheme.palette(Theme.of(context).brightness, accent);
    final totals = pos.totals;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Row(
            children: [
              const Text(
                'Keranjang',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const Spacer(),
              if (pos.cart.isNotEmpty)
                TextButton(
                  onPressed: ctrl.clearCart,
                  child: const Text('Kosongkan'),
                ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'DINE_IN', label: Text('Dine-in')),
              ButtonSegment(value: 'TAKEAWAY', label: Text('Takeaway')),
              ButtonSegment(value: 'DELIVERY', label: Text('Delivery')),
            ],
            selected: {pos.orderType},
            onSelectionChanged: (v) => ctrl.setOrderType(v.first),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
          child: Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              if (pos.orderType == 'DINE_IN')
                ActionChip(
                  avatar: const Icon(Icons.table_restaurant_rounded, size: 16),
                  label: Text(pos.selectedTableLabel ?? 'Pilih Meja'),
                  onPressed: onPickTable,
                ),
              ActionChip(
                avatar: const Icon(Icons.percent_rounded, size: 16),
                label: Text(
                  pos.discountValue > 0
                      ? (pos.discountType == DiscountType.percent
                          ? 'Diskon ${pos.discountValue.toStringAsFixed(0)}%'
                          : 'Diskon ${formatIdr(pos.discountValue)}')
                      : 'Diskon',
                ),
                onPressed: onPickDiscount,
              ),
            ],
          ),
        ),
        Expanded(
          child: pos.cart.isEmpty
              ? Center(
                  child: Text(
                    'Ketuk menu untuk mulai mencatat pesanan',
                    style: TextStyle(color: p.muted),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: pos.cart.length,
                  separatorBuilder: (context, index) => Divider(color: p.line),
                  itemBuilder: (ctx, i) {
                    final item = pos.cart[i];
                    final details = [
                      if (item.variant != null) item.variant!.name,
                      ...item.modifiers.map((m) => m.name),
                      if (item.notes != null && item.notes!.isNotEmpty)
                        '"${item.notes}"',
                    ].join(' • ');
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.product.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if (details.isNotEmpty)
                                Text(
                                  details,
                                  style: TextStyle(fontSize: 12, color: p.muted),
                                ),
                              const SizedBox(height: 4),
                              Text(
                                formatIdr(item.lineTotal),
                                style: CadraTheme.tabularStyle.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: p.iris,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              onPressed: () => ctrl.updateQuantity(item.key, -1),
                              icon: const Icon(Icons.remove_circle_outline),
                            ),
                            Text(
                              '${item.quantity}',
                              style: CadraTheme.tabularStyle.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            IconButton(
                              onPressed: () => ctrl.updateQuantity(item.key, 1),
                              icon: const Icon(Icons.add_circle_outline),
                            ),
                          ],
                        ),
                      ],
                    );
                  },
                ),
        ),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: p.surface,
            border: Border(top: BorderSide(color: p.line)),
          ),
          child: Column(
            children: [
              _summaryRow('Subtotal', formatIdr(totals.subtotal), p),
              if (totals.totalDiscount > 0)
                _summaryRow(
                  'Diskon',
                  '-${formatIdr(totals.totalDiscount)}',
                  p,
                  valueColor: p.good,
                ),
              _summaryRow(
                'Service Charge (${pos.taxConfig.serviceChargePercent.toStringAsFixed(0)}%)',
                formatIdr(totals.serviceChargeAmount),
                p,
              ),
              _summaryRow(
                'PB1 (${pos.taxConfig.taxRatePercent.toStringAsFixed(0)}%)',
                formatIdr(totals.taxAmount),
                p,
              ),
              if (totals.roundingAmount != 0)
                _summaryRow(
                  'Pembulatan',
                  formatIdr(totals.roundingAmount),
                  p,
                ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Text(
                    'TOTAL',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  const Spacer(),
                  Text(
                    formatIdr(totals.grandTotal),
                    style: CadraTheme.tabularStyle.copyWith(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  if (pos.isOnline) ...[
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: pos.cart.isEmpty || pos.isSubmitting
                            ? null
                            : () async {
                                final res = await ctrl.sendToKitchenOnly();
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      res.error ??
                                          'Order ${res.orderNo} dikirim ke dapur (KDS)',
                                    ),
                                  ),
                                );
                              },
                        icon: const Icon(Icons.soup_kitchen_rounded, size: 18),
                        label: const Text('Kirim Dapur'),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: FilledButton(
                      onPressed: pos.cart.isEmpty || pos.isSubmitting
                          ? null
                          : onCheckout,
                      child: const Text('Bayar'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _summaryRow(
    String label,
    String value,
    CadraPalette p, {
    Color? valueColor,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: p.muted)),
          const Spacer(),
          Text(
            value,
            style: CadraTheme.tabularStyle.copyWith(
              fontSize: 13,
              color: valueColor,
              fontWeight: valueColor != null ? FontWeight.w700 : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _PaymentSheet extends ConsumerStatefulWidget {
  const _PaymentSheet({this.existingOrder});

  final OpenOrderModel? existingOrder;

  @override
  ConsumerState<_PaymentSheet> createState() => _PaymentSheetState();
}

class _PaymentSheetState extends ConsumerState<_PaymentSheet> {
  String _method = 'CASH';
  final _paidCtrl = TextEditingController();
  final _refCtrl = TextEditingController();

  int get _grandTotal =>
      widget.existingOrder?.grandTotal ??
      ref.read(posControllerProvider).totals.grandTotal;

  @override
  void initState() {
    super.initState();
    _paidCtrl.text = _grandTotal.toString();
  }

  @override
  void dispose() {
    _paidCtrl.dispose();
    _refCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pos = ref.watch(posControllerProvider);
    final total = _grandTotal;
    final paid =
        int.tryParse(_paidCtrl.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
    final change = calculateCashChange(total, paid);

    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        20,
        20,
        MediaQuery.viewInsetsOf(context).bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.existingOrder != null
                  ? 'Bayar ${widget.existingOrder!.orderNo}'
                  : 'Pembayaran',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            Text(
              'Total Tagihan: ${formatIdr(total)}',
              style: CadraTheme.tabularStyle.copyWith(
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: const [
                ('CASH', 'Tunai'),
                ('QRIS', 'QRIS Manual'),
                ('CARD', 'Kartu / EDC'),
                ('TRANSFER', 'Transfer'),
                ('EWALLET', 'E-Wallet'),
              ].map((m) {
                return ChoiceChip(
                  label: Text(m.$2),
                  selected: _method == m.$1,
                  onSelected: (!pos.isOnline && m.$1 != 'CASH')
                      ? null
                      : (_) => setState(() => _method = m.$1),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            if (_method == 'CASH') ...[
              TextField(
                controller: _paidCtrl,
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(
                  labelText: 'Uang Diterima (Rp)',
                  prefixText: 'Rp ',
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: {total, 50000, 100000, 200000}.map((amt) {
                  return ActionChip(
                    label: Text(amt == total ? 'Uang Pas' : formatIdr(amt)),
                    onPressed: () => setState(() => _paidCtrl.text = '$amt'),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              Text(
                'Kembalian: ${formatIdr(change)}',
                style: CadraTheme.tabularStyle.copyWith(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ] else ...[
              TextField(
                controller: _refCtrl,
                decoration: const InputDecoration(
                  labelText: 'Nomor Referensi / Approval (opsional)',
                  hintText: 'Contoh: REF-QRIS-001',
                ),
              ),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: pos.isSubmitting || (_method == 'CASH' && paid < total)
                  ? null
                  : () async {
                      final ctrl = ref.read(posControllerProvider.notifier);
                      final res = widget.existingOrder != null
                          ? await ctrl.payExistingOrder(
                              order: widget.existingOrder!,
                              paymentMethod: _method,
                              paidAmount: paid,
                              referenceNo: _refCtrl.text,
                            )
                          : await ctrl.checkoutAndPay(
                              paymentMethod: _method,
                              paidAmount: paid,
                              referenceNo: _refCtrl.text,
                            );
                      if (!context.mounted) return;
                      if (res.error != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(res.error!)),
                        );
                      } else {
                        Navigator.pop(context, res.receipt);
                      }
                    },
              child: pos.isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Konfirmasi Lunas'),
            ),
          ],
        ),
      ),
    );
  }
}
