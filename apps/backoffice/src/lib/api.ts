export const ADMIN_API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:4001/api/v1";

export const LANDING_ADMIN_URL =
  process.env.NEXT_PUBLIC_LANDING_URL || "http://localhost:3005";

const TOKEN_KEY = "tumpu_bo_access_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function boFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${ADMIN_API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.message || body?.message || `Request gagal (${res.status})`,
      body?.error?.code,
    );
  }
  return body as T;
}

export function formatRupiah(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface PlatformAdmin {
  id: number;
  name: string;
  email: string;
  role: "SUPERADMIN" | "OPS" | "MARKETING" | "SUPPORT";
}

export interface TenantListItem {
  id: number;
  name: string;
  slug: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  effectivePlan: "FREE" | "PRO" | "ENTERPRISE";
  isPlanExpired: boolean;
  planExpiresAt: string | null;
  maxOutlets: number;
  maxUsers: number;
  isActive: boolean;
  createdAt: string;
  owner: { id: number; name: string; email: string; isActive: boolean } | null;
  counts: { outlets: number; users: number; subscriptionInvoices: number };
}

export interface SubscriptionInvoiceItem {
  id: number;
  invoiceNo: string;
  tenantId: number;
  plan: "PRO" | "ENTERPRISE";
  billingCycle: "MONTHLY" | "YEARLY" | "CUSTOM";
  durationDays: number;
  amount: number;
  status: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
  paymentMethod: string;
  referenceNo: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  tenant?: {
    id: number;
    name: string;
    slug: string;
    plan?: string;
    planExpiresAt?: string | null;
  };
  approvedBy?: { id: number; name: string } | null;
}

export interface AuditLogItem {
  id: number;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  ipAddress: string | null;
  createdAt: string;
  admin: { id: number; name: string; email: string; role: string } | null;
}
