import { Router } from "express";
import crypto from "node:crypto";
import {
  createOutletSchema,
  PLAN_POLICIES,
  switchOutletSchema,
  updateOutletSchema,
  updatePlanSchema,
} from "@pos/shared";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { invalidateRbacCache } from "../../lib/rbac-cache.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requireAuth, requireFeature, requireOwner } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error.js";
import { issueTokensForUser } from "../auth/auth.routes.js";

export const outletsRouter = Router();
outletsRouter.use(requireAuth);

// Ringkasan tenant, kuota paket, & daftar outlet milik tenant ini
outletsRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const [tenant, outlets, activeUserCount] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.outlet.findMany({
        where: { tenantId },
        orderBy: { id: "asc" },
        include: {
          _count: {
            select: {
              users: { where: { deletedAt: null, isActive: true } },
              orders: true,
            },
          },
        },
      }),
      prisma.user.count({ where: { tenantId, deletedAt: null, isActive: true } }),
    ]);

    if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant tidak ditemukan");

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        maxOutlets: tenant.maxOutlets,
        maxUsers: tenant.maxUsers,
        usedOutlets: outlets.filter((o) => o.isActive).length,
        usedUsers: activeUserCount,
      },
      activeOutletId: req.user!.outletId,
      outlets: outlets.map((o) => ({
        id: o.id,
        code: o.code,
        name: o.name,
        address: o.address,
        phone: o.phone,
        isActive: o.isActive,
        staffCount: o._count.users,
        orderCount: o._count.orders,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// Tambah outlet baru (khusus Owner & terikat limit paket)
outletsRouter.post("/", requireOwner, validateBody(createOutletSchema), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new AppError(404, "TENANT_NOT_FOUND", "Tenant tidak ditemukan");

    const activeOutlets = await prisma.outlet.count({ where: { tenantId, isActive: true } });
    const effectivePlan = req.user!.plan;
    const effectiveMaxOutlets = req.user!.maxOutlets;
    if (effectivePlan === "FREE" || activeOutlets >= effectiveMaxOutlets) {
      throw new AppError(
        403,
        "PLAN_LIMIT_REACHED",
        effectivePlan === "FREE"
          ? "Paket Free (atau langganan Pro yang sudah berakhir) hanya mendukung 1 outlet. Perpanjang/upgrade ke Tumpu Pro (Rp49.000/bln) untuk menambah banyak cabang."
          : `Batas maksimal ${effectiveMaxOutlets} outlet telah tercapai.`,
      );
    }

    const { name, address, phone } = req.body;
    const code = `OUT-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    const outlet = await prisma.$transaction(async (tx) => {
      const created = await tx.outlet.create({
        data: {
          tenantId,
          code,
          name: name.trim(),
          address: address?.trim() || null,
          phone: phone?.trim() || null,
        },
      });
      await tx.station.createMany({
        data: [
          { outletId: created.id, code: "BAR", name: "Bar & Minuman", tone: "iris", slaMins: 6 },
          { outletId: created.id, code: "KITCHEN", name: "Dapur", tone: "coral", slaMins: 12 },
        ],
      });
      await tx.category.create({
        data: { outletId: created.id, name: "Menu Utama", tone: "iris", sortOrder: 1 },
      });
      return created;
    });

    invalidateRbacCache(req.user!.id);

    await writeAuditLog({
      outletId: outlet.id,
      userId: req.user!.id,
      action: "OUTLET_CREATE",
      entityType: "Outlet",
      entityId: outlet.id,
      afterValue: { code: outlet.code, name: outlet.name },
      ipAddress: req.ip,
    });

    res.status(201).json(outlet);
  } catch (err) {
    next(err);
  }
});

// Edit atau nonaktifkan/aktifkan outlet milik tenant ini (khusus Owner)
outletsRouter.patch("/:id", requireOwner, validateBody(updateOutletSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const tenantId = req.user!.tenantId;
    const existing = await prisma.outlet.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new AppError(404, "OUTLET_NOT_FOUND", "Outlet tidak ditemukan pada akun bisnis Anda");
    }

    if (req.body.isActive === false && existing.isActive) {
      if (id === req.user!.outletId) {
        throw new AppError(400, "CANNOT_DEACTIVATE_ACTIVE", "Pindah ke outlet lain terlebih dahulu sebelum menonaktifkan outlet ini");
      }
      const activeCount = await prisma.outlet.count({ where: { tenantId, isActive: true } });
      if (activeCount <= 1) {
        throw new AppError(400, "LAST_ACTIVE_OUTLET", "Minimal harus ada 1 outlet aktif");
      }
    }

    if (req.body.isActive === true && !existing.isActive) {
      const activeCount = await prisma.outlet.count({ where: { tenantId, isActive: true } });
      if (activeCount >= req.user!.maxOutlets) {
        throw new AppError(403, "PLAN_LIMIT_REACHED", `Batas maksimal ${req.user!.maxOutlets} outlet aktif telah tercapai.`);
      }
    }

    const updated = await prisma.outlet.update({
      where: { id },
      data: {
        ...(req.body.name !== undefined ? { name: req.body.name.trim() } : {}),
        ...(req.body.address !== undefined ? { address: req.body.address?.trim() || null } : {}),
        ...(req.body.phone !== undefined ? { phone: req.body.phone?.trim() || null } : {}),
        ...(req.body.isActive !== undefined ? { isActive: req.body.isActive } : {}),
      },
    });

    invalidateRbacCache(req.user!.id);

    await writeAuditLog({
      outletId: updated.id,
      userId: req.user!.id,
      action: "OUTLET_UPDATE",
      entityType: "Outlet",
      entityId: updated.id,
      beforeValue: { name: existing.name, isActive: existing.isActive },
      afterValue: { name: updated.name, isActive: updated.isActive },
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Pindah outlet aktif (khusus Owner & paket Multi-Outlet)
outletsRouter.post("/switch", requireOwner, requireFeature("multiOutlet"), validateBody(switchOutletSchema), async (req, res, next) => {
  try {
    const { outletId } = req.body;
    const target = await prisma.outlet.findFirst({
      where: { id: outletId, tenantId: req.user!.tenantId, isActive: true },
    });
    if (!target) {
      throw new AppError(404, "OUTLET_NOT_FOUND", "Outlet tidak ditemukan pada akun bisnis Anda");
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { outletId: target.id },
    });

    const result = await issueTokensForUser(req.user!.id);
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

// Upgrade / ubah paket tenant (hanya untuk simulasi dev; di produksi wajib via billing Back Office / payment gateway)
outletsRouter.post("/plan", requireOwner, validateBody(updatePlanSchema), async (req, res, next) => {
  try {
    const { plan } = req.body as { plan: "FREE" | "PRO" | "ENTERPRISE" };
    if (process.env.NODE_ENV === "production" && plan !== "FREE") {
      throw new AppError(
        403,
        "BILLING_VERIFICATION_REQUIRED",
        "Upgrade paket berbayar wajib melalui konfirmasi pembayaran resmi atau hubungi admin Tumpu.",
      );
    }
    const policy = PLAN_POLICIES[plan];
    const tenantId = req.user!.tenantId;

    const [activeOutlets, activeUsers] = await Promise.all([
      prisma.outlet.count({ where: { tenantId, isActive: true } }),
      prisma.user.count({ where: { tenantId, deletedAt: null, isActive: true } }),
    ]);

    if (activeOutlets > policy.maxOutlets) {
      throw new AppError(
        400,
        "DOWNGRADE_BLOCKED",
        `Tidak dapat turun ke paket ${policy.label}: Anda masih memiliki ${activeOutlets} outlet aktif (maksimal ${policy.maxOutlets}). Nonaktifkan cabang berlebih terlebih dahulu.`,
      );
    }
    if (activeUsers > policy.maxUsers) {
      throw new AppError(
        400,
        "DOWNGRADE_BLOCKED",
        `Tidak dapat turun ke paket ${policy.label}: Anda masih memiliki ${activeUsers} akun aktif (maksimal ${policy.maxUsers}). Nonaktifkan staf berlebih terlebih dahulu.`,
      );
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: policy.tier,
        maxOutlets: policy.maxOutlets,
        maxUsers: policy.maxUsers,
      },
    });

    invalidateRbacCache();

    await writeAuditLog({
      outletId: req.user!.outletId,
      userId: req.user!.id,
      action: "TENANT_PLAN_UPDATE",
      entityType: "Tenant",
      entityId: req.user!.tenantId,
      afterValue: { plan: policy.tier, maxOutlets: policy.maxOutlets, maxUsers: policy.maxUsers },
      ipAddress: req.ip,
    });

    const result = await issueTokensForUser(req.user!.id);
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
