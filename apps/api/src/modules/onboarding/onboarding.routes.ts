import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  buildOnboardingSeedBlueprint,
  completeOnboardingSchema,
  type BusinessType,
  type FoodType,
  type ServiceMode,
} from "@pos/shared";
import { prisma } from "../../lib/prisma.js";
import { getOutletSettingsMap } from "../../lib/settings.js";
import { invalidateRbacCache } from "../../lib/rbac-cache.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requireAuth, requireOwner } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error.js";

export const onboardingRouter = Router();
onboardingRouter.use(requireAuth);

async function clearOutletOperationalData(outletId: number) {
  await prisma.$transaction(async (tx) => {
    await tx.refund.deleteMany({ where: { outletId } });
    await tx.payment.deleteMany({ where: { outletId } });
    await tx.kitchenTicket.deleteMany({ where: { outletId } });
    await tx.order.deleteMany({ where: { outletId } });
    await tx.cashMovement.deleteMany({ where: { outletId } });
    await tx.shift.deleteMany({ where: { outletId } });
    await tx.syncLog.deleteMany({ where: { outletId } });
    await tx.stockMovement.deleteMany({ where: { outletId } });
    await tx.diningTable.deleteMany({ where: { outletId } });
    await tx.area.deleteMany({ where: { outletId } });
    await tx.product.deleteMany({ where: { outletId } });
    await tx.modifierGroup.deleteMany({ where: { outletId } });
    await tx.category.deleteMany({ where: { outletId } });
    await tx.ingredient.deleteMany({ where: { outletId } });
  });
}

onboardingRouter.get("/status", async (req, res, next) => {
  try {
    const outletId = req.user!.outletId;
    const [settings, user] = await Promise.all([
      getOutletSettingsMap(outletId),
      prisma.user.findUnique({ where: { id: req.user!.id }, select: { pinHash: true } }),
    ]);

    let foodTypes: FoodType[] = [];
    if (settings.onboardingFoodTypes) {
      try {
        foodTypes = JSON.parse(settings.onboardingFoodTypes);
      } catch {
        foodTypes = [];
      }
    }

    res.json({
      completed: settings.onboardingCompleted === "true",
      hasPin: Boolean(user?.pinHash),
      sampleDataActive: settings.sampleDataActive === "true",
      businessType: (settings.onboardingBusinessType as BusinessType) ?? null,
      foodTypes,
      serviceMode: (settings.onboardingServiceMode as ServiceMode) ?? null,
    });
  } catch (err) {
    next(err);
  }
});

onboardingRouter.post(
  "/complete",
  requireOwner,
  validateBody(completeOnboardingSchema),
  async (req, res, next) => {
    try {
      const outletId = req.user!.outletId;
      const userId = req.user!.id;
      const { pin, businessType, foodTypes, serviceMode, seedSampleData } = req.body as {
        pin?: string;
        businessType: BusinessType;
        foodTypes: FoodType[];
        serviceMode: ServiceMode;
        seedSampleData: boolean;
      };

      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { pinHash: true } });
      if (!currentUser?.pinHash && !pin) {
        throw new AppError(400, "PIN_REQUIRED", "Silakan atur PIN 4–6 digit terlebih dahulu");
      }

      if (pin) {
        const pinHash = await bcrypt.hash(pin, 10);
        await prisma.user.update({
          where: { id: userId },
          data: { pinCode: pin, pinHash },
        });
      }

      // Pastikan station BAR & KITCHEN tersedia pada outlet ini
      let stations = await prisma.station.findMany({ where: { outletId } });
      if (stations.length === 0) {
        await prisma.station.createMany({
          data: [
            { outletId, code: "BAR", name: "Bar & Minuman", tone: "iris", slaMins: 6 },
            { outletId, code: "KITCHEN", name: "Dapur", tone: "coral", slaMins: 12 },
          ],
        });
        stations = await prisma.station.findMany({ where: { outletId } });
      }
      const stationMap = new Map(stations.map((s) => [s.code, s.id]));

      let summary = { categories: 0, products: 0, modifierGroups: 0, tables: 0, ingredients: 0 };

      if (seedSampleData) {
        await clearOutletOperationalData(outletId);
        const blueprint = buildOnboardingSeedBlueprint({ businessType, foodTypes, serviceMode });

        await prisma.$transaction(async (tx) => {
          const catMap = new Map<string, number>();
          for (const cat of blueprint.categories) {
            const created = await tx.category.create({
              data: { outletId, name: cat.name, tone: cat.tone, sortOrder: cat.sortOrder },
            });
            catMap.set(cat.name, created.id);
          }

          const modGroupMap = new Map<string, number>();
          for (const mg of blueprint.modifierGroups) {
            const created = await tx.modifierGroup.create({
              data: {
                outletId,
                name: mg.name,
                isRequired: mg.isRequired,
                minSelect: mg.minSelect,
                maxSelect: mg.maxSelect,
                modifiers: {
                  create: mg.modifiers.map((m) => ({
                    name: m.name,
                    price: BigInt(m.price),
                    isAvailable: true,
                  })),
                },
              },
            });
            modGroupMap.set(mg.name, created.id);
          }

          for (const p of blueprint.products) {
            const categoryId = catMap.get(p.categoryName);
            if (!categoryId) continue;
            const modIds = (p.modifierGroupNames ?? [])
              .map((n) => modGroupMap.get(n))
              .filter((id): id is number => Boolean(id));

            await tx.product.create({
              data: {
                outletId,
                categoryId,
                stationId: stationMap.get(p.stationCode) ?? stations[0]?.id ?? null,
                sku: p.sku,
                name: p.name,
                monogram: p.monogram,
                tone: p.tone,
                price: BigInt(p.price),
                cost: BigInt(p.cost),
                isAvailable: true,
                variants: p.variants?.length
                  ? {
                      create: p.variants.map((v, idx) => ({
                        name: v.name,
                        priceDelta: BigInt(v.priceDelta),
                        isDefault: v.isDefault ?? idx === 0,
                      })),
                    }
                  : undefined,
                modifierGroups: modIds.length
                  ? { create: modIds.map((modifierGroupId) => ({ modifierGroupId })) }
                  : undefined,
              },
            });
          }

          let tableCount = 0;
          for (let i = 0; i < blueprint.areas.length; i++) {
            const areaSpec = blueprint.areas[i];
            const area = await tx.area.create({
              data: { outletId, name: areaSpec.name, sortOrder: i + 1 },
            });
            for (const tbl of areaSpec.tables) {
              await tx.diningTable.create({
                data: {
                  outletId,
                  areaId: area.id,
                  code: tbl.code,
                  name: tbl.name,
                  capacity: tbl.capacity,
                  qrToken: crypto.randomBytes(12).toString("hex"),
                },
              });
              tableCount++;
            }
          }

          for (const ing of blueprint.ingredients) {
            await tx.ingredient.create({
              data: {
                outletId,
                sku: ing.sku,
                name: ing.name,
                unit: ing.unit,
                purchaseUnit: ing.purchaseUnit,
                conversion: ing.conversion,
                unitCost: BigInt(ing.unitCost),
                currentStock: ing.currentStock,
                minStock: ing.minStock,
              },
            });
          }

          summary = {
            categories: blueprint.categories.length,
            products: blueprint.products.length,
            modifierGroups: blueprint.modifierGroups.length,
            tables: tableCount,
            ingredients: blueprint.ingredients.length,
          };
        });
      }

      const settingEntries: Array<[string, string]> = [
        ["onboardingCompleted", "true"],
        ["onboardingBusinessType", businessType],
        ["onboardingFoodTypes", JSON.stringify(foodTypes)],
        ["onboardingServiceMode", serviceMode],
        ["sampleDataActive", seedSampleData ? "true" : "false"],
      ];
      for (const [key, value] of settingEntries) {
        await prisma.setting.upsert({
          where: { outletId_key: { outletId, key } },
          update: { value },
          create: { outletId, key, value },
        });
      }

      invalidateRbacCache(userId);

      await writeAuditLog({
        outletId,
        userId,
        action: "ONBOARDING_COMPLETE",
        entityType: "Outlet",
        entityId: outletId,
        afterValue: { businessType, foodTypes, serviceMode, seedSampleData, summary },
        ipAddress: req.ip,
      });

      res.json({ ok: true, summary });
    } catch (err) {
      next(err);
    }
  },
);

onboardingRouter.post("/reset-sample", requireOwner, async (req, res, next) => {
  try {
    const outletId = req.user!.outletId;
    const userId = req.user!.id;

    await clearOutletOperationalData(outletId);

    // Sisakan 1 kategori kosong default agar kasir / admin langsung bisa tambah menu asli
    await prisma.category.create({
      data: { outletId, name: "Menu Utama", tone: "iris", sortOrder: 1 },
    });

    await prisma.setting.upsert({
      where: { outletId_key: { outletId, key: "sampleDataActive" } },
      update: { value: "false" },
      create: { outletId, key: "sampleDataActive", value: "false" },
    });

    await writeAuditLog({
      outletId,
      userId,
      action: "ONBOARDING_RESET_SAMPLE",
      entityType: "Outlet",
      entityId: outletId,
      afterValue: { sampleDataActive: false },
      ipAddress: req.ip,
    });

    res.json({ ok: true, message: "Semua data contoh di outlet ini berhasil direset." });
  } catch (err) {
    next(err);
  }
});
