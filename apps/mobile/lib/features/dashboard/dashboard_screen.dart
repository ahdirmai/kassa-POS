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
    final isWide = MediaQuery.sizeOf(context).width >= 760;
    final kpis = _data?['kpis'] is Map<String, dynamic>
        ? _data!['kpis'] as Map<String, dynamic>
        : null;
    final breakdown = _data?['paymentBreakdown'] is Map<String, dynamic>
        ? _data!['paymentBreakdown'] as Map<String, dynamic>
        : const <String, dynamic>{};

    Widget kpiSales(Map<String, dynamic> k) => Container(
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
                formatIdr(_num(k['todaySales'])),
                style: CadraTheme.tabularStyle.copyWith(
                  color: p.onInk,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        );

    Widget kpiOrders(Map<String, dynamic> k) => Container(
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
                '${_num(k['todayCount'])} order',
                style: CadraTheme.tabularStyle.copyWith(
                  color: p.onAccent,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                'Avg ${formatIdr(_num(k['avgBill']))}',
                style: CadraTheme.tabularStyle.copyWith(
                  color: p.onAccent.withValues(alpha: 0.85),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );

    Widget kpiTables(Map<String, dynamic> k) => Card(
          margin: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Meja Terisi',
                    style: TextStyle(fontSize: 12, color: p.muted)),
                const SizedBox(height: 4),
                Text(
                  '${_num(k['occupiedTables'])} / ${_num(k['totalTables'])}',
                  style: CadraTheme.tabularStyle.copyWith(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        );

    Widget kpiStock(Map<String, dynamic> k) => Card(
          margin: EdgeInsets.zero,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Stok Menipis',
                    style: TextStyle(fontSize: 12, color: p.muted)),
                const SizedBox(height: 4),
                Text(
                  '${_num(k['lowStockCount'])} bahan',
                  style: CadraTheme.tabularStyle.copyWith(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: _num(k['lowStockCount']) > 0 ? p.warn : p.good,
                  ),
                ),
              ],
            ),
          ),
        );

    final paymentCard = breakdown.isEmpty
        ? null
        : Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pembayaran Hari Ini',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                  const SizedBox(height: 8),
                  ...breakdown.entries.map(
                    (e) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
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
          );

    final menuToggleCard = Card(
      margin: EdgeInsets.zero,
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
              'Matikan menu yang habis langsung dari HP/Tablet (pengaturan lengkap & resep tetap di Web Admin).',
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
                    onChanged: (v) => _toggleProductAvailability(prod.id, v),
                  ),
                ),
          ],
        ),
      ),
    );

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
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1200),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
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
                    if (isWide)
                      IntrinsicHeight(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(child: kpiSales(kpis)),
                            const SizedBox(width: 12),
                            Expanded(child: kpiOrders(kpis)),
                            const SizedBox(width: 12),
                            Expanded(child: kpiTables(kpis)),
                            const SizedBox(width: 12),
                            Expanded(child: kpiStock(kpis)),
                          ],
                        ),
                      )
                    else ...[
                      Row(
                        children: [
                          Expanded(child: kpiSales(kpis)),
                          const SizedBox(width: 12),
                          Expanded(child: kpiOrders(kpis)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(child: kpiTables(kpis)),
                          const SizedBox(width: 12),
                          Expanded(child: kpiStock(kpis)),
                        ],
                      ),
                    ],
                    const SizedBox(height: 14),
                  ],
                  if (isWide && paymentCard != null)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(flex: 4, child: paymentCard),
                        const SizedBox(width: 14),
                        Expanded(flex: 6, child: menuToggleCard),
                      ],
                    )
                  else ...[
                    if (paymentCard != null) ...[
                      paymentCard,
                      const SizedBox(height: 14),
                    ],
                    menuToggleCard,
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
