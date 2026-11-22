import '../../core/calculations/order_calculations.dart';

int _toInt(dynamic v, [int fallback = 0]) {
  if (v == null) return fallback;
  if (v is int) return v;
  if (v is num) return v.round();
  return int.tryParse(v.toString()) ?? fallback;
}

class OutletReceiptSettings {
  const OutletReceiptSettings({
    this.businessName = 'Kopi & Dapur Senja',
    this.address = 'Jl. Kemang Raya No. 48, Jakarta Selatan',
    this.receiptFooter =
        'Terima kasih telah berkunjung!\nWi-Fi: SenjaGuest / kopi2026',
  });

  final String businessName;
  final String address;
  final String receiptFooter;

  factory OutletReceiptSettings.fromSettings(Map<String, dynamic> settings) {
    final name = (settings['businessName'] ?? settings['outletName'] ?? '')
        .toString()
        .trim();
    final addr = (settings['address'] ?? '').toString().trim();
    final footer = (settings['receiptFooter'] ?? '').toString().trim();
    return OutletReceiptSettings(
      businessName: name.isNotEmpty ? name : 'Kopi & Dapur Senja',
      address: addr.isNotEmpty ? addr : 'Jl. Kemang Raya No. 48, Jakarta Selatan',
      receiptFooter: footer.isNotEmpty
          ? footer
          : 'Terima kasih telah berkunjung!\nWi-Fi: SenjaGuest / kopi2026',
    );
  }
}

class CategoryModel {
  const CategoryModel({
    required this.id,
    required this.name,
    this.tone = 'iris',
    this.sortOrder = 0,
  });

  final int id;
  final String name;
  final String tone;
  final int sortOrder;

  factory CategoryModel.fromJson(Map<String, dynamic> json) => CategoryModel(
        id: _toInt(json['id']),
        name: (json['name'] ?? '').toString(),
        tone: (json['tone'] ?? 'iris').toString(),
        sortOrder: _toInt(json['sortOrder']),
      );
}

class ProductVariantModel {
  const ProductVariantModel({
    required this.id,
    required this.name,
    required this.priceDelta,
    this.isDefault = false,
  });

  final int id;
  final String name;
  final int priceDelta;
  final bool isDefault;

  factory ProductVariantModel.fromJson(Map<String, dynamic> json) =>
      ProductVariantModel(
        id: _toInt(json['id']),
        name: (json['name'] ?? '').toString(),
        priceDelta: _toInt(json['priceDelta']),
        isDefault: json['isDefault'] == true,
      );
}

class ModifierModel {
  const ModifierModel({
    required this.id,
    required this.name,
    required this.price,
    this.isAvailable = true,
  });

  final int id;
  final String name;
  final int price;
  final bool isAvailable;

  factory ModifierModel.fromJson(Map<String, dynamic> json) => ModifierModel(
        id: _toInt(json['id']),
        name: (json['name'] ?? '').toString(),
        price: _toInt(json['price']),
        isAvailable: json['isAvailable'] != false,
      );
}

class ModifierGroupModel {
  const ModifierGroupModel({
    required this.id,
    required this.name,
    required this.isRequired,
    required this.minSelect,
    required this.maxSelect,
    required this.modifiers,
  });

  final int id;
  final String name;
  final bool isRequired;
  final int minSelect;
  final int maxSelect;
  final List<ModifierModel> modifiers;

  factory ModifierGroupModel.fromJson(Map<String, dynamic> json) {
    final target = json['modifierGroup'] is Map<String, dynamic>
        ? json['modifierGroup'] as Map<String, dynamic>
        : json;
    final rawMods = target['modifiers'] is List ? target['modifiers'] as List : [];
    return ModifierGroupModel(
      id: _toInt(target['id']),
      name: (target['name'] ?? '').toString(),
      isRequired: target['isRequired'] == true,
      minSelect: _toInt(target['minSelect']),
      maxSelect: _toInt(target['maxSelect'], 1),
      modifiers: rawMods
          .whereType<Map<String, dynamic>>()
          .map(ModifierModel.fromJson)
          .where((m) => m.isAvailable)
          .toList(),
    );
  }
}

class ProductModel {
  const ProductModel({
    required this.id,
    required this.categoryId,
    required this.sku,
    required this.name,
    required this.price,
    this.monogram,
    this.tone = 'iris',
    this.imageUrl,
    this.isAvailable = true,
    this.variants = const [],
    this.modifierGroups = const [],
  });

  final int id;
  final int categoryId;
  final String sku;
  final String name;
  final int price;
  final String? monogram;
  final String tone;
  final String? imageUrl;
  final bool isAvailable;
  final List<ProductVariantModel> variants;
  final List<ModifierGroupModel> modifierGroups;

  bool get isCustom => variants.length > 1 || modifierGroups.isNotEmpty;

  String get displayMonogram {
    if (monogram != null && monogram!.trim().isNotEmpty) {
      return monogram!.trim().toUpperCase();
    }
    final words = name.trim().split(RegExp(r'\s+'));
    if (words.length >= 2) {
      return '${words[0][0]}${words[1][0]}'.toUpperCase();
    }
    return name.length >= 2 ? name.substring(0, 2).toUpperCase() : name.toUpperCase();
  }

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final rawVariants = json['variants'] is List ? json['variants'] as List : [];
    final rawGroups =
        json['modifierGroups'] is List ? json['modifierGroups'] as List : [];
    return ProductModel(
      id: _toInt(json['id']),
      categoryId: _toInt(json['categoryId']),
      sku: (json['sku'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      price: _toInt(json['price']),
      monogram: json['monogram']?.toString(),
      tone: (json['tone'] ?? 'iris').toString(),
      imageUrl: json['imageUrl']?.toString(),
      isAvailable: json['isAvailable'] != false,
      variants: rawVariants
          .whereType<Map<String, dynamic>>()
          .map(ProductVariantModel.fromJson)
          .toList(),
      modifierGroups: rawGroups
          .whereType<Map<String, dynamic>>()
          .map(ModifierGroupModel.fromJson)
          .toList(),
    );
  }
}

class DiningTableOrderRef {
  const DiningTableOrderRef({
    required this.id,
    required this.orderNo,
    required this.grandTotal,
  });

  final int id;
  final String orderNo;
  final int grandTotal;

  factory DiningTableOrderRef.fromJson(Map<String, dynamic> json) =>
      DiningTableOrderRef(
        id: _toInt(json['id']),
        orderNo: (json['orderNo'] ?? '').toString(),
        grandTotal: _toInt(json['grandTotal']),
      );
}

class DiningTableModel {
  const DiningTableModel({
    required this.id,
    required this.code,
    required this.name,
    required this.capacity,
    required this.status,
    this.activeOrders = const [],
  });

  final int id;
  final String code;
  final String name;
  final int capacity;
  final String status;
  final List<DiningTableOrderRef> activeOrders;

  bool get isOccupied => status == 'OCCUPIED' || activeOrders.isNotEmpty;

  factory DiningTableModel.fromJson(Map<String, dynamic> json) {
    final rawOrders = json['orders'] is List ? json['orders'] as List : [];
    return DiningTableModel(
      id: _toInt(json['id']),
      code: (json['code'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      capacity: _toInt(json['capacity'], 2),
      status: (json['status'] ?? 'AVAILABLE').toString(),
      activeOrders: rawOrders
          .whereType<Map<String, dynamic>>()
          .map(DiningTableOrderRef.fromJson)
          .toList(),
    );
  }
}

class AreaModel {
  const AreaModel({
    required this.id,
    required this.name,
    this.tables = const [],
  });

  final int id;
  final String name;
  final List<DiningTableModel> tables;

  factory AreaModel.fromJson(Map<String, dynamic> json) {
    final rawTables = json['tables'] is List ? json['tables'] as List : [];
    return AreaModel(
      id: _toInt(json['id']),
      name: (json['name'] ?? '').toString(),
      tables: rawTables
          .whereType<Map<String, dynamic>>()
          .map(DiningTableModel.fromJson)
          .toList(),
    );
  }
}

class OpenOrderItemModel {
  const OpenOrderItemModel({
    required this.id,
    required this.productName,
    this.variantName,
    required this.quantity,
    required this.lineTotal,
    this.modifiers = const [],
  });

  final int id;
  final String productName;
  final String? variantName;
  final int quantity;
  final int lineTotal;
  final List<String> modifiers;

  factory OpenOrderItemModel.fromJson(Map<String, dynamic> json) {
    final rawMods = json['modifiers'] is List ? json['modifiers'] as List : [];
    return OpenOrderItemModel(
      id: _toInt(json['id']),
      productName: (json['productName'] ?? '').toString(),
      variantName: json['variantName']?.toString(),
      quantity: _toInt(json['quantity'], 1),
      lineTotal: _toInt(json['lineTotal']),
      modifiers: rawMods
          .whereType<Map<String, dynamic>>()
          .map((m) => (m['modifierName'] ?? '').toString())
          .where((s) => s.isNotEmpty)
          .toList(),
    );
  }
}

class OpenOrderModel {
  const OpenOrderModel({
    required this.id,
    required this.orderNo,
    required this.orderType,
    required this.status,
    required this.subtotal,
    required this.discountAmount,
    required this.serviceChargeAmount,
    required this.taxAmount,
    required this.roundingAmount,
    required this.grandTotal,
    required this.createdAt,
    this.tableId,
    this.tableName,
    this.customerName,
    this.items = const [],
  });

  final int id;
  final String orderNo;
  final String orderType;
  final String status;
  final int subtotal;
  final int discountAmount;
  final int serviceChargeAmount;
  final int taxAmount;
  final int roundingAmount;
  final int grandTotal;
  final DateTime createdAt;
  final int? tableId;
  final String? tableName;
  final String? customerName;
  final List<OpenOrderItemModel> items;

  factory OpenOrderModel.fromJson(Map<String, dynamic> json) {
    final table = json['table'] is Map<String, dynamic>
        ? json['table'] as Map<String, dynamic>
        : null;
    final rawItems = json['items'] is List ? json['items'] as List : [];
    return OpenOrderModel(
      id: _toInt(json['id']),
      orderNo: (json['orderNo'] ?? '').toString(),
      orderType: (json['orderType'] ?? 'DINE_IN').toString(),
      status: (json['status'] ?? 'OPEN').toString(),
      subtotal: _toInt(json['subtotal']),
      discountAmount: _toInt(json['discountAmount']),
      serviceChargeAmount: _toInt(json['serviceChargeAmount']),
      taxAmount: _toInt(json['taxAmount']),
      roundingAmount: _toInt(json['roundingAmount']),
      grandTotal: _toInt(json['grandTotal']),
      createdAt:
          DateTime.tryParse((json['createdAt'] ?? '').toString()) ?? DateTime.now(),
      tableId: table != null ? _toInt(table['id']) : null,
      tableName: table?['name']?.toString(),
      customerName: json['customerName']?.toString(),
      items: rawItems
          .whereType<Map<String, dynamic>>()
          .map(OpenOrderItemModel.fromJson)
          .toList(),
    );
  }
}

class CartItem {
  const CartItem({
    required this.key,
    required this.product,
    this.variant,
    this.modifiers = const [],
    required this.quantity,
    this.notes,
  });

  final String key;
  final ProductModel product;
  final ProductVariantModel? variant;
  final List<ModifierModel> modifiers;
  final int quantity;
  final String? notes;

  int get unitPrice => product.price + (variant?.priceDelta ?? 0);
  int get modifiersPrice => modifiers.fold<int>(0, (s, m) => s + m.price);
  int get lineTotal => (unitPrice + modifiersPrice) * quantity;

  CalcLineItemInput toCalcInput() => CalcLineItemInput(
        unitPrice: unitPrice,
        modifiersPrice: modifiersPrice,
        quantity: quantity,
      );

  Map<String, dynamic> toApiItemJson() => {
        'productId': product.id,
        if (variant != null) 'variantId': variant!.id,
        'quantity': quantity,
        if (notes != null && notes!.trim().isNotEmpty) 'notes': notes!.trim(),
        if (modifiers.isNotEmpty)
          'modifierIds': modifiers.map((m) => m.id).toList(),
      };

  CartItem copyWith({int? quantity, String? notes}) => CartItem(
        key: key,
        product: product,
        variant: variant,
        modifiers: modifiers,
        quantity: quantity ?? this.quantity,
        notes: notes ?? this.notes,
      );
}

class ActiveShiftModel {
  const ActiveShiftModel({
    required this.id,
    required this.openingCash,
    required this.openedAt,
    required this.totalOrders,
    required this.cashSales,
    required this.nonCashSales,
    required this.totalSales,
    required this.cashIn,
    required this.cashOut,
    required this.expectedCash,
    this.userName,
  });

  final int id;
  final int openingCash;
  final String openedAt;
  final int totalOrders;
  final int cashSales;
  final int nonCashSales;
  final int totalSales;
  final int cashIn;
  final int cashOut;
  final int expectedCash;
  final String? userName;

  factory ActiveShiftModel.fromJson(Map<String, dynamic> json) {
    final summary = json['summary'] is Map<String, dynamic>
        ? json['summary'] as Map<String, dynamic>
        : const <String, dynamic>{};
    final user = json['user'] is Map<String, dynamic>
        ? json['user'] as Map<String, dynamic>
        : const <String, dynamic>{};
    return ActiveShiftModel(
      id: _toInt(json['id']),
      openingCash: _toInt(json['openingCash']),
      openedAt: (json['openedAt'] ?? '').toString(),
      totalOrders: _toInt(summary['totalOrders']),
      cashSales: _toInt(summary['cashSales']),
      nonCashSales: _toInt(summary['nonCashSales']),
      totalSales: _toInt(summary['totalSales']),
      cashIn: _toInt(summary['cashIn']),
      cashOut: _toInt(summary['cashOut']),
      expectedCash: _toInt(summary['expectedCash'], _toInt(json['openingCash'])),
      userName: user['name']?.toString(),
    );
  }
}
