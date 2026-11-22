import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../core/calculations/order_calculations.dart';
import '../../core/network/api_client.dart';
import '../../core/network/socket_service.dart';
import '../../core/providers.dart';
import '../../core/storage/offline_db.dart';
import '../../core/widgets/receipt_modal.dart';
import 'pos_models.dart';

class PosState {
  const PosState({
    this.categories = const [],
    this.products = const [],
    this.areas = const [],
    this.openOrders = const [],
    this.taxConfig = TaxConfig.defaultConfig,
    this.receiptSettings = const OutletReceiptSettings(),
    this.activeShift,
    this.selectedCategoryId,
    this.searchQuery = '',
    this.orderType = 'DINE_IN',
    this.selectedTableId,
    this.selectedTableLabel,
    this.customerName = '',
    this.discountType,
    this.discountValue = 0,
    this.cart = const [],
    this.isOnline = true,
    this.pendingOfflineCount = 0,
    this.isLoading = false,
    this.isSubmitting = false,
    this.error,
  });

  final List<CategoryModel> categories;
  final List<ProductModel> products;
  final List<AreaModel> areas;
  final List<OpenOrderModel> openOrders;
  final TaxConfig taxConfig;
  final OutletReceiptSettings receiptSettings;
  final ActiveShiftModel? activeShift;
  final int? selectedCategoryId;
  final String searchQuery;
  final String orderType;
  final int? selectedTableId;
  final String? selectedTableLabel;
  final String customerName;
  final DiscountType? discountType;
  final double discountValue;
  final List<CartItem> cart;
  final bool isOnline;
  final int pendingOfflineCount;
  final bool isLoading;
  final bool isSubmitting;
  final String? error;

  List<ProductModel> get filteredProducts {
    final q = searchQuery.trim().toLowerCase();
    return products.where((p) {
      if (selectedCategoryId != null && p.categoryId != selectedCategoryId) {
        return false;
      }
      if (q.isNotEmpty &&
          !p.name.toLowerCase().contains(q) &&
          !p.sku.toLowerCase().contains(q)) {
        return false;
      }
      return true;
    }).toList();
  }

  int get totalItemsCount => cart.fold<int>(0, (s, item) => s + item.quantity);

  OrderTotalsResult get totals => calculateOrderTotals(
        cart.map((e) => e.toCalcInput()).toList(),
        discount: discountType != null && discountValue > 0
            ? OrderDiscountInput(type: discountType!, value: discountValue)
            : null,
        config: taxConfig,
      );

  PosState copyWith({
    List<CategoryModel>? categories,
    List<ProductModel>? products,
    List<AreaModel>? areas,
    List<OpenOrderModel>? openOrders,
    TaxConfig? taxConfig,
    OutletReceiptSettings? receiptSettings,
    ActiveShiftModel? activeShift,
    bool clearShift = false,
    int? selectedCategoryId,
    bool clearCategory = false,
    String? searchQuery,
    String? orderType,
    int? selectedTableId,
    String? selectedTableLabel,
    bool clearTable = false,
    String? customerName,
    DiscountType? discountType,
    bool clearDiscount = false,
    double? discountValue,
    List<CartItem>? cart,
    bool? isOnline,
    int? pendingOfflineCount,
    bool? isLoading,
    bool? isSubmitting,
    String? error,
    bool clearError = false,
  }) {
    return PosState(
      categories: categories ?? this.categories,
      products: products ?? this.products,
      areas: areas ?? this.areas,
      openOrders: openOrders ?? this.openOrders,
      taxConfig: taxConfig ?? this.taxConfig,
      receiptSettings: receiptSettings ?? this.receiptSettings,
      activeShift: clearShift ? null : (activeShift ?? this.activeShift),
      selectedCategoryId: clearCategory
          ? null
          : (selectedCategoryId ?? this.selectedCategoryId),
      searchQuery: searchQuery ?? this.searchQuery,
      orderType: orderType ?? this.orderType,
      selectedTableId:
          clearTable ? null : (selectedTableId ?? this.selectedTableId),
      selectedTableLabel:
          clearTable ? null : (selectedTableLabel ?? this.selectedTableLabel),
      customerName: customerName ?? this.customerName,
      discountType:
          clearDiscount ? null : (discountType ?? this.discountType),
      discountValue:
          clearDiscount ? 0 : (discountValue ?? this.discountValue),
      cart: cart ?? this.cart,
      isOnline: isOnline ?? this.isOnline,
      pendingOfflineCount: pendingOfflineCount ?? this.pendingOfflineCount,
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class PosController extends StateNotifier<PosState> {
  PosController(this._api, this._socket, this._outletId)
      : super(const PosState()) {
    _initRealtimeAndConnectivity();
  }

  final ApiClient _api;
  final KassaSocketService _socket;
  final int _outletId;
  final _uuid = const Uuid();
  final List<StreamSubscription<dynamic>> _subs = [];

  void _initRealtimeAndConnectivity() {
    _socket.connect(station: 'ALL');
    _subs.add(_socket.onOrderUpdated.listen((_) => refreshLiveOperational()));
    _subs.add(_socket.onTableUpdated.listen((_) => refreshTables()));
    _subs.add(
      Connectivity().onConnectivityChanged.listen((results) async {
        final online = results.any((r) => r != ConnectivityResult.none);
        state = state.copyWith(isOnline: online);
        if (online) {
          await syncPendingOfflineOrders();
          await refreshLiveOperational();
        }
      }),
    );
  }

  @override
  void dispose() {
    for (final s in _subs) {
      s.cancel();
    }
    super.dispose();
  }

  Future<void> loadInitialData() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final pendingCount = await OfflineDb.instance.getPendingCount(_outletId);

    try {
      final pullRes = await _api.dio.get<Map<String, dynamic>>('/sync/pull');
      final pull = pullRes.data ?? const <String, dynamic>{};
      await OfflineDb.instance.saveCatalog(_outletId, pull);

      _applyCatalogPayload(pull, isOnline: true, pendingCount: pendingCount);
      await refreshLiveOperational();
      if (pendingCount > 0) {
        await syncPendingOfflineOrders();
      }
      state = state.copyWith(isLoading: false);
    } catch (e) {
      final cached = await OfflineDb.instance.getCatalog(_outletId);
      if (cached != null) {
        _applyCatalogPayload(
          cached,
          isOnline: false,
          pendingCount: pendingCount,
        );
        state = state.copyWith(isLoading: false);
      } else {
        state = state.copyWith(
          isLoading: false,
          isOnline: false,
          pendingOfflineCount: pendingCount,
          error: ApiClient.extractErrorMessage(e),
        );
      }
    }
  }

  void _applyCatalogPayload(
    Map<String, dynamic> pull, {
    required bool isOnline,
    required int pendingCount,
  }) {
    final rawCats = pull['categories'] is List ? pull['categories'] as List : [];
    final rawProds = pull['products'] is List ? pull['products'] as List : [];
    final rawAreas = pull['areas'] is List ? pull['areas'] as List : [];
    final rawSettings = pull['settings'] is Map<String, dynamic>
        ? pull['settings'] as Map<String, dynamic>
        : const <String, dynamic>{};

    state = state.copyWith(
      categories: rawCats
          .whereType<Map<String, dynamic>>()
          .map(CategoryModel.fromJson)
          .toList(),
      products: rawProds
          .whereType<Map<String, dynamic>>()
          .map(ProductModel.fromJson)
          .toList(),
      areas: rawAreas
          .whereType<Map<String, dynamic>>()
          .map(AreaModel.fromJson)
          .toList(),
      taxConfig: TaxConfig.fromSettings(rawSettings),
      receiptSettings: OutletReceiptSettings.fromSettings(rawSettings),
      isOnline: isOnline,
      pendingOfflineCount: pendingCount,
    );
  }

  Future<void> refreshLiveOperational() async {
    await Future.wait([
      refreshShift(),
      refreshTables(),
      refreshOpenOrders(),
    ]);
  }

  Future<void> refreshTables() async {
    try {
      final res = await _api.dio.get<List<dynamic>>('/tables');
      final list = res.data ?? const [];
      state = state.copyWith(
        areas: list
            .whereType<Map<String, dynamic>>()
            .map(AreaModel.fromJson)
            .toList(),
        isOnline: true,
      );
    } catch (_) {}
  }

  Future<void> refreshOpenOrders() async {
    try {
      final res = await _api.dio.get<List<dynamic>>(
        '/orders',
        queryParameters: {'status': 'OPEN,SENT,SERVED'},
      );
      final list = res.data ?? const [];
      state = state.copyWith(
        openOrders: list
            .whereType<Map<String, dynamic>>()
            .map(OpenOrderModel.fromJson)
            .toList(),
        isOnline: true,
      );
    } catch (_) {}
  }

  Future<void> refreshShift() async {
    try {
      final res = await _api.dio.get<dynamic>('/shifts/active');
      final shift = res.data is Map<String, dynamic>
          ? ActiveShiftModel.fromJson(res.data as Map<String, dynamic>)
          : null;
      state = state.copyWith(
        activeShift: shift,
        clearShift: shift == null,
        isOnline: true,
      );
    } catch (_) {}
  }

  Future<int> syncPendingOfflineOrders() async {
    final pending = await OfflineDb.instance.getPendingOrders(_outletId);
    if (pending.isEmpty) {
      state = state.copyWith(pendingOfflineCount: 0);
      return 0;
    }
    try {
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/sync/push',
        data: {'transactions': pending},
      );
      final results =
          res.data?['results'] is List ? res.data!['results'] as List : [];
      final syncedIds = results
          .whereType<Map<String, dynamic>>()
          .where((r) =>
              r['status'] == 'SYNCED' || r['status'] == 'DUPLICATE_SKIPPED')
          .map((r) => r['clientUuid'].toString())
          .toList();
      await OfflineDb.instance.markSynced(syncedIds);
      final remaining = await OfflineDb.instance.getPendingCount(_outletId);
      state = state.copyWith(pendingOfflineCount: remaining, isOnline: true);
      await refreshShift();
      return syncedIds.length;
    } catch (_) {
      return 0;
    }
  }

  Future<String?> openShift({required int openingCash, String? notes}) async {
    try {
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/shifts/open',
        data: {
          'openingCash': openingCash,
          if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
        },
      );
      if (res.data != null) {
        state = state.copyWith(
          activeShift: ActiveShiftModel.fromJson(res.data!),
        );
      }
      return null;
    } catch (e) {
      return ApiClient.extractErrorMessage(e);
    }
  }

  Future<String?> recordCashMovement({
    required String type,
    required int amount,
    required String reason,
  }) async {
    final shift = state.activeShift;
    if (shift == null) return 'Belum ada shift aktif';
    try {
      await _api.dio.post(
        '/shifts/cash-movements',
        data: {
          'shiftId': shift.id,
          'type': type,
          'amount': amount,
          'reason': reason.trim(),
        },
      );
      await refreshShift();
      return null;
    } catch (e) {
      return ApiClient.extractErrorMessage(e);
    }
  }

  Future<String?> closeShift({required int actualCash, String? notes}) async {
    final shift = state.activeShift;
    if (shift == null) return 'Belum ada shift aktif';
    try {
      await _api.dio.post(
        '/shifts/${shift.id}/close',
        data: {
          'actualCash': actualCash,
          if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
        },
      );
      state = state.copyWith(clearShift: true);
      return null;
    } catch (e) {
      return ApiClient.extractErrorMessage(e);
    }
  }

  void setCategory(int? categoryId) {
    state = state.copyWith(
      selectedCategoryId: categoryId,
      clearCategory: categoryId == null,
    );
  }

  void setSearch(String query) => state = state.copyWith(searchQuery: query);

  void setOrderType(String type) {
    state = state.copyWith(
      orderType: type,
      clearTable: type != 'DINE_IN',
    );
  }

  void selectTable(int? tableId, String? label) {
    state = state.copyWith(
      orderType: tableId != null ? 'DINE_IN' : state.orderType,
      selectedTableId: tableId,
      selectedTableLabel: label,
      clearTable: tableId == null,
    );
  }

  void setCustomerName(String name) =>
      state = state.copyWith(customerName: name);

  void setDiscount(DiscountType? type, double value) {
    if (type == null || value <= 0) {
      state = state.copyWith(clearDiscount: true);
    } else {
      state = state.copyWith(discountType: type, discountValue: value);
    }
  }

  void addToCart({
    required ProductModel product,
    ProductVariantModel? variant,
    List<ModifierModel> modifiers = const [],
    int quantity = 1,
    String? notes,
  }) {
    final sortedModIds = modifiers.map((m) => m.id).toList()..sort();
    final key =
        '${product.id}:${variant?.id ?? 0}:${sortedModIds.join(",")}:${(notes ?? "").trim()}';

    final list = [...state.cart];
    final idx = list.indexWhere((c) => c.key == key);
    if (idx >= 0) {
      list[idx] = list[idx].copyWith(quantity: list[idx].quantity + quantity);
    } else {
      list.add(
        CartItem(
          key: key,
          product: product,
          variant: variant,
          modifiers: modifiers,
          quantity: quantity,
          notes: notes,
        ),
      );
    }
    state = state.copyWith(cart: list);
  }

  void updateQuantity(String key, int delta) {
    final list = [...state.cart];
    final idx = list.indexWhere((c) => c.key == key);
    if (idx < 0) return;
    final nextQty = list[idx].quantity + delta;
    if (nextQty <= 0) {
      list.removeAt(idx);
    } else {
      list[idx] = list[idx].copyWith(quantity: nextQty);
    }
    state = state.copyWith(cart: list);
  }

  void clearCart() {
    state = state.copyWith(
      cart: const [],
      customerName: '',
      clearTable: true,
      clearDiscount: true,
    );
  }

  /// Kirim pesanan ke dapur (tanpa bayar dulu — identik dengan tombol "Kirim Dapur" di web).
  Future<({String? orderNo, String? error})> sendToKitchenOnly() async {
    if (state.cart.isEmpty) {
      return (orderNo: null, error: 'Keranjang masih kosong');
    }
    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final res = await _api.dio.post<Map<String, dynamic>>(
        '/orders',
        data: {
          'clientUuid': _uuid.v4(),
          'orderType': state.orderType,
          if (state.selectedTableId != null) 'tableId': state.selectedTableId,
          if (state.customerName.trim().isNotEmpty)
            'customerName': state.customerName.trim(),
          if (state.discountType != null && state.discountValue > 0) ...{
            'discountType':
                state.discountType == DiscountType.percent ? 'PERCENT' : 'FIXED',
            'discountValue': state.discountValue.round(),
          },
          'sendToKitchen': true,
          'items': state.cart.map((e) => e.toApiItemJson()).toList(),
        },
      );
      final orderNo = (res.data?['orderNo'] ?? '-').toString();
      clearCart();
      state = state.copyWith(isSubmitting: false);
      await refreshLiveOperational();
      return (orderNo: orderNo, error: null);
    } catch (e) {
      final msg = ApiClient.extractErrorMessage(e);
      state = state.copyWith(isSubmitting: false, error: msg);
      return (orderNo: null, error: msg);
    }
  }

  /// Buat order + bayar langsung (mendukung fallback Offline Tunai `OFF-XXXXXX` saat jaringan putus).
  Future<({ReceiptData? receipt, String? error})> checkoutAndPay({
    required String paymentMethod,
    required int paidAmount,
    String? referenceNo,
  }) async {
    if (state.cart.isEmpty) {
      return (receipt: null, error: 'Keranjang masih kosong');
    }
    state = state.copyWith(isSubmitting: true, clearError: true);
    final itemsSnapshot = [...state.cart];
    final totalsSnapshot = state.totals;
    final tableNameSnap = state.selectedTableLabel;
    final customerSnap =
        state.customerName.trim().isEmpty ? null : state.customerName.trim();
    final orderTypeSnap = state.orderType;
    final clientUuid = _uuid.v4();

    if (!state.isOnline) {
      if (paymentMethod != 'CASH') {
        state = state.copyWith(isSubmitting: false);
        return (
          receipt: null,
          error: 'Mode offline hanya mendukung pembayaran Tunai',
        );
      }
      final receipt = await _saveOfflineCash(
        clientUuid: clientUuid,
        itemsSnapshot: itemsSnapshot,
        totalsSnapshot: totalsSnapshot,
        paidAmount: paidAmount,
        orderTypeSnap: orderTypeSnap,
        tableNameSnap: tableNameSnap,
        customerSnap: customerSnap,
      );
      clearCart();
      state = state.copyWith(isSubmitting: false);
      return (receipt: receipt, error: null);
    }

    try {
      final orderRes = await _api.dio.post<Map<String, dynamic>>(
        '/orders',
        data: {
          'clientUuid': clientUuid,
          'orderType': orderTypeSnap,
          if (state.selectedTableId != null) 'tableId': state.selectedTableId,
          'customerName': ?customerSnap,
          if (state.discountType != null && state.discountValue > 0) ...{
            'discountType':
                state.discountType == DiscountType.percent ? 'PERCENT' : 'FIXED',
            'discountValue': state.discountValue.round(),
          },
          'sendToKitchen': true,
          'items': itemsSnapshot.map((e) => e.toApiItemJson()).toList(),
        },
      );

      final orderData = orderRes.data!;
      final orderId = (orderData['id'] as num).toInt();
      final serverGrandTotal =
          int.tryParse(orderData['grandTotal'].toString()) ??
              totalsSnapshot.grandTotal;

      final payRes = await _api.dio.post<Map<String, dynamic>>(
        '/orders/$orderId/payments',
        data: {
          'payments': [
            {
              'method': paymentMethod,
              'amount': serverGrandTotal,
              'paidAmount':
                  paymentMethod == 'CASH' ? paidAmount : serverGrandTotal,
              if (referenceNo != null && referenceNo.trim().isNotEmpty)
                'referenceNo': referenceNo.trim(),
            },
          ],
        },
      );

      final paidOrder = payRes.data?['order'] is Map<String, dynamic>
          ? payRes.data!['order'] as Map<String, dynamic>
          : orderData;

      final receipt = ReceiptData(
        receiptNo: (paidOrder['receiptNo'] ?? 'RCP-OK').toString(),
        orderNo: (paidOrder['orderNo'] ?? orderData['orderNo'] ?? '-').toString(),
        createdAt: DateTime.now(),
        orderType: orderTypeSnap,
        tableName: tableNameSnap,
        customerName: customerSnap,
        items: itemsSnapshot
            .map(
              (c) => ReceiptLineItem(
                productName: c.product.name,
                variantName: c.variant?.name,
                quantity: c.quantity,
                lineTotal: c.lineTotal,
                modifiers: c.modifiers.map((m) => m.name).toList(),
              ),
            )
            .toList(),
        subtotal: totalsSnapshot.subtotal,
        discountAmount: totalsSnapshot.totalDiscount,
        serviceChargeAmount: totalsSnapshot.serviceChargeAmount,
        taxAmount: totalsSnapshot.taxAmount,
        roundingAmount: totalsSnapshot.roundingAmount,
        grandTotal: serverGrandTotal,
        paidAmount: paymentMethod == 'CASH' ? paidAmount : serverGrandTotal,
        changeAmt: paymentMethod == 'CASH'
            ? calculateCashChange(serverGrandTotal, paidAmount)
            : 0,
        paymentMethod: paymentMethod,
        serviceChargePercent: state.taxConfig.serviceChargePercent,
        taxRatePercent: state.taxConfig.taxRatePercent,
        businessName: state.receiptSettings.businessName,
        address: state.receiptSettings.address,
        footer: state.receiptSettings.receiptFooter,
      );

      clearCart();
      state = state.copyWith(isSubmitting: false);
      await refreshLiveOperational();
      return (receipt: receipt, error: null);
    } on DioException catch (e) {
      final isNetErr = e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout;
      if (isNetErr && paymentMethod == 'CASH') {
        final receipt = await _saveOfflineCash(
          clientUuid: clientUuid,
          itemsSnapshot: itemsSnapshot,
          totalsSnapshot: totalsSnapshot,
          paidAmount: paidAmount,
          orderTypeSnap: orderTypeSnap,
          tableNameSnap: tableNameSnap,
          customerSnap: customerSnap,
        );
        clearCart();
        state = state.copyWith(isSubmitting: false, isOnline: false);
        return (receipt: receipt, error: null);
      }
      final msg = ApiClient.extractErrorMessage(e);
      state = state.copyWith(isSubmitting: false, error: msg);
      return (receipt: null, error: msg);
    } catch (e) {
      final msg = ApiClient.extractErrorMessage(e);
      state = state.copyWith(isSubmitting: false, error: msg);
      return (receipt: null, error: msg);
    }
  }

  Future<ReceiptData> _saveOfflineCash({
    required String clientUuid,
    required List<CartItem> itemsSnapshot,
    required OrderTotalsResult totalsSnapshot,
    required int paidAmount,
    required String orderTypeSnap,
    required String? tableNameSnap,
    required String? customerSnap,
  }) async {
    final now = DateTime.now();
    final offlineReceiptNo =
        'OFF-${now.millisecondsSinceEpoch.toString().substring(7)}';
    final payload = {
      'clientUuid': clientUuid,
      'offlineReceiptNo': offlineReceiptNo,
      'createdAt': now.toIso8601String(),
      'orderType': orderTypeSnap,
      if (state.selectedTableId != null) 'tableId': state.selectedTableId,
      'customerName': ?customerSnap,
      if (state.discountType != null && state.discountValue > 0) ...{
        'discountType':
            state.discountType == DiscountType.percent ? 'PERCENT' : 'FIXED',
        'discountValue': state.discountValue.round(),
      },
      'items': itemsSnapshot.map((e) => e.toApiItemJson()).toList(),
      'paidAmount': paidAmount,
    };

    await OfflineDb.instance.addOfflineOrder(
      clientUuid: clientUuid,
      outletId: _outletId,
      offlineReceiptNo: offlineReceiptNo,
      createdAt: now.toIso8601String(),
      transactionPayload: payload,
    );
    final pendingCount = await OfflineDb.instance.getPendingCount(_outletId);
    state = state.copyWith(pendingOfflineCount: pendingCount);

    return ReceiptData(
      receiptNo: offlineReceiptNo,
      orderNo: offlineReceiptNo,
      createdAt: now,
      orderType: orderTypeSnap,
      tableName: tableNameSnap,
      customerName: customerSnap,
      items: itemsSnapshot
          .map(
            (c) => ReceiptLineItem(
              productName: c.product.name,
              variantName: c.variant?.name,
              quantity: c.quantity,
              lineTotal: c.lineTotal,
              modifiers: c.modifiers.map((m) => m.name).toList(),
            ),
          )
          .toList(),
      subtotal: totalsSnapshot.subtotal,
      discountAmount: totalsSnapshot.totalDiscount,
      serviceChargeAmount: totalsSnapshot.serviceChargeAmount,
      taxAmount: totalsSnapshot.taxAmount,
      roundingAmount: totalsSnapshot.roundingAmount,
      grandTotal: totalsSnapshot.grandTotal,
      paidAmount: paidAmount,
      changeAmt: calculateCashChange(totalsSnapshot.grandTotal, paidAmount),
      paymentMethod: 'CASH',
      serviceChargePercent: state.taxConfig.serviceChargePercent,
      taxRatePercent: state.taxConfig.taxRatePercent,
      businessName: state.receiptSettings.businessName,
      address: state.receiptSettings.address,
      footer: state.receiptSettings.receiptFooter,
      isOffline: true,
    );
  }

  /// Bayar Order Aktif yang sudah dikirim ke dapur.
  Future<({ReceiptData? receipt, String? error})> payExistingOrder({
    required OpenOrderModel order,
    required String paymentMethod,
    required int paidAmount,
    String? referenceNo,
  }) async {
    state = state.copyWith(isSubmitting: true, clearError: true);
    try {
      final payRes = await _api.dio.post<Map<String, dynamic>>(
        '/orders/${order.id}/payments',
        data: {
          'payments': [
            {
              'method': paymentMethod,
              'amount': order.grandTotal,
              'paidAmount':
                  paymentMethod == 'CASH' ? paidAmount : order.grandTotal,
              if (referenceNo != null && referenceNo.trim().isNotEmpty)
                'referenceNo': referenceNo.trim(),
            },
          ],
        },
      );
      final paidOrder = payRes.data?['order'] is Map<String, dynamic>
          ? payRes.data!['order'] as Map<String, dynamic>
          : const <String, dynamic>{};

      final receipt = ReceiptData(
        receiptNo: (paidOrder['receiptNo'] ?? 'RCP-OK').toString(),
        orderNo: order.orderNo,
        createdAt: DateTime.now(),
        orderType: order.orderType,
        tableName: order.tableName,
        customerName: order.customerName,
        items: order.items
            .map(
              (it) => ReceiptLineItem(
                productName: it.productName,
                variantName: it.variantName,
                quantity: it.quantity,
                lineTotal: it.lineTotal,
                modifiers: it.modifiers,
              ),
            )
            .toList(),
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        serviceChargeAmount: order.serviceChargeAmount,
        taxAmount: order.taxAmount,
        roundingAmount: order.roundingAmount,
        grandTotal: order.grandTotal,
        paidAmount: paymentMethod == 'CASH' ? paidAmount : order.grandTotal,
        changeAmt: paymentMethod == 'CASH'
            ? calculateCashChange(order.grandTotal, paidAmount)
            : 0,
        paymentMethod: paymentMethod,
        serviceChargePercent: state.taxConfig.serviceChargePercent,
        taxRatePercent: state.taxConfig.taxRatePercent,
        businessName: state.receiptSettings.businessName,
        address: state.receiptSettings.address,
        footer: state.receiptSettings.receiptFooter,
      );

      state = state.copyWith(isSubmitting: false);
      await refreshLiveOperational();
      return (receipt: receipt, error: null);
    } catch (e) {
      final msg = ApiClient.extractErrorMessage(e);
      state = state.copyWith(isSubmitting: false, error: msg);
      return (receipt: null, error: msg);
    }
  }

  /// Void Order dengan PIN Approval Manager/Owner (`approval.pin`).
  Future<String?> voidOrderWithPin({
    required int orderId,
    required String managerPin,
    required String reason,
  }) async {
    try {
      await _api.dio.post(
        '/orders/$orderId/void',
        data: {
          'managerPin': managerPin.trim(),
          'reason': reason.trim(),
        },
      );
      await refreshLiveOperational();
      return null;
    } catch (e) {
      return ApiClient.extractErrorMessage(e);
    }
  }

  /// Pindah meja aktif ke meja kosong lain.
  Future<String?> moveTable({
    required int fromTableId,
    required int targetTableId,
  }) async {
    try {
      await _api.dio.post(
        '/tables/$fromTableId/move',
        data: {'targetTableId': targetTableId},
      );
      await refreshLiveOperational();
      return null;
    } catch (e) {
      return ApiClient.extractErrorMessage(e);
    }
  }

  /// Gabung dua meja aktif.
  Future<String?> mergeTables({
    required int sourceTableId,
    required int targetTableId,
  }) async {
    try {
      await _api.dio.post(
        '/tables/merge',
        data: {
          'sourceTableId': sourceTableId,
          'targetTableId': targetTableId,
        },
      );
      await refreshLiveOperational();
      return null;
    } catch (e) {
      return ApiClient.extractErrorMessage(e);
    }
  }
}

final posControllerProvider =
    StateNotifierProvider<PosController, PosState>((ref) {
  final api = ref.watch(apiClientProvider);
  final socket = ref.watch(socketServiceProvider);
  final outletId = ref.watch(authControllerProvider).user?.outletId ?? 1;
  final controller = PosController(api, socket, outletId);
  controller.loadInitialData();
  return controller;
});
