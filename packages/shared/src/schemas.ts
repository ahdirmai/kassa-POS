import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export const registerSchema = z.object({
  businessName: z.string().min(2, "Nama bisnis minimal 2 karakter").max(120),
  outletName: z.string().min(2, "Nama outlet minimal 2 karakter").max(120).optional(),
  ownerName: z.string().min(2, "Nama owner minimal 2 karakter").max(120),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").max(100),
  pin: z.string().regex(/^\d{4,6}$/, "PIN harus 4-6 digit angka").optional(),
});

export const pinLoginSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, "PIN harus 4-6 digit angka"),
  outletCode: z.string().trim().min(2, "Kode outlet wajib diisi").max(20),
});

export const createOutletSchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().max(255).optional(),
  phone: z.string().max(40).optional(),
});

export const updateOutletSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  address: z.string().max(255).nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const switchOutletSchema = z.object({
  outletId: z.number().int().positive(),
});

export const updatePlanSchema = z.object({
  plan: z.enum(["FREE", "PRO", "ENTERPRISE"]),
});

export const completeOnboardingSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, "PIN harus 4-6 digit angka").optional(),
  businessType: z.enum(["COFFEE_SHOP", "RESTAURANT", "BAKERY", "FAST_FOOD", "BEVERAGE_BAR"]),
  foodTypes: z
    .array(z.enum(["COFFEE", "NON_COFFEE", "BOBA_COLD", "HEAVY_MEAL", "GRILL_WESTERN", "PASTRY_CAKE", "SNACK"]))
    .min(1, "Pilih minimal 1 jenis menu"),
  serviceMode: z.enum(["DINE_IN_AND_TAKEAWAY", "COUNTER_ONLY"]),
  seedSampleData: z.boolean().default(true),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const createProductSchema = z.object({
  categoryId: z.number().int().positive(),
  stationId: z.number().int().positive().nullable().optional(),
  sku: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  monogram: z.string().min(1).max(4).optional(),
  tone: z.string().max(20).optional(),
  price: z.number().int().nonnegative(),
  cost: z.number().int().nonnegative().optional(),
  isAvailable: z.boolean().optional(),
  modifierGroupIds: z.array(z.number().int().positive()).optional(),
});

export const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const orderItemInputSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().nullable().optional(),
  quantity: z.number().int().positive(),
  notes: z.string().max(255).optional(),
  modifierIds: z.array(z.number().int().positive()).optional(),
});

export const createOrderSchema = z.object({
  clientUuid: z.string().uuid().optional(),
  orderType: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]).default("DINE_IN"),
  tableId: z.number().int().positive().nullable().optional(),
  customerName: z.string().max(120).optional(),
  notes: z.string().max(255).optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).nullable().optional(),
  discountValue: z.number().nonnegative().optional(),
  items: z.array(orderItemInputSchema).min(1),
  sendToKitchen: z.boolean().optional(),
});

export const addOrderItemsSchema = z.object({
  items: z.array(orderItemInputSchema).min(1),
  sendToKitchen: z.boolean().optional(),
});

export const voidOrderSchema = z.object({
  reason: z.string().min(3).max(255),
  managerPin: z.string().regex(/^\d{4,6}$/),
});

export const createPaymentSchema = z.object({
  payments: z
    .array(
      z.object({
        method: z.enum(["CASH", "QRIS", "CARD_EDC", "TRANSFER", "EWALLET"]),
        amount: z.number().int().positive(),
        paidAmount: z.number().int().nonnegative().optional(),
        referenceNo: z.string().max(100).optional(),
      }),
    )
    .min(1),
  tipAmount: z.number().int().nonnegative().optional(),
});

export const refundPaymentSchema = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(3).max(255),
  managerPin: z.string().regex(/^\d{4,6}$/),
});

export const openShiftSchema = z.object({
  openingCash: z.number().int().nonnegative(),
  notes: z.string().max(255).optional(),
});

export const closeShiftSchema = z.object({
  actualCash: z.number().int().nonnegative(),
  notes: z.string().max(255).optional(),
});

export const cashMovementSchema = z.object({
  shiftId: z.number().int().positive(),
  type: z.enum(["CASH_IN", "CASH_OUT"]),
  amount: z.number().int().positive(),
  reason: z.string().min(3).max(255),
});

export const stockAdjustSchema = z.object({
  ingredientId: z.number().int().positive(),
  type: z.enum(["PURCHASE_IN", "ADJUSTMENT", "WASTE", "OPNAME"]),
  qtyChange: z.number(), // positif untuk masuk, negatif untuk waste/keluar, atau fisik aktual untuk OPNAME
  inputUnit: z.string().max(20).optional(), // satuan input fleksibel (mis. kg, liter, box, gram, ml)
  unitCost: z.number().int().nonnegative().optional(),
  reason: z.string().min(2).max(255),
});

export const moveTableSchema = z.object({
  targetTableId: z.number().int().positive(),
});

export const mergeTablesSchema = z.object({
  sourceTableId: z.number().int().positive(),
  targetTableId: z.number().int().positive(),
});

export const updateSettingsSchema = z.object({
  businessName: z.string().min(2).max(120).optional(),
  outletName: z.string().min(2).max(120).optional(),
  address: z.string().max(255).optional(),
  phone: z.string().max(40).optional(),
  receiptFooter: z.string().max(255).optional(),
  taxRatePercent: z.number().min(0).max(50).optional(),
  serviceChargePercent: z.number().min(0).max(30).optional(),
  taxInclusive: z.boolean().optional(),
  taxAfterService: z.boolean().optional(),
  roundingUnit: z.number().int().nonnegative().optional(),
});

export const syncPushSchema = z.object({
  transactions: z.array(
    z.object({
      clientUuid: z.string().uuid(),
      offlineReceiptNo: z.string().max(60),
      createdAt: z.string(),
      orderType: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]),
      tableId: z.number().int().positive().nullable().optional(),
      customerName: z.string().max(120).optional(),
      discountType: z.enum(["PERCENT", "FIXED"]).nullable().optional(),
      discountValue: z.number().nonnegative().optional(),
      items: z.array(orderItemInputSchema).min(1),
      paidAmount: z.number().int().nonnegative(),
    }),
  ),
});

export const createRoleSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_]+$/, "Kode role harus huruf kapital/angka/underscore"),
  name: z.string().min(2).max(80),
  description: z.string().max(255).optional(),
  permissions: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(255).nullable().optional(),
  permissions: z.array(z.string()).optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6),
  pin: z.string().regex(/^\d{4,6}$/, "PIN harus 4-6 digit angka").optional(),
  roleId: z.number().int().positive(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  roleId: z.number().int().positive().optional(),
  pin: z.string().regex(/^\d{4,6}$/, "PIN harus 4-6 digit angka").nullable().optional(),
  isActive: z.boolean().optional(),
});

export const DIGITAL_MENU_THEMES = ["amber", "emerald", "indigo", "rose", "slate"] as const;
export type DigitalMenuTheme = (typeof DIGITAL_MENU_THEMES)[number];

export const DIGITAL_MENU_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const RESERVED_DIGITAL_MENU_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "login",
  "register",
  "preview",
  "sitemap",
  "robots",
  "kassa",
  "menu",
  "p",
  "pos",
  "kds",
  "docs",
  "help",
  "support",
]);

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === "" || /^https?:\/\/.+/i.test(v),
    "URL harus diawali http:// atau https://",
  )
  .nullable()
  .optional();

export const updateDigitalMenuSchema = z.object({
  enabled: z.boolean().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug minimal 3 karakter")
    .max(80, "Slug maksimal 80 karakter")
    .regex(DIGITAL_MENU_SLUG_REGEX, "Slug hanya boleh huruf kecil, angka, dan tanda hubung (-)")
    .optional(),
  defaultOutletId: z.number().int().positive().nullable().optional(),
  displayName: z.string().trim().max(120).nullable().optional(),
  tagline: z.string().trim().max(180).nullable().optional(),
  description: z.string().trim().max(1500).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  address: z.string().trim().max(255).nullable().optional(),
  openingHours: z.string().trim().max(120).nullable().optional(),
  whatsapp: z.string().trim().max(40).nullable().optional(),
  instagram: z.string().trim().max(80).nullable().optional(),
  googleMapsUrl: optionalUrlSchema,
  heroImageUrl: optionalUrlSchema,
  logoUrl: optionalUrlSchema,
  themeAccent: z.enum(DIGITAL_MENU_THEMES).optional(),
  showPrices: z.boolean().optional(),
  showUnavailable: z.boolean().optional(),
  seoTitle: z.string().trim().max(140).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
  seoKeywords: z.string().trim().max(320).nullable().optional(),
  cuisineType: z.string().trim().max(100).nullable().optional(),
  priceRange: z.enum(["$", "$$", "$$$"]).optional(),
});
