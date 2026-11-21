import { Router } from "express";
import { calculateCashChange, calculateOrderTotals, syncPushSchema } from "@pos/shared";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { getOutletTaxConfig } from "../../lib/settings.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error.js";
import {
  deductStockForOrder,
  generateDailyOrderNumbers,
  generateReceiptNo,
  resolveOrderItemsInput,
} from "../orders/orders.service.js";

export const syncRouter = Router();
syncRouter.use(requireAuth);

/**
 * Pull data master terbaru untuk disimpan ke IndexedDB (Dexie) di PWA kasir.
 */
syncRouter.get("/pull", async (req, res, next) => {
  try {
    const outletId = req.user!.outletId;
    const [categories, products, areas, settings] = await Promise.all([
      prisma.category.findMany({ where: { outletId, deletedAt: null }, orderBy: { sortOrder: "asc" } }),
      prisma.product.findMany({
        where: { outletId, deletedAt: null },
        include: {
          variants: true,
          modifierGroups: { include: { modifierGroup: { include: { modifiers: true } } } },
        },
      }),
      prisma.area.findMany({ where: { outletId }, include: { tables: true } }),
      prisma.setting.findMany({ where: { outletId } }),
    ]);

    res.json(
      serializeJson({
        syncedAt: new Date().toISOString(),
        categories,
        products,
        areas,
        settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
      }),
    );
  } catch (err) {
    next(err);
  }
});

/**
 * Push batch transaksi tunai offline secara idempotent berdasarkan clientUuid.
 */
syncRouter.post("/push", requirePermission("order.create"), validateBody(syncPushSchema), async (req, res, next) => {
  try {
    const outletId = req.user!.outletId;
    const taxCfg = await getOutletTaxConfig(outletId);
    const activeShift = await prisma.shift.findFirst({
      where: { outletId, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    const results: Array<{ clientUuid: string; status: string; orderNo?: string; receiptNo?: string }> = [];

    for (const tx of req.body.transactions) {
      const existingSync = await prisma.syncLog.findUnique({
        where: { outletId_clientUuid: { outletId, clientUuid: tx.clientUuid } },
      });
      if (existingSync) {
        results.push({ clientUuid: tx.clientUuid, status: "DUPLICATE_SKIPPED" });
        continue;
      }

      if (tx.tableId) {
        const table = await prisma.diningTable.findFirst({ where: { id: tx.tableId, outletId } });
        if (!table) {
          throw new AppError(404, "TABLE_NOT_FOUND", "Meja tidak ditemukan pada outlet ini");
        }
      }

      const resolved = await resolveOrderItemsInput(tx.items, outletId);
      const totals = calculateOrderTotals(
        resolved.map((it) => ({
          unitPrice: it.unitPrice,
          modifiersPrice: it.modifiersSum,
          quantity: it.quantity,
        })),
        tx.discountType && tx.discountValue
          ? { type: tx.discountType, value: tx.discountValue }
          : null,
        taxCfg,
      );

      const { orderNo, queueNo } = await generateDailyOrderNumbers(outletId);
      const receiptNo = await generateReceiptNo(outletId);
      const changeAmt = calculateCashChange(totals.grandTotal, tx.paidAmount);

      const order = await prisma.order.create({
        data: {
          outletId,
          shiftId: activeShift?.id ?? null,
          tableId: tx.tableId ?? null,
          cashierId: req.user!.id,
          clientUuid: tx.clientUuid,
          orderNo,
          queueNo,
          receiptNo,
          orderType: tx.orderType,
          status: "PAID",
          customerName: tx.customerName ?? null,
          notes: `Synced from offline (${tx.offlineReceiptNo})`,
          discountType: tx.discountType ?? null,
          discountValue: tx.discountValue ?? 0,
          subtotal: BigInt(totals.subtotal),
          discountAmount: BigInt(totals.totalDiscount),
          serviceChargeAmount: BigInt(totals.serviceChargeAmount),
          taxAmount: BigInt(totals.taxAmount),
          roundingAmount: BigInt(totals.roundingAmount),
          grandTotal: BigInt(totals.grandTotal),
          paidAt: new Date(tx.createdAt),
          createdAt: new Date(tx.createdAt),
          items: {
            create: resolved.map((it) => ({
              productId: it.productId,
              variantId: it.variantId,
              productName: it.productName,
              variantName: it.variantName,
              stationId: it.stationId,
              unitPrice: BigInt(it.unitPrice),
              unitCost: BigInt(it.unitCost),
              modifiersSum: BigInt(it.modifiersSum),
              quantity: it.quantity,
              lineTotal: BigInt(it.lineTotal),
              notes: it.notes,
              kitchenStatus: "BUMPED",
              modifiers: {
                create: it.modifiers.map((m) => ({
                  modifierId: m.modifierId,
                  modifierName: m.modifierName,
                  price: BigInt(m.price),
                })),
              },
            })),
          },
          payments: {
            create: {
              outletId,
              method: "CASH",
              status: "SETTLED",
              amount: BigInt(totals.grandTotal),
              paidAmount: BigInt(tx.paidAmount),
              changeAmt: BigInt(changeAmt),
              referenceNo: tx.offlineReceiptNo,
              settledAt: new Date(tx.createdAt),
              createdBy: req.user!.id,
            },
          },
        },
      });

      await deductStockForOrder(order.id, req.user!.id);
      await prisma.syncLog.create({
        data: { outletId, clientUuid: tx.clientUuid, orderId: order.id, status: "PROCESSED" },
      });

      results.push({ clientUuid: tx.clientUuid, status: "SYNCED", orderNo, receiptNo });
    }

    res.json({ results });
  } catch (err) {
    next(err);
  }
});
