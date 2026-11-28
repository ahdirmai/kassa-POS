import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/providers.dart';
import '../../core/theme/cadra_theme.dart';

class KdsTicketItem {
  const KdsTicketItem({
    required this.id,
    required this.productName,
    this.variantName,
    required this.quantity,
    this.notes,
    this.modifiers = const [],
  });

  final int id;
  final String productName;
  final String? variantName;
  final int quantity;
  final String? notes;
  final List<String> modifiers;

  factory KdsTicketItem.fromJson(Map<String, dynamic> json) {
    final mods = json['modifiers'] is List ? json['modifiers'] as List : [];
    return KdsTicketItem(
      id: (json['id'] as num).toInt(),
      productName: (json['productName'] ?? '').toString(),
      variantName: json['variantName']?.toString(),
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      notes: json['notes']?.toString(),
      modifiers: mods
          .whereType<Map<String, dynamic>>()
          .map((m) => (m['modifierName'] ?? '').toString())
          .where((s) => s.isNotEmpty)
          .toList(),
    );
  }
}

class KdsTicketModel {
  const KdsTicketModel({
    required this.id,
    required this.status,
    required this.createdAt,
    required this.stationCode,
    required this.stationName,
    required this.slaMins,
    required this.orderNo,
    required this.orderType,
    this.tableName,
    required this.roundNo,
    this.items = const [],
  });

  final int id;
  final String status;
  final DateTime createdAt;
  final String stationCode;
  final String stationName;
  final int slaMins;
  final String orderNo;
  final String orderType;
  final String? tableName;
  final int roundNo;
  final List<KdsTicketItem> items;

  factory KdsTicketModel.fromJson(Map<String, dynamic> json) {
    final station = json['station'] is Map<String, dynamic>
        ? json['station'] as Map<String, dynamic>
        : const <String, dynamic>{};
    final order = json['order'] is Map<String, dynamic>
        ? json['order'] as Map<String, dynamic>
        : const <String, dynamic>{};
    final table = order['table'] is Map<String, dynamic>
        ? order['table'] as Map<String, dynamic>
        : null;
    final round = json['round'] is Map<String, dynamic>
        ? json['round'] as Map<String, dynamic>
        : const <String, dynamic>{};
    final rawItems = json['items'] is List ? json['items'] as List : [];

    return KdsTicketModel(
      id: (json['id'] as num).toInt(),
      status: (json['status'] ?? 'NEW').toString(),
      createdAt:
          DateTime.tryParse((json['createdAt'] ?? '').toString()) ?? DateTime.now(),
      stationCode: (station['code'] ?? 'KITCHEN').toString(),
      stationName: (station['name'] ?? 'Dapur').toString(),
      slaMins: (station['slaMins'] as num?)?.toInt() ?? 10,
      orderNo: (order['orderNo'] ?? '-').toString(),
      orderType: (order['orderType'] ?? 'DINE_IN').toString(),
      tableName: table?['name']?.toString(),
      roundNo: (round['roundNo'] as num?)?.toInt() ?? 1,
      items: rawItems
          .whereType<Map<String, dynamic>>()
          .map(KdsTicketItem.fromJson)
          .toList(),
    );
  }
}

class KdsScreen extends ConsumerStatefulWidget {
  const KdsScreen({super.key});

  @override
  ConsumerState<KdsScreen> createState() => _KdsScreenState();
}

class _KdsScreenState extends ConsumerState<KdsScreen> {
  String _station = 'ALL';
  bool _showBumped = false;
  bool _loading = true;
  String? _error;
  List<KdsTicketModel> _tickets = const [];
  StreamSubscription<dynamic>? _sockSub;
  Timer? _tickTimer;

  @override
  void initState() {
    super.initState();
    _loadTickets();
    final sock = ref.read(socketServiceProvider);
    sock.connect(station: _station);
    _sockSub = sock.onKdsUpdated.listen((_) => _loadTickets(silent: true));
    _tickTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _sockSub?.cancel();
    _tickTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadTickets({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.dio.get<List<dynamic>>(
        '/kds/tickets',
        queryParameters: {
          'station': _station,
          'includeBumped': _showBumped.toString(),
        },
      );
      final list = (res.data ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(KdsTicketModel.fromJson)
          .toList();
      if (!mounted) return;
      setState(() {
        _tickets = list;
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

  Future<void> _updateStatus(int ticketId, String nextStatus) async {
    try {
      await ref.read(apiClientProvider).dio.patch(
        '/kds/tickets/$ticketId/status',
        data: {'status': nextStatus},
      );
      await _loadTickets(silent: true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(ApiClient.extractErrorMessage(e))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = CadraTheme.palette(
      Theme.of(context).brightness,
      ref.watch(cadraAccentProvider),
    );
    final cols = [
      ('NEW', 'Antrean Baru', const Color(0xFFC9542B)),
      ('PREPARING', 'Sedang Diproses', const Color(0xFFA87406)),
      ('READY', 'Siap Saji', p.good),
      if (_showBumped) ('BUMPED', 'Selesai (Recall)', p.muted),
    ];

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                ...[
                  ('ALL', 'Semua Stasiun'),
                  ('BAR', 'Bar & Kopi'),
                  ('KITCHEN', 'Dapur Panas'),
                  ('PASTRY', 'Pastry'),
                ].map(
                  (s) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(s.$2),
                      selected: _station == s.$1,
                      onSelected: (_) {
                        setState(() => _station = s.$1);
                        ref
                            .read(socketServiceProvider)
                            .connect(station: _station);
                        _loadTickets();
                      },
                    ),
                  ),
                ),
                FilterChip(
                  label: Text(_showBumped ? 'Tutup Selesai' : 'Tampilkan Selesai'),
                  selected: _showBumped,
                  onSelected: (v) {
                    setState(() => _showBumped = v);
                    _loadTickets();
                  },
                ),
              ],
            ),
          ),
        ),
        // Ribbon proporsi beban kerja
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: SizedBox(
              height: 6,
              child: Row(
                children: cols.map((c) {
                  final count = _tickets.where((t) => t.status == c.$1).length;
                  return Expanded(
                    flex: count > 0 ? count * 4 : 1,
                    child: Container(color: c.$3),
                  );
                }).toList(),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_error!, textAlign: TextAlign.center),
                          const SizedBox(height: 10),
                          FilledButton(
                            onPressed: _loadTickets,
                            child: const Text('Coba Lagi'),
                          ),
                        ],
                      ),
                    )
                  : LayoutBuilder(
                      builder: (ctx, constraints) {
                        final fitAll = constraints.maxWidth >= cols.length * 250;
                        Widget buildColumn((String, String, Color) col,
                            {required bool expand}) {
                          final list = _tickets
                              .where((t) => t.status == col.$1)
                              .toList();
                          final card = Container(
                            width: expand ? null : 310,
                            margin: EdgeInsets.only(right: expand ? 0 : 12),
                            decoration: BoxDecoration(
                              color: p.surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: p.line),
                            ),
                            child: Column(
                              children: [
                                Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 10,
                                        height: 10,
                                        decoration: BoxDecoration(
                                          color: col.$3,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          col.$2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: p.raised,
                                          borderRadius:
                                              BorderRadius.circular(999),
                                        ),
                                        child: Text(
                                          '${list.length}',
                                          style:
                                              CadraTheme.tabularStyle.copyWith(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Expanded(
                                  child: list.isEmpty
                                      ? Center(
                                          child: Text(
                                            'Kosong',
                                            style: TextStyle(color: p.faint),
                                          ),
                                        )
                                      : ListView.separated(
                                          padding: const EdgeInsets.fromLTRB(
                                            12,
                                            0,
                                            12,
                                            12,
                                          ),
                                          itemCount: list.length,
                                          separatorBuilder: (context, index) =>
                                              const SizedBox(height: 10),
                                          itemBuilder: (_, idx) =>
                                              _ticketCard(list[idx], p),
                                        ),
                                ),
                              ],
                            ),
                          );
                          return expand
                              ? Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 6),
                                    child: card,
                                  ),
                                )
                              : card;
                        }

                        if (fitAll) {
                          return Padding(
                            padding: const EdgeInsets.fromLTRB(10, 0, 10, 16),
                            child: Row(
                              children: cols
                                  .map((c) => buildColumn(c, expand: true))
                                  .toList(),
                            ),
                          );
                        }

                        return ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          itemCount: cols.length,
                          itemBuilder: (ctx, i) =>
                              buildColumn(cols[i], expand: false),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  Widget _ticketCard(KdsTicketModel t, CadraPalette p) {
    final elapsedMins =
        DateTime.now().difference(t.createdAt).inMinutes.clamp(0, 999);
    final overdue =
        elapsedMins >= t.slaMins && t.status != 'BUMPED' && t.status != 'READY';

    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: overdue ? p.bad : p.line, width: overdue ? 1.5 : 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${t.tableName ?? t.orderType} • R${t.roundNo}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        '${t.orderNo} · ${t.stationName}',
                        style: TextStyle(fontSize: 11.5, color: p.muted),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: (overdue ? p.bad : p.iris).withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${elapsedMins}m',
                    style: CadraTheme.tabularStyle.copyWith(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      color: overdue ? p.bad : p.iris,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: p.surface,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: t.items.map((it) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${it.quantity}× ${it.productName}${it.variantName != null ? ' (${it.variantName})' : ''}',
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (it.modifiers.isNotEmpty)
                          Text(
                            '+ ${it.modifiers.join(', ')}',
                            style: TextStyle(fontSize: 11, color: p.iris),
                          ),
                        if (it.notes != null && it.notes!.isNotEmpty)
                          Text(
                            '“${it.notes}”',
                            style: TextStyle(
                              fontSize: 11,
                              fontStyle: FontStyle.italic,
                              color: p.warn,
                            ),
                          ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 10),
            if (t.status == 'NEW')
              FilledButton.tonal(
                onPressed: () => _updateStatus(t.id, 'PREPARING'),
                child: const Text('Mulai Proses'),
              )
            else if (t.status == 'PREPARING')
              FilledButton(
                onPressed: () => _updateStatus(t.id, 'READY'),
                child: const Text('Tandai Siap'),
              )
            else if (t.status == 'READY')
              OutlinedButton(
                onPressed: () => _updateStatus(t.id, 'BUMPED'),
                child: const Text('Bump Selesai'),
              )
            else
              OutlinedButton(
                onPressed: () => _updateStatus(t.id, 'NEW'),
                child: const Text('Recall ke Antrean'),
              ),
          ],
        ),
      ),
    );
  }
}
