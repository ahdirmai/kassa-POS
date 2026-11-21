import { Router } from "express";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { emitKdsUpdate, emitOrderUpdate } from "../../lib/socket.js";
import { requireAuth, requireFeature, requirePermission } from "../../middleware/auth.js";
import { AppError } from "../../middleware/error.js";

export const kdsRouter = Router();
kdsRouter.use(requireAuth);
kdsRouter.use(requireFeature("kds"));
kdsRouter.use(requirePermission("kds.view"));

kdsRouter.get("/tickets", async (req, res, next) => {
  try {
    const stationCode = req.query.station ? String(req.query.station) : undefined;
    const includeBumped = req.query.includeBumped === "true";

    const tickets = await prisma.kitchenTicket.findMany({
      where: {
        outletId: req.user!.outletId,
        ...(stationCode && stationCode !== "ALL" ? { station: { code: stationCode } } : {}),
        ...(includeBumped ? {} : { status: { in: ["NEW", "PREPARING", "READY"] } }),
      },
      include: {
        station: true,
        order: { include: { table: true } },
        round: {
          include: {
            items: { include: { modifiers: true }, orderBy: { id: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 60,
    });

    // Filter items within each round to match the ticket's station
    const formatted = tickets.map((t) => ({
      ...t,
      items: t.round.items.filter((it) => it.stationId === t.stationId || !it.stationId),
    }));

    res.json(serializeJson(formatted));
  } catch (err) {
    next(err);
  }
});

kdsRouter.patch("/tickets/:id/status", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status ?? "");
    if (!["NEW", "PREPARING", "READY", "BUMPED"].includes(status)) {
      throw new AppError(400, "INVALID_STATUS", "Status KDS tidak valid");
    }

    const ticket = await prisma.kitchenTicket.findFirst({
      where: { id, outletId: req.user!.outletId },
      include: { station: true },
    });
    if (!ticket) throw new AppError(404, "TICKET_NOT_FOUND", "Tiket dapur tidak ditemukan");

    const now = new Date();
    const updated = await prisma.kitchenTicket.update({
      where: { id },
      data: {
        status,
        ...(status === "PREPARING" && !ticket.startedAt ? { startedAt: now } : {}),
        ...(status === "READY" ? { readyAt: now } : {}),
        ...(status === "BUMPED" ? { bumpedAt: now } : {}),
      },
      include: { station: true },
    });

    await prisma.orderItem.updateMany({
      where: { roundId: ticket.roundId, stationId: ticket.stationId },
      data: { kitchenStatus: status },
    });

    // Jika semua tiket order sudah READY/BUMPED, tandai order SERVED (kecuali sudah PAID)
    const pendingTickets = await prisma.kitchenTicket.count({
      where: { orderId: ticket.orderId, status: { in: ["NEW", "PREPARING"] } },
    });
    if (pendingTickets === 0) {
      await prisma.order.updateMany({
        where: { id: ticket.orderId, status: "SENT" },
        data: { status: "SERVED" },
      });
      emitOrderUpdate(ticket.outletId, { type: "SERVED", orderId: ticket.orderId });
    }

    emitKdsUpdate(ticket.outletId, ticket.station.code, { type: "STATUS_CHANGED", ticketId: id, status });
    res.json(serializeJson(updated));
  } catch (err) {
    next(err);
  }
});
