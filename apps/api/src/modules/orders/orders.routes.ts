import { Router } from "express";
import { addOrderItemsSchema, createOrderSchema, voidOrderSchema } from "@pos/shared";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { emitOrderUpdate, emitTableUpdate } from "../../lib/socket.js";
import { requireAuth, requirePermission, verifyManagerPin } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error.js";
import {
  freeTableIfOccupied,
  generateDailyOrderNumbers,
  recalculateOrder,
  resolveOrderItemsInput,
  sendOrderToKitchen,
} from "./orders.service.js";

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

ordersRouter.get("/", async (req, res, next) => {
  try {
    const statusParam = req.query.status ? String(req.query.status).split(",") : undefined;
    const orders = await prisma.order.findMany({
      where: {
        outletId: req.user!.outletId,
        ...(statusParam ? { status: { in: statusParam } } : {}),
      },
      include: {
        table: true,
        cashier: { select: { id: true, name: true } },
        items: { include: { modifiers: true }, orderBy: { id: "asc" } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });
    res.json(serializeJson(orders));
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        cashier: { select: { id: true, name: true } },
        items: { include: { modifiers: true }, orderBy: { id: "asc" } },
        payments: { include: { refunds: true }, orderBy: { createdAt: "desc" } },
        kitchenTickets: { include: { station: true } },
      },
    });
    if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
    res.json(serializeJson(order));
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/", requirePermission("order.create"), validateBody(createOrderSchema), async (req, res, next) => {
  try {
    const outletId = req.user!.outletId;
    const body = req.body;

    // Idempotency check if clientUuid provided
    if (body.clientUuid) {
      const existing = await prisma.order.findUnique({
        where: { clientUuid: body.clientUuid },
        include: { items: { include: { modifiers: true } }, table: true, payments: true },
      });
      if (existing) return res.json(serializeJson(existing));
    }

    // Validasi meja: tidak boleh ada dua order aktif di meja yang sama
    if (body.orderType === "DINE_IN" && body.tableId) {
      const busy = await prisma.order.findFirst({
        where: { tableId: body.tableId, status: { in: ["OPEN", "SENT", "SERVED"] } },
      });
      if (busy) {
        throw new AppError(409, "TABLE_OCCUPIED", `Meja sudah memiliki order aktif (${busy.orderNo})`);
      }
    }

    const activeShift = await prisma.shift.findFirst({
      where: { outletId, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    const { orderNo, queueNo } = await generateDailyOrderNumbers(outletId);
    const resolvedItems = await resolveOrderItemsInput(body.items);

    const created = await prisma.order.create({
      data: {
        outletId,
        shiftId: activeShift?.id ?? null,
        tableId: body.tableId ?? null,
        cashierId: req.user!.id,
        clientUuid: body.clientUuid ?? null,
        orderNo,
        queueNo,
        orderType: body.orderType,
        status: "OPEN",
        customerName: body.customerName ?? null,
        notes: body.notes ?? null,
        discountType: body.discountType ?? null,
        discountValue: body.discountValue ?? 0,
        items: {
          create: resolvedItems.map((it) => ({
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
            modifiers: {
              create: it.modifiers.map((m) => ({
                modifierId: m.modifierId,
                modifierName: m.modifierName,
                price: BigInt(m.price),
              })),
            },
          })),
        },
      },
    });

    if (body.tableId) {
      await prisma.diningTable.update({ where: { id: body.tableId }, data: { status: "OCCUPIED" } });
      emitTableUpdate(outletId, { type: "OCCUPIED", tableId: body.tableId, orderId: created.id });
    }

    if (body.sendToKitchen) {
      await sendOrderToKitchen(created.id, req.user!.id);
    }

    const full = await recalculateOrder(created.id);
    emitOrderUpdate(outletId, { type: "CREATED", orderId: full.id });
    return res.status(201).json(serializeJson(full));
  } catch (err) {
    return next(err);
  }
});

ordersRouter.post("/:id/items", requirePermission("order.create"), validateBody(addOrderItemsSchema), async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || ["PAID", "CLOSED", "VOID"].includes(order.status)) {
      throw new AppError(400, "ORDER_CLOSED", "Order sudah selesai atau dibatalkan");
    }

    const resolvedItems = await resolveOrderItemsInput(req.body.items);
    for (const it of resolvedItems) {
      await prisma.orderItem.create({
        data: {
          orderId,
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
          modifiers: {
            create: it.modifiers.map((m) => ({
              modifierId: m.modifierId,
              modifierName: m.modifierName,
              price: BigInt(m.price),
            })),
          },
        },
      });
    }

    if (req.body.sendToKitchen) {
      await sendOrderToKitchen(orderId, req.user!.id);
    }

    const full = await recalculateOrder(orderId);
    emitOrderUpdate(order.outletId, { type: "ITEMS_ADDED", orderId });
    res.json(serializeJson(full));
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/:id/send", requirePermission("order.create"), async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const result = await sendOrderToKitchen(orderId, req.user!.id);
    res.json(serializeJson(result));
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/:id/void", validateBody(voidOrderSchema), async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const manager = await verifyManagerPin(req.body.managerPin, req.user!.outletId);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
    if (order.status === "VOID") throw new AppError(400, "ALREADY_VOID", "Order sudah di-void");

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "VOID", voidReason: req.body.reason },
    });

    await freeTableIfOccupied(order.tableId, order.outletId);

    await writeAuditLog({
      outletId: order.outletId,
      userId: req.user!.id,
      action: "ORDER_VOID",
      entityType: "Order",
      entityId: order.id,
      reason: `${req.body.reason} (Approved by ${manager.name})`,
      beforeValue: { status: order.status, grandTotal: Number(order.grandTotal) },
      afterValue: { status: "VOID" },
      ipAddress: req.ip,
    });

    emitOrderUpdate(order.outletId, { type: "VOID", orderId });
    res.json(serializeJson(updated));
  } catch (err) {
    next(err);
  }
});
