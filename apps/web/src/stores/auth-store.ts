import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hasPlanFeature, type PlanFeature, type PlanTier } from "@pos/shared";

export interface OutletSummary {
  id: number;
  code: string;
  name: string;
}

export interface UserSession {
  id: number;
  tenantId?: number;
  tenantName?: string;
  plan?: PlanTier;
  maxOutlets?: number;
  maxUsers?: number;
  outletId: number;
  outletCode?: string;
  outletName?: string;
  outlets?: OutletSummary[];
  name: string;
  email: string;
  hasPin?: boolean;
  roleCode: string;
  roleName: string;
  permissions: string[];
}

interface AuthState {
  user: UserSession | null;
  accessToken: string | null;
  setSession: (user: UserSession, accessToken: string) => void;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  hasFeature: (feature: PlanFeature) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setSession: (user, accessToken) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
      hasPermission: (perm) => {
        const u = get().user;
        if (!u) return false;
        return u.roleCode === "OWNER" || u.permissions.includes(perm);
      },
      hasFeature: (feature) => {
        const u = get().user;
        if (!u) return false;
        return hasPlanFeature(u.plan ?? "FREE", feature);
      },
    }),
    { name: "cadra_pos_auth" },
  ),
);
