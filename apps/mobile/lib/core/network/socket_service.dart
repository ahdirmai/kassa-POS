import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/app_config.dart';
import '../storage/token_storage.dart';

class TumpuSocketService {
  TumpuSocketService(this._storage);

  final TokenStorage _storage;
  io.Socket? _socket;
  String? _connectedStation;

  final _orderEvents = StreamController<dynamic>.broadcast();
  final _tableEvents = StreamController<dynamic>.broadcast();
  final _kdsEvents = StreamController<dynamic>.broadcast();
  final _connectionState = StreamController<bool>.broadcast();

  Stream<dynamic> get onOrderUpdated => _orderEvents.stream;
  Stream<dynamic> get onTableUpdated => _tableEvents.stream;
  Stream<dynamic> get onKdsUpdated => _kdsEvents.stream;
  Stream<bool> get onConnectionChanged => _connectionState.stream;

  bool get isConnected => _socket?.connected == true;

  Future<void> connect({String station = 'ALL'}) async {
    final token = await _storage.getAccessToken();
    if (token == null || token.isEmpty) return;

    if (_socket != null &&
        _socket!.connected &&
        _connectedStation == station) {
      return;
    }

    disconnect();
    _connectedStation = station;

    final apiUrl = await _storage.getApiBaseUrl();
    final socketUrl = AppConfig.socketOriginFromApiUrl(apiUrl);

    final opts = io.OptionBuilder()
        .setTransports(['websocket', 'polling'])
        .setAuth({'token': token})
        .setQuery({'station': station})
        .enableReconnection()
        .setReconnectionAttempts(15)
        .build();

    final sock = io.io(socketUrl, opts);
    sock.onConnect((_) => _connectionState.add(true));
    sock.onDisconnect((_) => _connectionState.add(false));
    sock.on('order:updated', (data) => _orderEvents.add(data));
    sock.on('table:updated', (data) => _tableEvents.add(data));
    sock.on('kds:updated', (data) => _kdsEvents.add(data));
    _socket = sock;
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
    _connectedStation = null;
  }

  void dispose() {
    disconnect();
    _orderEvents.close();
    _tableEvents.close();
    _kdsEvents.close();
    _connectionState.close();
  }
}
