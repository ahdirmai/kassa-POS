import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/calculations/order_calculations.dart';
import '../../core/providers.dart';
import '../../core/theme/cadra_theme.dart';
import '../pos/pos_models.dart';
import '../pos/pos_provider.dart';

class TablesScreen extends ConsumerWidget {
  const TablesScreen({super.key, required this.onSelectTableForPos});

  final VoidCallback onSelectTableForPos;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pos = ref.watch(posControllerProvider);
    final accent = ref.watch(cadraAccentProvider);
    final p = CadraTheme.palette(Theme.of(context).brightness, accent);

    return RefreshIndicator(
      onRefresh: () =>
          ref.read(posControllerProvider.notifier).refreshLiveOperational(),
      child: pos.areas.isEmpty
          ? ListView(
              children: [
                Padding(
                  padding: const EdgeInsets.all(32),
                  child: Center(
                    child: Text(
                      'Belum ada area & meja terdaftar.',
                      style: TextStyle(color: p.muted),
                    ),
                  ),
                ),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: pos.areas.length,
              itemBuilder: (ctx, idx) {
                final area = pos.areas[idx];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        area.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 10),
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate:
                            const SliverGridDelegateWithMaxCrossAxisExtent(
                          maxCrossAxisExtent: 190,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 1.2,
                        ),
                        itemCount: area.tables.length,
                        itemBuilder: (_, i) {
                          final table = area.tables[i];
                          final orderRef = table.activeOrders.isNotEmpty
                              ? table.activeOrders.first
                              : null;
                          return Material(
                            color: table.isOccupied
                                ? p.accent.withValues(alpha: 0.45)
                                : p.raised,
                            borderRadius:
                                BorderRadius.circular(CadraTheme.rTile),
                            child: InkWell(
                              borderRadius:
                                  BorderRadius.circular(CadraTheme.rTile),
                              onTap: () => _handleTableTap(
                                context,
                                ref,
                                table,
                                pos.areas,
                              ),
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius:
                                      BorderRadius.circular(CadraTheme.rTile),
                                  border: Border.all(
                                    color:
                                        table.isOccupied ? p.iris : p.line,
                                  ),
                                ),
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            table.name,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 15,
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: (table.isOccupied
                                                    ? p.warn
                                                    : p.good)
                                                .withValues(alpha: 0.16),
                                            borderRadius:
                                                BorderRadius.circular(999),
                                          ),
                                          child: Text(
                                            table.isOccupied
                                                ? 'Terisi'
                                                : 'Kosong',
                                            style: TextStyle(
                                              fontSize: 10.5,
                                              fontWeight: FontWeight.w700,
                                              color: table.isOccupied
                                                  ? p.warn
                                                  : p.good,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const Spacer(),
                                    if (orderRef != null) ...[
                                      Text(
                                        orderRef.orderNo,
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          color: p.muted,
                                        ),
                                      ),
                                      Text(
                                        formatIdr(orderRef.grandTotal),
                                        style: CadraTheme.tabularStyle.copyWith(
                                          fontWeight: FontWeight.w800,
                                          color: p.iris,
                                        ),
                                      ),
                                    ] else
                                      Text(
                                        'Kapasitas ${table.capacity} kursi',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: p.muted,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }

  Future<void> _handleTableTap(
    BuildContext context,
    WidgetRef ref,
    DiningTableModel table,
    List<AreaModel> areas,
  ) async {
    final ctrl = ref.read(posControllerProvider.notifier);
    if (!table.isOccupied) {
      ctrl.selectTable(table.id, table.name);
      onSelectTableForPos();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Meja ${table.name} dipilih untuk pesanan baru')),
      );
      return;
    }

    final allTables = areas.expand((a) => a.tables).toList();
    final emptyTables =
        allTables.where((t) => !t.isOccupied && t.id != table.id).toList();
    final busyTables =
        allTables.where((t) => t.isOccupied && t.id != table.id).toList();

    await showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Meja ${table.name} (Terisi)',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            if (table.activeOrders.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Order: ${table.activeOrders.first.orderNo} • ${formatIdr(table.activeOrders.first.grandTotal)}',
                ),
              ),
            const SizedBox(height: 16),
            if (emptyTables.isNotEmpty)
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  _pickTargetTableDialog(
                    context,
                    title: 'Pindah ${table.name} ke Meja Kosong',
                    candidates: emptyTables,
                    onPick: (target) async {
                      final err = await ctrl.moveTable(
                        fromTableId: table.id,
                        targetTableId: target.id,
                      );
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              err ?? 'Berhasil pindah ke ${target.name}',
                            ),
                          ),
                        );
                      }
                    },
                  );
                },
                icon: const Icon(Icons.drive_file_move_outline),
                label: const Text('Pindah Meja'),
              ),
            const SizedBox(height: 8),
            if (busyTables.isNotEmpty)
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(ctx);
                  _pickTargetTableDialog(
                    context,
                    title: 'Gabung ${table.name} ke Meja Aktif',
                    candidates: busyTables,
                    onPick: (target) async {
                      final err = await ctrl.mergeTables(
                        sourceTableId: table.id,
                        targetTableId: target.id,
                      );
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              err ??
                                  'Order ${table.name} digabung ke ${target.name}',
                            ),
                          ),
                        );
                      }
                    },
                  );
                },
                icon: const Icon(Icons.merge_rounded),
                label: const Text('Gabung Meja'),
              ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Tutup'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickTargetTableDialog(
    BuildContext context, {
    required String title,
    required List<DiningTableModel> candidates,
    required Future<void> Function(DiningTableModel target) onPick,
  }) async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: SizedBox(
          width: 300,
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: candidates
                .map(
                  (t) => ActionChip(
                    label: Text(t.name),
                    onPressed: () async {
                      Navigator.pop(ctx);
                      await onPick(t);
                    },
                  ),
                )
                .toList(),
          ),
        ),
      ),
    );
  }
}
