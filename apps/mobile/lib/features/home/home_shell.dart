import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers.dart';
import '../../core/rbac/rbac.dart';
import '../../core/theme/cadra_theme.dart';
import '../dashboard/dashboard_screen.dart';
import '../kds/kds_screen.dart';
import '../pos/pos_provider.dart';
import '../pos/pos_screen.dart';
import '../printer/printer_settings_screen.dart';
import '../shift/shift_screen.dart';
import '../tables/tables_screen.dart';

class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).user;
    final pos = ref.watch(posControllerProvider);
    final themeMode = ref.watch(themeModeProvider);
    final accent = ref.watch(cadraAccentProvider);
    final p = CadraTheme.palette(Theme.of(context).brightness, accent);

    final destinations = <_NavItem>[
      const _NavItem(
        label: 'Kasir',
        icon: Icons.point_of_sale_rounded,
        screen: PosScreen(),
      ),
      _NavItem(
        label: 'Meja',
        icon: Icons.table_restaurant_rounded,
        screen: TablesScreen(
          onSelectTableForPos: () => setState(() => _selectedIndex = 0),
        ),
      ),
      if (user == null ||
          (user.hasPermission('kds.view') &&
              user.canUseFeature(PlanFeature.kds)))
        const _NavItem(
          label: 'KDS',
          icon: Icons.soup_kitchen_rounded,
          screen: KdsScreen(),
        ),
      const _NavItem(
        label: 'Shift',
        icon: Icons.receipt_long_rounded,
        screen: ShiftScreen(),
      ),
      if (user != null && user.hasPermission('report.view'))
        const _NavItem(
          label: 'Ringkasan',
          icon: Icons.insights_rounded,
          screen: DashboardScreen(),
        ),
    ];

    final activeIdx = _selectedIndex.clamp(0, destinations.length - 1);
    final active = destinations[activeIdx];
    final isWide = MediaQuery.sizeOf(context).width >= 900;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                'assets/branding/kassa-icon-dark.png',
                width: 28,
                height: 28,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 10),
            Text(active.label),
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
              decoration: BoxDecoration(
                color: (pos.isOnline ? p.good : p.warn).withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: pos.isOnline ? p.good : p.warn,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    pos.isOnline ? 'Online' : 'Offline',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: pos.isOnline ? p.good : p.warn,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Pengaturan Printer Thermal',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const PrinterSettingsScreen(),
                ),
              );
            },
            icon: const Icon(Icons.print_rounded),
          ),
          PopupMenuButton<CadraAccent>(
            tooltip: 'Pilih Aksen Cadra',
            icon: const Icon(Icons.palette_outlined),
            onSelected: (selected) =>
                ref.read(cadraAccentProvider.notifier).state = selected,
            itemBuilder: (_) => const [
              PopupMenuItem(value: CadraAccent.ocean, child: Text('Ocean')),
              PopupMenuItem(value: CadraAccent.sage, child: Text('Sage')),
              PopupMenuItem(value: CadraAccent.coral, child: Text('Coral')),
              PopupMenuItem(value: CadraAccent.amber, child: Text('Amber')),
              PopupMenuItem(value: CadraAccent.mono, child: Text('Mono')),
            ],
          ),
          IconButton(
            tooltip: 'Ganti Tema Terang/Gelap',
            onPressed: () {
              ref.read(themeModeProvider.notifier).state =
                  themeMode == ThemeMode.dark
                      ? ThemeMode.light
                      : ThemeMode.dark;
            },
            icon: Icon(
              themeMode == ThemeMode.dark
                  ? Icons.light_mode_rounded
                  : Icons.dark_mode_rounded,
            ),
          ),
          IconButton(
            tooltip: 'Keluar',
            onPressed: () {
              ref.read(socketServiceProvider).disconnect();
              ref.read(authControllerProvider.notifier).logout();
            },
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: isWide
          ? Row(
              children: [
                NavigationRail(
                  selectedIndex: activeIdx,
                  onDestinationSelected: (i) =>
                      setState(() => _selectedIndex = i),
                  labelType: NavigationRailLabelType.all,
                  destinations: destinations
                      .map(
                        (d) => NavigationRailDestination(
                          icon: Icon(d.icon),
                          label: Text(d.label),
                        ),
                      )
                      .toList(),
                ),
                const VerticalDivider(width: 1),
                Expanded(child: active.screen),
              ],
            )
          : active.screen,
      bottomNavigationBar: isWide
          ? null
          : NavigationBar(
              selectedIndex: activeIdx,
              onDestinationSelected: (i) => setState(() => _selectedIndex = i),
              destinations: destinations
                  .map(
                    (d) => NavigationDestination(
                      icon: Icon(d.icon),
                      label: d.label,
                    ),
                  )
                  .toList(),
            ),
    );
  }
}

class _NavItem {
  const _NavItem({
    required this.label,
    required this.icon,
    required this.screen,
  });

  final String label;
  final IconData icon;
  final Widget screen;
}
