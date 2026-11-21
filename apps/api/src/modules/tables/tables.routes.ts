import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { mergeTablesSchema, moveTableSchema } from "@pos/shared";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { recalculateOrder } from "../orders/orders.service.js";
import { emitTableUpdate } from "../../lib/socket.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requireAuth, requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error.js";

export const tablesRouter = Router();
tablesRouter.use(requireAuth);

const areaSchema = z.object({
  name: z.string().min(2).max(80),
  sortOrder: z.coerce.number().int().optional(),
});

const createTableSchema = z.object({
  areaId: z.coerce.number().int().positive(),
  code: z.string().min(1).max(20),
  name: z.string().min(2).max(60),
  capacity: z.coerce.number().int().min(1).max(50).default(4),
});

const updateTableSchema = z.object({
  areaId: z.coerce.number().int().positive().optional(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(2).max(60).optional(),
  capacity: z.coerce.number().int().min(1).max(50).optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "WAITING_PAYMENT"]).optional(),
});

tablesRouter.get("/", async (req, res, next) => {
  try {
    const areas = await prisma.area.findMany({
      where: { outletId: req.user!.outletId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: {
        tables: {
          orderBy: { code: "asc" },
          include: {
            orders: {
              where: { status: { in: ["OPEN", "SENT", "SERVED"] } },
              take: 1,
              orderBy: { createdAt: "desc" },
              select: { id: true, orderNo: true, status: true, grandTotal: true, createdAt: true, customerName: true },
            },
          },
        },
      },
    });
    res.json(serializeJson(areas));
  } catch (err) {
    next(err);
  }
});

// CRUD Area
tablesRouter.post("/areas", requirePermission("table.manage"), validateBody(areaSchema), async (req, res, next) => {
  try {
    const count = await prisma.area.count({ where: { outletId: req.user!.outletId } });
    const created = await prisma.area.create({
      data: {
        outletId: req.user!.outletId,
        name: req.body.name.trim(),
        sortOrder: req.body.sortOrder ?? count + 1,
      },
    });
    await writeAuditLog({
      outletId: req.user!.outletId,
      userId: req.user!.id,
      action: "AREA_CREATE",
      entityType: "Area",
      entityId: created.id,
      afterValue: created,
    });
    res.status(201).json(serializeJson(created));
  } catch (err) {
    next(err);
  }
});

tablesRouter.patch("/areas/:id", requirePermission("table.manage"), validateBody(areaSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.area.findFirst({ where: { id, outletId: req.user!.outletId } });
    if (!existing) throw new AppError(404, "AREA_NOT_FOUND", "Area tidak ditemukan");
    const updated = await prisma.area.update({
      where: { id },
      data: {
        name: req.body.name.trim(),
        ...(req.body.sortOrder !== undefined ? { sortOrder: req.body.sortOrder } : {}),
      },
    });
    res.json(serializeJson(updated));
  } catch (err) {
    next(err);
  }
});

tablesRouter.delete("/areas/:id", requirePermission("table.manage"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.area.findFirst({ where: { id, outletId: req.user!.outletId } });
    if (!existing) throw new AppError(404, "AREA_NOT_FOUND", "Area tidak ditemukan");
    const count = await prisma.diningTable.count({ where: { areaId: id, outletId: req.user!.outletId } });
    if (count > 0) {
      throw new AppError(400, "AREA_NOT_EMPTY", "Hapus atau pindahkan semua meja di area ini terlebih dahulu");
    }
    await prisma.area.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// CRUD Meja
tablesRouter.post("/", requirePermission("table.manage"), validateBody(createTableSchema), async (req, res, next) => {
  try {
    const outletId = req.user!.outletId;
    const area = await prisma.area.findFirst({ where: { id: req.body.areaId, outletId } });
    if (!area) throw new AppError(404, "AREA_NOT_FOUND", "Area tidak ditemukan pada outlet ini");

    const code = req.body.code.trim().toUpperCase();
    const exists = await prisma.diningTable.findUnique({
      where: { outletId_code: { outletId, code } },
    });
    if (exists) throw new AppError(409, "TABLE_CODE_EXISTS", `Kode meja ${code} sudah digunakan`);

    const created = await prisma.diningTable.create({
      data: {
        outletId,
        areaId: req.body.areaId,
        code,
        name: req.body.name.trim(),
        capacity: req.body.capacity,
        qrToken: crypto.randomBytes(12).toString("hex"),
      },
    });
    emitTableUpdate(outletId, { type: "CREATED", tableId: created.id });
    res.status(201).json(serializeJson(created));
  } catch (err) {
    next(err);
  }
});

tablesRouter.patch("/:id", requirePermission("table.manage"), validateBody(updateTableSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const outletId = req.user!.outletId;
    const existing = await prisma.diningTable.findFirst({ where: { id, outletId } });
    if (!existing) throw new AppError(404, "TABLE_NOT_FOUND", "Meja tidak ditemukan");
    if (req.body.areaId !== undefined) {
      const area = await prisma.area.findFirst({ where: { id: req.body.areaId, outletId } });
      if (!area) throw new AppError(404, "AREA_NOT_FOUND", "Area tidak ditemukan pada outlet ini");
    }
    const updated = await prisma.diningTable.update({
      where: { id },
      data: {
        ...(req.body.areaId !== undefined ? { areaId: req.body.areaId } : {}),
        ...(req.body.code !== undefined ? { code: req.body.code.trim().toUpperCase() } : {}),
        ...(req.body.name !== undefined ? { name: req.body.name.trim() } : {}),
        ...(req.body.capacity !== undefined ? { capacity: req.body.capacity } : {}),
        ...(req.body.status !== undefined ? { status: req.body.status } : {}),
      },
    });
    emitTableUpdate(outletId, { type: "UPDATED", tableId: id });
    res.json(serializeJson(updated));
  } catch (err) {
    next(err);
  }
});

tablesRouter.delete("/:id", requirePermission("table.manage"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const outletId = req.user!.outletId;
    const existing = await prisma.diningTable.findFirst({ where: { id, outletId } });
    if (!existing) throw new AppError(404, "TABLE_NOT_FOUND", "Meja tidak ditemukan");
    const active = await prisma.order.count({
      where: { tableId: id, outletId, status: { in: ["OPEN", "SENT", "SERVED"] } },
    });
    if (active > 0) {
      throw new AppError(400, "TABLE_HAS_ACTIVE_ORDER", "Meja sedang memiliki order aktif, selesaikan atau pindah dulu");
    }
    await prisma.diningTable.delete({ where: { id } });
    emitTableUpdate(outletId, { type: "DELETED", tableId: id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

tablesRouter.post("/:id/move", requirePermission("order.create"), validateBody(moveTableSchema), async (req, res, next) => {
  try {
    const sourceId = Number(req.params.id);
    const outletId = req.user!.outletId;
    const { targetTableId } = req.body;
    if (sourceId === targetTableId) {
      throw new AppError(400, "SAME_TABLE", "Meja tujuan tidak boleh sama dengan meja asal");
    }

    const result = await prisma.$transaction(async (tx) => {
      const [source, target] = await Promise.all([
        tx.diningTable.findFirst({ where: { id: sourceId, outletId } }),
        tx.diningTable.findFirst({ where: { id: targetTableId, outletId } }),
      ]);
      if (!source || !target) {
        throw new AppError(404, "TABLE_NOT_FOUND", "Meja asal atau tujuan tidak ditemukan pada outlet ini");
      }
      if (target.status !== "AVAILABLE") {
        throw new AppError(409, "TABLE_NOT_AVAILABLE", "Meja tujuan sedang terisi");
      }

      const activeOrder = await tx.order.findFirst({
        where: { tableId: sourceId, outletId, status: { in: ["OPEN", "SENT", "SERVED"] } },
      });
      if (!activeOrder) {
        throw new AppError(404, "NO_ACTIVE_ORDER", "Tidak ada order aktif di meja asal");
      }

      await tx.order.update({ where: { id: activeOrder.id }, data: { tableId: targetTableId } });
      await tx.diningTable.update({ where: { id: sourceId }, data: { status: "AVAILABLE" } });
      await tx.diningTable.update({ where: { id: targetTableId }, data: { status: "OCCUPIED" } });

      return { orderId: activeOrder.id, from: sourceId, to: targetTableId };
    });

    emitTableUpdate(outletId, { type: "MOVED", ...result });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

tablesRouter.post("/merge", requirePermission("order.create"), validateBody(mergeTablesSchema), async (req, res, next) => {
  try {
    const outletId = req.user!.outletId;
    const { sourceTableId, targetTableId } = req.body;
    if (sourceTableId === targetTableId) {
      throw new AppError(400, "SAME_TABLE", "Pilih dua meja yang berbeda untuk digabung");
    }

    const result = await prisma.$transaction(async (tx) => {
      const [sourceTable, targetTable] = await Promise.all([
        tx.diningTable.findFirst({ where: { id: sourceTableId, outletId } }),
        tx.diningTable.findFirst({ where: { id: targetTableId, outletId } }),
      ]);
      if (!sourceTable || !targetTable) {
        throw new AppError(404, "TABLE_NOT_FOUND", "Meja tidak ditemukan pada outlet ini");
      }
      const sourceOrder = await tx.order.findFirst({
        where: { tableId: sourceTableId, outletId, status: { in: ["OPEN", "SENT", "SERVED"] } },
        include: { items: true },
      });
      const targetOrder = await tx.order.findFirst({
        where: { tableId: targetTableId, outletId, status: { in: ["OPEN", "SENT", "SERVED"] } },
      });
      if (!sourceOrder || !targetOrder) {
        throw new AppError(400, "MERGE_REQUIRES_ACTIVE", "Kedua meja harus memiliki order aktif untuk digabung");
      }

      await tx.orderItem.updateMany({
        where: { orderId: sourceOrder.id },
        data: { orderId: targetOrder.id },
      });
      await tx.order.update({
        where: { id: sourceOrder.id },
        data: { status: "VOID", voidReason: `Digabung ke order ${targetOrder.orderNo}` },
      });
      await tx.diningTable.update({ where: { id: sourceTableId }, data: { status: "AVAILABLE" } });

      const mergedItems = await tx.orderItem.findMany({ where: { orderId: targetOrder.id } });
      const subtotal = mergedItems.reduce((s, it) => s + Number(it.lineTotal), 0);
      await tx.order.update({
        where: { id: targetOrder.id },
        data: {
          subtotal: BigInt(subtotal),
          grandTotal: BigInt(subtotal),
        },
      });

      return { targetOrderId: targetOrder.id, voidedOrderId: sourceOrder.id };
    });

    await recalculateOrder(result.targetOrderId);
    emitTableUpdate(req.user!.outletId, { type: "MERGED", ...result });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
