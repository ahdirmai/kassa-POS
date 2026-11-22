import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import {
  loginSchema,
  pinLoginSchema,
  PLAN_POLICIES,
  refreshSchema,
  registerSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from "@pos/shared";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { getLiveUserAuth, invalidateRbacCache } from "../../lib/rbac-cache.js";
import { writeAuditLog } from "../../lib/audit.js";
import { sendVerificationEmail } from "../../lib/mailer.js";
import { checkPinLockout, clearPinFailures, recordPinFailure } from "../../lib/pin-lockout.js";
import { AppError } from "../../middleware/error.js";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";

export const authRouter = Router();

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
const EMAIL_RESEND_COOLDOWN_MS = 60 * 1000; // 60 detik
// Precomputed bcrypt hash (cost 10) untuk dummy compare agar timing respons pin-login seragam
const DUMMY_PIN_HASH = bcrypt.hashSync("000000", 10);

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function createAndSendEmailVerification(params: {
  userId: number;
  email: string;
  ownerName: string;
  businessName: string;
}) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFY_TTL_MS);

  await prisma.emailVerificationToken.create({
    data: {
      userId: params.userId,
      tokenHash,
      expiresAt,
    },
  });

  const baseUrl = env.APP_WEB_URL.replace(/\/$/, "");
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;

  const mailResult = await sendVerificationEmail({
    to: params.email,
    ownerName: params.ownerName,
    businessName: params.businessName,
    verifyUrl,
    idempotencyKey: `verify-email/${tokenHash.slice(0, 24)}`,
  });

  return { verifyUrl, provider: mailResult.provider, messageId: mailResult.messageId };
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

    const ownerRole = await prisma.role.findFirst({ where: { code: "OWNER", tenantId: null } });
    if (!ownerRole) {
      throw new AppError(500, "SEED_MISSING", "Role OWNER belum tersedia di database");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const pinCode = pin?.trim() || null;
    const pinHash = pinCode ? await bcrypt.hash(pinCode, 10) : null;
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

    const verification = await createAndSendEmailVerification({
      userId: created.user.id,
      email: normalizedEmail,
      ownerName: ownerName.trim(),
      businessName: businessName.trim(),
    });

    await writeAuditLog({
      outletId: created.outlet.id,
      userId: created.user.id,
      action: "TENANT_REGISTER",
      entityType: "Tenant",
      entityId: created.tenant.id,
      afterValue: { plan: "FREE", outletCode, emailProvider: verification.provider },
      ipAddress: req.ip,
    });

    res.status(201).json({
      requiresEmailVerification: true,
      email: normalizedEmail,
      outletCode,
      message: "Pendaftaran berhasil! Silakan cek kotak masuk email Anda untuk konfirmasi sebelum login.",
      ...(process.env.NODE_ENV !== "production" && verification.provider === "console"
        ? { devVerifyUrl: verification.verifyUrl }
        : {}),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Konfirmasi email dengan token dari link email → otomatis login agar langsung lanjut Onboarding.
 */
authRouter.post("/verify-email", validateBody(verifyEmailSchema), async (req, res, next) => {
  try {
    const tokenHash = hashToken(req.body.token);
    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw new AppError(
        400,
        "INVALID_VERIFICATION_TOKEN",
        "Tautan verifikasi tidak valid atau sudah kedaluwarsa. Silakan minta kirim ulang email konfirmasi.",
      );
    }

    if (!record.user.isActive || record.user.deletedAt) {
      throw new AppError(403, "USER_INACTIVE", "Akun tidak aktif");
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: record.user.emailVerifiedAt ?? now },
      }),
    ]);

    const result = await issueTokensForUser(record.userId);
    await writeAuditLog({
      outletId: record.user.outletId,
      userId: record.userId,
      action: "AUTH_EMAIL_VERIFIED",
      entityType: "User",
      entityId: record.userId,
      ipAddress: req.ip,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 86400_000,
    });
    res.json({
      verified: true,
      message: "Email berhasil dikonfirmasi!",
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Kirim ulang email konfirmasi (dengan cooldown 60 detik agar tidak disalahgunakan).
 */
authRouter.post("/resend-verification", validateBody(resendVerificationSchema), async (req, res, next) => {
  try {
    const normalizedEmail = req.body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { tenant: { select: { name: true } } },
    });

    // Jangan bocorkan keberadaan email jika tidak ditemukan
    if (!user || user.deletedAt || !user.isActive) {
      return res.json({
        ok: true,
        message: "Jika email terdaftar dan belum terverifikasi, tautan konfirmasi baru telah dikirim.",
      });
    }

    if (user.emailVerifiedAt) {
      return res.json({
        ok: true,
        alreadyVerified: true,
        message: "Email Anda sudah terverifikasi. Silakan langsung login.",
      });
    }

    const latest = await prisma.emailVerificationToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (latest && Date.now() - latest.createdAt.getTime() < EMAIL_RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((EMAIL_RESEND_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000);
      throw new AppError(
        429,
        "RESEND_COOLDOWN",
        `Mohon tunggu ${waitSec} detik sebelum mengirim ulang email konfirmasi.`,
      );
    }

    // Invalidasi token lama yang belum dipakai
    await prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const verification = await createAndSendEmailVerification({
      userId: user.id,
      email: normalizedEmail,
      ownerName: user.name,
      businessName: user.tenant.name,
    });

    res.json({
      ok: true,
      message: "Email konfirmasi baru telah dikirim. Silakan cek kotak masuk atau folder spam Anda.",
      ...(process.env.NODE_ENV !== "production" && verification.provider === "console"
        ? { devVerifyUrl: verification.verifyUrl }
        : {}),
    });
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
    if (!user.emailVerifiedAt) {
      throw new AppError(
        403,
        "EMAIL_NOT_VERIFIED",
        "Email Anda belum dikonfirmasi. Silakan cek kotak masuk atau kirim ulang email verifikasi.",
      );
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
      secure: process.env.NODE_ENV === "production",
      maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 86400_000,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/pin-login", validateBody(pinLoginSchema), async (req, res, next) => {
  try {
    const { pin, outletCode } = req.body;
    const normalizedOutletCode = outletCode.trim().toUpperCase();

    // KSA-02: Cek lockout berbasis Redis per outletCode (independen dari IP)
    const lockState = await checkPinLockout(normalizedOutletCode);
    if (lockState.locked) {
      req.log?.warn(
        { outletCode: normalizedOutletCode, retryAfterSec: lockState.retryAfterSec, ip: req.ip },
        "PIN login blocked: outlet locked out",
      );
      res.setHeader("Retry-After", String(lockState.retryAfterSec));
      return res.status(429).json({
        code: "PIN_LOCKED",
        message: "Terlalu banyak percobaan PIN salah. Silakan coba lagi nanti.",
        retryAfterSec: lockState.retryAfterSec,
      });
    }

    const outlet = await prisma.outlet.findUnique({
      where: { code: normalizedOutletCode },
    });

    let matched = null;
    if (!outlet || !outlet.isActive) {
      // KSA-03: Dummy hash compare agar waktu respons seragam dan mencegah outlet enumeration
      await bcrypt.compare(pin, DUMMY_PIN_HASH);
    } else {
      const candidates = await prisma.user.findMany({
        where: {
          outletId: outlet.id,
          tenantId: outlet.tenantId,
          pinCode: pin,
          isActive: true,
          deletedAt: null,
        },
      });

      if (candidates.length === 0) {
        await bcrypt.compare(pin, DUMMY_PIN_HASH);
      } else {
        for (const u of candidates) {
          if (u.pinHash && (await bcrypt.compare(pin, u.pinHash))) {
            matched = u;
            break;
          }
        }
      }
    }

    if (!matched) {
      const failure = await recordPinFailure(normalizedOutletCode);
      req.log?.warn(
        {
          outletCode: normalizedOutletCode,
          outletId: outlet?.id ?? null,
          attempts: failure.attempts,
          locked: failure.locked,
          retryAfterSec: failure.retryAfterSec,
          ip: req.ip,
        },
        failure.locked ? "PIN login locked out after consecutive failures" : "PIN login failed",
      );

      if (outlet) {
        await writeAuditLog({
          outletId: outlet.id,
          userId: null,
          action: failure.locked ? "AUTH_PIN_LOCKOUT" : "AUTH_PIN_FAILED",
          entityType: "Outlet",
          entityId: outlet.id,
          afterValue: {
            outletCode: normalizedOutletCode,
            attempts: failure.attempts,
            locked: failure.locked,
            retryAfterSec: failure.retryAfterSec,
          },
          ipAddress: req.ip,
        });
      }

      if (failure.locked) {
        res.setHeader("Retry-After", String(failure.retryAfterSec));
        return res.status(429).json({
          code: "PIN_LOCKED",
          message: "Terlalu banyak percobaan PIN salah. Silakan coba lagi nanti.",
          retryAfterSec: failure.retryAfterSec,
        });
      }

      // KSA-03: Respons seragam untuk outlet tidak ditemukan maupun PIN salah
      throw new AppError(401, "INVALID_CREDENTIALS", "Kode outlet atau PIN salah");
    }

    await clearPinFailures(normalizedOutletCode);

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
      secure: process.env.NODE_ENV === "production",
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
      secure: process.env.NODE_ENV === "production",
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
