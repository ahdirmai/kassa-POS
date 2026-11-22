enum PlanTier { free, pro, enterprise }

enum PlanFeature {
  pos,
  kds,
  stock,
  reports,
  rbacCustom,
  multiOutlet,
  digitalMenu,
}

PlanTier normalizePlanTier(String? raw) {
  switch (raw?.toUpperCase()) {
    case 'PRO':
      return PlanTier.pro;
    case 'ENTERPRISE':
      return PlanTier.enterprise;
    default:
      return PlanTier.free;
  }
}

bool hasPlanFeature(String? planRaw, PlanFeature feature) {
  final tier = normalizePlanTier(planRaw);
  if (tier == PlanTier.pro || tier == PlanTier.enterprise) {
    return true;
  }
  return feature == PlanFeature.pos;
}

class AuthUser {
  const AuthUser({
    required this.id,
    required this.tenantId,
    required this.outletId,
    required this.name,
    required this.email,
    required this.roleCode,
    required this.roleName,
    required this.permissions,
    this.plan = 'FREE',
    this.outletCode,
    this.outletName,
    this.tenantName,
  });

  final int id;
  final int tenantId;
  final int outletId;
  final String name;
  final String email;
  final String roleCode;
  final String roleName;
  final List<String> permissions;
  final String plan;
  final String? outletCode;
  final String? outletName;
  final String? tenantName;

  bool hasPermission(String permission) {
    if (roleCode.toUpperCase() == 'OWNER') return true;
    return permissions.contains(permission);
  }

  bool canUseFeature(PlanFeature feature) => hasPlanFeature(plan, feature);

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final permsRaw = json['permissions'];
    final perms = permsRaw is List
        ? permsRaw.map((e) => e.toString()).toList()
        : <String>[];

    return AuthUser(
      id: (json['id'] as num).toInt(),
      tenantId: (json['tenantId'] as num?)?.toInt() ?? 1,
      outletId: (json['outletId'] as num?)?.toInt() ?? 1,
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      roleCode: (json['roleCode'] ?? json['role']?['code'] ?? 'CASHIER')
          .toString(),
      roleName: (json['roleName'] ?? json['role']?['name'] ?? 'Kasir')
          .toString(),
      permissions: perms,
      plan: (json['plan'] ?? json['tenant']?['plan'] ?? 'FREE').toString(),
      outletCode: json['outletCode']?.toString() ??
          json['outlet']?['code']?.toString(),
      outletName: json['outletName']?.toString() ??
          json['outlet']?['name']?.toString(),
      tenantName: json['tenantName']?.toString() ??
          json['tenant']?['name']?.toString(),
    );
  }
}
