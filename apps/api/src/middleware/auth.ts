import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { hasPlanFeature, type PlanFeature, type PlanTier } from "@pos/shared";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { getLiveUserAuth } from "../lib/rbac-cache.js";
import { AppError } from "./error.js";

export interface AuthOutletSummary {
  id: number;
  code: string;
  name: string;
}

export interface AuthUser {
  id: number;
  tenantId: number;
  tenantName: string;
  plan: PlanTier;
  maxOutlets: number;
  maxUsers: number;
  outletId: number;
  outletCode: string;
  outletName: string;
  outlets: AuthOutletSummary[];
  name: string;
  email: string;
  emailVerified: boolean;
  hasPin: boolean;
  roleCode: string;
  roleName: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "UNAUTHORIZED", "Token akses tidak ditemukan"));
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: number };
    const live = await getLiveUserAuth(decoded.id);
    if (!live) {
      return next(new AppError(401, "USER_INACTIVE", "Akun tidak aktif atau telah dinonaktifkan"));
    }
    req.user = live;
    return next();
  } catch {
    return next(new AppError(401, "TOKEN_EXPIRED", "Sesi telah berakhir, silakan login ulang"));
  }
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Belum terautentikasi"));
    }
    if (req.user.roleCode === "OWNER" || req.user.permissions.includes(permission)) {
      return next();
    }
    return next(new AppError(403, "FORBIDDEN", `Tidak memiliki izin: ${permission}`));
  };
}

export function requireOwner(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError(401, "UNAUTHORIZED", "Belum terautentikasi"));
  }
  if (req.user.roleCode !== "OWNER") {
    return next(new AppError(403, "FORBIDDEN", "Khusus Owner"));
  }
  return next();
}

const FEATURE_LABELS: Record<PlanFeature, string> = {
  pos: "Kasir POS",
  kds: "Layar Dapur (KDS)",
  stock: "Stok Bahan Baku & HPP",
  reports: "Dashboard & Laporan",
  rbacCustom: "Role RBAC Kustom",
  multiOutlet: "Multi-Outlet",
  digitalMenu: "Landing Page & Menu Digital",
};

/**
 * Enforcement Paket Langganan (FREE vs PRO):
 * Paket FREE hanya bisa mengakses POS (1 outlet, total 3 akun).
 */
export function requireFeature(feature: PlanFeature) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "UNAUTHORIZED", "Belum terautentikasi"));
    }
    if (hasPlanFeature(req.user.plan, feature)) {
      return next();
    }
    return next(
      new AppError(
        403,
        "PLAN_UPGRADE_REQUIRED",
        `Fitur ${FEATURE_LABELS[feature]} khusus paket Tumpu Pro (Rp49.000/bulan). Paket Free hanya mendukung Kasir POS.`,
      ),
    );
  };
}

export async function verifyManagerPin(pin: string, outletId = 1, requiredPermission = "approval.pin") {
  const candidates = await prisma.user.findMany({
    where: {
      outletId,
      isActive: true,
      deletedAt: null,
      pinCode: pin,
    },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  for (const user of candidates) {
    const perms = user.role.permissions.map((rp) => rp.permission.code);
    const allowed = user.role.code === "OWNER" || perms.includes(requiredPermission) || perms.includes("approval.pin");
    if (!allowed) continue;
    if (user.pinHash && (await bcrypt.compare(pin, user.pinHash))) {
      return user;
    }
  }
  throw new AppError(403, "INVALID_APPROVAL_PIN", "PIN tidak valid atau role tidak memiliki izin approval.pin");
}
