import { calculateOrderTotals } from "@pos/shared";
import { prisma } from "../../lib/prisma.js";
import { getOutletTaxConfig } from "../../lib/settings.js";
import { emitKdsUpdate, emitOrderUpdate, emitTableUpdate } from "../../lib/socket.js";
import { AppError } from "../../middleware/error.js";

export async function generateDailyOrderNumbers(outletId: number) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const count = await prisma.order.count({
    where: { outletId, createdAt: { gte: startOfDay } },
  });
  const seq = count + 1;
  const ymd = startOfDay.toISOString().slice(0, 10).replace(/-/g, "");
  return {
    queueNo: seq,
    orderNo: `ORD-${ymd}-${String(seq).padStart(3, "0")}`,
  };
}

export async function generateReceiptNo(outletId: number) {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.order.count({
    where: { outletId, receiptNo: { not: null } },
  });
  return `RCP-${ymd}-${String(count + 1).padStart(4, "0")}`;
}

export async function resolveOrderItemsInput(
  items: Array<{
    productId: number;
    variantId?: number | null;
    quantity: number;
    notes?: string;
    modifierIds?: number[];
  }>,
  outletId: number,
) {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, outletId, deletedAt: null },
    include: { variants: true },
  });
  const prodMap = new Map(products.map((p) => [p.id, p]));

  const allModIds = [...new Set(items.flatMap((i) => i.modifierIds ?? []))];
  const mods = allModIds.length
    ? await prisma.modifier.findMany({ where: { id: { in: allModIds }, group: { outletId } } })
    : [];
  const modMap = new Map(mods.map((m) => [m.id, m]));

  return items.map((input) => {
    const product = prodMap.get(input.productId);
    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", `Produk #${input.productId} tidak ditemukan`);
    }
    const variant = input.variantId ? product.variants.find((v) => v.id === input.variantId) : null;
    const unitPrice = Number(product.price) + (variant ? Number(variant.priceDelta) : 0);
    const chosenMods = (input.modifierIds ?? [])
      .map((id) => modMap.get(id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m));
    const modifiersSum = chosenMods.reduce((s, m) => s + Number(m.price), 0);
    const lineTotal = (unitPrice + modifiersSum) * input.quantity;

    return {
      productId: product.id,
      variantId: variant?.id ?? null,
      productName: product.name,
      variantName: variant?.name ?? null,
      stationId: product.stationId,
      unitPrice,
      unitCost: Number(product.cost),
      modifiersSum,
      quantity: input.quantity,
      lineTotal,
      notes: input.notes ?? null,
      modifiers: chosenMods.map((m) => ({
        modifierId: m.id,
        modifierName: m.name,
        price: Number(m.price),
      })),
    };
  });
}

export async function recalculateOrder(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");

  const taxCfg = await getOutletTaxConfig(order.outletId);
  const totals = calculateOrderTotals(
    order.items.map((it) => ({
      unitPrice: Number(it.unitPrice),
      modifiersPrice: Number(it.modifiersSum),
      quantity: it.quantity,
    })),
    order.discountType && order.discountValue > 0
      ? { type: order.discountType as "PERCENT" | "FIXED", value: order.discountValue }
      : null,
    taxCfg,
  );

  return prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal: BigInt(totals.subtotal),
      discountAmount: BigInt(totals.totalDiscount),
      serviceChargeAmount: BigInt(totals.serviceChargeAmount),
      taxAmount: BigInt(totals.taxAmount),
      roundingAmount: BigInt(totals.roundingAmount),
      grandTotal: BigInt(totals.grandTotal),
    },
    include: {
      table: true,
      cashier: { select: { id: true, name: true } },
      items: { include: { modifiers: true }, orderBy: { id: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      kitchenTickets: { include: { station: true } },
    },
  });
}

export async function sendOrderToKitchen(orderId: number, userId: number, outletId?: number) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, ...(outletId !== undefined ? { outletId } : {}) },
    include: {
      items: { where: { roundId: null }, include: { modifiers: true } },
      rounds: true,
      table: true,
    },
  });
  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order tidak ditemukan");
  if (!order.items.length) {
    throw new AppError(400, "NO_PENDING_ITEMS", "Semua item sudah dikirim ke dapur");
  }

  const nextRoundNo = order.rounds.length + 1;
  const round = await prisma.orderRound.create({
    data: {
      orderId: order.id,
      roundNo: nextRoundNo,
      createdBy: userId,
    },
  });

  await prisma.orderItem.updateMany({
    where: { id: { in: order.items.map((i) => i.id) } },
    data: { roundId: round.id, kitchenStatus: "NEW" },
  });

  // Group items by stationId and create KitchenTicket per station
  const defaultStation = await prisma.station.findFirst({
    where: { outletId: order.outletId },
    orderBy: { id: "asc" },
  });
  const stationIds = [
    ...new Set(order.items.map((i) => i.stationId ?? defaultStation?.id).filter((x): x is number => Boolean(x))),
  ];

  const createdTickets = [];
  for (const stId of stationIds) {
    const ticket = await prisma.kitchenTicket.create({
      data: {
        outletId: order.outletId,
        orderId: order.id,
        roundId: round.id,
        stationId: stId,
        status: "NEW",
      },
      include: { station: true },
    });
    createdTickets.push(ticket);
    emitKdsUpdate(order.outletId, ticket.station.code, { type: "NEW_TICKET", ticketId: ticket.id, orderId: order.id });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: order.status === "OPEN" || order.status === "DRAFT" ? "SENT" : order.status },
    include: {
      table: true,
      items: { include: { modifiers: true } },
      kitchenTickets: { include: { station: true } },
    },
  });

  emitOrderUpdate(order.outletId, { type: "SENT", orderId: order.id });
  return { order: updated, round, tickets: createdTickets };
}

/**
 * Kurangi stok bahan baku secara otomatis berdasarkan resep setiap item saat order PAID.
 * Append-only di stock_movements; stok negatif diizinkan (untuk sinkron offline).
 */
export async function deductStockForOrder(orderId: number, userId: number | null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              recipe: {
                include: { items: { include: { ingredient: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!order) return;

  for (const line of order.items) {
    const recipeItems = line.product?.recipe?.items ?? [];
    for (const ri of recipeItems) {
      const deductQty = ri.qty * line.quantity;
      const ing = await prisma.ingredient.findUnique({ where: { id: ri.ingredientId } });
      if (!ing) continue;
      const newBalance = Number((ing.currentStock - deductQty).toFixed(3));
      await prisma.ingredient.update({
        where: { id: ing.id },
        data: { currentStock: newBalance },
      });
      await prisma.stockMovement.create({
        data: {
          outletId: order.outletId,
          ingredientId: ing.id,
          type: "SALE_DEDUCT",
          qtyChange: -deductQty,
          balanceAfter: newBalance,
          unitCost: ing.unitCost,
          referenceId: order.orderNo,
          reason: `Penjualan ${line.quantity}x ${line.productName}`,
          createdBy: userId,
        },
      });
    }
  }
}

export async function freeTableIfOccupied(tableId: number | null, outletId: number) {
  if (!tableId) return;
  const remaining = await prisma.order.count({
    where: { tableId, status: { in: ["OPEN", "SENT", "SERVED"] } },
  });
  if (remaining === 0) {
    await prisma.diningTable.update({ where: { id: tableId }, data: { status: "AVAILABLE" } });
    emitTableUpdate(outletId, { type: "AVAILABLE", tableId });
  }
}
