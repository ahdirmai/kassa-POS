import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { PLAN_POLICIES } from "@pos/shared";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import { requirePlatformAuth, requirePlatformRole } from "../../middleware/platform-auth.js";
import { validateBody } from "../../middleware/validate.js";

export const publicLandingRouter = Router();
export const adminLandingRouter = Router();

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `tenant-${crypto.randomBytes(2).toString("hex")}`;
}

async function logLandingAction(params: {
  adminId: number;
  action: string;
  targetId?: string | number;
  summary: string;
  metadata?: unknown;
  ipAddress?: string;
}) {
  await prisma.platformAuditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      targetType: "LANDING",
      targetId: params.targetId !== undefined ? String(params.targetId) : null,
      summary: params.summary,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress ?? null,
    },
  });
}

// ============================================================================
// PUBLIC LANDING ENDPOINTS (dikonsumsi oleh apps/landing — kassa.biz.id)
// ============================================================================

publicLandingRouter.get("/content", async (_req, res, next) => {
  try {
    const row = await prisma.landingContent.findUnique({ where: { key: "default" } });
    if (!row) {
      return res.json({ data: null, updatedAt: null });
    }
    return res.json({
      data: JSON.parse(row.data),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

const publicLeadSchema = z.object({
  name: z.string().min(2).max(120),
  businessName: z.string().max(150).optional().default("Belum diisi"),
  whatsapp: z.string().min(6).max(40),
  email: z.string().email().optional().or(z.literal("")),
  outletCount: z.string().max(40).optional(),
  planInterest: z.string().max(40).optional(),
  message: z.string().max(1000).optional(),
  source: z.string().max(60).optional(),
  utmSource: z.string().max(80).optional(),
  utmMedium: z.string().max(80).optional(),
  utmCampaign: z.string().max(120).optional(),
});

publicLandingRouter.post("/leads", validateBody(publicLeadSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof publicLeadSchema>;
    const leadCode = `lead_${crypto.randomBytes(6).toString("hex")}`;
    const lead = await prisma.landingLead.create({
      data: {
        leadCode,
        name: body.name.trim(),
        businessName: body.businessName.trim(),
        whatsapp: body.whatsapp.trim(),
        email: body.email?.trim() || null,
        outletCount: body.outletCount || "1 outlet",
        planInterest: body.planInterest || "Pro",
        message: body.message?.trim() || null,
        source: body.source || "landing-form",
        utmSource: body.utmSource || null,
        utmMedium: body.utmMedium || null,
        utmCampaign: body.utmCampaign || null,
      },
    });
    res.status(201).json({ lead });
  } catch (err) {
    next(err);
  }
});

const publicTrackSchema = z.object({
  type: z.enum(["pageview", "click"]),
  visitorId: z.string().min(1).max(80),
  path: z.string().max(255).default("/"),
  referrer: z.string().max(255).optional(),
  source: z.string().max(80).default("Direct"),
  device: z.string().max(20).default("Desktop"),
  label: z.string().max(120).optional(),
  target: z.string().max(255).optional(),
  utmSource: z.string().max(80).optional(),
  utmMedium: z.string().max(80).optional(),
  utmCampaign: z.string().max(120).optional(),
});

publicLandingRouter.post("/track", validateBody(publicTrackSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof publicTrackSchema>;
    const event = await prisma.landingAnalyticsEvent.create({
      data: {
        type: body.type,
        visitorId: body.visitorId,
        path: body.path || "/",
        referrer: body.referrer || null,
        source: body.source || "Direct",
        device: body.device || "Desktop",
        label: body.label || null,
        target: body.target || null,
        utmSource: body.utmSource || null,
        utmMedium: body.utmMedium || null,
        utmCampaign: body.utmCampaign || null,
      },
    });
    res.status(201).json({ ok: true, id: event.id });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// PROTECTED BACK OFFICE LANDING ENDPOINTS (/api/v1/landing/*)
// ============================================================================

adminLandingRouter.use(requirePlatformAuth);

adminLandingRouter.get("/overview", async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [events, leads, totalLeadsAll, wonLeadsAll] = await Promise.all([
      prisma.landingAnalyticsEvent.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.landingLead.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.landingLead.count(),
      prisma.landingLead.count({ where: { status: "won" } }),
    ]);

    const visitors = new Set<string>();
    let pageviews = 0;
    let clicks = 0;
    const ctaMap = new Map<string, number>();
    const sourceMap = new Map<string, number>();
    const deviceMap = new Map<string, number>();
    const dailyMap = new Map<string, { date: string; pageviews: number; clicks: number; leads: number }>();

    // Seed last 7 days buckets
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      dailyMap.set(d, { date: d, pageviews: 0, clicks: 0, leads: 0 });
    }

    for (const ev of events) {
      visitors.add(ev.visitorId);
      const dayKey = ev.createdAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(dayKey);

      if (ev.type === "pageview") {
        pageviews++;
        if (bucket) bucket.pageviews++;
        const src = ev.utmCampaign
          ? `${ev.utmSource || ev.source} (${ev.utmCampaign})`
          : ev.utmSource || ev.source || "Direct";
        sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
        deviceMap.set(ev.device || "Desktop", (deviceMap.get(ev.device || "Desktop") ?? 0) + 1);
      } else {
        clicks++;
        if (bucket) bucket.clicks++;
        const lbl = ev.label || ev.target || "CTA";
        ctaMap.set(lbl, (ctaMap.get(lbl) ?? 0) + 1);
      }
    }

    for (const l of leads) {
      const dayKey = l.createdAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(dayKey);
      if (bucket) bucket.leads++;
    }

    const conversionRate =
      visitors.size > 0 ? Number(((leads.length / visitors.size) * 100).toFixed(2)) : 0;

    res.json({
      days,
      kpis: {
        pageviews,
        uniqueVisitors: visitors.size,
        clicks,
        leadsPeriod: leads.length,
        totalLeadsAll,
        wonLeadsAll,
        conversionRate,
      },
      topCtas: Array.from(ctaMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, count]) => ({ label, count })),
      topSources: Array.from(sourceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([source, count]) => ({ source, count })),
      devices: Array.from(deviceMap.entries()).map(([device, count]) => ({ device, count })),
      daily: Array.from(dailyMap.values()),
    });
  } catch (err) {
    next(err);
  }
});

// --- LANDING CONTENT CMS ---

adminLandingRouter.get("/content", async (_req, res, next) => {
  try {
    const row = await prisma.landingContent.findUnique({ where: { key: "default" } });
    res.json({
      data: row ? JSON.parse(row.data) : null,
      updatedAt: row ? row.updatedAt.toISOString() : null,
    });
  } catch (err) {
    next(err);
  }
});

adminLandingRouter.put(
  "/content",
  requirePlatformRole("OPS", "MARKETING"),
  async (req, res, next) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== "object") {
        throw new AppError(400, "INVALID_CONTENT", "Payload konten landing tidak valid");
      }
      const nextPayload = {
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      const saved = await prisma.landingContent.upsert({
        where: { key: "default" },
        update: {
          data: JSON.stringify(nextPayload),
          updatedById: req.platformAdmin!.id,
        },
        create: {
          key: "default",
          data: JSON.stringify(nextPayload),
          updatedById: req.platformAdmin!.id,
        },
      });

      await logLandingAction({
        adminId: req.platformAdmin!.id,
        action: "LANDING_CONTENT_UPDATE",
        targetId: saved.id,
        summary: "Memperbarui konten CMS Landing Page (kassa.biz.id)",
        ipAddress: req.ip,
      });

      res.json({ data: nextPayload, updatedAt: saved.updatedAt.toISOString() });
    } catch (err) {
      next(err);
    }
  },
);

adminLandingRouter.post(
  "/content/reset",
  requirePlatformRole("OPS", "MARKETING"),
  async (req, res, next) => {
    try {
      await prisma.landingContent.deleteMany({ where: { key: "default" } });
      await logLandingAction({
        adminId: req.platformAdmin!.id,
        action: "LANDING_CONTENT_RESET",
        summary: "Mereset konten Landing Page ke default bawaan",
        ipAddress: req.ip,
      });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

// --- LEADS CRM ---

adminLandingRouter.get("/leads", async (req, res, next) => {
  try {
    const status = String(req.query.status ?? "").trim().toLowerCase();
    const q = String(req.query.q ?? "").trim();

    const where: Record<string, unknown> = {};
    if (["new", "contacted", "demo", "won", "lost"].includes(status)) {
      where.status = status;
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { businessName: { contains: q } },
        { whatsapp: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const items = await prisma.landingLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        convertedTenant: {
          select: { id: true, name: true, slug: true, plan: true, isActive: true },
        },
      },
    });

    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
});

adminLandingRouter.post(
  "/leads",
  requirePlatformRole("OPS", "MARKETING", "SUPPORT"),
  validateBody(publicLeadSchema),
  async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof publicLeadSchema>;
      const lead = await prisma.landingLead.create({
        data: {
          leadCode: `lead_${crypto.randomBytes(6).toString("hex")}`,
          name: body.name.trim(),
          businessName: body.businessName.trim(),
          whatsapp: body.whatsapp.trim(),
          email: body.email?.trim() || null,
          outletCount: body.outletCount || "1 outlet",
          planInterest: body.planInterest || "Pro",
          message: body.message?.trim() || null,
          source: body.source || "backoffice-manual",
          utmSource: body.utmSource || null,
          utmMedium: body.utmMedium || null,
          utmCampaign: body.utmCampaign || null,
        },
      });
      res.status(201).json({ lead });
    } catch (err) {
      next(err);
    }
  },
);

const patchLeadSchema = z.object({
  status: z.enum(["new", "contacted", "demo", "won", "lost"]).optional(),
  notes: z.string().max(2000).optional(),
  planInterest: z.string().max(40).optional(),
});

adminLandingRouter.patch(
  "/leads/:id",
  requirePlatformRole("OPS", "MARKETING", "SUPPORT"),
  validateBody(patchLeadSchema),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const body = req.body as z.infer<typeof patchLeadSchema>;
      const existing = await prisma.landingLead.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Lead tidak ditemukan");

      const updated = await prisma.landingLead.update({
        where: { id },
        data: {
          status: body.status ?? existing.status,
          notes: body.notes !== undefined ? body.notes : existing.notes,
          planInterest: body.planInterest ?? existing.planInterest,
        },
        include: {
          convertedTenant: {
            select: { id: true, name: true, slug: true, plan: true, isActive: true },
          },
        },
      });

      await logLandingAction({
        adminId: req.platformAdmin!.id,
        action: "LEAD_UPDATE",
        targetId: id,
        summary: `Update lead ${existing.businessName} → status: ${updated.status}`,
        ipAddress: req.ip,
      });

      res.json({ lead: updated });
    } catch (err) {
      next(err);
    }
  },
);

adminLandingRouter.delete(
  "/leads/:id",
  requirePlatformRole("OPS", "MARKETING"),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const existing = await prisma.landingLead.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "NOT_FOUND", "Lead tidak ditemukan");

      await prisma.landingLead.delete({ where: { id } });
      await logLandingAction({
        adminId: req.platformAdmin!.id,
        action: "LEAD_DELETE",
        targetId: id,
        summary: `Menghapus lead ${existing.businessName} (${existing.name})`,
        ipAddress: req.ip,
      });

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

// --- 1-CLICK CONVERT LEAD → TENANT PROVISIONING ---

const convertLeadSchema = z.object({
  businessName: z.string().min(2).max(120).optional(),
  ownerName: z.string().min(2).max(120).optional(),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8).max(72),
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]).default("PRO"),
  durationDays: z.number().int().min(1).max(365).default(14),
});

adminLandingRouter.post(
  "/leads/:id/convert-to-tenant",
  requirePlatformRole("OPS"),
  validateBody(convertLeadSchema),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const body = req.body as z.infer<typeof convertLeadSchema>;

      const lead = await prisma.landingLead.findUnique({ where: { id } });
      if (!lead) throw new AppError(404, "NOT_FOUND", "Lead tidak ditemukan");
      if (lead.convertedTenantId) {
        throw new AppError(400, "ALREADY_CONVERTED", "Lead ini sudah pernah dikonversi menjadi Tenant");
      }

      const email = body.ownerEmail.trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new AppError(409, "EMAIL_EXISTS", `Email ${email} sudah terdaftar di Kassa POS`);
      }

      const ownerRole = await prisma.role.findFirst({
        where: { code: "OWNER", tenantId: null },
      });
      if (!ownerRole) {
        throw new AppError(500, "ROLE_MISSING", "Role sistem OWNER belum tersedia (jalankan seed)");
      }

      const tenantName = (body.businessName || lead.businessName).trim();
      const ownerName = (body.ownerName || lead.name).trim();
      let slug = slugify(tenantName);
      const slugTaken = await prisma.tenant.findUnique({ where: { slug } });
      if (slugTaken) {
        slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
      }

      const outletCode = `OUT-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const policy = PLAN_POLICIES[body.plan];
      const planExpiresAt =
        body.plan === "FREE"
          ? null
          : new Date(Date.now() + body.durationDays * 24 * 60 * 60 * 1000);

      const passwordHash = await bcrypt.hash(body.ownerPassword, 10);
      const pinCode = "1111";
      const pinHash = await bcrypt.hash(pinCode, 10);

      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: tenantName,
            slug,
            plan: body.plan,
            planExpiresAt,
            maxOutlets: policy.maxOutlets,
            maxUsers: policy.maxUsers,
            isActive: true,
          },
        });

        const outlet = await tx.outlet.create({
          data: {
            tenantId: tenant.id,
            code: outletCode,
            name: `${tenantName} — Pusat`,
            phone: lead.whatsapp,
            timezone: "Asia/Jakarta",
          },
        });

        await tx.setting.createMany({
          data: [
            { outletId: outlet.id, key: "businessName", value: tenantName },
            { outletId: outlet.id, key: "outletName", value: outlet.name },
            { outletId: outlet.id, key: "phone", value: lead.whatsapp },
            { outletId: outlet.id, key: "taxRatePercent", value: "10" },
            { outletId: outlet.id, key: "serviceChargePercent", value: "0" },
            { outletId: outlet.id, key: "roundingUnit", value: "100" },
          ],
        });

        const owner = await tx.user.create({
          data: {
            tenantId: tenant.id,
            outletId: outlet.id,
            roleId: ownerRole.id,
            name: ownerName,
            email,
            passwordHash,
            pinHash,
            pinCode,
            isActive: true,
          },
          select: { id: true, name: true, email: true },
        });

        const updatedLead = await tx.landingLead.update({
          where: { id: lead.id },
          data: {
            status: "won",
            convertedTenantId: tenant.id,
            email,
          },
        });

        return { tenant, outlet, owner, lead: updatedLead };
      });

      await logLandingAction({
        adminId: req.platformAdmin!.id,
        action: "LEAD_CONVERT_TO_TENANT",
        targetId: result.tenant.id,
        summary: `Konversi lead ${lead.businessName} → Tenant ${result.tenant.name} (${body.plan}, Owner: ${email})`,
        metadata: { leadId: lead.id, tenantId: result.tenant.id, plan: body.plan },
        ipAddress: req.ip,
      });

      res.status(201).json({
        ...result,
        outletCode: result.outlet.code,
        defaultPin: pinCode,
      });
    } catch (err) {
      next(err);
    }
  },
);
