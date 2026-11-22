import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { calculateOrderTotals, PERMISSION_CATALOG, PERMISSIONS } from "@pos/shared";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Kassa Multi-Tenant POS...");

  // 0. Tenant 1 (PRO — Multi-Outlet Showcase)
  const tenantPro = await prisma.tenant.upsert({
    where: { slug: "kopi-senja" },
    update: { plan: "PRO", maxOutlets: 20, maxUsers: 200 },
    create: {
      name: "Kopi & Dapur Senja Group",
      slug: "kopi-senja",
      plan: "PRO",
      maxOutlets: 20,
      maxUsers: 200,
    },
  });

  // 1. Outlet Utama Tenant PRO
  const outlet = await prisma.outlet.upsert({
    where: { code: "OUT-01" },
    update: { tenantId: tenantPro.id },
    create: {
      tenantId: tenantPro.id,
      code: "OUT-01",
      name: "Kopi & Dapur Senja — Kemang",
      address: "Jl. Kemang Raya No. 48, Jakarta Selatan",
      phone: "(021) 719-4820",
      timezone: "Asia/Jakarta",
    },
  });

  // 1b. Landing Page / Digital Menu Tenant PRO (kassa.biz.id/p/kopi-senja)
  await prisma.tenantDigitalMenu.upsert({
    where: { tenantId: tenantPro.id },
    update: {},
    create: {
      tenantId: tenantPro.id,
      defaultOutletId: outlet.id,
      enabled: true,
      displayName: "Kopi & Dapur Senja",
      tagline: "Specialty Coffee, Artisan Pastry & All-Day Comfort Kitchen di Kemang",
      description:
        "Kopi & Dapur Senja menyajikan kopi specialty sangrai segar, signature kopi susu gula aren, pastry hangat setiap pagi, serta hidangan nusantara dan western untuk kerja maupun bersantai bersama teman di Kemang, Jakarta Selatan.",
      city: "Jakarta Selatan",
      address: "Jl. Kemang Raya No. 48, Jakarta Selatan",
      openingHours: "Setiap hari, 07.30 – 22.00 WIB",
      whatsapp: "628127194820",
      instagram: "kopisenja.kemang",
      themeAccent: "amber",
      showPrices: true,
      showUnavailable: true,
      cuisineType: "Coffee Shop, Cafe, Indonesian, Western",
      priceRange: "$$",
      seoKeywords:
        "menu kopi senja, kopi dan dapur senja kemang, cafe kemang jakarta selatan, harga kopi susu gula aren, coffee shop kemang",
    },
  });

  // 2. Settings (PB1 10%, Service Charge 5%, belum termasuk harga, pajak setelah service, pembulatan Rp100)
  const defaultSettings: Record<string, string> = {
    businessName: "Kopi & Dapur Senja",
    outletName: outlet.name,
    address: outlet.address ?? "",
    phone: outlet.phone ?? "",
    receiptFooter: "Terima kasih telah berkunjung! Wi-Fi: SenjaGuest / kopi2026",
    taxRatePercent: "10",
    serviceChargePercent: "5",
    taxInclusive: "false",
    taxAfterService: "true",
    roundingUnit: "100",
    paymentProvider: "midtrans",
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { outletId_key: { outletId: outlet.id, key } },
      update: {},
      create: { outletId: outlet.id, key, value },
    });
  }

  // 3. Permissions & Roles
  const permMap = new Map<string, number>();
  for (const meta of PERMISSION_CATALOG) {
    const p = await prisma.permission.upsert({
      where: { code: meta.code },
      update: { description: meta.description },
      create: { code: meta.code, description: meta.description },
    });
    permMap.set(meta.code, p.id);
  }

  const roleDefs: Array<{ code: string; name: string; description: string; perms: string[] }> = [
    { code: "OWNER", name: "Owner", description: "Akses penuh seluruh modul & konfigurasi sistem", perms: [...PERMISSIONS] },
    {
      code: "MANAGER",
      name: "Manager",
      description: "Operasional harian, approval PIN, stok, dan laporan",
      perms: [
        "pos.access", "order.create", "order.void", "discount.apply", "discount.unlimited",
        "payment.refund", "approval.pin", "shift.manage", "kds.view", "menu.manage", "table.manage",
        "stock.view", "stock.adjust", "report.view",
      ],
    },
    {
      code: "CASHIER",
      name: "Kasir",
      description: "Input pesanan, meja, pembayaran, dan shift kasir",
      perms: ["pos.access", "order.create", "discount.apply", "shift.manage"],
    },
    {
      code: "KITCHEN",
      name: "Dapur / Bar",
      description: "Layar antrean KDS dapur dan bar",
      perms: ["kds.view"],
    },
  ];

  const roleMap = new Map<string, number>();
  for (const r of roleDefs) {
    let role = await prisma.role.findFirst({ where: { code: r.code, tenantId: null } });
    if (role) {
      role = await prisma.role.update({
        where: { id: role.id },
        data: { name: r.name, description: r.description },
      });
    } else {
      role = await prisma.role.create({
        data: { tenantId: null, code: r.code, name: r.name, description: r.description },
      });
    }
    roleMap.set(r.code, role.id);

    for (const pCode of r.perms) {
      const pid = permMap.get(pCode);
      if (pid) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: pid } },
          update: {},
          create: { roleId: role.id, permissionId: pid },
        });
      }
    }
  }

  // 4. Users (Owner, Manager, 2 Kasir beda shift, Dapur)
  const usersSeed = [
    { name: "Raka Pratama", email: "owner@senja.id", password: "password123", pin: "1111", role: "OWNER" },
    { name: "Nadia Kusuma", email: "manager@senja.id", password: "password123", pin: "2222", role: "MANAGER" },
    { name: "Dina Kartika", email: "kasir@senja.id", password: "password123", pin: "1234", role: "CASHIER" },
    { name: "Sinta Dewi", email: "sinta@senja.id", password: "password123", pin: "3456", role: "CASHIER" },
    { name: "Budi Santoso", email: "dapur@senja.id", password: "password123", pin: "5678", role: "KITCHEN" },
  ];

  for (const u of usersSeed) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const pinHash = await bcrypt.hash(u.pin, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { tenantId: tenantPro.id, outletId: outlet.id },
      create: {
        tenantId: tenantPro.id,
        outletId: outlet.id,
        roleId: roleMap.get(u.role)!,
        name: u.name,
        email: u.email,
        passwordHash,
        pinHash,
        pinCode: u.pin,
      },
    });
  }

  // 5. Stations (Bar, Dapur, Pastry)
  const stationDefs = [
    { code: "BAR", name: "Bar & Kopi", tone: "iris", slaMins: 6 },
    { code: "KITCHEN", name: "Dapur Panas", tone: "coral", slaMins: 12 },
    { code: "PASTRY", name: "Pastry & Bakery", tone: "amber", slaMins: 5 },
  ];
  const stationMap = new Map<string, number>();
  for (const s of stationDefs) {
    const st = await prisma.station.upsert({
      where: { outletId_code: { outletId: outlet.id, code: s.code } },
      update: {},
      create: { outletId: outlet.id, ...s },
    });
    stationMap.set(s.code, st.id);
  }

  // 6. Categories
  const catDefs = [
    { name: "Kopi & Espresso", tone: "iris", sortOrder: 1 },
    { name: "Non-Kopi & Teh", tone: "teal", sortOrder: 2 },
    { name: "Makanan Utama", tone: "coral", sortOrder: 3 },
    { name: "Camilan & Share", tone: "amber", sortOrder: 4 },
    { name: "Pastry & Dessert", tone: "plum", sortOrder: 5 },
  ];
  const existingCats = await prisma.category.findMany({ where: { outletId: outlet.id } });
  const catMap = new Map<string, number>();
  for (const c of catDefs) {
    const found = existingCats.find((x) => x.name === c.name);
    if (found) {
      catMap.set(c.name, found.id);
    } else {
      const created = await prisma.category.create({ data: { outletId: outlet.id, ...c } });
      catMap.set(c.name, created.id);
    }
  }

  // 7. Modifier Groups
  const existingMgs = await prisma.modifierGroup.findMany({ include: { modifiers: true } });
  async function ensureModGroup(
    name: string,
    isRequired: boolean,
    minSelect: number,
    maxSelect: number,
    items: Array<{ name: string; price: number }>,
  ) {
    const found = existingMgs.find((g) => g.name === name);
    if (found) return found;
    return prisma.modifierGroup.create({
      data: {
        name,
        isRequired,
        minSelect,
        maxSelect,
        modifiers: { create: items.map((m) => ({ name: m.name, price: BigInt(m.price) })) },
      },
      include: { modifiers: true },
    });
  }

  const mgSugar = await ensureModGroup("Level Gula", false, 0, 1, [
    { name: "Normal Sugar", price: 0 },
    { name: "Less Sugar (50%)", price: 0 },
    { name: "No Sugar", price: 0 },
  ]);
  const mgIce = await ensureModGroup("Level Es", false, 0, 1, [
    { name: "Normal Ice", price: 0 },
    { name: "Less Ice", price: 0 },
    { name: "Hot / Tanpa Es", price: 0 },
  ]);
  const mgAddonCoffee = await ensureModGroup("Extra Add-on Kopi", false, 0, 3, [
    { name: "Extra Espresso Shot", price: 8000 },
    { name: "Ganti Oat Milk", price: 10000 },
    { name: "Vanilla Syrup", price: 6000 },
    { name: "Caramel Drizzle", price: 6000 },
  ]);
  const mgSpice = await ensureModGroup("Level Pedas", false, 0, 1, [
    { name: "Tidak Pedas", price: 0 },
    { name: "Sedang", price: 0 },
    { name: "Pedas Mantap", price: 0 },
  ]);
  const mgAddonFood = await ensureModGroup("Tambahan Lauk", false, 0, 2, [
    { name: "Telur Mata Sapi", price: 7000 },
    { name: "Ekstra Sambal Matah", price: 5000 },
    { name: "Nasi Putih Tambahan", price: 8000 },
  ]);

  // 8. Products
  const productsSeed = [
    {
      sku: "KP-001", name: "Es Kopi Susu Senja", mono: "KS", tone: "iris",
      cat: "Kopi & Espresso", station: "BAR", price: 28000, cost: 8200,
      imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Regular (12oz)", priceDelta: 0, isDefault: true }, { name: "Large (16oz)", priceDelta: 6000 }],
      mods: [mgSugar.id, mgIce.id, mgAddonCoffee.id],
    },
    {
      sku: "KP-002", name: "Americano House Blend", mono: "AM", tone: "slate",
      cat: "Kopi & Espresso", station: "BAR", price: 24000, cost: 5200,
      imageUrl: "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Iced", priceDelta: 0, isDefault: true }, { name: "Hot", priceDelta: 0 }],
      mods: [mgSugar.id, mgAddonCoffee.id],
    },
    {
      sku: "KP-003", name: "Caramel Macchiato", mono: "CM", tone: "amber",
      cat: "Kopi & Espresso", station: "BAR", price: 34000, cost: 10400,
      imageUrl: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Regular", priceDelta: 0, isDefault: true }, { name: "Large", priceDelta: 7000 }],
      mods: [mgSugar.id, mgIce.id, mgAddonCoffee.id],
    },
    {
      sku: "KP-004", name: "Cappuccino Artisan", mono: "CP", tone: "plum",
      cat: "Kopi & Espresso", station: "BAR", price: 32000, cost: 9100,
      imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Hot", priceDelta: 0, isDefault: true }, { name: "Iced", priceDelta: 3000 }],
      mods: [mgSugar.id, mgAddonCoffee.id],
    },
    {
      sku: "NK-001", name: "Uji Matcha Latte", mono: "ML", tone: "lime",
      cat: "Non-Kopi & Teh", station: "BAR", price: 35000, cost: 11200,
      imageUrl: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Iced", priceDelta: 0, isDefault: true }, { name: "Hot", priceDelta: 0 }],
      mods: [mgSugar.id, mgIce.id, mgAddonCoffee.id],
    },
    {
      sku: "NK-002", name: "Lychee Iced Tea", mono: "LT", tone: "teal",
      cat: "Non-Kopi & Teh", station: "BAR", price: 25000, cost: 6400,
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Regular", priceDelta: 0, isDefault: true }],
      mods: [mgSugar.id, mgIce.id],
    },
    {
      sku: "MK-001", name: "Nasi Goreng Kampung Senja", mono: "NG", tone: "coral",
      cat: "Makanan Utama", station: "KITCHEN", price: 45000, cost: 16500,
      imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Ayam Suwir", priceDelta: 0, isDefault: true }, { name: "Seafood", priceDelta: 10000 }],
      mods: [mgSpice.id, mgAddonFood.id],
    },
    {
      sku: "MK-002", name: "Rice Bowl Ayam Sambal Matah", mono: "AM", tone: "rose",
      cat: "Makanan Utama", station: "KITCHEN", price: 42000, cost: 15200,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Regular", priceDelta: 0, isDefault: true }, { name: "Jumbo", priceDelta: 12000 }],
      mods: [mgSpice.id, mgAddonFood.id],
    },
    {
      sku: "MK-003", name: "Spaghetti Aglio Olio Tuna", mono: "AO", tone: "amber",
      cat: "Makanan Utama", station: "KITCHEN", price: 48000, cost: 17800,
      imageUrl: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Regular", priceDelta: 0, isDefault: true }],
      mods: [mgSpice.id],
    },
    {
      sku: "MK-004", name: "Sop Buntut Bakar", mono: "SB", tone: "coral",
      cat: "Makanan Utama", station: "KITCHEN", price: 78000, cost: 34000,
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Dengan Nasi", priceDelta: 0, isDefault: true }],
      mods: [mgSpice.id, mgAddonFood.id],
    },
    {
      sku: "CM-001", name: "Truffle French Fries", mono: "TF", tone: "amber",
      cat: "Camilan & Share", station: "KITCHEN", price: 32000, cost: 9800,
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Regular", priceDelta: 0, isDefault: true }, { name: "Sharing", priceDelta: 14000 }],
      mods: [],
    },
    {
      sku: "CM-002", name: "Pisang Goreng Wijen Gula Aren", mono: "PG", tone: "lime",
      cat: "Camilan & Share", station: "KITCHEN", price: 28000, cost: 8500,
      imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Isi 5", priceDelta: 0, isDefault: true }],
      mods: [],
    },
    {
      sku: "PS-001", name: "Butter Croissant", mono: "BC", tone: "plum",
      cat: "Pastry & Dessert", station: "PASTRY", price: 29000, cost: 9200,
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Hangatkan", priceDelta: 0, isDefault: true }, { name: "Suhu Ruang", priceDelta: 0 }],
      mods: [],
    },
    {
      sku: "PS-002", name: "Burnt Basque Cheesecake", mono: "CC", tone: "sky",
      cat: "Pastry & Dessert", station: "PASTRY", price: 44000, cost: 14800,
      imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
      variants: [{ name: "Slice", priceDelta: 0, isDefault: true }],
      mods: [],
    },
  ];

  const productMap = new Map<string, number>();
  for (const p of productsSeed) {
    const existing = await prisma.product.findUnique({
      where: { outletId_sku: { outletId: outlet.id, sku: p.sku } },
    });
    if (existing) {
      if (p.imageUrl && existing.imageUrl !== p.imageUrl) {
        await prisma.product.update({ where: { id: existing.id }, data: { imageUrl: p.imageUrl } });
      }
      productMap.set(p.sku, existing.id);
      continue;
    }
    const created = await prisma.product.create({
      data: {
        outletId: outlet.id,
        categoryId: catMap.get(p.cat)!,
        stationId: stationMap.get(p.station)!,
        sku: p.sku,
        name: p.name,
        monogram: p.mono,
        tone: p.tone,
        price: BigInt(p.price),
        cost: BigInt(p.cost),
        imageUrl: p.imageUrl,
        variants: {
          create: p.variants.map((v) => ({
            name: v.name,
            priceDelta: BigInt(v.priceDelta),
            isDefault: Boolean(v.isDefault),
          })),
        },
        modifierGroups: {
          create: p.mods.map((mgId) => ({ modifierGroupId: mgId })),
        },
      },
    });
    productMap.set(p.sku, created.id);
  }

  // 9. Areas & Dining Tables
  const areaDefs = [
    { name: "Indoor Utama", sortOrder: 1, tables: ["T01", "T02", "T03", "T04", "T05", "T06"] },
    { name: "Teras & Taman", sortOrder: 2, tables: ["O01", "O02", "O03", "O04"] },
    { name: "VIP & Meeting", sortOrder: 3, tables: ["V01", "V02"] },
  ];
  for (const a of areaDefs) {
    let area = await prisma.area.findFirst({ where: { outletId: outlet.id, name: a.name } });
    if (!area) {
      area = await prisma.area.create({ data: { outletId: outlet.id, name: a.name, sortOrder: a.sortOrder } });
    }
    for (const code of a.tables) {
      await prisma.diningTable.upsert({
        where: { outletId_code: { outletId: outlet.id, code } },
        update: {},
        create: {
          outletId: outlet.id,
          areaId: area.id,
          code,
          name: `Meja ${code}`,
          capacity: code.startsWith("V") ? 8 : 4,
          qrToken: crypto.randomBytes(12).toString("hex"),
        },
      });
    }
  }

  // 10. Ingredients & Recipes (BOM)
  const ingDefs = [
    { sku: "ING-BEAN", name: "Biji Kopi House Blend", unit: "gram", purchaseUnit: "kg", conversion: 1000, unitCost: 260, currentStock: 4200, minStock: 1000 },
    { sku: "ING-MILK", name: "Susu UHT Full Cream", unit: "ml", purchaseUnit: "liter", conversion: 1000, unitCost: 22, currentStock: 14500, minStock: 4000 },
    { sku: "ING-AREN", name: "Gula Aren Cair", unit: "ml", purchaseUnit: "liter", conversion: 1000, unitCost: 45, currentStock: 2600, minStock: 800 },
    { sku: "ING-MATCHA", name: "Bubuk Uji Matcha", unit: "gram", purchaseUnit: "pack", conversion: 500, unitCost: 420, currentStock: 680, minStock: 300 },
    { sku: "ING-RICE", name: "Beras Pandan Wangi", unit: "gram", purchaseUnit: "kg", conversion: 1000, unitCost: 18, currentStock: 18000, minStock: 5000 },
    { sku: "ING-CHICK", name: "Fillet Dada Ayam", unit: "gram", purchaseUnit: "kg", conversion: 1000, unitCost: 62, currentStock: 6200, minStock: 2000 },
    { sku: "ING-POTATO", name: "Kentang Shoestring", unit: "gram", purchaseUnit: "kg", conversion: 1000, unitCost: 42, currentStock: 3800, minStock: 1500 },
    { sku: "ING-CROIS", name: "Adonan Croissant Butter", unit: "pcs", purchaseUnit: "box", conversion: 12, unitCost: 9200, currentStock: 18, minStock: 10 },
  ];

  const ingMap = new Map<string, number>();
  for (const ing of ingDefs) {
    const rec = await prisma.ingredient.upsert({
      where: { outletId_sku: { outletId: outlet.id, sku: ing.sku } },
      update: {},
      create: {
        outletId: outlet.id,
        sku: ing.sku,
        name: ing.name,
        unit: ing.unit,
        purchaseUnit: ing.purchaseUnit,
        conversion: ing.conversion,
        unitCost: BigInt(ing.unitCost),
        currentStock: ing.currentStock,
        minStock: ing.minStock,
      },
    });
    ingMap.set(ing.sku, rec.id);
  }

  const recipeDefs: Array<{ productSku: string; items: Array<{ ingSku: string; qty: number }> }> = [
    {
      productSku: "KP-001",
      items: [{ ingSku: "ING-BEAN", qty: 18 }, { ingSku: "ING-MILK", qty: 140 }, { ingSku: "ING-AREN", qty: 25 }],
    },
    {
      productSku: "KP-002",
      items: [{ ingSku: "ING-BEAN", qty: 18 }],
    },
    {
      productSku: "NK-001",
      items: [{ ingSku: "ING-MATCHA", qty: 15 }, { ingSku: "ING-MILK", qty: 160 }],
    },
    {
      productSku: "MK-001",
      items: [{ ingSku: "ING-RICE", qty: 220 }, { ingSku: "ING-CHICK", qty: 100 }],
    },
    {
      productSku: "MK-002",
      items: [{ ingSku: "ING-RICE", qty: 200 }, { ingSku: "ING-CHICK", qty: 120 }],
    },
    {
      productSku: "CM-001",
      items: [{ ingSku: "ING-POTATO", qty: 180 }],
    },
    {
      productSku: "PS-001",
      items: [{ ingSku: "ING-CROIS", qty: 1 }],
    },
  ];

  for (const r of recipeDefs) {
    const productId = productMap.get(r.productSku);
    if (!productId) continue;
    const existing = await prisma.recipe.findUnique({ where: { productId } });
    if (existing) continue;
    await prisma.recipe.create({
      data: {
        productId,
        items: {
          create: r.items.map((it) => ({
            ingredientId: ingMap.get(it.ingSku)!,
            qty: it.qty,
          })),
        },
      },
    });
  }

  // 11. Dummy Data Operasional (Shift, Orders hari ini, KDS aktif, Mutasi Stok, Audit Log)
  // Idempotent: dijalankan jika jumlah order masih < 5 agar tidak bentrok dengan data uji user
  const existingOrderCount = await prisma.order.count({ where: { outletId: outlet.id } });
  if (existingOrderCount < 5) {
    console.log("Menambahkan dummy data operasional (shift, 12 order lunas, 3 order aktif KDS, mutasi stok, audit log)...");

    const ownerUser = await prisma.user.findUnique({ where: { email: "owner@senja.id" } });
    const managerUser = await prisma.user.findUnique({ where: { email: "manager@senja.id" } });
    const cashierUser = await prisma.user.findUnique({ where: { email: "kasir@senja.id" } });
    const cashier2User = await prisma.user.findUnique({ where: { email: "sinta@senja.id" } });
    const allProducts = await prisma.product.findMany({
      where: { outletId: outlet.id },
      include: { variants: true },
    });
    const allTables = await prisma.diningTable.findMany({ where: { outletId: outlet.id } });
    const prodBySku = new Map(allProducts.map((p) => [p.sku, p]));
    const tableByCode = new Map(allTables.map((t) => [t.code, t]));

    const now = new Date();
    const todayAt = (hour: number, minute = 0) => {
      const d = new Date(now);
      d.setHours(hour, minute, 0, 0);
      return d;
    };
    const yesterdayAt = (hour: number, minute = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      d.setHours(hour, minute, 0, 0);
      return d;
    };

    // A. Shift Kemarin (CLOSED), Shift Pagi Hari Ini (CLOSED), & Shift Sore Hari Ini (OPEN)
    await prisma.shift.create({
      data: {
        outletId: outlet.id,
        userId: cashier2User!.id,
        status: "CLOSED",
        openingCash: BigInt(500000),
        expectedCash: BigInt(1845000),
        actualCash: BigInt(1847000),
        difference: BigInt(2000),
        notes: "Shift sore kemarin berjalan lancar",
        openedAt: yesterdayAt(14, 30),
        closedAt: yesterdayAt(22, 0),
        cashMovements: {
          create: [
            {
              outletId: outlet.id,
              type: "CASH_OUT",
              amount: BigInt(45000),
              reason: "Beli es batu kristal tambahan",
              createdBy: cashier2User!.id,
              createdAt: yesterdayAt(16, 15),
            },
          ],
        },
      },
    });

    const morningShift = await prisma.shift.create({
      data: {
        outletId: outlet.id,
        userId: cashierUser!.id,
        status: "CLOSED",
        openingCash: BigInt(500000),
        expectedCash: BigInt(1125000),
        actualCash: BigInt(1125000),
        difference: BigInt(0),
        notes: "Serah terima kas shift pagi pas (Rp0 selisih)",
        openedAt: todayAt(8, 0),
        closedAt: todayAt(14, 30),
        cashMovements: {
          create: [
            {
              outletId: outlet.id,
              type: "CASH_OUT",
              amount: BigInt(35000),
              reason: "Beli air galon & tisu meja",
              createdBy: cashierUser!.id,
              createdAt: todayAt(9, 20),
            },
          ],
        },
      },
    });

    const existingOpenShift = await prisma.shift.findFirst({
      where: { outletId: outlet.id, status: "OPEN" },
    });
    const activeShift =
      existingOpenShift ??
      (await prisma.shift.create({
        data: {
          outletId: outlet.id,
          userId: cashier2User!.id,
          status: "OPEN",
          openingCash: BigInt(500000),
          expectedCash: BigInt(500000),
          notes: "Shift sore Kopi & Dapur Senja",
          openedAt: todayAt(14, 30),
        },
      }));

    // B. 12 Order Lunas Hari Ini (tersebar 08:30 - 18:40 agar chart jam ramai terlihat natural)
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
    const paidOrdersSpec: Array<{
      hour: number;
      min: number;
      type: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
      table?: string;
      customer?: string;
      method: "CASH" | "EWALLET" | "CARD_EDC" | "TRANSFER";
      discountPct?: number;
      lines: Array<{ sku: string; qty: number }>;
    }> = [
      { hour: 8, min: 35, type: "TAKEAWAY", customer: "Ardi", method: "EWALLET", lines: [{ sku: "KP-001", qty: 2 }, { sku: "PS-001", qty: 1 }] },
      { hour: 9, min: 15, type: "DINE_IN", table: "T01", customer: "Mbak Maya", method: "CASH", lines: [{ sku: "KP-002", qty: 1 }, { sku: "PS-002", qty: 1 }] },
      { hour: 10, min: 20, type: "DINE_IN", table: "T03", customer: "Tim Desain", method: "CARD_EDC", lines: [{ sku: "KP-001", qty: 3 }, { sku: "NK-001", qty: 2 }, { sku: "CM-001", qty: 2 }] },
      { hour: 11, min: 45, type: "DELIVERY", customer: "Gojek - Hendra", method: "TRANSFER", lines: [{ sku: "MK-001", qty: 2 }, { sku: "NK-002", qty: 2 }] },
      { hour: 12, min: 15, type: "DINE_IN", table: "T04", customer: "Keluarga Bima", method: "CARD_EDC", lines: [{ sku: "MK-004", qty: 2 }, { sku: "MK-001", qty: 1 }, { sku: "NK-002", qty: 3 }] },
      { hour: 12, min: 50, type: "DINE_IN", table: "V01", customer: "Meeting PT Nusantara", method: "TRANSFER", discountPct: 10, lines: [{ sku: "MK-002", qty: 4 }, { sku: "MK-003", qty: 2 }, { sku: "KP-003", qty: 4 }, { sku: "CM-001", qty: 2 }] },
      { hour: 13, min: 25, type: "TAKEAWAY", customer: "Rani", method: "EWALLET", lines: [{ sku: "KP-001", qty: 2 }, { sku: "KP-004", qty: 1 }] },
      { hour: 14, min: 40, type: "DINE_IN", table: "O02", customer: "Fajar & Dita", method: "CASH", lines: [{ sku: "NK-001", qty: 2 }, { sku: "PS-002", qty: 2 }, { sku: "CM-002", qty: 1 }] },
      { hour: 15, min: 55, type: "TAKEAWAY", customer: "Denny", method: "CASH", lines: [{ sku: "KP-002", qty: 2 }, { sku: "PS-001", qty: 2 }] },
      { hour: 16, min: 30, type: "DINE_IN", table: "T06", customer: "Komunitas Sepeda", method: "EWALLET", discountPct: 5, lines: [{ sku: "KP-001", qty: 4 }, { sku: "CM-001", qty: 2 }, { sku: "CM-002", qty: 2 }] },
      { hour: 17, min: 45, type: "DINE_IN", table: "O03", customer: "Putri", method: "CASH", lines: [{ sku: "MK-002", qty: 2 }, { sku: "NK-002", qty: 2 }] },
      { hour: 18, min: 30, type: "DINE_IN", table: "T01", customer: "Andre & Rekan", method: "CARD_EDC", lines: [{ sku: "MK-004", qty: 1 }, { sku: "MK-003", qty: 2 }, { sku: "KP-004", qty: 2 }] },
    ];

    let seq = existingOrderCount + 1;
    for (const spec of paidOrdersSpec) {
      const createdAt = todayAt(spec.hour, spec.min);
      const isMorning = spec.hour < 14 || (spec.hour === 14 && spec.min < 30);
      const orderShift = isMorning ? morningShift : activeShift;
      const orderCashier = isMorning ? cashierUser! : cashier2User!;
      const resolved = spec.lines.map((l) => {
        const p = prodBySku.get(l.sku)!;
        const unitPrice = Number(p.price);
        return {
          product: p,
          qty: l.qty,
          unitPrice,
          unitCost: Number(p.cost),
          lineTotal: unitPrice * l.qty,
        };
      });
      const totals = calculateOrderTotals(
        resolved.map((r) => ({ unitPrice: r.unitPrice, quantity: r.qty })),
        spec.discountPct ? { type: "PERCENT", value: spec.discountPct } : null,
      );
      const orderNo = `ORD-${ymd}-${String(seq).padStart(3, "0")}`;
      const receiptNo = `RCP-${ymd}-${String(seq).padStart(4, "0")}`;
      const paidCash = spec.method === "CASH" ? Math.ceil(totals.grandTotal / 50000) * 50000 : totals.grandTotal;

      await prisma.order.create({
        data: {
          outletId: outlet.id,
          shiftId: orderShift.id,
          tableId: spec.table ? tableByCode.get(spec.table)?.id ?? null : null,
          cashierId: orderCashier.id,
          orderNo,
          queueNo: seq,
          receiptNo,
          orderType: spec.type,
          status: "PAID",
          customerName: spec.customer ?? null,
          discountType: spec.discountPct ? "PERCENT" : null,
          discountValue: spec.discountPct ?? 0,
          subtotal: BigInt(totals.subtotal),
          discountAmount: BigInt(totals.totalDiscount),
          serviceChargeAmount: BigInt(totals.serviceChargeAmount),
          taxAmount: BigInt(totals.taxAmount),
          roundingAmount: BigInt(totals.roundingAmount),
          grandTotal: BigInt(totals.grandTotal),
          paidAt: createdAt,
          createdAt,
          items: {
            create: resolved.map((r) => ({
              productId: r.product.id,
              productName: r.product.name,
              stationId: r.product.stationId,
              unitPrice: BigInt(r.unitPrice),
              unitCost: BigInt(r.unitCost),
              quantity: r.qty,
              lineTotal: BigInt(r.lineTotal),
              kitchenStatus: "BUMPED",
            })),
          },
          payments: {
            create: {
              outletId: outlet.id,
              method: spec.method,
              status: "SETTLED",
              amount: BigInt(totals.grandTotal),
              paidAmount: BigInt(paidCash),
              changeAmt: BigInt(Math.max(0, paidCash - totals.grandTotal)),
              referenceNo: spec.method === "EWALLET" ? `QRIS-STATIC-${seq}09` : spec.method === "CARD_EDC" ? `EDC-${seq}842` : null,
              settledAt: createdAt,
              createdBy: cashierUser!.id,
              createdAt,
            },
          },
        },
      });
      seq++;
    }

    // C. 1 Order VOID (untuk laporan void & audit log)
    const voidProd = prodBySku.get("KP-003")!;
    await prisma.order.create({
      data: {
        outletId: outlet.id,
        shiftId: activeShift.id,
        cashierId: cashierUser!.id,
        orderNo: `ORD-${ymd}-${String(seq).padStart(3, "0")}`,
        queueNo: seq,
        orderType: "TAKEAWAY",
        status: "VOID",
        customerName: "Batal Pesan",
        voidReason: "Pelanggan salah pilih ukuran (Approved by Nadia Kusuma)",
        subtotal: voidProd.price,
        grandTotal: voidProd.price,
        createdAt: todayAt(11, 10),
        items: {
          create: [
            {
              productId: voidProd.id,
              productName: voidProd.name,
              stationId: voidProd.stationId,
              unitPrice: voidProd.price,
              unitCost: voidProd.cost,
              quantity: 1,
              lineTotal: voidProd.price,
              kitchenStatus: "PENDING",
            },
          ],
        },
      },
    });
    seq++;

    // D. 3 Order Aktif di Meja + Tiket KDS Realtime (NEW, PREPARING, READY)
    const activeSpecs: Array<{
      tableCode: string;
      customer: string;
      minsAgo: number;
      ticketStatus: "NEW" | "PREPARING" | "READY";
      lines: Array<{ sku: string; qty: number; note?: string }>;
    }> = [
      {
        tableCode: "T02",
        customer: "Rizal & Nadia",
        minsAgo: 14, // Melewati SLA agar indikator peringatan merah terlihat di KDS
        ticketStatus: "PREPARING",
        lines: [
          { sku: "MK-001", qty: 1, note: "Pedas sedang, tanpa acar" },
          { sku: "KP-001", qty: 2, note: "Less sugar, less ice" },
        ],
      },
      {
        tableCode: "T05",
        customer: "Meja Kerja Coworking",
        minsAgo: 4,
        ticketStatus: "NEW",
        lines: [
          { sku: "NK-001", qty: 1 },
          { sku: "PS-001", qty: 2, note: "Hangatkan 2 menit" },
          { sku: "CM-001", qty: 1 },
        ],
      },
      {
        tableCode: "O01",
        customer: "Sore Santai",
        minsAgo: 7,
        ticketStatus: "READY",
        lines: [
          { sku: "KP-004", qty: 2 },
          { sku: "PS-002", qty: 1 },
        ],
      },
    ];

    for (const act of activeSpecs) {
      const tbl = tableByCode.get(act.tableCode);
      const createdAt = new Date(Date.now() - act.minsAgo * 60_000);
      const resolved = act.lines.map((l) => {
        const p = prodBySku.get(l.sku)!;
        return { p, qty: l.qty, note: l.note, lineTotal: Number(p.price) * l.qty };
      });
      const totals = calculateOrderTotals(resolved.map((r) => ({ unitPrice: Number(r.p.price), quantity: r.qty })));
      const orderNo = `ORD-${ymd}-${String(seq).padStart(3, "0")}`;

      const ord = await prisma.order.create({
        data: {
          outletId: outlet.id,
          shiftId: activeShift.id,
          tableId: tbl?.id ?? null,
          cashierId: cashierUser!.id,
          orderNo,
          queueNo: seq,
          orderType: "DINE_IN",
          status: "SENT",
          customerName: act.customer,
          subtotal: BigInt(totals.subtotal),
          serviceChargeAmount: BigInt(totals.serviceChargeAmount),
          taxAmount: BigInt(totals.taxAmount),
          roundingAmount: BigInt(totals.roundingAmount),
          grandTotal: BigInt(totals.grandTotal),
          createdAt,
        },
      });

      const round = await prisma.orderRound.create({
        data: { orderId: ord.id, roundNo: 1, sentAt: createdAt, createdBy: cashierUser!.id },
      });

      for (const r of resolved) {
        await prisma.orderItem.create({
          data: {
            orderId: ord.id,
            roundId: round.id,
            productId: r.p.id,
            productName: r.p.name,
            stationId: r.p.stationId,
            unitPrice: r.p.price,
            unitCost: r.p.cost,
            quantity: r.qty,
            lineTotal: BigInt(r.lineTotal),
            notes: r.note ?? null,
            kitchenStatus: act.ticketStatus,
          },
        });
      }

      const stationIds = [...new Set(resolved.map((r) => r.p.stationId).filter((x): x is number => Boolean(x)))];
      for (const stId of stationIds) {
        await prisma.kitchenTicket.create({
          data: {
            outletId: outlet.id,
            orderId: ord.id,
            roundId: round.id,
            stationId: stId,
            status: act.ticketStatus,
            createdAt,
            startedAt: act.ticketStatus !== "NEW" ? createdAt : null,
            readyAt: act.ticketStatus === "READY" ? new Date() : null,
          },
        });
      }

      if (tbl) {
        await prisma.diningTable.update({ where: { id: tbl.id }, data: { status: "OCCUPIED" } });
      }
      seq++;
    }

    // E. Mutasi Stok & 2 Bahan Kritis (agar alert stok minimum di Dashboard & Stok terisi)
    const matchaId = ingMap.get("ING-MATCHA")!;
    const croisId = ingMap.get("ING-CROIS")!;
    const beanId = ingMap.get("ING-BEAN")!;
    const milkId = ingMap.get("ING-MILK")!;

    await prisma.ingredient.update({ where: { id: matchaId }, data: { currentStock: 210 } }); // min 300 -> Kritis
    await prisma.ingredient.update({ where: { id: croisId }, data: { currentStock: 6 } }); // min 10 -> Kritis

    await prisma.stockMovement.createMany({
      data: [
        { outletId: outlet.id, ingredientId: beanId, type: "PURCHASE_IN", qtyChange: 2000, balanceAfter: 4200, unitCost: BigInt(260), reason: "Restock Biji Kopi Roastery", createdBy: managerUser!.id, createdAt: todayAt(7, 30) },
        { outletId: outlet.id, ingredientId: milkId, type: "SALE_DEDUCT", qtyChange: -1680, balanceAfter: 14500, unitCost: BigInt(22), referenceId: `ORD-${ymd}-003`, reason: "Penjualan 12x Kopi Susu", createdBy: cashierUser!.id, createdAt: todayAt(10, 25) },
        { outletId: outlet.id, ingredientId: matchaId, type: "SALE_DEDUCT", qtyChange: -180, balanceAfter: 210, unitCost: BigInt(420), referenceId: `ORD-${ymd}-008`, reason: "Penjualan Uji Matcha Latte", createdBy: cashierUser!.id, createdAt: todayAt(14, 42) },
        { outletId: outlet.id, ingredientId: croisId, type: "WASTE", qtyChange: -2, balanceAfter: 6, unitCost: BigInt(9200), reason: "Croissant gosong di oven", createdBy: managerUser!.id, createdAt: todayAt(11, 5) },
      ],
    });

    // F. Audit Logs Dummy
    await prisma.auditLog.createMany({
      data: [
        { outletId: outlet.id, userId: cashierUser!.id, action: "SHIFT_OPEN", entityType: "Shift", entityId: String(activeShift.id), reason: "Modal kas awal Rp500.000", createdAt: todayAt(8, 0) },
        { outletId: outlet.id, userId: managerUser!.id, action: "STOCK_WASTE", entityType: "Ingredient", entityId: String(croisId), reason: "Croissant gosong di oven (-2 pcs)", createdAt: todayAt(11, 5) },
        { outletId: outlet.id, userId: cashierUser!.id, action: "ORDER_VOID", entityType: "Order", entityId: "13", reason: "Pelanggan salah pilih ukuran (Approved by Nadia Kusuma)", createdAt: todayAt(11, 10) },
        { outletId: outlet.id, userId: ownerUser!.id, action: "SETTINGS_UPDATE", entityType: "Setting", entityId: "1", reason: "Konfirmasi tarif PB1 10% + Service 5%", createdAt: todayAt(9, 0) },
      ],
    });
  }

  // =========================================================================
  // MULTI-TENANT DEMO: Outlet ke-2 Tenant PRO + Tenant 2 (FREE: 1 Outlet, 3 Akun)
  // =========================================================================
  const outlet2 = await prisma.outlet.upsert({
    where: { code: "OUT-02" },
    update: { tenantId: tenantPro.id },
    create: {
      tenantId: tenantPro.id,
      code: "OUT-02",
      name: "Kopi & Dapur Senja — Tebet",
      address: "Jl. Tebet Barat Dalam No. 19, Jakarta Selatan",
      phone: "(021) 837-1120",
      timezone: "Asia/Jakarta",
    },
  });
  const stBar2 = await prisma.station.upsert({
    where: { outletId_code: { outletId: outlet2.id, code: "BAR" } },
    update: {},
    create: { outletId: outlet2.id, code: "BAR", name: "Bar Tebet", tone: "iris", slaMins: 6 },
  });
  let cat2 = await prisma.category.findFirst({ where: { outletId: outlet2.id, name: "Kopi Signature" } });
  if (!cat2) {
    cat2 = await prisma.category.create({ data: { outletId: outlet2.id, name: "Kopi Signature", tone: "iris", sortOrder: 1 } });
  }
  await prisma.product.upsert({
    where: { outletId_sku: { outletId: outlet2.id, sku: "KP-001" } },
    update: {},
    create: {
      outletId: outlet2.id,
      categoryId: cat2.id,
      stationId: stBar2.id,
      sku: "KP-001",
      name: "Es Kopi Susu Tebet",
      monogram: "KT",
      tone: "iris",
      price: BigInt(26000),
      cost: BigInt(7800),
      imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
      variants: { create: [{ name: "Regular", priceDelta: BigInt(0), isDefault: true }] },
    },
  });

  // Tenant 2: FREE Tier (1 Outlet, Total 3 Akun: 1 Owner + 2 Staf, POS-Only)
  const tenantFree = await prisma.tenant.upsert({
    where: { slug: "kedai-kopi-pagi" },
    update: { plan: "FREE", maxOutlets: 1, maxUsers: 3 },
    create: {
      name: "Kedai Kopi Pagi",
      slug: "kedai-kopi-pagi",
      plan: "FREE",
      maxOutlets: 1,
      maxUsers: 3,
    },
  });
  const freeOutlet = await prisma.outlet.upsert({
    where: { code: "PGI-01" },
    update: { tenantId: tenantFree.id },
    create: {
      tenantId: tenantFree.id,
      code: "PGI-01",
      name: "Kedai Kopi Pagi — Cabang Utama",
      address: "Jl. Cikini Raya No. 12, Jakarta Pusat",
      phone: "(021) 319-0044",
      timezone: "Asia/Jakarta",
    },
  });
  const freeUsers = [
    { name: "Andi Wijaya", email: "free@kopipagi.id", pin: "7777", role: "OWNER" },
    { name: "Rina Kasir 1", email: "kasir1@kopipagi.id", pin: "8888", role: "CASHIER" },
    { name: "Dodi Kasir 2", email: "kasir2@kopipagi.id", pin: "9999", role: "CASHIER" },
  ];
  for (const fu of freeUsers) {
    const passwordHash = await bcrypt.hash("password123", 10);
    const pinHash = await bcrypt.hash(fu.pin, 10);
    await prisma.user.upsert({
      where: { email: fu.email },
      update: { tenantId: tenantFree.id, outletId: freeOutlet.id },
      create: {
        tenantId: tenantFree.id,
        outletId: freeOutlet.id,
        roleId: roleMap.get(fu.role)!,
        name: fu.name,
        email: fu.email,
        passwordHash,
        pinHash,
        pinCode: fu.pin,
      },
    });
  }
  let freeCat = await prisma.category.findFirst({ where: { outletId: freeOutlet.id, name: "Kopi Pagi" } });
  if (!freeCat) {
    freeCat = await prisma.category.create({ data: { outletId: freeOutlet.id, name: "Kopi Pagi", tone: "amber", sortOrder: 1 } });
  }
  const freeProducts = [
    { sku: "KP-001", name: "Kopi Susu Pagi", price: 22000, img: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80" },
    { sku: "KP-002", name: "Americano Pagi", price: 18000, img: "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=600&q=80" },
    { sku: "KP-003", name: "Cappuccino Pagi", price: 25000, img: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80" },
  ];
  for (const fp of freeProducts) {
    await prisma.product.upsert({
      where: { outletId_sku: { outletId: freeOutlet.id, sku: fp.sku } },
      update: {},
      create: {
        outletId: freeOutlet.id,
        categoryId: freeCat.id,
        sku: fp.sku,
        name: fp.name,
        monogram: "KP",
        tone: "amber",
        price: BigInt(fp.price),
        cost: BigInt(7000),
        imageUrl: fp.img,
        variants: { create: [{ name: "Regular", priceDelta: BigInt(0), isDefault: true }] },
      },
    });
  }

  // 14. Platform Back Office Superadmin & Sample Subscription Invoice
  const adminEmail = (process.env.PLATFORM_ADMIN_EMAIL || "superadmin@kassa.biz.id").trim().toLowerCase();
  const adminPass = process.env.PLATFORM_ADMIN_PASSWORD || "kassa-superadmin-2026";
  const adminPasswordHash = await bcrypt.hash(adminPass, 10);

  const superAdmin = await prisma.platformAdmin.upsert({
    where: { email: adminEmail },
    update: { isActive: true },
    create: {
      name: "Kassa Superadmin",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "SUPERADMIN",
      isActive: true,
    },
  });

  // Set default planExpiresAt (+30 hari) untuk tenantPro jika belum ada
  if (!tenantPro.planExpiresAt) {
    await prisma.tenant.update({
      where: { id: tenantPro.id },
      data: { planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
  }

  await prisma.subscriptionInvoice.upsert({
    where: { invoiceNo: "INV-KSA-SEED-001" },
    update: {},
    create: {
      invoiceNo: "INV-KSA-SEED-001",
      tenantId: tenantPro.id,
      plan: "PRO",
      billingCycle: "MONTHLY",
      durationDays: 30,
      amount: BigInt(49_000),
      status: "PAID",
      paymentMethod: "MANUAL_TRANSFER",
      referenceNo: "BCA-20261121-SENJA",
      notes: "Aktivasi awal paket Kassa Pro (seed)",
      paidAt: new Date(),
      approvedById: superAdmin.id,
    },
  });

  // Pastikan seluruh akun seed otomatis terverifikasi emailnya
  await prisma.user.updateMany({
    where: {
      email: {
        in: [
          "owner@senja.id",
          "manager@senja.id",
          "kasir@senja.id",
          "dapur@senja.id",
          "free@kopipagi.id",
          "kasir@kopipagi.id",
        ],
      },
      emailVerifiedAt: null,
    },
    data: { emailVerifiedAt: new Date() },
  });

  console.log("Seed selesai! Akun Multi-Tenant & Back Office:");
  console.log(`  [BACK OFFICE] Superadmin: ${adminEmail} / ${adminPass}`);
  console.log("  [PRO · 2 Outlet] Owner: owner@senja.id / password123 (PIN: 1111, OUT-01 & OUT-02)");
  console.log("  [PRO] Manager: manager@senja.id (2222), Kasir: kasir@senja.id (1234), Dapur: dapur@senja.id (5678)");
  console.log("  [FREE · 1 Outlet, 3 Akun, POS Only] Owner: free@kopipagi.id / password123 (PIN: 7777, PGI-01)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
