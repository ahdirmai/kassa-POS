import { Router } from "express";
import { updateSettingsSchema } from "@pos/shared";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { getOutletSettingsMap } from "../../lib/settings.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get("/", async (req, res, next) => {
  try {
    const map = await getOutletSettingsMap(req.user!.outletId);
    res.json({
      businessName: map.businessName ?? "Kopi & Dapur Senja",
      outletName: map.outletName ?? "Outlet Utama",
      address: map.address ?? "",
      phone: map.phone ?? "",
      receiptFooter: map.receiptFooter ?? "",
      taxRatePercent: Number(map.taxRatePercent ?? 10),
      serviceChargePercent: Number(map.serviceChargePercent ?? 5),
      taxInclusive: map.taxInclusive === "true",
      taxAfterService: map.taxAfterService !== "false",
      roundingUnit: Number(map.roundingUnit ?? 100),
      paymentProvider: map.paymentProvider ?? "midtrans",
    });
  } catch (err) {
    next(err);
  }
});

settingsRouter.patch(
  "/",
  requirePermission("settings.manage"),
  validateBody(updateSettingsSchema),
  async (req, res, next) => {
    try {
      const outletId = req.user!.outletId;
      const before = await getOutletSettingsMap(outletId);

      for (const [key, val] of Object.entries(req.body)) {
        if (val === undefined) continue;
        await prisma.setting.upsert({
          where: { outletId_key: { outletId, key } },
          update: { value: String(val) },
          create: { outletId, key, value: String(val) },
        });
      }

      await writeAuditLog({
        outletId,
        userId: req.user!.id,
        action: "SETTINGS_UPDATE",
        entityType: "Setting",
        entityId: outletId,
        beforeValue: before,
        afterValue: req.body,
        ipAddress: req.ip,
      });

      const after = await getOutletSettingsMap(outletId);
      res.json(after);
    } catch (err) {
      next(err);
    }
  },
);

settingsRouter.get("/audit-logs", requirePermission("report.view"), async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { outletId: req.user!.outletId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    res.json(serializeJson(logs));
  } catch (err) {
    next(err);
  }
});
