import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/calculations/order_calculations.dart';
import '../../core/providers.dart';
import '../../core/theme/cadra_theme.dart';
import '../pos/pos_provider.dart';

class ShiftScreen extends ConsumerWidget {
  const ShiftScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pos = ref.watch(posControllerProvider);
    final shift = pos.activeShift;
    final accent = ref.watch(cadraAccentProvider);
    final p = CadraTheme.palette(Theme.of(context).brightness, accent);

    return RefreshIndicator(
      onRefresh: () => ref.read(posControllerProvider.notifier).refreshShift(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: shift == null
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Icon(Icons.lock_clock_rounded, size: 42, color: p.warn),
                        const SizedBox(height: 12),
                        const Text(
                          'Belum Ada Shift Aktif',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Masukkan modal kas awal untuk memulai pencatatan shift kasir hari ini.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: p.muted),
                        ),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: () => _openShiftDialog(context, ref),
                          icon: const Icon(Icons.play_arrow_rounded),
                          label: const Text('Buka Shift Baru'),
                        ),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: p.good.withValues(alpha: 0.16),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                'SHIFT AKTIF #${shift.id}',
                                style: TextStyle(
                                  color: p.good,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            const Spacer(),
                            Text(
                              shift.userName ?? '',
                              style: TextStyle(color: p.muted, fontSize: 13),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _kv('Modal Kas Awal', formatIdr(shift.openingCash), p),
                        _kv('Total Transaksi', '${shift.totalOrders} order', p),
                        _kv('Penjualan Tunai', formatIdr(shift.cashSales), p),
                        _kv('Penjualan Non-Tunai',
                            formatIdr(shift.nonCashSales), p),
                        _kv('Kas Masuk (Petty Cash)', formatIdr(shift.cashIn), p),
                        _kv('Kas Keluar (Petty Cash)',
                            formatIdr(shift.cashOut), p),
                        Divider(height: 24, color: p.line),
                        Row(
                          children: [
                            const Text(
                              'Ekspektasi Kas Laci',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              formatIdr(shift.expectedCash),
                              style: CadraTheme.tabularStyle.copyWith(
                                fontWeight: FontWeight.w800,
                                fontSize: 17,
                                color: p.iris,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () =>
                                    _cashMovementDialog(context, ref),
                                child: const Text('Kas In / Out'),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: FilledButton(
                                onPressed: () => _closeShiftDialog(
                                  context,
                                  ref,
                                  shift.expectedCash,
                                ),
                                child: const Text('Tutup Shift'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _kv(String k, String v, CadraPalette p) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(k, style: TextStyle(color: p.muted)),
          const Spacer(),
          Text(
            v,
            style: CadraTheme.tabularStyle.copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }

  Future<void> _openShiftDialog(BuildContext context, WidgetRef ref) async {
    final cashCtrl = TextEditingController(text: '300000');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Buka Shift Kasir'),
        content: TextField(
          controller: cashCtrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Modal Kas Awal (Rp)',
            prefixText: 'Rp ',
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Batal')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Buka Shift')),
        ],
      ),
    );
    if (ok == true) {
      final amount = int.tryParse(cashCtrl.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
      final err = await ref
          .read(posControllerProvider.notifier)
          .openShift(openingCash: amount);
      if (err != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
      }
    }
  }

  Future<void> _cashMovementDialog(BuildContext context, WidgetRef ref) async {
    var type = 'CASH_OUT';
    final amountCtrl = TextEditingController();
    final reasonCtrl = TextEditingController();

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Catat Kas Masuk / Keluar'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'CASH_IN', label: Text('Kas Masuk')),
                  ButtonSegment(value: 'CASH_OUT', label: Text('Kas Keluar')),
                ],
                selected: {type},
                onSelectionChanged: (v) => setState(() => type = v.first),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Nominal (Rp)',
                  prefixText: 'Rp ',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: reasonCtrl,
                decoration: const InputDecoration(
                  labelText: 'Keterangan / Alasan',
                  hintText: 'Contoh: Beli es batu',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Batal')),
            FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Simpan')),
          ],
        ),
      ),
    );

    if (ok == true) {
      final amt = int.tryParse(amountCtrl.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
      if (amt <= 0 || reasonCtrl.text.trim().isEmpty) return;
      final err = await ref
          .read(posControllerProvider.notifier)
          .recordCashMovement(type: type, amount: amt, reason: reasonCtrl.text);
      if (err != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
      }
    }
  }

  Future<void> _closeShiftDialog(
    BuildContext context,
    WidgetRef ref,
    int expectedCash,
  ) async {
    final actualCtrl = TextEditingController(text: '$expectedCash');
    final notesCtrl = TextEditingController();

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tutup Shift (Z-Report)'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Ekspektasi Kas: ${formatIdr(expectedCash)}'),
            const SizedBox(height: 12),
            TextField(
              controller: actualCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Kas Fisik Aktual di Laci (Rp)',
                prefixText: 'Rp ',
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: notesCtrl,
              decoration: const InputDecoration(
                labelText: 'Catatan (opsional)',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Batal')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Tutup Shift')),
        ],
      ),
    );

    if (ok == true) {
      final actual =
          int.tryParse(actualCtrl.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
      final err = await ref
          .read(posControllerProvider.notifier)
          .closeShift(actualCash: actual, notes: notesCtrl.text);
      if (err != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
      }
    }
  }
}
