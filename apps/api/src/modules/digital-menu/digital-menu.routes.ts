import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  DIGITAL_MENU_SLUG_REGEX,
  RESERVED_DIGITAL_MENU_SLUGS,
  hasPlanFeature,
  normalizePlanTier,
  updateDigitalMenuSchema,
} from "@pos/shared";
import { prisma, serializeJson } from "../../lib/prisma.js";
import { getOutletSettingsMap } from "../../lib/settings.js";
import { writeAuditLog } from "../../lib/audit.js";
import { invalidateRbacCache } from "../../lib/rbac-cache.js";
import { requireAuth, requireFeature, requirePermission } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { AppError } from "../../middleware/error.js";

const PUBLIC_BASE_URL = process.env.PUBLIC_LANDING_URL || "https://kassa.biz.id";

function getEffectivePlan(plan: string, planExpiresAt: Date | null) {
  const raw = normalizePlanTier(plan);
  const expired = raw !== "FREE" && planExpiresAt !== null && planExpiresAt.getTime() < Date.now();
  return expired ? "FREE" : raw;
}

function cleanStr(val: string | null | undefined): string | null | undefined {
  if (val === undefined) return undefined;
  if (val === null) return null;
  const trimmed = val.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeInstagram(val: string | null | undefined): string | null | undefined {
  const c = cleanStr(val);
  if (!c) return c;
  return c.replace(/^@+/, "");
}

// ============================================================================
// AUTHENTICATED ADMIN ROUTER (/api/v1/digital-menu) — Khusus Tenant PRO
// ============================================================================

export const digitalMenuRouter = Router();
digitalMenuRouter.use(requireAuth, requireFeature("digitalMenu"));

digitalMenuRouter.get("/", requirePermission("settings.manage"), async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        digitalMenu: true,
        outlets: {
          where: { isActive: true },
          orderBy: { id: "asc" },
          select: { id: true, code: true, name: true, address: true, phone: true },
        },
      },
    });

    if (!tenant) {
      return next(new AppError(404, "TENANT_NOT_FOUND", "Tenant tidak ditemukan"));
    }

    const activeOutletId =
      tenant.digitalMenu?.defaultOutletId &&
      tenant.outlets.some((o) => o.id === tenant.digitalMenu?.defaultOutletId)
        ? tenant.digitalMenu.defaultOutletId
        : tenant.outlets[0]?.id ?? req.user!.outletId;

    const [activeProductCount, categoryCount, outletSettings] = await Promise.all([
      prisma.product.count({
        where: { outletId: activeOutletId, deletedAt: null, isAvailable: true },
      }),
      prisma.category.count({
        where: { outletId: activeOutletId, deletedAt: null },
      }),
      getOutletSettingsMap(activeOutletId),
    ]);

    const defaultOutlet = tenant.outlets.find((o) => o.id === activeOutletId) ?? tenant.outlets[0];
    const dm = tenant.digitalMenu;

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: req.user!.plan,
      },
      publicUrl: `${PUBLIC_BASE_URL}/p/${tenant.slug}`,
      outlets: tenant.outlets,
      stats: {
        activeProductCount,
        categoryCount,
      },
      config: {
        enabled: dm?.enabled ?? false,
        slug: tenant.slug,
        defaultOutletId: activeOutletId,
        displayName: dm?.displayName ?? outletSettings.businessName ?? tenant.name,
        tagline: dm?.tagline ?? "",
        description: dm?.description ?? "",
        city: dm?.city ?? "",
        address: dm?.address ?? defaultOutlet?.address ?? outletSettings.address ?? "",
        openingHours: dm?.openingHours ?? "",
        whatsapp: dm?.whatsapp ?? defaultOutlet?.phone ?? outletSettings.phone ?? "",
        instagram: dm?.instagram ?? "",
        googleMapsUrl: dm?.googleMapsUrl ?? "",
        heroImageUrl: dm?.heroImageUrl ?? "",
        logoUrl: dm?.logoUrl ?? "",
        themeAccent: dm?.themeAccent ?? "amber",
        showPrices: dm?.showPrices ?? true,
        showUnavailable: dm?.showUnavailable ?? true,
        seoTitle: dm?.seoTitle ?? "",
        seoDescription: dm?.seoDescription ?? "",
        seoKeywords: dm?.seoKeywords ?? "",
        cuisineType: dm?.cuisineType ?? "",
        priceRange: dm?.priceRange ?? "$$",
        updatedAt: dm?.updatedAt ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
});

digitalMenuRouter.get("/check-slug", requirePermission("settings.manage"), async (req, res, next) => {
  try {
    const rawSlug = String(req.query.slug ?? "").trim().toLowerCase();
    if (rawSlug.length < 3 || rawSlug.length > 80 || !DIGITAL_MENU_SLUG_REGEX.test(rawSlug)) {
      return res.json({
        slug: rawSlug,
        available: false,
        reason: "Slug harus 3–80 karakter (huruf kecil, angka, dan tanda hubung -)",
      });
    }
    if (RESERVED_DIGITAL_MENU_SLUGS.has(rawSlug)) {
      return res.json({
        slug: rawSlug,
        available: false,
        reason: "Slug ini dicadangkan oleh sistem",
      });
    }
    const existing = await prisma.tenant.findUnique({
      where: { slug: rawSlug },
      select: { id: true },
    });
    const available = !existing || existing.id === req.user!.tenantId;
    res.json({
      slug: rawSlug,
      available,
      reason: available ? null : "Slug sudah digunakan oleh cafe lain",
    });
  } catch (err) {
    next(err);
  }
});

digitalMenuRouter.patch(
  "/",
  requirePermission("settings.manage"),
  validateBody(updateDigitalMenuSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.user!.tenantId;
      const body = req.body;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          digitalMenu: true,
          outlets: { where: { isActive: true }, select: { id: true } },
        },
      });
      if (!tenant) {
        return next(new AppError(404, "TENANT_NOT_FOUND", "Tenant tidak ditemukan"));
      }

      let nextSlug = tenant.slug;
      if (body.slug && body.slug !== tenant.slug) {
        const candidate = String(body.slug).trim().toLowerCase();
        if (RESERVED_DIGITAL_MENU_SLUGS.has(candidate)) {
          return next(new AppError(400, "RESERVED_SLUG", "Nama URL (slug) ini dicadangkan oleh sistem"));
        }
        const conflict = await prisma.tenant.findUnique({
          where: { slug: candidate },
          select: { id: true },
        });
        if (conflict && conflict.id !== tenantId) {
          return next(new AppError(409, "SLUG_TAKEN", "Nama URL (slug) sudah dipakai oleh bisnis lain"));
        }
        nextSlug = candidate;
      }

      if (
        body.defaultOutletId !== undefined &&
        body.defaultOutletId !== null &&
        !tenant.outlets.some((o) => o.id === body.defaultOutletId)
      ) {
        return next(new AppError(400, "INVALID_OUTLET", "Outlet default tidak ditemukan pada tenant ini"));
      }

      const dataPayload = {
        ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
        ...(body.defaultOutletId !== undefined ? { defaultOutletId: body.defaultOutletId } : {}),
        ...(body.displayName !== undefined ? { displayName: cleanStr(body.displayName) } : {}),
        ...(body.tagline !== undefined ? { tagline: cleanStr(body.tagline) } : {}),
        ...(body.description !== undefined ? { description: cleanStr(body.description) } : {}),
        ...(body.city !== undefined ? { city: cleanStr(body.city) } : {}),
        ...(body.address !== undefined ? { address: cleanStr(body.address) } : {}),
        ...(body.openingHours !== undefined ? { openingHours: cleanStr(body.openingHours) } : {}),
        ...(body.whatsapp !== undefined ? { whatsapp: cleanStr(body.whatsapp) } : {}),
        ...(body.instagram !== undefined ? { instagram: normalizeInstagram(body.instagram) } : {}),
        ...(body.googleMapsUrl !== undefined ? { googleMapsUrl: cleanStr(body.googleMapsUrl) } : {}),
        ...(body.heroImageUrl !== undefined ? { heroImageUrl: cleanStr(body.heroImageUrl) } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: cleanStr(body.logoUrl) } : {}),
        ...(body.themeAccent !== undefined ? { themeAccent: body.themeAccent } : {}),
        ...(body.showPrices !== undefined ? { showPrices: body.showPrices } : {}),
        ...(body.showUnavailable !== undefined ? { showUnavailable: body.showUnavailable } : {}),
        ...(body.seoTitle !== undefined ? { seoTitle: cleanStr(body.seoTitle) } : {}),
        ...(body.seoDescription !== undefined ? { seoDescription: cleanStr(body.seoDescription) } : {}),
        ...(body.seoKeywords !== undefined ? { seoKeywords: cleanStr(body.seoKeywords) } : {}),
        ...(body.cuisineType !== undefined ? { cuisineType: cleanStr(body.cuisineType) } : {}),
        ...(body.priceRange !== undefined ? { priceRange: body.priceRange } : {}),
      };

      const saved = await prisma.$transaction(async (tx) => {
        if (nextSlug !== tenant.slug) {
          await tx.tenant.update({
            where: { id: tenantId },
            data: { slug: nextSlug },
          });
        }
        return tx.tenantDigitalMenu.upsert({
          where: { tenantId },
          create: {
            tenantId,
            enabled: body.enabled ?? false,
            defaultOutletId: body.defaultOutletId ?? tenant.outlets[0]?.id ?? null,
            ...dataPayload,
          },
          update: dataPayload,
        });
      });

      if (nextSlug !== tenant.slug) {
        invalidateRbacCache();
      }

      await writeAuditLog({
        outletId: req.user!.outletId,
        userId: req.user!.id,
        action: "DIGITAL_MENU_UPDATE",
        entityType: "TenantDigitalMenu",
        entityId: saved.id,
        beforeValue: tenant.digitalMenu ? { slug: tenant.slug, ...tenant.digitalMenu } : { slug: tenant.slug },
        afterValue: { slug: nextSlug, ...saved },
        ipAddress: req.ip,
      });

      res.json({
        slug: nextSlug,
        publicUrl: `${PUBLIC_BASE_URL}/p/${nextSlug}`,
        config: serializeJson(saved),
      });
    } catch (err) {
      next(err);
    }
  },
);

// ============================================================================
// PUBLIC ROUTER (/api/v1/public/digital-menu) — Untuk SSR kassa.biz.id/p/[slug] & SEO Sitemap
// ============================================================================

export const publicDigitalMenuRouter = Router();

const publicLimiter = rateLimit({
  windowMs: 60_000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
});

publicDigitalMenuRouter.use(publicLimiter);

/**
 * Daftar slug aktif untuk Dynamic XML Sitemap (Googlebot indexing)
 */
publicDigitalMenuRouter.get("/sitemap", async (_req, res, next) => {
  try {
    const now = new Date();
    const rows = await prisma.tenantDigitalMenu.findMany({
      where: {
        enabled: true,
        tenant: {
          isActive: true,
          plan: { in: ["PRO", "ENTERPRISE"] },
          OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }],
        },
      },
      select: {
        updatedAt: true,
        tenant: {
          select: { slug: true, updatedAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({
      items: rows.map((r) => ({
        slug: r.tenant.slug,
        updatedAt: (r.updatedAt > r.tenant.updatedAt ? r.updatedAt : r.tenant.updatedAt).toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Data lengkap halaman menu digital publik untuk /p/[slug]
 */
publicDigitalMenuRouter.get("/:slug", async (req, res, next) => {
  try {
    const slug = String(req.params.slug ?? "").trim().toLowerCase();
    if (!slug) {
      return next(new AppError(404, "NOT_FOUND", "Halaman menu digital tidak ditemukan"));
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        digitalMenu: true,
        outlets: {
          where: { isActive: true },
          orderBy: { id: "asc" },
          select: { id: true, code: true, name: true, address: true, phone: true, timezone: true },
        },
      },
    });

    if (!tenant || !tenant.isActive || !tenant.digitalMenu || !tenant.digitalMenu.enabled) {
      return next(new AppError(404, "DIGITAL_MENU_NOT_FOUND", "Menu digital tidak ditemukan atau belum aktif"));
    }

    const effectivePlan = getEffectivePlan(tenant.plan, tenant.planExpiresAt);
    if (!hasPlanFeature(effectivePlan, "digitalMenu")) {
      return next(new AppError(404, "DIGITAL_MENU_UNAVAILABLE", "Halaman menu digital sedang tidak tersedia"));
    }

    const requestedOutletId = req.query.outletId ? Number(req.query.outletId) : null;
    const dm = tenant.digitalMenu;
    const activeOutlet =
      (requestedOutletId ? tenant.outlets.find((o) => o.id === requestedOutletId) : null) ??
      (dm.defaultOutletId ? tenant.outlets.find((o) => o.id === dm.defaultOutletId) : null) ??
      tenant.outlets[0];

    if (!activeOutlet) {
      return next(new AppError(404, "OUTLET_NOT_FOUND", "Outlet aktif tidak ditemukan"));
    }

    const [categories, products, settingsMap] = await Promise.all([
      prisma.category.findMany({
        where: { outletId: activeOutlet.id, deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true, name: true, tone: true, sortOrder: true },
      }),
      prisma.product.findMany({
        where: {
          outletId: activeOutlet.id,
          deletedAt: null,
          ...(dm.showUnavailable ? {} : { isAvailable: true }),
        },
        include: {
          variants: { orderBy: [{ isDefault: "desc" }, { priceDelta: "asc" }] },
          modifierGroups: {
            include: {
              modifierGroup: {
                include: {
                  modifiers: {
                    where: { isAvailable: true },
                    orderBy: { id: "asc" },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ categoryId: "asc" }, { name: "asc" }],
      }),
      getOutletSettingsMap(activeOutlet.id),
    ]);

    const groupedCategories = categories
      .map((cat) => {
        const items = products
          .filter((p) => p.categoryId === cat.id)
          .map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            monogram: p.monogram,
            tone: p.tone,
            price: Number(p.price),
            imageUrl: p.imageUrl,
            isAvailable: p.isAvailable,
            variants: p.variants.map((v) => ({
              id: v.id,
              name: v.name,
              priceDelta: Number(v.priceDelta),
              finalPrice: Number(p.price) + Number(v.priceDelta),
              isDefault: v.isDefault,
            })),
            modifierGroups: p.modifierGroups
              .map((pmg) => ({
                id: pmg.modifierGroup.id,
                name: pmg.modifierGroup.name,
                isRequired: pmg.modifierGroup.isRequired,
                modifiers: pmg.modifierGroup.modifiers.map((m) => ({
                  id: m.id,
                  name: m.name,
                  price: Number(m.price),
                })),
              }))
              .filter((g) => g.modifiers.length > 0),
          }));
        return {
          id: cat.id,
          name: cat.name,
          tone: cat.tone,
          items,
        };
      })
      .filter((c) => c.items.length > 0);

    const displayName = dm.displayName || settingsMap.businessName || tenant.name;

    res.json({
      slug: tenant.slug,
      updatedAt: dm.updatedAt.toISOString(),
      cafe: {
        displayName,
        tagline: dm.tagline || null,
        description: dm.description || null,
        city: dm.city || null,
        address: dm.address || activeOutlet.address || null,
        openingHours: dm.openingHours || null,
        whatsapp: dm.whatsapp || activeOutlet.phone || null,
        instagram: dm.instagram || null,
        googleMapsUrl: dm.googleMapsUrl || null,
        heroImageUrl: dm.heroImageUrl || null,
        logoUrl: dm.logoUrl || null,
        themeAccent: dm.themeAccent || "amber",
        showPrices: dm.showPrices,
        showUnavailable: dm.showUnavailable,
        cuisineType: dm.cuisineType || "Cafe & Restaurant",
        priceRange: dm.priceRange || "$$",
      },
      seo: {
        title: dm.seoTitle || null,
        description: dm.seoDescription || null,
        keywords: dm.seoKeywords || null,
      },
      taxInfo: {
        taxRatePercent: Number(settingsMap.taxRatePercent ?? 0),
        serviceChargePercent: Number(settingsMap.serviceChargePercent ?? 0),
        taxInclusive: settingsMap.taxInclusive === "true",
      },
      activeOutlet: {
        id: activeOutlet.id,
        code: activeOutlet.code,
        name: activeOutlet.name,
        address: activeOutlet.address,
        phone: activeOutlet.phone,
      },
      outlets: tenant.outlets.map((o) => ({
        id: o.id,
        code: o.code,
        name: o.name,
        address: o.address,
      })),
      categories: groupedCategories,
      totalItems: groupedCategories.reduce((sum, c) => sum + c.items.length, 0),
    });
  } catch (err) {
    next(err);
  }
});
