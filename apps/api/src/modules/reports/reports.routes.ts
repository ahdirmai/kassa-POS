import { Router } from "express";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { requireAuth, requireFeature, requirePermission } from "../../middleware/auth.js";

export const reportsRouter = Router();
reportsRouter.use(requireAuth);
reportsRouter.use(requireFeature("reports"));
reportsRouter.use(requirePermission("report.view"));

reportsRouter.get("/dashboard", async (req, res, next) => {
  try {
    const outletId = req.user!.outletId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayOrders, allPaidOrders, tables, ingredients, activeShift] = await Promise.all([
      prisma.order.findMany({
        where: { outletId, createdAt: { gte: startOfDay }, status: { in: ["PAID", "CLOSED"] } },
        include: { payments: { where: { status: "SETTLED" } }, items: true },
      }),
      prisma.order.findMany({
        where: { outletId, status: { in: ["PAID", "CLOSED"] } },
        include: { payments: { where: { status: "SETTLED" } }, items: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.diningTable.findMany({ where: { outletId } }),
      prisma.ingredient.findMany({ where: { outletId, deletedAt: null } }),
      prisma.shift.findFirst({ where: { outletId, status: "OPEN" }, include: { user: { select: { name: true } } } }),
    ]);

    const todaySales = todayOrders.reduce((s, o) => s + Number(o.grandTotal), 0);
    const todayTax = todayOrders.reduce((s, o) => s + Number(o.taxAmount), 0);
    const todayService = todayOrders.reduce((s, o) => s + Number(o.serviceChargeAmount), 0);
    const todayCount = todayOrders.length;
    const avgBill = todayCount > 0 ? Math.round(todaySales / todayCount) : 0;

    // Hourly sales buckets (08:00 - 22:00)
    const hourly = Array.from({ length: 15 }, (_, idx) => {
      const hour = idx + 8;
      const total = todayOrders
        .filter((o) => new Date(o.createdAt).getHours() === hour)
        .reduce((s, o) => s + Number(o.grandTotal), 0);
      return { hour: `${String(hour).padStart(2, "0")}:00`, total };
    });

    // Payment method breakdown
    const paymentBreakdown: Record<string, number> = {};
    for (const o of todayOrders) {
      for (const p of o.payments) {
        paymentBreakdown[p.method] = (paymentBreakdown[p.method] ?? 0) + Number(p.amount);
      }
    }

    // Top products
    const prodAgg = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();
    for (const o of allPaidOrders) {
      for (const it of o.items) {
        const cur = prodAgg.get(it.productName) ?? { name: it.productName, qty: 0, revenue: 0, cost: 0 };
        cur.qty += it.quantity;
        cur.revenue += Number(it.lineTotal);
        cur.cost += Number(it.unitCost) * it.quantity;
        prodAgg.set(it.productName, cur);
      }
    }
    const topProducts = [...prodAgg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    const lowStock = ingredients
      .filter((i) => i.currentStock <= i.minStock)
      .map((i) => ({
        id: i.id,
        sku: i.sku,
        name: i.name,
        currentStock: i.currentStock,
        minStock: i.minStock,
        unit: i.unit,
      }));

    res.json(
      serializeJson({
        kpis: {
          todaySales,
          todayCount,
          avgBill,
          todayTax,
          todayService,
          occupiedTables: tables.filter((t) => t.status !== "AVAILABLE").length,
          totalTables: tables.length,
          lowStockCount: lowStock.length,
        },
        activeShift,
        hourly,
        paymentBreakdown,
        topProducts,
        lowStock,
        recentOrders: allPaidOrders.slice(0, 10),
      }),
    );
  } catch (err) {
    next(err);
  }
});

reportsRouter.get("/sales", async (req, res, next) => {
  try {
    const outletId = req.user!.outletId;
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 86400_000);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();

    const orders = await prisma.order.findMany({
      where: {
        outletId,
        createdAt: { gte: from, lte: to },
        status: { in: ["PAID", "CLOSED", "VOID"] },
      },
      include: {
        cashier: { select: { name: true } },
        table: { select: { code: true } },
        payments: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const paid = orders.filter((o) => o.status !== "VOID");
    const voided = orders.filter((o) => o.status === "VOID");

    const summary = {
      totalTransactions: paid.length,
      voidCount: voided.length,
      grossSales: paid.reduce((s, o) => s + Number(o.subtotal), 0),
      totalDiscount: paid.reduce((s, o) => s + Number(o.discountAmount), 0),
      totalService: paid.reduce((s, o) => s + Number(o.serviceChargeAmount), 0),
      totalTax: paid.reduce((s, o) => s + Number(o.taxAmount), 0),
      netSales: paid.reduce((s, o) => s + Number(o.grandTotal), 0),
      totalCogs: paid.reduce(
        (s, o) => s + o.items.reduce((is, it) => is + Number(it.unitCost) * it.quantity, 0),
        0,
      ),
    };

    res.json(serializeJson({ summary, orders }));
  } catch (err) {
    next(err);
  }
});
