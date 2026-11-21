import { Router } from "express";
import { z } from "zod";
import { updateAvailabilitySchema } from "@pos/shared";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error.js";

export const menuRouter = Router();

menuRouter.use(requireAuth);

const variantInputSchema = z.object({
  name: z.string().min(1).max(80),
  priceDelta: z.coerce.number().int().default(0),
  isDefault: z.boolean().optional(),
});

const productUpsertSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  stationId: z.coerce.number().int().positive().nullable().optional(),
  sku: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  monogram: z.string().min(1).max(4).optional(),
  tone: z.string().max(20).optional(),
  price: z.coerce.number().int().nonnegative(),
  cost: z.coerce.number().int().nonnegative().optional(),
  imageUrl: z.string().max(255).nullable().optional(),
  isAvailable: z.boolean().optional(),
  variants: z.array(variantInputSchema).optional(),
  modifierGroupIds: z.array(z.coerce.number().int().positive()).optional(),
});

menuRouter.get("/categories", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { outletId: req.user!.outletId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    });
    res.json(serializeJson(categories));
  } catch (err) {
    next(err);
  }
});

menuRouter.get("/stations", async (req, res, next) => {
  try {
    const stations = await prisma.station.findMany({
      where: { outletId: req.user!.outletId },
      orderBy: { id: "asc" },
    });
    res.json(serializeJson(stations));
  } catch (err) {
    next(err);
  }
});

const modifierItemInputSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().min(1).max(80),
  price: z.coerce.number().int().nonnegative().default(0),
  isAvailable: z.boolean().optional(),
});

const modifierGroupUpsertSchema = z.object({
  name: z.string().min(2).max(80),
  isRequired: z.boolean().default(false),
  minSelect: z.coerce.number().int().min(0).default(0),
  maxSelect: z.coerce.number().int().min(1).default(1),
  modifiers: z.array(modifierItemInputSchema).min(1, "Minimal 1 opsi add-on"),
});

menuRouter.get("/modifier-groups", async (_req, res, next) => {
  try {
    const groups = await prisma.modifierGroup.findMany({
      include: {
        modifiers: { orderBy: { id: "asc" } },
        _count: { select: { products: true } },
      },
      orderBy: { id: "asc" },
    });
    res.json(serializeJson(groups));
  } catch (err) {
    next(err);
  }
});

menuRouter.post(
  "/modifier-groups",
  requirePermission("menu.manage"),
  validateBody(modifierGroupUpsertSchema),
  async (req, res, next) => {
    try {
      const { name, isRequired, minSelect, maxSelect, modifiers } = req.body as z.infer<typeof modifierGroupUpsertSchema>;
      const created = await prisma.modifierGroup.create({
        data: {
          name: name.trim(),
          isRequired,
          minSelect: isRequired ? Math.max(1, minSelect) : minSelect,
          maxSelect: Math.max(maxSelect, isRequired ? Math.max(1, minSelect) : 1),
          modifiers: {
            create: modifiers.map((m) => ({
              name: m.name.trim(),
              price: BigInt(m.price ?? 0),
              isAvailable: m.isAvailable ?? true,
            })),
          },
        },
        include: { modifiers: { orderBy: { id: "asc" } }, _count: { select: { products: true } } },
      });

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "MODIFIER_GROUP_CREATE",
        entityType: "ModifierGroup",
        entityId: created.id,
        afterValue: { name: created.name, optionCount: created.modifiers.length },
      });

      res.status(201).json(serializeJson(created));
    } catch (err) {
      next(err);
    }
  },
);

menuRouter.patch(
  "/modifier-groups/:id",
  requirePermission("menu.manage"),
  validateBody(modifierGroupUpsertSchema),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = await prisma.modifierGroup.findUnique({ where: { id }, include: { modifiers: true } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Grup Add-On tidak ditemukan");

      const { name, isRequired, minSelect, maxSelect, modifiers } = req.body as z.infer<typeof modifierGroupUpsertSchema>;
      const keepIds = modifiers.map((m) => m.id).filter((x): x is number => Boolean(x));

      const updated = await prisma.$transaction(async (tx) => {
        await tx.modifierGroup.update({
          where: { id },
          data: {
            name: name.trim(),
            isRequired,
            minSelect: isRequired ? Math.max(1, minSelect) : minSelect,
            maxSelect: Math.max(maxSelect, isRequired ? Math.max(1, minSelect) : 1),
          },
        });

        await tx.modifier.deleteMany({
          where: { modifierGroupId: id, ...(keepIds.length ? { id: { notIn: keepIds } } : {}) },
        });

        for (const m of modifiers) {
          if (m.id) {
            await tx.modifier.update({
              where: { id: m.id },
              data: { name: m.name.trim(), price: BigInt(m.price ?? 0), isAvailable: m.isAvailable ?? true },
            });
          } else {
            await tx.modifier.create({
              data: {
                modifierGroupId: id,
                name: m.name.trim(),
                price: BigInt(m.price ?? 0),
                isAvailable: m.isAvailable ?? true,
              },
            });
          }
        }

        return tx.modifierGroup.findUnique({
          where: { id },
          include: { modifiers: { orderBy: { id: "asc" } }, _count: { select: { products: true } } },
        });
      });

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "MODIFIER_GROUP_UPDATE",
        entityType: "ModifierGroup",
        entityId: id,
        beforeValue: { name: existing.name, optionCount: existing.modifiers.length },
        afterValue: { name: updated?.name, optionCount: updated?.modifiers.length },
      });

      res.json(serializeJson(updated));
    } catch (err) {
      next(err);
    }
  },
);

menuRouter.delete("/modifier-groups/:id", requirePermission("menu.manage"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.modifierGroup.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "NOT_FOUND", "Grup Add-On tidak ditemukan");

    await prisma.modifierGroup.delete({ where: { id } });

    await writeAuditLog({
      outletId: req.user!.outletId,
      userId: req.user!.id,
      action: "MODIFIER_GROUP_DELETE",
      entityType: "ModifierGroup",
      entityId: id,
      beforeValue: { name: existing.name },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

menuRouter.get("/products", async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { outletId: req.user!.outletId, deletedAt: null },
      include: {
        category: true,
        station: true,
        variants: { orderBy: { id: "asc" } },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: { modifiers: { where: { isAvailable: true }, orderBy: { id: "asc" } } },
            },
          },
        },
        recipe: { include: { items: { include: { ingredient: true } } } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    });
    res.json(serializeJson(products));
  } catch (err) {
    next(err);
  }
});

menuRouter.post(
  "/products",
  requirePermission("menu.manage"),
  validateBody(productUpsertSchema),
  async (req, res, next) => {
    try {
      const {
        categoryId,
        stationId,
        sku: rawSku,
        name,
        monogram,
        tone,
        price,
        cost,
        imageUrl,
        isAvailable,
        variants,
        modifierGroupIds,
      } = req.body as z.infer<typeof productUpsertSchema>;

      const sku = rawSku.trim().toUpperCase();
      const existing = await prisma.product.findUnique({
        where: { outletId_sku: { outletId: req.user!.outletId, sku } },
      });
      if (existing && !existing.deletedAt) {
        throw new AppError(409, "SKU_EXISTS", `SKU menu ${sku} sudah digunakan`);
      }

      const cleanVariants = (variants ?? []).filter((v) => v.name.trim().length > 0);
      const cleanModIds = [...new Set(modifierGroupIds ?? [])];

      const product = await prisma.$transaction(async (tx) => {
        if (existing && existing.deletedAt) {
          await tx.productVariant.deleteMany({ where: { productId: existing.id } });
          await tx.productModifierGroup.deleteMany({ where: { productId: existing.id } });
          return tx.product.update({
            where: { id: existing.id },
            data: {
              deletedAt: null,
              categoryId,
              stationId: stationId ?? null,
              name: name.trim(),
              monogram: (monogram?.trim() || name.trim().slice(0, 2)).toUpperCase(),
              tone: tone ?? "iris",
              price: BigInt(price),
              cost: BigInt(cost ?? 0),
              imageUrl: imageUrl?.trim() || null,
              isAvailable: isAvailable ?? true,
              variants: cleanVariants.length
                ? {
                    create: cleanVariants.map((v, idx) => ({
                      name: v.name.trim(),
                      priceDelta: BigInt(v.priceDelta ?? 0),
                      isDefault: v.isDefault ?? idx === 0,
                    })),
                  }
                : undefined,
              modifierGroups: cleanModIds.length
                ? { create: cleanModIds.map((id) => ({ modifierGroupId: id })) }
                : undefined,
            },
            include: { category: true, station: true, variants: true, modifierGroups: { include: { modifierGroup: true } } },
          });
        }

        return tx.product.create({
          data: {
            outletId: req.user!.outletId,
            categoryId,
            stationId: stationId ?? null,
            sku,
            name: name.trim(),
            monogram: (monogram?.trim() || name.trim().slice(0, 2)).toUpperCase(),
            tone: tone ?? "iris",
            price: BigInt(price),
            cost: BigInt(cost ?? 0),
            imageUrl: imageUrl?.trim() || null,
            isAvailable: isAvailable ?? true,
            variants: cleanVariants.length
              ? {
                  create: cleanVariants.map((v, idx) => ({
                    name: v.name.trim(),
                    priceDelta: BigInt(v.priceDelta ?? 0),
                    isDefault: v.isDefault ?? idx === 0,
                  })),
                }
              : undefined,
            modifierGroups: cleanModIds.length
              ? { create: cleanModIds.map((id) => ({ modifierGroupId: id })) }
              : undefined,
          },
          include: { category: true, station: true, variants: true, modifierGroups: { include: { modifierGroup: true } } },
        });
      });

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "MENU_CREATE",
        entityType: "Product",
        entityId: product.id,
        afterValue: { sku, name: product.name, price, variantCount: cleanVariants.length, modifierGroupCount: cleanModIds.length },
      });

      res.status(201).json(serializeJson(product));
    } catch (err) {
      next(err);
    }
  },
);

menuRouter.patch(
  "/products/:id",
  requirePermission("menu.manage"),
  validateBody(productUpsertSchema.partial()),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const before = await prisma.product.findUnique({ where: { id } });
      if (!before || before.deletedAt) throw new AppError(404, "NOT_FOUND", "Menu tidak ditemukan");

      const body = req.body as Partial<z.infer<typeof productUpsertSchema>>;
      if (body.sku && body.sku.trim().toUpperCase() !== before.sku) {
        const dup = await prisma.product.findUnique({
          where: { outletId_sku: { outletId: req.user!.outletId, sku: body.sku.trim().toUpperCase() } },
        });
        if (dup && !dup.deletedAt) throw new AppError(409, "SKU_EXISTS", "SKU sudah digunakan menu lain");
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (body.variants !== undefined) {
          const cleanVariants = body.variants.filter((v) => v.name.trim().length > 0);
          await tx.productVariant.deleteMany({ where: { productId: id } });
          if (cleanVariants.length > 0) {
            await tx.productVariant.createMany({
              data: cleanVariants.map((v, idx) => ({
                productId: id,
                name: v.name.trim(),
                priceDelta: BigInt(v.priceDelta ?? 0),
                isDefault: v.isDefault ?? idx === 0,
              })),
            });
          }
        }

        if (body.modifierGroupIds !== undefined) {
          const cleanModIds = [...new Set(body.modifierGroupIds)];
          await tx.productModifierGroup.deleteMany({ where: { productId: id } });
          if (cleanModIds.length > 0) {
            await tx.productModifierGroup.createMany({
              data: cleanModIds.map((modifierGroupId) => ({ productId: id, modifierGroupId })),
            });
          }
        }

        return tx.product.update({
          where: { id },
          data: {
            ...(body.sku !== undefined ? { sku: body.sku.trim().toUpperCase() } : {}),
            ...(body.name !== undefined ? { name: body.name.trim() } : {}),
            ...(body.price !== undefined ? { price: BigInt(body.price) } : {}),
            ...(body.cost !== undefined ? { cost: BigInt(body.cost) } : {}),
            ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl?.trim() || null } : {}),
            ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
            ...(body.stationId !== undefined ? { stationId: body.stationId } : {}),
            ...(body.isAvailable !== undefined ? { isAvailable: body.isAvailable } : {}),
            ...(body.tone !== undefined ? { tone: body.tone } : {}),
            ...(body.monogram !== undefined ? { monogram: body.monogram.trim().toUpperCase() } : {}),
          },
          include: {
            category: true,
            station: true,
            variants: { orderBy: { id: "asc" } },
            modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
          },
        });
      });

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "MENU_UPDATE",
        entityType: "Product",
        entityId: id,
        beforeValue: { name: before.name, price: Number(before.price) },
        afterValue: { name: updated.name, price: Number(updated.price) },
      });

      res.json(serializeJson(updated));
    } catch (err) {
      next(err);
    }
  },
);

menuRouter.delete("/products/:id", requirePermission("menu.manage"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new AppError(404, "NOT_FOUND", "Menu tidak ditemukan");

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
    });

    await writeAuditLog({
      outletId: req.user!.outletId,
      userId: req.user!.id,
      action: "MENU_DELETE",
      entityType: "Product",
      entityId: id,
      beforeValue: { sku: existing.sku, name: existing.name },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

menuRouter.patch(
  "/products/:id/availability",
  validateBody(updateAvailabilitySchema),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const exists = await prisma.product.findUnique({ where: { id } });
      if (!exists) throw new AppError(404, "NOT_FOUND", "Menu tidak ditemukan");
      const updated = await prisma.product.update({
        where: { id },
        data: { isAvailable: req.body.isAvailable },
      });
      res.json(serializeJson(updated));
    } catch (err) {
      next(err);
    }
  },
);
