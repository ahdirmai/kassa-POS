import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "./error.js";

export type PlatformRole = "SUPERADMIN" | "OPS" | "MARKETING" | "SUPPORT";

export interface PlatformAuthAdmin {
  id: number;
  name: string;
  email: string;
  role: PlatformRole;
}

export const PLATFORM_COOKIE_NAME = "tumpu_bo_token";

declare global {
  namespace Express {
    interface Request {
      platformAdmin?: PlatformAuthAdmin;
    }
  }
}

export async function requirePlatformAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const cookieToken = req.cookies?.[PLATFORM_COOKIE_NAME] as string | undefined;
  const token = bearerToken || cookieToken;

  if (!token) {
    return next(new AppError(401, "PLATFORM_UNAUTHORIZED", "Sesi Back Office tidak ditemukan"));
  }

  try {
    const decoded = jwt.verify(token, env.PLATFORM_JWT_ACCESS_SECRET) as unknown as {
      sub: number;
      scope: string;
    };
    if (decoded.scope !== "platform_admin") {
      return next(new AppError(401, "PLATFORM_INVALID_TOKEN", "Token bukan milik Back Office"));
    }

    const admin = await prisma.platformAdmin.findUnique({
      where: { id: decoded.sub },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      return next(new AppError(401, "PLATFORM_ADMIN_INACTIVE", "Akun admin tidak aktif"));
    }

    req.platformAdmin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role as PlatformRole,
    };
    return next();
  } catch {
    return next(new AppError(401, "PLATFORM_TOKEN_EXPIRED", "Sesi Back Office berakhir, silakan login ulang"));
  }
}

export function requirePlatformRole(...allowedRoles: PlatformRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.platformAdmin) {
      return next(new AppError(401, "PLATFORM_UNAUTHORIZED", "Belum terautentikasi"));
    }
    if (req.platformAdmin.role === "SUPERADMIN" || allowedRoles.includes(req.platformAdmin.role)) {
      return next();
    }
    return next(new AppError(403, "PLATFORM_FORBIDDEN", "Tidak memiliki akses untuk tindakan ini"));
  };
}
