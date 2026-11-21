import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { z } from "zod";
import { PLAN_POLICIES, normalizePlanTier } from "@pos/shared";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import {
  PLATFORM_COOKIE_NAME,
  requirePlatformAuth,
  requirePlatformRole,
} from "../../middleware/platform-auth.js";
import { validateBody } from "../../middleware/validate.js";

export const backofficeRouter = Router();

async function logPlatformAction(params: {
  adminId: number;
  action: string;
  targetType: string;
  targetId?: string | number;
  summary: string;
  metadata?: unknown;
  ipAddress?: string;
}) {
  await prisma.platformAuditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId !== undefined ? String(params.targetId) : null,
      summary: params.summary,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress ?? null,
    },
  });
}

function serializeBigInt<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === "bigint" ? Number(value) : value)),
  ) as T;
}

// ============================================================================
// AUTH (PLATFORM ADMIN)
// ============================================================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

backofficeRouter.post("/auth/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body as z.infer<typeof loginSchema>;

    const admin = await prisma.platformAdmin.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email atau password Back Office salah");
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email atau password Back Office salah");
    }

    await prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role, scope: "platform_admin" },
      env.PLATFORM_JWT_ACCESS_SECRET,
      { expiresIn: env.PLATFORM_JWT_EXPIRES as jwt.SignOptions["expiresIn"] },
    );

    res.cookie(PLATFORM_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

backofficeRouter.post("/auth/logout", (_req, res) => {
  res.clearCookie(PLATFORM_COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

backofficeRouter.get("/auth/me", requirePlatformAuth, (req, res) => {
  res.json({ admin: req.platformAdmin });
});

// ============================================================================
// OVERVIEW KPI
// ============================================================================

backofficeRouter.get("/overview", requirePlatformAuth, async (_req, res, next) => {
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      tenants,
      pendingInvoicesCount,
      paidInvoices30d,
      recentAuditLogs,
      totalOutlets,
      totalUsers,
    ] = await Promise.all([
      prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { outlets: true, users: true } },
        },
      }),
      prisma.subscriptionInvoice.count({ where: { status: "PENDING" } }),
      prisma.subscriptionInvoice.aggregate({
        where: { status: "PAID", paidAt: { gte: days30Ago } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.platformAuditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { admin: { select: { id: true, name: true, email: true, role: true } } },
      }),
      prisma.outlet.count(),
      prisma.user.count({ where: { deletedAt: null } }),
    ]);

    const planBreakdown = { FREE: 0, PRO: 0, ENTERPRISE: 0 };
    let activeTenants = 0;
    let suspendedTenants = 0;
    let estimatedMrr = 0;
    const expiringTenants: typeof tenants = [];

    for (const t of tenants) {
      if (t.isActive) activeTenants++;
      else suspendedTenants++;

      const tier = normalizePlanTier(t.plan);
      const isExpired = tier !== "FREE" && t.planExpiresAt !== null && t.planExpiresAt < now;
      const effectiveTier = isExpired ? "FREE" : tier;
      planBreakdown[effectiveTier]++;

      if (t.isActive && !isExpired) {
        estimatedMrr += PLAN_POLICIES[effectiveTier].priceMonthly;
      }

      if (
        tier !== "FREE" &&
        t.planExpiresAt !== null &&
        t.planExpiresAt >= now &&
        t.planExpiresAt <= in7Days
      ) {
        expiringTenants.push(t);
      }
    }

    res.json(
      serializeBigInt({
        kpis: {
          totalTenants: tenants.length,
          activeTenants,
          suspendedTenants,
          totalOutlets,
          totalUsers,
          planBreakdown,
          estimatedMrr,
          expiringSoonCount: expiringTenants.length,
          pendingInvoicesCount,
          paidRevenue30d: paidInvoices30d._sum.amount ?? 0n,
          paidInvoices30dCount: paidInvoices30d._count._all,
        },
        recentTenants: tenants.slice(0, 6),
        expiringTenants,
        recentAuditLogs,
      }),
    );
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// ACCOUNT & TENANT MANAGEMENT
// ============================================================================

backofficeRouter.get("/tenants", requirePlatformAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const plan = String(req.query.plan ?? "").trim().toUpperCase();
    const status = String(req.query.status ?? "").trim().toLowerCase();

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { slug: { contains: q } },
        { users: { some: { email: { contains: q } } } },
      ];
    }
    if (plan === "FREE" || plan === "PRO" || plan === "ENTERPRISE") {
      where.plan = plan;
    }
    if (status === "active") where.isActive = true;
    if (status === "suspended") where.isActive = false;

    const tenants = await prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            outlets: true,
            users: { where: { deletedAt: null } },
            subscriptionInvoices: true,
          },
        },
        users: {
          where: { deletedAt: null, role: { code: "OWNER" } },
          take: 1,
          select: { id: true, name: true, email: true, isActive: true },
        },
      },
    });

    const now = new Date();
    const items = tenants.map((t) => {
      const tier = normalizePlanTier(t.plan);
      const isExpired = tier !== "FREE" && t.planExpiresAt !== null && t.planExpiresAt < now;
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: tier,
        effectivePlan: isExpired ? "FREE" : tier,
        isPlanExpired: isExpired,
        planExpiresAt: t.planExpiresAt,
        maxOutlets: t.maxOutlets,
        maxUsers: t.maxUsers,
        isActive: t.isActive,
        createdAt: t.createdAt,
        owner: t.users[0] ?? null,
        counts: t._count,
      };
    });

    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
});

backofficeRouter.get("/tenants/:id", requirePlatformAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new AppError(400, "INVALID_ID", "ID tenant tidak valid");

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        outlets: {
          orderBy: { id: "asc" },
          include: { _count: { select: { orders: true, users: true } } },
        },
        users: {
          where: { deletedAt: null },
          orderBy: { id: "asc" },
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            outletId: true,
            createdAt: true,
            role: { select: { code: true, name: true } },
          },
        },
        subscriptionInvoices: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { approvedBy: { select: { id: true, name: true } } },
        },
      },
    });

    if (!tenant) throw new AppError(404, "NOT_FOUND", "Tenant tidak ditemukan");

    const outletIds = tenant.outlets.map((o) => o.id);
    const days30Ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orderStats = outletIds.length
      ? await prisma.order.aggregate({
          where: {
            outletId: { in: outletIds },
            status: { in: ["PAID", "CLOSED"] },
            createdAt: { gte: days30Ago },
          },
          _count: { _all: true },
          _sum: { grandTotal: true },
        })
      : { _count: { _all: 0 }, _sum: { grandTotal: 0n } };

    res.json(
      serializeBigInt({
        tenant,
        stats30d: {
          paidOrders: orderStats._count._all,
          gmv: orderStats._sum.grandTotal ?? 0n,
        },
      }),
    );
  } catch (err) {
    next(err);
  }
});

const statusPatchSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().max(200).optional(),
});

backofficeRouter.patch(
  "/tenants/:id/status",
  requirePlatformAuth,
  requirePlatformRole("OPS"),
  validateBody(statusPatchSchema),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { isActive, reason } = req.body as z.infer<typeof statusPatchSchema>;

      const tenant = await prisma.tenant.findUnique({ where: { id } });
      if (!tenant) throw new AppError(404, "NOT_FOUND", "Tenant tidak ditemukan");

      const updated = await prisma.tenant.update({
        where: { id },
        data: { isActive },
      });

      // RBAC cache di app-api memiliki TTL 10 detik sehingga perubahan segera efektif

      await logPlatformAction({
        adminId: req.platformAdmin!.id,
        action: isActive ? "TENANT_REACTIVATE" : "TENANT_SUSPEND",
        targetType: "TENANT",
        targetId: id,
        summary: `${isActive ? "Mengaktifkan kembali" : "Menangguhkan (suspend)"} tenant ${tenant.name}`,
        metadata: { previousIsActive: tenant.isActive, isActive, reason },
        ipAddress: req.ip,
      });

      res.json({ tenant: updated });
    } catch (err) {
      next(err);
    }
  },
);

const subscriptionPatchSchema = z.object({
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]),
  planExpiresAt: z.string().datetime().nullable().optional(),
  maxOutlets: z.number().int().min(1).max(9999).optional(),
  maxUsers: z.number().int().min(1).max(99999).optional(),
  reason: z.string().max(200).optional(),
});

backofficeRouter.patch(
  "/tenants/:id/subscription",
  requirePlatformAuth,
  requirePlatformRole("OPS"),
  validateBody(subscriptionPatchSchema),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const body = req.body as z.infer<typeof subscriptionPatchSchema>;

      const tenant = await prisma.tenant.findUnique({ where: { id } });
      if (!tenant) throw new AppError(404, "NOT_FOUND", "Tenant tidak ditemukan");

      const policy = PLAN_POLICIES[body.plan];
      const nextExpiresAt =
        body.plan === "FREE"
          ? null
          : body.planExpiresAt !== undefined
            ? body.planExpiresAt
              ? new Date(body.planExpiresAt)
              : null
            : tenant.planExpiresAt;

      const updated = await prisma.tenant.update({
        where: { id },
        data: {
          plan: body.plan,
          planExpiresAt: nextExpiresAt,
          maxOutlets: body.maxOutlets ?? policy.maxOutlets,
          maxUsers: body.maxUsers ?? policy.maxUsers,
        },
      });

      await logPlatformAction({
        adminId: req.platformAdmin!.id,
        action: "SUBSCRIPTION_UPDATE",
        targetType: "TENANT",
        targetId: id,
        summary: `Ubah paket ${tenant.name}: ${tenant.plan} → ${body.plan}`,
        metadata: {
          before: {
            plan: tenant.plan,
            planExpiresAt: tenant.planExpiresAt,
            maxOutlets: tenant.maxOutlets,
            maxUsers: tenant.maxUsers,
          },
          after: {
            plan: updated.plan,
            planExpiresAt: updated.planExpiresAt,
            maxOutlets: updated.maxOutlets,
            maxUsers: updated.maxUsers,
          },
          reason: body.reason,
        },
        ipAddress: req.ip,
      });

      res.json({ tenant: updated });
    } catch (err) {
      next(err);
    }
  },
);

const resetOwnerPasswordSchema = z.object({
  newPassword: z.string().min(8).max(72),
});

backofficeRouter.post(
  "/tenants/:id/reset-owner-password",
  requirePlatformAuth,
  requirePlatformRole("OPS", "SUPPORT"),
  validateBody(resetOwnerPasswordSchema),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { newPassword } = req.body as z.infer<typeof resetOwnerPasswordSchema>;

      const owner = await prisma.user.findFirst({
        where: { tenantId: id, deletedAt: null, role: { code: "OWNER" } },
        include: { tenant: { select: { name: true } } },
      });

      if (!owner) throw new AppError(404, "OWNER_NOT_FOUND", "Akun Owner tenant tidak ditemukan");

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.$transaction([
        prisma.user.update({ where: { id: owner.id }, data: { passwordHash } }),
        prisma.refreshToken.updateMany({
          where: { userId: owner.id, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      ]);

      await logPlatformAction({
        adminId: req.platformAdmin!.id,
        action: "OWNER_PASSWORD_RESET",
        targetType: "TENANT",
        targetId: id,
        summary: `Reset password Owner (${owner.email}) untuk tenant ${owner.tenant.name}`,
        ipAddress: req.ip,
      });

      res.json({ ok: true, ownerEmail: owner.email });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// SUBSCRIPTION INVOICES & BILLING
// ============================================================================

backofficeRouter.get("/invoices", requirePlatformAuth, async (req, res, next) => {
  try {
    const status = String(req.query.status ?? "").trim().toUpperCase();
    const q = String(req.query.q ?? "").trim();

    const where: Record<string, unknown> = {};
    if (["PENDING", "PAID", "CANCELLED", "REFUNDED"].includes(status)) {
      where.status = status;
    }
    if (q) {
      where.OR = [
        { invoiceNo: { contains: q } },
        { referenceNo: { contains: q } },
        { tenant: { name: { contains: q } } },
      ];
    }

    const invoices = await prisma.subscriptionInvoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        tenant: { select: { id: true, name: true, slug: true, plan: true, planExpiresAt: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    res.json(serializeBigInt({ items: invoices, total: invoices.length }));
  } catch (err) {
    next(err);
  }
});

const createInvoiceSchema = z.object({
  tenantId: z.number().int().positive(),
  plan: z.enum(["PRO", "ENTERPRISE"]),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "CUSTOM"]).default("MONTHLY"),
  durationDays: z.number().int().min(1).max(1095).default(30),
  amount: z.number().int().min(0),
  paymentMethod: z.enum(["MANUAL_TRANSFER", "MIDTRANS", "XENDIT", "COMP"]).default("MANUAL_TRANSFER"),
  referenceNo: z.string().max(120).optional(),
  notes: z.string().max(255).optional(),
  markAsPaid: z.boolean().default(false),
});

backofficeRouter.post(
  "/invoices",
  requirePlatformAuth,
  requirePlatformRole("OPS"),
  validateBody(createInvoiceSchema),
  async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createInvoiceSchema>;
      const tenant = await prisma.tenant.findUnique({ where: { id: body.tenantId } });
      if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant tidak ditemukan");

      const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randTag = crypto.randomBytes(2).toString("hex").toUpperCase();
      const invoiceNo = `INV-KSA-${dateTag}-${randTag}`;

      const now = new Date();
      const policy = PLAN_POLICIES[body.plan];

      const invoice = await prisma.$transaction(async (tx) => {
        const created = await tx.subscriptionInvoice.create({
          data: {
            invoiceNo,
            tenantId: body.tenantId,
            plan: body.plan,
            billingCycle: body.billingCycle,
            durationDays: body.durationDays,
            amount: BigInt(body.amount),
            status: body.markAsPaid ? "PAID" : "PENDING",
            paymentMethod: body.paymentMethod,
            referenceNo: body.referenceNo || null,
            notes: body.notes || null,
            paidAt: body.markAsPaid ? now : null,
            approvedById: body.markAsPaid ? req.platformAdmin!.id : null,
          },
          include: {
            tenant: { select: { id: true, name: true, slug: true } },
          },
        });

        if (body.markAsPaid) {
          const baseDate =
            tenant.planExpiresAt && tenant.planExpiresAt > now ? tenant.planExpiresAt : now;
          const nextExpiry = new Date(baseDate.getTime() + body.durationDays * 24 * 60 * 60 * 1000);
          await tx.tenant.update({
            where: { id: tenant.id },
            data: {
              plan: body.plan,
              planExpiresAt: nextExpiry,
              maxOutlets: Math.max(tenant.maxOutlets, policy.maxOutlets),
              maxUsers: Math.max(tenant.maxUsers, policy.maxUsers),
            },
          });
        }

        return created;
      });

      await logPlatformAction({
        adminId: req.platformAdmin!.id,
        action: body.markAsPaid ? "INVOICE_CREATE_AND_PAID" : "INVOICE_CREATE",
        targetType: "INVOICE",
        targetId: invoice.id,
        summary: `Buat invoice ${invoiceNo} (${body.plan}, Rp${body.amount.toLocaleString("id-ID")}) untuk ${tenant.name}`,
        metadata: body,
        ipAddress: req.ip,
      });

      res.status(201).json(serializeBigInt({ invoice }));
    } catch (err) {
      next(err);
    }
  },
);

const approveInvoiceSchema = z.object({
  referenceNo: z.string().max(120).optional(),
  notes: z.string().max(255).optional(),
});

backofficeRouter.post(
  "/invoices/:id/approve",
  requirePlatformAuth,
  requirePlatformRole("OPS"),
  validateBody(approveInvoiceSchema),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const body = req.body as z.infer<typeof approveInvoiceSchema>;

      const invoice = await prisma.subscriptionInvoice.findUnique({
        where: { id },
        include: { tenant: true },
      });
      if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice tidak ditemukan");
      if (invoice.status !== "PENDING") {
        throw new AppError(400, "INVALID_STATUS", `Invoice sudah berstatus ${invoice.status}`);
      }

      const now = new Date();
      const tier = normalizePlanTier(invoice.plan);
      const policy = PLAN_POLICIES[tier];
      const baseDate =
        invoice.tenant.planExpiresAt && invoice.tenant.planExpiresAt > now
          ? invoice.tenant.planExpiresAt
          : now;
      const nextExpiry = new Date(baseDate.getTime() + invoice.durationDays * 24 * 60 * 60 * 1000);

      const updated = await prisma.$transaction(async (tx) => {
        const inv = await tx.subscriptionInvoice.update({
          where: { id },
          data: {
            status: "PAID",
            paidAt: now,
            approvedById: req.platformAdmin!.id,
            referenceNo: body.referenceNo ?? invoice.referenceNo,
            notes: body.notes ?? invoice.notes,
          },
        });

        await tx.tenant.update({
          where: { id: invoice.tenantId },
          data: {
            plan: tier,
            planExpiresAt: nextExpiry,
            maxOutlets: Math.max(invoice.tenant.maxOutlets, policy.maxOutlets),
            maxUsers: Math.max(invoice.tenant.maxUsers, policy.maxUsers),
          },
        });

        return inv;
      });

      await logPlatformAction({
        adminId: req.platformAdmin!.id,
        action: "INVOICE_APPROVE",
        targetType: "INVOICE",
        targetId: id,
        summary: `Approve pembayaran ${invoice.invoiceNo} — ${invoice.tenant.name} aktif ${tier} s/d ${nextExpiry.toISOString().slice(0, 10)}`,
        metadata: { nextExpiry: nextExpiry.toISOString(), durationDays: invoice.durationDays },
        ipAddress: req.ip,
      });

      res.json(serializeBigInt({ invoice: updated, nextExpiry }));
    } catch (err) {
      next(err);
    }
  },
);

backofficeRouter.post(
  "/invoices/:id/cancel",
  requirePlatformAuth,
  requirePlatformRole("OPS"),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const invoice = await prisma.subscriptionInvoice.findUnique({ where: { id } });
      if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice tidak ditemukan");
      if (invoice.status !== "PENDING") {
        throw new AppError(400, "INVALID_STATUS", "Hanya invoice PENDING yang dapat dibatalkan");
      }

      const updated = await prisma.subscriptionInvoice.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      await logPlatformAction({
        adminId: req.platformAdmin!.id,
        action: "INVOICE_CANCEL",
        targetType: "INVOICE",
        targetId: id,
        summary: `Batalkan invoice ${invoice.invoiceNo}`,
        ipAddress: req.ip,
      });

      res.json(serializeBigInt({ invoice: updated }));
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// AUDIT LOGS
// ============================================================================

backofficeRouter.get("/audit-logs", requirePlatformAuth, async (_req, res, next) => {
  try {
    const items = await prisma.platformAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { admin: { select: { id: true, name: true, email: true, role: true } } },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});
