import 'dart:convert';
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

class OfflineDb {
  OfflineDb._();
  static final OfflineDb instance = OfflineDb._();

  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    final dbPath = await getDatabasesPath();
    final fullPath = p.join(dbPath, 'kassa_pos_offline_v1.db');
    _db = await openDatabase(
      fullPath,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE catalog_cache (
            cache_key TEXT PRIMARY KEY,
            synced_at TEXT NOT NULL,
            payload_json TEXT NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE offline_orders (
            client_uuid TEXT PRIMARY KEY,
            outlet_id INTEGER,
            offline_receipt_no TEXT NOT NULL,
            created_at TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
          )
        ''');
      },
    );
    return _db!;
  }

  Future<void> saveCatalog(int outletId, Map<String, dynamic> pullData) async {
    final db = await database;
    await db.insert(
      'catalog_cache',
      {
        'cache_key': 'catalog:$outletId',
        'synced_at': (pullData['syncedAt'] ?? DateTime.now().toIso8601String())
            .toString(),
        'payload_json': jsonEncode(pullData),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<Map<String, dynamic>?> getCatalog(int outletId) async {
    final db = await database;
    final rows = await db.query(
      'catalog_cache',
      where: 'cache_key = ?',
      whereArgs: ['catalog:$outletId'],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    final decoded = jsonDecode(rows.first['payload_json'] as String);
    return decoded is Map<String, dynamic> ? decoded : null;
  }

  Future<void> addOfflineOrder({
    required String clientUuid,
    required int outletId,
    required String offlineReceiptNo,
    required String createdAt,
    required Map<String, dynamic> transactionPayload,
  }) async {
    final db = await database;
    await db.insert(
      'offline_orders',
      {
        'client_uuid': clientUuid,
        'outlet_id': outletId,
        'offline_receipt_no': offlineReceiptNo,
        'created_at': createdAt,
        'payload_json': jsonEncode(transactionPayload),
        'synced': 0,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Map<String, dynamic>>> getPendingOrders(int outletId) async {
    final db = await database;
    final rows = await db.query(
      'offline_orders',
      where: 'synced = 0 AND (outlet_id IS NULL OR outlet_id = ?)',
      whereArgs: [outletId],
      orderBy: 'created_at ASC',
    );
    return rows.map((r) {
      final decoded = jsonDecode(r['payload_json'] as String);
      return decoded is Map<String, dynamic>
          ? decoded
          : <String, dynamic>{};
    }).toList();
  }

  Future<int> getPendingCount(int outletId) async {
    final db = await database;
    final result = await db.rawQuery(
      'SELECT COUNT(*) as cnt FROM offline_orders WHERE synced = 0 AND (outlet_id IS NULL OR outlet_id = ?)',
      [outletId],
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<void> markSynced(List<String> clientUuids) async {
    if (clientUuids.isEmpty) return;
    final db = await database;
    final batch = db.batch();
    for (final id in clientUuids) {
      batch.update(
        'offline_orders',
        {'synced': 1},
        where: 'client_uuid = ?',
        whereArgs: [id],
      );
    }
    await batch.commit(noResult: true);
  }
}
