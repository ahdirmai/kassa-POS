import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/widgets/receipt_modal.dart';
import 'esc_pos_builder.dart';

enum PrinterConnectionMode { lan, bluetooth }

class PrinterConfig {
  const PrinterConfig({
    this.mode = PrinterConnectionMode.lan,
    this.paperWidthMm = 58,
    this.lanIp = '192.168.1.100',
    this.lanPort = 9100,
    this.btMac = '',
    this.btName = '',
    this.autoCut = true,
  });

  final PrinterConnectionMode mode;
  final int paperWidthMm;
  final String lanIp;
  final int lanPort;
  final String btMac;
  final String btName;
  final bool autoCut;

  PrinterConfig copyWith({
    PrinterConnectionMode? mode,
    int? paperWidthMm,
    String? lanIp,
    int? lanPort,
    String? btMac,
    String? btName,
    bool? autoCut,
  }) {
    return PrinterConfig(
      mode: mode ?? this.mode,
      paperWidthMm: paperWidthMm ?? this.paperWidthMm,
      lanIp: lanIp ?? this.lanIp,
      lanPort: lanPort ?? this.lanPort,
      btMac: btMac ?? this.btMac,
      btName: btName ?? this.btName,
      autoCut: autoCut ?? this.autoCut,
    );
  }
}

class ThermalPrinterService {
  static const _kMode = 'kassa_printer_mode';
  static const _kPaper = 'kassa_printer_paper_mm';
  static const _kLanIp = 'kassa_printer_lan_ip';
  static const _kLanPort = 'kassa_printer_lan_port';
  static const _kBtMac = 'kassa_printer_bt_mac';
  static const _kBtName = 'kassa_printer_bt_name';
  static const _kAutoCut = 'kassa_printer_autocut';

  Future<PrinterConfig> loadConfig() async {
    final prefs = await SharedPreferences.getInstance();
    final modeRaw = prefs.getString(_kMode) ?? 'lan';
    return PrinterConfig(
      mode: modeRaw == 'bluetooth'
          ? PrinterConnectionMode.bluetooth
          : PrinterConnectionMode.lan,
      paperWidthMm: prefs.getInt(_kPaper) ?? 58,
      lanIp: prefs.getString(_kLanIp) ?? '192.168.1.100',
      lanPort: prefs.getInt(_kLanPort) ?? 9100,
      btMac: prefs.getString(_kBtMac) ?? '',
      btName: prefs.getString(_kBtName) ?? '',
      autoCut: prefs.getBool(_kAutoCut) ?? true,
    );
  }

  Future<void> saveConfig(PrinterConfig config) async {
    final prefs = await SharedPreferences.getInstance();
    await Future.wait([
      prefs.setString(
        _kMode,
        config.mode == PrinterConnectionMode.bluetooth ? 'bluetooth' : 'lan',
      ),
      prefs.setInt(_kPaper, config.paperWidthMm),
      prefs.setString(_kLanIp, config.lanIp.trim()),
      prefs.setInt(_kLanPort, config.lanPort),
      prefs.setString(_kBtMac, config.btMac.trim()),
      prefs.setString(_kBtName, config.btName.trim()),
      prefs.setBool(_kAutoCut, config.autoCut),
    ]);
  }

  Future<List<BluetoothInfo>> scanPairedBluetooth() async {
    try {
      final enabled = await PrintBluetoothThermal.bluetoothEnabled;
      if (!enabled) return const [];
      return await PrintBluetoothThermal.pairedBluetooths;
    } catch (_) {
      return const [];
    }
  }

  Future<String?> printReceipt(ReceiptData receipt) async {
    final config = await loadConfig();
    final bytes = EscPosBuilder.buildReceipt(
      receipt,
      paperWidthMm: config.paperWidthMm,
      autoCut: config.autoCut,
    );
    return _sendBytes(bytes, config);
  }

  Future<String?> testPrint({required String outletName}) async {
    final config = await loadConfig();
    final bytes = EscPosBuilder.buildTestPrint(
      outletName: outletName,
      paperWidthMm: config.paperWidthMm,
      autoCut: config.autoCut,
    );
    return _sendBytes(bytes, config);
  }

  Future<String?> _sendBytes(List<int> bytes, PrinterConfig config) async {
    if (config.mode == PrinterConnectionMode.lan) {
      if (config.lanIp.trim().isEmpty) {
        return 'IP Printer LAN belum diisi. Atur di menu Pengaturan Printer.';
      }
      Socket? socket;
      try {
        socket = await Socket.connect(
          config.lanIp.trim(),
          config.lanPort,
          timeout: const Duration(seconds: 5),
        );
        socket.add(bytes);
        await socket.flush();
        return null;
      } catch (e) {
        return 'Gagal mencetak ke printer LAN (${config.lanIp}:${config.lanPort}): $e';
      } finally {
        socket?.destroy();
      }
    }

    // Bluetooth mode
    if (config.btMac.trim().isEmpty) {
      return 'Printer Bluetooth belum dipilih. Pilih perangkat di Pengaturan Printer.';
    }
    try {
      final connected = await PrintBluetoothThermal.connectionStatus;
      if (!connected) {
        final ok = await PrintBluetoothThermal.connect(
          macPrinterAddress: config.btMac.trim(),
        );
        if (!ok) {
          return 'Gagal terhubung ke printer Bluetooth (${config.btName.isNotEmpty ? config.btName : config.btMac}).';
        }
      }
      final written = await PrintBluetoothThermal.writeBytes(bytes);
      return written ? null : 'Printer Bluetooth tidak merespons.';
    } catch (e) {
      return 'Error Bluetooth: $e';
    }
  }
}

final thermalPrinterServiceProvider = Provider<ThermalPrinterService>((ref) {
  return ThermalPrinterService();
});
