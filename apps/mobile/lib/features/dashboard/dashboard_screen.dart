import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/calculations/order_calculations.dart';
import '../../core/network/api_client.dart';
import '../../core/providers.dart';
import '../../core/rbac/rbac.dart';
import '../../core/theme/cadra_theme.dart';
import '../pos/pos_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final user = ref.read(authControllerProvider).user;
    if (user == null ||
        !user.hasPermission('report.view') ||
        !user.canUseFeature(PlanFeature.reports)) {
      setState(() {
        _loading = false;
        _data = null;
      });
      return;
    }
    setState(() => _loading = true);
    try {
      final res =
          await ref.read(apiClientProvider).dio.get<Map<String, dynamic>>(
                '/reports/dashboard',
              );
      if (!mounted) return;
      setState(() {
        _data = res.data;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = ApiClient.extractErrorMessage(e);
      });
    }
  }

  Future<void> _toggleProductAvailability(int productId, bool nextVal) async {
    try {
      await ref.read(apiClientProvider).dio.patch(
        '/menu/products/$productId/availability',
        data: {'isAvailable': nextVal},
      );
      await ref.read(posControllerProvider.notifier).loadInitialData();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            nextVal ? 'Menu ditandai Tersedia' : 'Menu ditandai Habis',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiClient.extractErrorMessage(e))),
      );
    }
  }

  int _num(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is num) return v.round();
    return int.tryParse(v.toString()) ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final p = CadraTheme.palette(
      Theme.of(context).brightness,
      ref.watch(cadraAccentProvider),
    );
    final pos = ref.watch(posControllerProvider);
    final kpis = _data?['kpis'] is Map<String, dynamic>
        ? _data!['kpis'] as Map<String, dynamic>
        : null;
    final breakdown = _data?['paymentBreakdown'] is Map<String, dynamic>
        ? _data!['paymentBreakdown'] as Map<String, dynamic>
        : const <String, dynamic>{};

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          _load(),
          ref.read(posControllerProvider.notifier).loadInitialData(),
        ]);
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_error != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 10),
                    FilledButton(
                      onPressed: _load,
                      child: const Text('Coba Lagi'),
                    ),
                  ],
                ),
              ),
            )
          else if (kpis != null) ...[
            // Cadra Signature KPI Grid: Tile 1 Solid Ink, Tile 2 Solid Accent
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: p.ink,
                      borderRadius: BorderRadius.circular(CadraTheme.rCard),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Omzet Hari Ini',
                          style: TextStyle(
                            color: p.onInk.withValues(alpha: 0.75),
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          formatIdr(_num(kpis['todaySales'])),
                          style: CadraTheme.tabularStyle.copyWith(
                            color: p.onInk,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: p.accent,
                      borderRadius: BorderRadius.circular(CadraTheme.rCard),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Transaksi & Avg',
                          style: TextStyle(
                            color: p.onAccent.withValues(alpha: 0.75),
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${_num(kpis['todayCount'])} order',
                          style: CadraTheme.tabularStyle.copyWith(
                            color: p.onAccent,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          'Avg ${formatIdr(_num(kpis['avgBill']))}',
                          style: CadraTheme.tabularStyle.copyWith(
                            color: p.onAccent.withValues(alpha: 0.85),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Meja Terisi',
                              style: TextStyle(fontSize: 12, color: p.muted)),
                          const SizedBox(height: 4),
                          Text(
                            '${_num(kpis['occupiedTables'])} / ${_num(kpis['totalTables'])}',
                            style: CadraTheme.tabularStyle.copyWith(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Stok Menipis',
                              style: TextStyle(fontSize: 12, color: p.muted)),
                          const SizedBox(height: 4),
                          Text(
                            '${_num(kpis['lowStockCount'])} bahan',
                            style: CadraTheme.tabularStyle.copyWith(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: _num(kpis['lowStockCount']) > 0
                                  ? p.warn
                                  : p.good,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            if (breakdown.isNotEmpty) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Pembayaran Hari Ini',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ...breakdown.entries.map(
                        (e) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          child: Row(
                            children: [
                              Text(e.key, style: TextStyle(color: p.muted)),
                              const Spacer(),
                              Text(
                                formatIdr(_num(e.value)),
                                style: CadraTheme.tabularStyle.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
          ],

          // Quick Menu Availability Toggle (Tersedia / Habis)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Kontrol Cepat Ketersediaan Menu',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Matikan menu yang habis langsung dari HP (pengaturan lengkap & resep tetap di Web Admin).',
                    style: TextStyle(fontSize: 12, color: p.muted),
                  ),
                  const SizedBox(height: 10),
                  ...pos.products.take(25).map(
                        (prod) => SwitchListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            prod.name,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          subtitle: Text(
                            formatIdr(prod.price),
                            style: CadraTheme.tabularStyle.copyWith(
                              fontSize: 12,
                              color: p.muted,
                            ),
                          ),
                          value: prod.isAvailable,
                          onChanged: (v) =>
                              _toggleProductAvailability(prod.id, v),
                        ),
                      ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
