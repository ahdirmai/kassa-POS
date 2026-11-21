import { Router } from "express";
import { z } from "zod";
import { calculateMarginPercent, calculateRecipeHpp, convertToBaseUnit, stockAdjustSchema } from "@pos/shared";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requireAuth, requireFeature, requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error.js";

export const stockRouter = Router();
stockRouter.use(requireAuth);
stockRouter.use(requireFeature("stock"));

const createIngredientSchema = z.object({
  sku: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  unit: z.string().min(1).max(20),
  purchaseUnit: z.string().min(1).max(20).default("pack"),
  conversion: z.coerce.number().positive().default(1),
  unitCost: z.coerce.number().int().nonnegative(),
  currentStock: z.coerce.number().default(0),
  minStock: z.coerce.number().nonnegative().default(0),
});

const updateIngredientSchema = z.object({
  sku: z.string().min(2).max(40).optional(),
  name: z.string().min(2).max(120).optional(),
  unit: z.string().min(1).max(20).optional(),
  purchaseUnit: z.string().min(1).max(20).optional(),
  conversion: z.coerce.number().positive().optional(),
  unitCost: z.coerce.number().int().nonnegative().optional(),
  minStock: z.coerce.number().nonnegative().optional(),
});

const upsertRecipeSchema = z.object({
  notes: z.string().max(255).optional(),
  manualCost: z.coerce.number().int().nonnegative().optional(),
  items: z.array(
    z.object({
      ingredientId: z.coerce.number().int().positive(),
      qty: z.coerce.number().positive(),
      unit: z.string().max(20).optional(), // satuan takaran fleksibel (otomatis dikonversi ke satuan dasar bahan)
    }),
  ),
});

async function syncProductHppFromRecipe(productId: number, fallbackManualCost?: number) {
  const recipe = await prisma.recipe.findUnique({
    where: { productId },
    include: { items: { include: { ingredient: true } } },
  });
  let hpp = fallbackManualCost ?? 0;
  if (recipe && recipe.items.length > 0) {
    hpp = calculateRecipeHpp(
      recipe.items.map((ri) => ({ qty: ri.qty, unitCost: Number(ri.ingredient.unitCost) })),
    );
  }
  await prisma.product.update({
    where: { id: productId },
    data: { cost: BigInt(hpp) },
  });
  return hpp;
}

stockRouter.get("/ingredients", requirePermission("stock.view"), async (req, res, next) => {
  try {
    const items = await prisma.ingredient.findMany({
      where: { outletId: req.user!.outletId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    res.json(serializeJson(items));
  } catch (err) {
    next(err);
  }
});

// CRUD Bahan Baku (Ingredient)
stockRouter.post(
  "/ingredients",
  requirePermission("stock.adjust"),
  validateBody(createIngredientSchema),
  async (req, res, next) => {
    try {
      const sku = req.body.sku.trim().toUpperCase();
      const exists = await prisma.ingredient.findUnique({ where: { sku } });
      if (exists && !exists.deletedAt) {
        throw new AppError(409, "SKU_EXISTS", `SKU bahan ${sku} sudah digunakan`);
      }

      const created = exists
        ? await prisma.ingredient.update({
            where: { id: exists.id },
            data: {
              deletedAt: null,
              name: req.body.name.trim(),
              unit: req.body.unit.trim(),
              purchaseUnit: req.body.purchaseUnit.trim(),
              conversion: req.body.conversion,
              unitCost: BigInt(req.body.unitCost),
              currentStock: req.body.currentStock,
              minStock: req.body.minStock,
            },
          })
        : await prisma.ingredient.create({
            data: {
              outletId: req.user!.outletId,
              sku,
              name: req.body.name.trim(),
              unit: req.body.unit.trim(),
              purchaseUnit: req.body.purchaseUnit.trim(),
              conversion: req.body.conversion,
              unitCost: BigInt(req.body.unitCost),
              currentStock: req.body.currentStock,
              minStock: req.body.minStock,
            },
          });

      if (req.body.currentStock !== 0) {
        await prisma.stockMovement.create({
          data: {
            outletId: req.user!.outletId,
            ingredientId: created.id,
            type: "PURCHASE_IN",
            qtyChange: req.body.currentStock,
            balanceAfter: req.body.currentStock,
            unitCost: BigInt(req.body.unitCost),
            reason: "Stok awal bahan baku baru",
            createdBy: req.user!.id,
          },
        });
      }

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "INGREDIENT_CREATE",
        entityType: "Ingredient",
        entityId: created.id,
        afterValue: { sku, name: created.name, unitCost: req.body.unitCost },
      });

      res.status(201).json(serializeJson(created));
    } catch (err) {
      next(err);
    }
  },
);

stockRouter.patch(
  "/ingredients/:id",
  requirePermission("stock.adjust"),
  validateBody(updateIngredientSchema),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const before = await prisma.ingredient.findUnique({ where: { id } });
      if (!before || before.deletedAt) throw new AppError(404, "INGREDIENT_NOT_FOUND", "Bahan baku tidak ditemukan");

      const updated = await prisma.ingredient.update({
        where: { id },
        data: {
          ...(req.body.sku !== undefined ? { sku: req.body.sku.trim().toUpperCase() } : {}),
          ...(req.body.name !== undefined ? { name: req.body.name.trim() } : {}),
          ...(req.body.unit !== undefined ? { unit: req.body.unit.trim() } : {}),
          ...(req.body.purchaseUnit !== undefined ? { purchaseUnit: req.body.purchaseUnit.trim() } : {}),
          ...(req.body.conversion !== undefined ? { conversion: req.body.conversion } : {}),
          ...(req.body.unitCost !== undefined ? { unitCost: BigInt(req.body.unitCost) } : {}),
          ...(req.body.minStock !== undefined ? { minStock: req.body.minStock } : {}),
        },
      });

      // Jika harga satuan bahan berubah, sinkronkan HPP semua produk yang memakai bahan ini
      if (req.body.unitCost !== undefined) {
        const affected = await prisma.recipeItem.findMany({
          where: { ingredientId: id },
          include: { recipe: true },
        });
        for (const ri of affected) {
          await syncProductHppFromRecipe(ri.recipe.productId);
        }
      }

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "INGREDIENT_UPDATE",
        entityType: "Ingredient",
        entityId: id,
        beforeValue: { name: before.name, unitCost: Number(before.unitCost), minStock: before.minStock },
        afterValue: req.body,
      });

      res.json(serializeJson(updated));
    } catch (err) {
      next(err);
    }
  },
);

stockRouter.delete("/ingredients/:id", requirePermission("stock.adjust"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const usedInRecipes = await prisma.recipeItem.count({ where: { ingredientId: id } });
    if (usedInRecipes > 0) {
      throw new AppError(400, "INGREDIENT_IN_USE", `Bahan masih dipakai di ${usedInRecipes} resep menu. Hapus dari resep dulu.`);
    }
    await prisma.ingredient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

stockRouter.get("/movements", requirePermission("stock.view"), async (req, res, next) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { outletId: req.user!.outletId },
      include: { ingredient: { select: { id: true, sku: true, name: true, unit: true } } },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    res.json(serializeJson(movements));
  } catch (err) {
    next(err);
  }
});

stockRouter.post(
  "/adjust",
  requirePermission("stock.adjust"),
  validateBody(stockAdjustSchema),
  async (req, res, next) => {
    try {
      const { ingredientId, type, qtyChange, inputUnit, unitCost, reason } = req.body;
      const ing = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
      if (!ing || ing.deletedAt) throw new AppError(404, "INGREDIENT_NOT_FOUND", "Bahan baku tidak ditemukan");

      const convertedQty = convertToBaseUnit(qtyChange, inputUnit, ing.unit, ing.purchaseUnit, ing.conversion);
      const conversionNote =
        inputUnit && inputUnit.trim().toLowerCase() !== ing.unit.trim().toLowerCase()
          ? ` (${qtyChange} ${inputUnit} → ${convertedQty} ${ing.unit})`
          : "";

      let signedChange = convertedQty;
      if (type === "WASTE") signedChange = -Math.abs(convertedQty);
      else if (type === "PURCHASE_IN") signedChange = Math.abs(convertedQty);
      else if (type === "OPNAME") {
        // Pada OPNAME, qtyChange diperlakukan sebagai stok fisik aktual, lalu dihitung selisihnya
        signedChange = Number((Math.max(0, convertedQty) - ing.currentStock).toFixed(3));
      }

      if (signedChange === 0) {
        throw new AppError(400, "NO_STOCK_CHANGE", "Tidak ada perubahan jumlah stok");
      }

      const newBalance = Number((ing.currentStock + signedChange).toFixed(3));
      const fullReason = `${reason}${conversionNote}`;

      const [updated, movement] = await prisma.$transaction([
        prisma.ingredient.update({
          where: { id: ingredientId },
          data: {
            currentStock: newBalance,
            ...(unitCost !== undefined && type === "PURCHASE_IN" ? { unitCost: BigInt(unitCost) } : {}),
          },
        }),
        prisma.stockMovement.create({
          data: {
            outletId: req.user!.outletId,
            ingredientId,
            type,
            qtyChange: signedChange,
            balanceAfter: newBalance,
            unitCost: BigInt(unitCost ?? Number(ing.unitCost)),
            reason: fullReason,
            createdBy: req.user!.id,
          },
        }),
      ]);

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: `STOCK_${type}`,
        entityType: "Ingredient",
        entityId: ingredientId,
        reason,
        beforeValue: { currentStock: ing.currentStock },
        afterValue: { currentStock: newBalance, qtyChange: signedChange },
      });

      res.status(201).json(serializeJson({ ingredient: updated, movement }));
    } catch (err) {
      next(err);
    }
  },
);

stockRouter.get("/recipes", requirePermission("stock.view"), async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { outletId: req.user!.outletId, deletedAt: null },
      include: {
        category: true,
        recipe: {
          include: {
            items: { include: { ingredient: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const enriched = products.map((p) => {
      const recipeItems = p.recipe?.items ?? [];
      const hpp = recipeItems.length
        ? calculateRecipeHpp(recipeItems.map((ri) => ({ qty: ri.qty, unitCost: Number(ri.ingredient.unitCost) })))
        : Number(p.cost);
      const price = Number(p.price);
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category.name,
        price,
        hpp,
        margin: price - hpp,
        marginPercent: calculateMarginPercent(price, hpp),
        notes: p.recipe?.notes ?? "",
        recipeItems: recipeItems.map((ri) => ({
          ingredientId: ri.ingredientId,
          ingredientName: ri.ingredient.name,
          unit: ri.ingredient.unit,
          qty: ri.qty,
          unitCost: Number(ri.ingredient.unitCost),
          lineCost: Math.round(ri.qty * Number(ri.ingredient.unitCost)),
        })),
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// CRUD Resep (BOM) & HPP per Menu
stockRouter.put(
  "/recipes/:productId",
  requirePermission("stock.adjust"),
  validateBody(upsertRecipeSchema),
  async (req, res, next) => {
    try {
      const productId = Number(req.params.productId);
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Menu tidak ditemukan");

      const { items, notes, manualCost } = req.body as z.infer<typeof upsertRecipeSchema>;

      // Konversi satuan takaran fleksibel tiap item ke satuan dasar bahan + gabungkan duplikat
      const ingIds = [...new Set(items.map((i) => i.ingredientId))];
      const ings = ingIds.length
        ? await prisma.ingredient.findMany({ where: { id: { in: ingIds } } })
        : [];
      const ingMap = new Map(ings.map((i) => [i.id, i]));

      const mergedMap = new Map<number, number>();
      for (const it of items) {
        const ing = ingMap.get(it.ingredientId);
        const baseQty = ing
          ? convertToBaseUnit(it.qty, it.unit, ing.unit, ing.purchaseUnit, ing.conversion)
          : it.qty;
        mergedMap.set(it.ingredientId, Number(((mergedMap.get(it.ingredientId) ?? 0) + baseQty).toFixed(4)));
      }
      const dedupedItems = [...mergedMap.entries()].map(([ingredientId, qty]) => ({ ingredientId, qty }));

      await prisma.$transaction(async (tx) => {
        const recipe = await tx.recipe.upsert({
          where: { productId },
          update: { notes: notes ?? null },
          create: { productId, notes: notes ?? null },
        });
        await tx.recipeItem.deleteMany({ where: { recipeId: recipe.id } });
        if (dedupedItems.length > 0) {
          await tx.recipeItem.createMany({
            data: dedupedItems.map((it) => ({
              recipeId: recipe.id,
              ingredientId: it.ingredientId,
              qty: it.qty,
            })),
          });
        }
      });

      const newHpp = await syncProductHppFromRecipe(productId, manualCost ?? Number(product.cost));

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "RECIPE_HPP_UPDATE",
        entityType: "Product",
        entityId: productId,
        afterValue: { hpp: newHpp, itemCount: items.length },
      });

      res.json({ ok: true, productId, hpp: newHpp });
    } catch (err) {
      next(err);
    }
  },
);
