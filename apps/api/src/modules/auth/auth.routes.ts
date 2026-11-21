import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { loginSchema, pinLoginSchema, PLAN_POLICIES, refreshSchema, registerSchema } from "@pos/shared";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { getLiveUserAuth, invalidateRbacCache } from "../../lib/rbac-cache.js";
import { writeAuditLog } from "../../lib/audit.js";
import { AppError } from "../../middleware/error.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";

export const authRouter = Router();

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "outlet"}-${crypto.randomBytes(3).toString("hex")}`;
}

export async function issueTokensForUser(userId: number) {
  invalidateRbacCache(userId);
  const authUser = await getLiveUserAuth(userId);
  if (!authUser) {
    throw new AppError(401, "USER_INACTIVE", "Akun tidak aktif");
  }

  const accessToken = jwt.sign(authUser, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions["expiresIn"],
  });

  const rawRefresh = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 86400_000);
  await prisma.refreshToken.create({
    data: {
      userId: authUser.id,
      tokenHash: hashToken(rawRefresh),
      expiresAt,
    },
  });

  return { accessToken, refreshToken: rawRefresh, user: authUser };
}

/**
 * Registrasi Owner baru (Multi-Tenant SaaS).
 * Otomatis membuat Tenant paket FREE (1 Outlet, total 3 akun, khusus POS).
 */
authRouter.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { businessName, outletName, ownerName, email, password, pin } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      throw new AppError(409, "EMAIL_EXISTS", "Email sudah terdaftar. Silakan login.");
    }

    const ownerRole = await prisma.role.findUnique({ where: { code: "OWNER" } });
    if (!ownerRole) {
      throw new AppError(500, "SEED_MISSING", "Role OWNER belum tersedia di database");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const pinCode = pin || "1111";
    const pinHash = await bcrypt.hash(pinCode, 10);
    const outletCode = `KSA-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const freePolicy = PLAN_POLICIES.FREE;

    const created = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: businessName.trim(),
          slug: slugify(businessName),
          plan: "FREE",
          maxOutlets: freePolicy.maxOutlets,
          maxUsers: freePolicy.maxUsers,
        },
      });

      const outlet = await tx.outlet.create({
        data: {
          tenantId: tenant.id,
          code: outletCode,
          name: (outletName || `${businessName.trim()} — Cabang Utama`).trim(),
          timezone: "Asia/Jakarta",
        },
      });

      // Default category & station agar kasir bisa langsung pakai
      await tx.station.createMany({
        data: [
          { outletId: outlet.id, code: "BAR", name: "Bar & Minuman", tone: "iris", slaMins: 6 },
          { outletId: outlet.id, code: "KITCHEN", name: "Dapur", tone: "coral", slaMins: 12 },
        ],
      });
      await tx.category.create({
        data: { outletId: outlet.id, name: "Menu Utama", tone: "iris", sortOrder: 1 },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          outletId: outlet.id,
          roleId: ownerRole.id,
          name: ownerName.trim(),
          email: normalizedEmail,
          passwordHash,
          pinHash,
          pinCode,
        },
      });

      return { tenant, outlet, user };
    });

    const result = await issueTokensForUser(created.user.id);
    await writeAuditLog({
      outletId: created.outlet.id,
      userId: created.user.id,
      action: "TENANT_REGISTER",
      entityType: "Tenant",
      entityId: created.tenant.id,
      afterValue: { plan: "FREE", outletCode },
      ipAddress: req.ip,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 86400_000,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || user.deletedAt || !user.isActive) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email atau password salah");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email atau password salah");
    }

    const result = await issueTokensForUser(user.id);
    await writeAuditLog({
      outletId: user.outletId,
      userId: user.id,
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
      ipAddress: req.ip,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 86400_000,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/pin-login", validateBody(pinLoginSchema), async (req, res, next) => {
  try {
    const { pin, outletId, outletCode } = req.body;

    let resolvedOutletId = outletId;
    if (!resolvedOutletId && outletCode) {
      const outlet = await prisma.outlet.findUnique({ where: { code: outletCode.trim().toUpperCase() } });
      if (!outlet) {
        throw new AppError(404, "OUTLET_NOT_FOUND", `Kode outlet ${outletCode} tidak ditemukan`);
      }
      resolvedOutletId = outlet.id;
    }

    const candidates = await prisma.user.findMany({
      where: {
        ...(resolvedOutletId ? { outletId: resolvedOutletId } : {}),
        pinCode: pin,
        isActive: true,
        deletedAt: null,
      },
    });

    let matched = null;
    for (const u of candidates) {
      if (u.pinHash && (await bcrypt.compare(pin, u.pinHash))) {
        matched = u;
        break;
      }
    }
    if (!matched) {
      throw new AppError(401, "INVALID_PIN", "PIN tidak ditemukan untuk outlet ini");
    }

    const result = await issueTokensForUser(matched.id);
    await writeAuditLog({
      outletId: matched.outletId,
      userId: matched.id,
      action: "AUTH_PIN_LOGIN",
      entityType: "User",
      entityId: matched.id,
      ipAddress: req.ip,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 86400_000,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/refresh", validateBody(refreshSchema), async (req, res, next) => {
  try {
    const raw = req.body.refreshToken ?? req.cookies?.refreshToken;
    if (!raw) throw new AppError(401, "NO_REFRESH_TOKEN", "Refresh token tidak ditemukan");

    const hashed = hashToken(raw);
    const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: hashed } });
    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token tidak valid atau kadaluarsa");
    }

    await prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    const result = await issueTokensForUser(existing.userId);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 86400_000,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", async (req, res, next) => {
  try {
    const raw = req.body?.refreshToken ?? req.cookies?.refreshToken;
    if (raw) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(raw) },
        data: { revokedAt: new Date() },
      });
    }
    res.clearCookie("refreshToken");
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
