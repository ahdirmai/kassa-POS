import { normalizePlanTier } from "@pos/shared";
import { prisma } from "./prisma.js";
import type { AuthUser } from "../middleware/auth.js";

interface CacheEntry {
  user: AuthUser;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000;
const userPermCache = new Map<number, CacheEntry>();

export function invalidateRbacCache(userId?: number) {
  if (userId !== undefined) {
    userPermCache.delete(userId);
  } else {
    userPermCache.clear();
  }
}

export async function getLiveUserAuth(userId: number): Promise<AuthUser | null> {
  const cached = userPermCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenant: {
        include: {
          outlets: {
            where: { isActive: true },
            orderBy: { id: "asc" },
            select: { id: true, code: true, name: true },
          },
        },
      },
      outlet: { select: { id: true, code: true, name: true } },
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!user || !user.isActive || user.deletedAt || !user.tenant.isActive) {
    userPermCache.delete(userId);
    return null;
  }

  const live: AuthUser = {
    id: user.id,
    tenantId: user.tenantId,
    tenantName: user.tenant.name,
    plan: normalizePlanTier(user.tenant.plan),
    maxOutlets: user.tenant.maxOutlets,
    maxUsers: user.tenant.maxUsers,
    outletId: user.outletId,
    outletCode: user.outlet.code,
    outletName: user.outlet.name,
    outlets: user.role.code === "OWNER" ? user.tenant.outlets : [user.outlet],
    name: user.name,
    email: user.email,
    roleCode: user.role.code,
    roleName: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.code),
  };

  userPermCache.set(userId, { user: live, expiresAt: Date.now() + CACHE_TTL_MS });
  return live;
}
