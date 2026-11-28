import { hasPlanFeature, type PlanFeature } from "@pos/shared";

export interface RouteRule {
  href: string;
  label: string;
  sub: string;
  kind: "POS" | "KDS" | "Admin";
  anyPermissions: string[];
  requiredFeature?: PlanFeature;
}

export const APP_ROUTES: RouteRule[] = [
  { href: "/pos", label: "Kasir POS", sub: "Input pesanan, meja & pembayaran", kind: "POS", anyPermissions: ["pos.access"], requiredFeature: "pos" },
  { href: "/kds", label: "Layar Dapur (KDS)", sub: "Kanban antrean dapur & bar realtime", kind: "KDS", anyPermissions: ["kds.view"], requiredFeature: "kds" },
  { href: "/admin", label: "Dashboard", sub: "Ringkasan penjualan, KPI & stok kritis", kind: "Admin", anyPermissions: ["report.view"], requiredFeature: "reports" },
  { href: "/admin/menu", label: "Menu", sub: "Produk, varian, grup add-on & status habis", kind: "Admin", anyPermissions: ["menu.manage"] },
  { href: "/admin/tables", label: "Meja", sub: "Area, denah meja, pindah & gabung", kind: "Admin", anyPermissions: ["table.manage"] },
  { href: "/admin/stock", label: "Stok & HPP", sub: "Bahan baku fleksibel, mutasi, BOM & margin", kind: "Admin", anyPermissions: ["stock.view", "stock.adjust"], requiredFeature: "stock" },
  { href: "/admin/shifts", label: "Shift", sub: "Riwayat buka/tutup shift & Z-Report", kind: "Admin", anyPermissions: ["report.view"], requiredFeature: "reports" },
  { href: "/admin/reports", label: "Laporan", sub: "Laporan harian, metode bayar & ekspor CSV", kind: "Admin", anyPermissions: ["report.view"], requiredFeature: "reports" },
  { href: "/admin/rbac", label: "RBAC & Staf", sub: "Role kustom, matriks permission & akun staf", kind: "Admin", anyPermissions: ["role.manage", "user.manage"] },
  { href: "/admin/digital-menu", label: "Menu Digital", sub: "Landing page publik tumpu.biz.id/p/nama-cafe & SEO Google", kind: "Admin", anyPermissions: ["settings.manage"], requiredFeature: "digitalMenu" },
  { href: "/admin/outlets", label: "Outlet & Paket", sub: "Multi-outlet, kuota staf & upgrade Pro", kind: "Admin", anyPermissions: ["settings.manage"] },
  { href: "/admin/settings", label: "Pengaturan", sub: "PB1 10%, Service 5%, tema & audit log", kind: "Admin", anyPermissions: ["settings.manage"] },
];

export const ADMIN_ROUTES = APP_ROUTES.filter((r) => r.kind === "Admin");

export function hasAnyPerm(hasPermission: (p: string) => boolean, perms: string[]): boolean {
  return perms.some((p) => hasPermission(p));
}

export function isRouteAllowed(
  rule: RouteRule,
  hasPermission: (p: string) => boolean,
  plan?: string | null,
): boolean {
  if (!hasAnyPerm(hasPermission, rule.anyPermissions)) return false;
  if (rule.requiredFeature && !hasPlanFeature(plan ?? "PRO", rule.requiredFeature)) {
    return false;
  }
  return true;
}

export function canAccessPath(
  pathname: string,
  hasPermission: (p: string) => boolean,
  plan?: string | null,
): boolean {
  const sorted = [...APP_ROUTES].sort((a, b) => b.href.length - a.href.length);
  const match = sorted.find((r) => pathname === r.href || (r.href !== "/admin" && pathname.startsWith(`${r.href}/`)));
  if (!match) return true;
  return isRouteAllowed(match, hasPermission, plan);
}

export function getFirstAdminPath(hasPermission: (p: string) => boolean, plan?: string | null): string | null {
  const first = ADMIN_ROUTES.find((r) => isRouteAllowed(r, hasPermission, plan));
  return first ? first.href : null;
}

export function getDefaultHomePath(hasPermission: (p: string) => boolean, plan?: string | null): string {
  // Paket FREE langsung diarahkan ke Kasir POS
  if (plan === "FREE" && hasPermission("pos.access")) return "/pos";
  const firstAdmin = getFirstAdminPath(hasPermission, plan);
  if (firstAdmin) return firstAdmin;
  if (hasPermission("pos.access")) return "/pos";
  if (hasPermission("kds.view") && hasPlanFeature(plan ?? "PRO", "kds")) return "/kds";
  return "/login";
}
