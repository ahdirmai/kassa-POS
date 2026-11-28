import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import '../../core/providers.dart';
import '../../core/theme/cadra_theme.dart';
import 'printer_service.dart';

class PrinterSettingsScreen extends ConsumerStatefulWidget {
  const PrinterSettingsScreen({super.key});

  @override
  ConsumerState<PrinterSettingsScreen> createState() =>
      _PrinterSettingsScreenState();
}

class _PrinterSettingsScreenState extends ConsumerState<PrinterSettingsScreen> {
  PrinterConfig _config = const PrinterConfig();
  final _ipCtrl = TextEditingController();
  final _portCtrl = TextEditingController();
  List<BluetoothInfo> _btDevices = const [];
  bool _loading = true;
  bool _scanning = false;
  bool _testing = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final cfg = await ref.read(thermalPrinterServiceProvider).loadConfig();
    if (!mounted) return;
    setState(() {
      _config = cfg;
      _ipCtrl.text = cfg.lanIp;
      _portCtrl.text = cfg.lanPort.toString();
      _loading = false;
    });
  }

  @override
  void dispose() {
    _ipCtrl.dispose();
    _portCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final next = _config.copyWith(
      lanIp: _ipCtrl.text.trim(),
      lanPort: int.tryParse(_portCtrl.text.trim()) ?? 9100,
    );
    await ref.read(thermalPrinterServiceProvider).saveConfig(next);
    if (!mounted) return;
    setState(() => _config = next);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Pengaturan printer disimpan')),
    );
  }

  Future<void> _scanBt() async {
    setState(() => _scanning = true);
    final list =
        await ref.read(thermalPrinterServiceProvider).scanPairedBluetooth();
    if (!mounted) return;
    setState(() {
      _btDevices = list;
      _scanning = false;
    });
    if (list.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Tidak ada printer Bluetooth ter-pair. Pastikan Bluetooth aktif & sudah di-pair di Pengaturan HP.',
          ),
        ),
      );
    }
  }

  Future<void> _testPrint() async {
    await _save();
    setState(() => _testing = true);
    final user = ref.read(authControllerProvider).user;
    final err = await ref.read(thermalPrinterServiceProvider).testPrint(
          outletName: user?.outletName ?? 'TUMPU POS',
        );
    if (!mounted) return;
    setState(() => _testing = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(err ?? 'Test print berhasil dikirim ke printer!'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final p = CadraTheme.palette(
      Theme.of(context).brightness,
      ref.watch(cadraAccentProvider),
    );

    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Pengaturan Printer Thermal')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 680),
              child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Koneksi Printer (ESC/POS)',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'LAN/Wi-Fi (TCP 9100) bekerja di Android & iOS. Bluetooth bekerja di Android (Classic SPP) & iOS (BLE).',
                    style: TextStyle(fontSize: 12, color: p.muted),
                  ),
                  const SizedBox(height: 14),
                  SegmentedButton<PrinterConnectionMode>(
                    segments: const [
                      ButtonSegment(
                        value: PrinterConnectionMode.lan,
                        label: Text('LAN / Wi-Fi'),
                        icon: Icon(Icons.wifi_rounded, size: 18),
                      ),
                      ButtonSegment(
                        value: PrinterConnectionMode.bluetooth,
                        label: Text('Bluetooth'),
                        icon: Icon(Icons.bluetooth_rounded, size: 18),
                      ),
                    ],
                    selected: {_config.mode},
                    onSelectionChanged: (v) =>
                        setState(() => _config = _config.copyWith(mode: v.first)),
                  ),
                  const SizedBox(height: 16),
                  if (_config.mode == PrinterConnectionMode.lan) ...[
                    TextField(
                      controller: _ipCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Alamat IP Printer',
                        hintText: '192.168.1.100',
                        prefixIcon: Icon(Icons.router_rounded),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _portCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Port TCP (default 9100)',
                        prefixIcon: Icon(Icons.numbers_rounded),
                      ),
                    ),
                  ] else ...[
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _config.btMac.isNotEmpty
                                ? 'Terpilih: ${_config.btName} (${_config.btMac})'
                                : 'Belum ada printer Bluetooth dipilih',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        OutlinedButton.icon(
                          onPressed: _scanning ? null : _scanBt,
                          icon: const Icon(Icons.bluetooth_searching_rounded,
                              size: 18),
                          label: Text(_scanning ? 'Mencari...' : 'Scan'),
                        ),
                      ],
                    ),
                    if (_btDevices.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      ..._btDevices.map(
                        (d) => ListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.print_rounded),
                          title: Text(d.name),
                          subtitle: Text(d.macAdress),
                          trailing: _config.btMac == d.macAdress
                              ? Icon(Icons.check_circle_rounded, color: p.good)
                              : null,
                          onTap: () => setState(() {
                            _config = _config.copyWith(
                              btMac: d.macAdress,
                              btName: d.name,
                            );
                          }),
                        ),
                      ),
                    ],
                  ],
                  const SizedBox(height: 16),
                  const Text(
                    'Lebar Kertas Thermal',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  SegmentedButton<int>(
                    segments: const [
                      ButtonSegment(value: 58, label: Text('58 mm (32 kolom)')),
                      ButtonSegment(value: 80, label: Text('80 mm (48 kolom)')),
                    ],
                    selected: {_config.paperWidthMm},
                    onSelectionChanged: (v) => setState(
                      () => _config = _config.copyWith(paperWidthMm: v.first),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Auto-Cut Kertas'),
                    subtitle: const Text('Kirim perintah potong otomatis setelah cetak'),
                    value: _config.autoCut,
                    onChanged: (v) =>
                        setState(() => _config = _config.copyWith(autoCut: v)),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _testing ? null : _testPrint,
                          icon: const Icon(Icons.print_outlined),
                          label: Text(_testing ? 'Mencetak...' : 'Test Print'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: FilledButton(
                          onPressed: _save,
                          child: const Text('Simpan'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
