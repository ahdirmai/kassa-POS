import { Router } from "express";
import { cashMovementSchema, closeShiftSchema, openShiftSchema } from "@pos/shared";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { writeAuditLog } from "../../lib/audit.js";
import { requireAuth, requireFeature, requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error.js";

export const shiftsRouter = Router();
shiftsRouter.use(requireAuth);

async function computeShiftSummary(shiftId: number, outletId?: number) {
  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, ...(outletId !== undefined ? { outletId } : {}) },
    include: {
      user: { select: { id: true, name: true, email: true } },
      cashMovements: { orderBy: { createdAt: "desc" } },
      orders: {
        where: { status: { in: ["PAID", "CLOSED"] } },
        include: { payments: { where: { status: "SETTLED" } } },
      },
    },
  });
  if (!shift) return null;

  let cashSales = 0;
  let nonCashSales = 0;
  const byMethod: Record<string, number> = {};

  for (const order of shift.orders) {
    for (const p of order.payments) {
      const amt = Number(p.amount);
      byMethod[p.method] = (byMethod[p.method] ?? 0) + amt;
      if (p.method === "CASH") cashSales += amt;
      else nonCashSales += amt;
    }
  }

  let cashIn = 0;
  let cashOut = 0;
  for (const m of shift.cashMovements) {
    if (m.type === "CASH_IN") cashIn += Number(m.amount);
    else cashOut += Number(m.amount);
  }

  const expectedCash = Number(shift.openingCash) + cashSales + cashIn - cashOut;

  return {
    ...shift,
    summary: {
      totalOrders: shift.orders.length,
      cashSales,
      nonCashSales,
      totalSales: cashSales + nonCashSales,
      cashIn,
      cashOut,
      expectedCash,
      byMethod,
    },
  };
}

shiftsRouter.get("/active", async (req, res, next) => {
  try {
    const active = await prisma.shift.findFirst({
      where: { outletId: req.user!.outletId, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });
    if (!active) return res.json(null);
    const full = await computeShiftSummary(active.id);
    return res.json(serializeJson(full));
  } catch (err) {
    next(err);
  }
});

shiftsRouter.get("/", requireFeature("reports"), requirePermission("report.view"), async (req, res, next) => {
  try {
    const shifts = await prisma.shift.findMany({
      where: { outletId: req.user!.outletId },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { orders: true, cashMovements: true } },
      },
      orderBy: { openedAt: "desc" },
      take: 30,
    });
    res.json(serializeJson(shifts));
  } catch (err) {
    next(err);
  }
});

shiftsRouter.post("/open", requirePermission("shift.manage"), validateBody(openShiftSchema), async (req, res, next) => {
  try {
    const existing = await prisma.shift.findFirst({
      where: { outletId: req.user!.outletId, status: "OPEN" },
    });
    if (existing) {
      throw new AppError(409, "SHIFT_ALREADY_OPEN", "Masih ada shift aktif yang belum ditutup");
    }

    const shift = await prisma.shift.create({
      data: {
        outletId: req.user!.outletId,
        userId: req.user!.id,
        openingCash: BigInt(req.body.openingCash),
        expectedCash: BigInt(req.body.openingCash),
        notes: req.body.notes,
      },
    });

    await writeAuditLog({
      outletId: req.user!.outletId,
      userId: req.user!.id,
      action: "SHIFT_OPEN",
      entityType: "Shift",
      entityId: shift.id,
      afterValue: { openingCash: req.body.openingCash },
    });

    const full = await computeShiftSummary(shift.id);
    res.status(201).json(serializeJson(full));
  } catch (err) {
    next(err);
  }
});

shiftsRouter.post("/cash-movements", requirePermission("shift.manage"), validateBody(cashMovementSchema), async (req, res, next) => {
  try {
    const { shiftId, type, amount, reason } = req.body;
    const shift = await prisma.shift.findFirst({ where: { id: shiftId, outletId: req.user!.outletId } });
    if (!shift || shift.status !== "OPEN") {
      throw new AppError(404, "SHIFT_NOT_OPEN", "Shift tidak ditemukan atau sudah ditutup");
    }

    const mv = await prisma.cashMovement.create({
      data: {
        outletId: req.user!.outletId,
        shiftId,
        type,
        amount: BigInt(amount),
        reason,
        createdBy: req.user!.id,
      },
    });

    await writeAuditLog({
      outletId: req.user!.outletId,
      userId: req.user!.id,
      action: type,
      entityType: "Shift",
      entityId: shiftId,
      reason,
      afterValue: { amount },
    });

    res.status(201).json(serializeJson(mv));
  } catch (err) {
    next(err);
  }
});

shiftsRouter.post("/:id/close", requirePermission("shift.manage"), validateBody(closeShiftSchema), async (req, res, next) => {
  try {
    const shiftId = Number(req.params.id);
    const full = await computeShiftSummary(shiftId, req.user!.outletId);
    if (!full || full.status !== "OPEN") {
      throw new AppError(404, "SHIFT_NOT_OPEN", "Shift sudah ditutup atau tidak ditemukan");
    }

    const expectedCash = full.summary.expectedCash;
    const actualCash = req.body.actualCash;
    const difference = actualCash - expectedCash;

    const closed = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: "CLOSED",
        expectedCash: BigInt(expectedCash),
        actualCash: BigInt(actualCash),
        difference: BigInt(difference),
        notes: req.body.notes ?? full.notes,
        closedAt: new Date(),
      },
    });

    await writeAuditLog({
      outletId: req.user!.outletId,
      userId: req.user!.id,
      action: "SHIFT_CLOSE",
      entityType: "Shift",
      entityId: shiftId,
      afterValue: { expectedCash, actualCash, difference },
    });

    res.json(serializeJson({ ...closed, summary: full.summary }));
  } catch (err) {
    next(err);
  }
});
