export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

export type PlanFeature =
  | "pos"
  | "kds"
  | "stock"
  | "reports"
  | "rbacCustom"
  | "multiOutlet";

export interface PlanPolicy {
  tier: PlanTier;
  label: string;
  priceMonthly: number;
  maxOutlets: number;
  maxUsers: number; // total akun aktif (Owner + Staf)
  features: Record<PlanFeature, boolean>;
}

export const PLAN_POLICIES: Record<PlanTier, PlanPolicy> = {
  FREE: {
    tier: "FREE",
    label: "Starter (Gratis)",
    priceMonthly: 0,
    maxOutlets: 1,
    maxUsers: 3, // 1 Owner + 2 Staf
    features: {
      pos: true,
      kds: false,
      stock: false,
      reports: false,
      rbacCustom: false,
      multiOutlet: false,
    },
  },
  PRO: {
    tier: "PRO",
    label: "Kassa Pro",
    priceMonthly: 49_000,
    maxOutlets: 20,
    maxUsers: 200,
    features: {
      pos: true,
      kds: true,
      stock: true,
      reports: true,
      rbacCustom: true,
      multiOutlet: true,
    },
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    label: "Enterprise",
    priceMonthly: 0,
    maxOutlets: 999,
    maxUsers: 9999,
    features: {
      pos: true,
      kds: true,
      stock: true,
      reports: true,
      rbacCustom: true,
      multiOutlet: true,
    },
  },
};

export function normalizePlanTier(plan?: string | null): PlanTier {
  if (plan === "PRO" || plan === "ENTERPRISE") return plan;
  return "FREE";
}

export function hasPlanFeature(plan: string | null | undefined, feature: PlanFeature): boolean {
  return PLAN_POLICIES[normalizePlanTier(plan)].features[feature];
}
