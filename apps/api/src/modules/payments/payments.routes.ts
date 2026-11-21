import { Router } from "express";
import { calculateCashChange, createPaymentSchema, refundPaymentSchema } from "@pos/shared";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { paymentGateway } from "../../lib/payment-gateway.js";
import { writeAuditLog } from "../../lib/audit.js";
import { emitOrderUpdate } from "../../lib/socket.js";
import { requireAuth, verifyManagerPin } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error.js";
import {
  deductStockForOrder,
  freeTableIfOccupied,
  generateReceiptNo,
  recalculateOrder,
} from "../orders/orders.service.js";

export const paymentsRouter = Router();

/**
 * Webhook publik dari Payment Gateway (Midtrans) — idempotent & verifikasi signature.
 */
paymentsRouter.post("/webhooks/payment/:provider", async (req, res, next) => {
  try {
    const provider = req.params.provider;
    const body = req.body as {
      order_id: string;
      status_code: string;
      gross_amount: string;
      signature_key: string;
      transaction_status: string;
      transaction_id?: string;
    };

    const valid = paymentGateway.verifyWebhookSignature({
      order_id: String(body.order_id ?? ""),
      status_code: String(body.status_code ?? "200"),
      gross_amount: String(body.gross_amount ?? "0"),
      signature_key: String(body.signature_key ?? ""),
    });
    if (!valid) {
      throw new AppError(401, "INVALID_SIGNATURE", "Signature webhook tidak valid");
    }

    const eventKey = `${provider}:${body.order_id}:${body.transaction_status}`;
    const already = await prisma.paymentWebhookEvent.findUnique({ where: { eventKey } });
    if (already) {
      return res.json({ ok: true, idempotent: true });
    }

    await prisma.paymentWebhookEvent.create({
      data: {
        provider,
        eventKey,
        payload: JSON.stringify(body),
      },
    });

    if (body.transaction_status === "settlement" || body.transaction_status === "capture") {
      const payment = await prisma.payment.findFirst({ where: { referenceNo: body.order_id } });
      if (payment && payment.status !== "SETTLED") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "SETTLED", settledAt: new Date() },
        });
        await finalizeOrderIfFullyPaid(payment.orderId, null);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

async function finalizeOrderIfFullyPaid(orderId: number, userId: number | null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true },
  });
  if (!order) return null;

  const settledTotal = order.payments
    .filter((p) => p.status === "SETTLED")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (settledTotal >= Number(order.grandTotal) && order.status !== "PAID" && order.status !== "CLOSED") {
    const receiptNo = order.receiptNo ?? (await generateReceiptNo(order.outletId));
    const paidOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        receiptNo,
        paidAt: new Date(),
      },
      include: {
        table: true,
        cashier: { select: { id: true, name: true } },
        items: { include: { modifiers: true } },
        payments: true,
      },
    });

    await deductStockForOrder(order.id, userId);
    await freeTableIfOccupied(order.tableId, order.outletId);
    emitOrderUpdate(order.outletId, { type: "PAID", orderId: order.id, receiptNo });
    return paidOrder;
  }
  return order;
}

paymentsRouter.use(requireAuth);

paymentsRouter.post("/orders/:id/payments", validateBody(createPaymentSchema), async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const order = await recalculateOrder(orderId);
    if (["PAID", "CLOSED", "VOID"].includes(order.status)) {
      throw new AppError(400, "ORDER_ALREADY_FINAL", "Order sudah lunas atau dibatalkan");
    }

    if (req.body.tipAmount) {
      await prisma.order.update({
        where: { id: orderId },
        data: { tipAmount: BigInt(req.body.tipAmount) },
      });
    }

    const createdPayments = [];
    for (const p of req.body.payments) {
      if (p.method === "QRIS") {
        const qris = await paymentGateway.createQris({
          orderId: order.orderNo,
          grossAmount: p.amount,
          customerName: order.customerName ?? undefined,
        });
        const payment = await prisma.payment.create({
          data: {
            outletId: order.outletId,
            orderId: order.id,
            method: "QRIS",
            status: "PENDING",
            amount: BigInt(p.amount),
            paidAmount: BigInt(p.amount),
            referenceNo: qris.referenceNo,
            qrString: qris.qrString,
            provider: qris.provider,
            createdBy: req.user!.id,
          },
        });
        createdPayments.push(payment);
      } else {
        const paidAmount = p.method === "CASH" ? (p.paidAmount ?? p.amount) : p.amount;
        const changeAmt = p.method === "CASH" ? calculateCashChange(p.amount, paidAmount) : 0;
        if (p.method === "CASH" && paidAmount < p.amount) {
          throw new AppError(400, "INSUFFICIENT_CASH", "Uang tunai kurang dari nominal pembayaran");
        }
        const payment = await prisma.payment.create({
          data: {
            outletId: order.outletId,
            orderId: order.id,
            method: p.method,
            status: "SETTLED",
            amount: BigInt(p.amount),
            paidAmount: BigInt(paidAmount),
            changeAmt: BigInt(changeAmt),
            referenceNo: p.referenceNo ?? null,
            settledAt: new Date(),
            createdBy: req.user!.id,
          },
        });
        createdPayments.push(payment);
      }
    }

    const updatedOrder = await finalizeOrderIfFullyPaid(order.id, req.user!.id);
    res.status(201).json(serializeJson({ order: updatedOrder, payments: createdPayments }));
  } catch (err) {
    next(err);
  }
});

/**
 * Helper khusus sandbox/mock untuk mensimulasikan settlement QRIS dari UI POS.
 */
paymentsRouter.post("/payments/:id/simulate-settle", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment || payment.method !== "QRIS") {
      throw new AppError(404, "PAYMENT_NOT_FOUND", "Pembayaran QRIS tidak ditemukan");
    }
    if (payment.status !== "SETTLED") {
      await prisma.payment.update({
        where: { id },
        data: { status: "SETTLED", settledAt: new Date() },
      });
    }
    const updatedOrder = await finalizeOrderIfFullyPaid(payment.orderId, req.user!.id);
    res.json(serializeJson({ order: updatedOrder }));
  } catch (err) {
    next(err);
  }
});

paymentsRouter.post("/payments/:id/refund", validateBody(refundPaymentSchema), async (req, res, next) => {
  try {
    const paymentId = Number(req.params.id);
    const manager = await verifyManagerPin(req.body.managerPin, req.user!.outletId);

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { refunds: true },
    });
    if (!payment || payment.status !== "SETTLED") {
      throw new AppError(400, "CANNOT_REFUND", "Hanya pembayaran SETTLED yang bisa di-refund");
    }

    const refundedSoFar = payment.refunds.reduce((s, r) => s + Number(r.amount), 0);
    if (refundedSoFar + req.body.amount > Number(payment.amount)) {
      throw new AppError(400, "REFUND_EXCEEDS_PAID", "Nominal refund melebihi jumlah pembayaran");
    }

    const refund = await prisma.refund.create({
      data: {
        outletId: payment.outletId,
        paymentId: payment.id,
        amount: BigInt(req.body.amount),
        reason: req.body.reason,
        approvedBy: manager.id,
        createdBy: req.user!.id,
      },
    });

    if (refundedSoFar + req.body.amount === Number(payment.amount)) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
    }

    await writeAuditLog({
      outletId: payment.outletId,
      userId: req.user!.id,
      action: "PAYMENT_REFUND",
      entityType: "Payment",
      entityId: payment.id,
      reason: `${req.body.reason} (Approved by ${manager.name})`,
      afterValue: { refundAmount: req.body.amount },
      ipAddress: req.ip,
    });

    res.status(201).json(serializeJson(refund));
  } catch (err) {
    next(err);
  }
});
