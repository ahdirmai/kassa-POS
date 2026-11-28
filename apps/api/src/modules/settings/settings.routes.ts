import { Router } from "express";
import { updateSettingsSchema } from "@pos/shared";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { getOutletSettingsMap } from "../../lib/settings.js";
import { invalidateRbacCache } from "../../lib/rbac-cache.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requireAuth, requireFeature, requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get("/", async (req, res, next) => {
  try {
    const [map, outlet] = await Promise.all([
      getOutletSettingsMap(req.user!.outletId),
      prisma.outlet.findUnique({ where: { id: req.user!.outletId } }),
    ]);
    res.json({
      businessName: map.businessName ?? req.user!.tenantName ?? "Tumpu POS",
      outletName: map.outletName ?? outlet?.name ?? req.user!.outletName ?? "Outlet Utama",
      address: map.address ?? outlet?.address ?? "",
      phone: map.phone ?? outlet?.phone ?? "",
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

      // Sinkronkan nama/alamat/telepon outlet ke tabel Outlet agar switcher selalu konsisten
      if (
        req.body.outletName !== undefined ||
        req.body.address !== undefined ||
        req.body.phone !== undefined
      ) {
        await prisma.outlet.update({
          where: { id: outletId },
          data: {
            ...(req.body.outletName ? { name: String(req.body.outletName).trim() } : {}),
            ...(req.body.address !== undefined ? { address: String(req.body.address).trim() || null } : {}),
            ...(req.body.phone !== undefined ? { phone: String(req.body.phone).trim() || null } : {}),
          },
        });
        invalidateRbacCache();
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

settingsRouter.get("/audit-logs", requireFeature("reports"), requirePermission("report.view"), async (req, res, next) => {
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
