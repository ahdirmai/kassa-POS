import { Router } from "express";
import bcrypt from "bcryptjs";
import {
  createRoleSchema,
  createUserSchema,
  PERMISSION_CATALOG,
  updateRoleSchema,
  updateUserSchema,
} from "@pos/shared";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { invalidateRbacCache } from "../../lib/rbac-cache.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requireAuth, requireFeature, requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error.js";

export const rbacRouter = Router();
rbacRouter.use(requireAuth);

const SYSTEM_ROLES = new Set(["OWNER", "MANAGER", "CASHIER", "KITCHEN"]);

// Daftar katalog permission (beserta grup & label bahasa Indonesia)
rbacRouter.get("/permissions", async (_req, res, next) => {
  try {
    const dbPerms = await prisma.permission.findMany({ orderBy: { id: "asc" } });
    const metaMap = new Map(PERMISSION_CATALOG.map((m) => [m.code as string, m]));
    const list = dbPerms.map((p) => {
      const meta = metaMap.get(p.code);
      return {
        id: p.id,
        code: p.code,
        group: meta?.group ?? "Lainnya",
        label: meta?.label ?? p.code,
        description: meta?.description ?? p.description ?? "",
      };
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// Daftar semua role beserta permission aktif & jumlah user
rbacRouter.get("/roles", requirePermission("role.manage"), async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { id: "asc" },
    });
    const formatted = roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      isSystem: SYSTEM_ROLES.has(r.code),
      userCount: r._count.users,
      permissions: r.permissions.map((rp) => rp.permission.code),
    }));
    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// Buat role dinamis baru
rbacRouter.post(
  "/roles",
  requireFeature("rbacCustom"),
  requirePermission("role.manage"),
  validateBody(createRoleSchema),
  async (req, res, next) => {
    try {
      const { code, name, description, permissions } = req.body;
      const existing = await prisma.role.findUnique({ where: { code } });
      if (existing) throw new AppError(409, "ROLE_EXISTS", `Kode role ${code} sudah digunakan`);

      const dbPerms = await prisma.permission.findMany({
        where: { code: { in: permissions } },
      });

      const created = await prisma.role.create({
        data: {
          code,
          name,
          description: description ?? null,
          permissions: {
            create: dbPerms.map((p) => ({ permissionId: p.id })),
          },
        },
        include: { permissions: { include: { permission: true } } },
      });

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "RBAC_ROLE_CREATE",
        entityType: "Role",
        entityId: created.id,
        afterValue: { code, name, permissions: dbPerms.map((p) => p.code) },
        ipAddress: req.ip,
      });

      res.status(201).json({
        id: created.id,
        code: created.code,
        name: created.name,
        description: created.description,
        isSystem: false,
        userCount: 0,
        permissions: created.permissions.map((rp) => rp.permission.code),
      });
    } catch (err) {
      next(err);
    }
  },
);

// Update nama/deskripsi/permission role secara dinamis
rbacRouter.patch(
  "/roles/:id",
  requirePermission("role.manage"),
  validateBody(updateRoleSchema),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const role = await prisma.role.findUnique({
        where: { id },
        include: { permissions: { include: { permission: true } } },
      });
      if (!role) throw new AppError(404, "ROLE_NOT_FOUND", "Role tidak ditemukan");

      const beforePerms = role.permissions.map((rp) => rp.permission.code);
      const nextPerms: string[] | undefined = req.body.permissions;

      // Proteksi: OWNER tidak boleh kehilangan role.manage & user.manage agar tidak terkunci
      const safePerms =
        nextPerms && role.code === "OWNER"
          ? [...new Set([...nextPerms, "role.manage", "user.manage", "settings.manage"])]
          : nextPerms;

      await prisma.$transaction(async (tx) => {
        if (req.body.name !== undefined || req.body.description !== undefined) {
          await tx.role.update({
            where: { id },
            data: {
              ...(req.body.name !== undefined ? { name: req.body.name } : {}),
              ...(req.body.description !== undefined ? { description: req.body.description } : {}),
            },
          });
        }
        if (safePerms !== undefined) {
          const dbPerms = await tx.permission.findMany({ where: { code: { in: safePerms } } });
          await tx.rolePermission.deleteMany({ where: { roleId: id } });
          if (dbPerms.length) {
            await tx.rolePermission.createMany({
              data: dbPerms.map((p) => ({ roleId: id, permissionId: p.id })),
            });
          }
        }
      });

      // Invalidate cache seluruh user agar perubahan permission langsung berlaku!
      invalidateRbacCache();

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "RBAC_ROLE_UPDATE",
        entityType: "Role",
        entityId: id,
        beforeValue: { name: role.name, permissions: beforePerms },
        afterValue: { name: req.body.name ?? role.name, permissions: safePerms ?? beforePerms },
        ipAddress: req.ip,
      });

      const updated = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
        },
      });
      res.json({
        id: updated!.id,
        code: updated!.code,
        name: updated!.name,
        description: updated!.description,
        isSystem: SYSTEM_ROLES.has(updated!.code),
        userCount: updated!._count.users,
        permissions: updated!.permissions.map((rp) => rp.permission.code),
      });
    } catch (err) {
      next(err);
    }
  },
);

// Hapus role kustom
rbacRouter.delete("/roles/:id", requirePermission("role.manage"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new AppError(404, "ROLE_NOT_FOUND", "Role tidak ditemukan");
    if (SYSTEM_ROLES.has(role.code)) {
      throw new AppError(400, "SYSTEM_ROLE_PROTECTED", "Role bawaan sistem tidak dapat dihapus");
    }
    if (role._count.users > 0) {
      throw new AppError(400, "ROLE_IN_USE", "Pindahkan user dari role ini terlebih dahulu sebelum menghapus");
    }

    await prisma.role.delete({ where: { id } });
    invalidateRbacCache();

    await writeAuditLog({
      outletId: req.user!.outletId,
      userId: req.user!.id,
      action: "RBAC_ROLE_DELETE",
      entityType: "Role",
      entityId: id,
      beforeValue: { code: role.code, name: role.name },
      ipAddress: req.ip,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Daftar staf / user
rbacRouter.get("/users", requirePermission("user.manage"), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { outletId: req.user!.outletId, deletedAt: null },
      include: { role: true },
      orderBy: { id: "asc" },
    });
    res.json(
      serializeJson(
        users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          hasPin: Boolean(u.pinHash),
          isActive: u.isActive,
          roleId: u.roleId,
          roleCode: u.role.code,
          roleName: u.role.name,
          createdAt: u.createdAt,
        })),
      ),
    );
  } catch (err) {
    next(err);
  }
});

// Tambah user / staf baru
rbacRouter.post(
  "/users",
  requirePermission("user.manage"),
  validateBody(createUserSchema),
  async (req, res, next) => {
    try {
      const { name, email, password, pin, roleId } = req.body;
      const tenantId = req.user!.tenantId;

      // Enforce batas jumlah akun per paket (FREE: total 3 akun = 1 Owner + 2 Staf)
      const activeCount = await prisma.user.count({
        where: { tenantId, deletedAt: null, isActive: true },
      });
      if (activeCount >= req.user!.maxUsers) {
        throw new AppError(
          403,
          "PLAN_LIMIT_REACHED",
          `Batas paket ${req.user!.plan} tercapai (maksimal ${req.user!.maxUsers} akun: 1 Owner + ${req.user!.maxUsers - 1} Staf). Upgrade ke Kassa Pro (Rp49.000/bln) untuk menambah staf.`,
        );
      }

      const exists = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (exists) throw new AppError(409, "EMAIL_EXISTS", "Email sudah terdaftar");

      const passwordHash = await bcrypt.hash(password, 10);
      const pinHash = pin ? await bcrypt.hash(pin, 10) : null;

      const user = await prisma.user.create({
        data: {
          tenantId,
          outletId: req.user!.outletId,
          roleId,
          name,
          email: email.trim().toLowerCase(),
          passwordHash,
          pinHash,
          pinCode: pin ?? null,
        },
        include: { role: true },
      });

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "RBAC_USER_CREATE",
        entityType: "User",
        entityId: user.id,
        afterValue: { name, email, role: user.role.code },
        ipAddress: req.ip,
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        hasPin: Boolean(user.pinHash),
        isActive: user.isActive,
        roleId: user.roleId,
        roleCode: user.role.code,
        roleName: user.role.name,
      });
    } catch (err) {
      next(err);
    }
  },
);

// Ubah nama, email, password, role, PIN, atau status aktif akun secara dinamis
rbacRouter.patch(
  "/users/:id",
  requirePermission("user.manage"),
  validateBody(updateUserSchema),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
      if (!user || user.deletedAt) throw new AppError(404, "USER_NOT_FOUND", "Akun tidak ditemukan");

      if (req.body.email && req.body.email !== user.email) {
        const dup = await prisma.user.findUnique({ where: { email: req.body.email } });
        if (dup) throw new AppError(409, "EMAIL_EXISTS", "Email sudah digunakan akun lain");
      }

      const passwordHash = req.body.password ? await bcrypt.hash(req.body.password, 10) : undefined;
      const pinHash =
        req.body.pin === undefined
          ? undefined
          : req.body.pin === null
            ? null
            : await bcrypt.hash(req.body.pin, 10);

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(req.body.name !== undefined ? { name: req.body.name } : {}),
          ...(req.body.email !== undefined ? { email: req.body.email } : {}),
          ...(passwordHash !== undefined ? { passwordHash } : {}),
          ...(req.body.roleId !== undefined ? { roleId: req.body.roleId } : {}),
          ...(req.body.isActive !== undefined ? { isActive: req.body.isActive } : {}),
          ...(pinHash !== undefined ? { pinHash, pinCode: req.body.pin } : {}),
        },
        include: { role: true },
      });

      invalidateRbacCache(id);

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "RBAC_USER_UPDATE",
        entityType: "User",
        entityId: id,
        beforeValue: { name: user.name, email: user.email, role: user.role.code, isActive: user.isActive },
        afterValue: {
          name: updated.name,
          email: updated.email,
          role: updated.role.code,
          isActive: updated.isActive,
          passwordChanged: Boolean(req.body.password),
          pinChanged: req.body.pin !== undefined,
        },
        ipAddress: req.ip,
      });

      res.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        hasPin: Boolean(updated.pinHash),
        isActive: updated.isActive,
        roleId: updated.roleId,
        roleCode: updated.role.code,
        roleName: updated.role.name,
      });
    } catch (err) {
      next(err);
    }
  },
);

// Soft-delete akun staf (proteksi: tidak bisa hapus diri sendiri atau OWNER terakhir)
rbacRouter.delete("/users/:id", requirePermission("user.manage"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user!.id) {
      throw new AppError(400, "CANNOT_DELETE_SELF", "Tidak dapat menghapus akun yang sedang login");
    }
    const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!user || user.deletedAt) throw new AppError(404, "USER_NOT_FOUND", "Akun tidak ditemukan");

    if (user.role.code === "OWNER") {
      const ownerCount = await prisma.user.count({
        where: { outletId: user.outletId, deletedAt: null, isActive: true, role: { code: "OWNER" } },
      });
      if (ownerCount <= 1) {
        throw new AppError(400, "LAST_OWNER", "Tidak dapat menghapus satu-satunya akun Owner aktif");
      }
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
    invalidateRbacCache(id);

    await writeAuditLog({
      outletId: req.user!.outletId,
      userId: req.user!.id,
      action: "RBAC_USER_DELETE",
      entityType: "User",
      entityId: id,
      beforeValue: { name: user.name, email: user.email, role: user.role.code },
      ipAddress: req.ip,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
