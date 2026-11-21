#!/usr/bin/env node
/**
 * End-to-End Multi-Tenant & Multi-Outlet Isolation Verification Suite
 * Covers QA Analyst security checklist + PM 1-Owner multi-outlet & plan quota flows.
 * Automatically cleans up all test records on exit.
 */
import { PrismaClient } from "@prisma/client";

const BASE = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";
const prisma = new PrismaClient();
const ts = Date.now();

async function req(method, path, token, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;
function assert(name, ok, detail) {
  if (ok) {
    passed++;
    console.log(`✅ ${name} -> ${detail}`);
  } else {
    failed++;
    console.error(`❌ ${name} -> ${detail}`);
  }
}

const cleanupTenantIds = [];

try {
  // 1. Register Tenant A (FREE, no default PIN)
  const regA = await req("POST", "/auth/register", null, {
    businessName: `Kopi Verif A ${ts}`,
    outletName: "Cabang Pusat A",
    ownerName: "Owner A",
    email: `owner-a-${ts}@test.local`,
    password: "password123",
    pin: "7777",
  });
  assert(
    "1. Register Tenant A (FREE)",
    regA.status === 201 && regA.data?.user?.plan === "FREE",
    `status=${regA.status}, tenantId=${regA.data?.user?.tenantId}, outletCode=${regA.data?.user?.outletCode}`,
  );
  let tokenA = regA.data.accessToken;
  const tenantAId = regA.data.user.tenantId;
  const outletA1Id = regA.data.user.outletId;
  const outletA1Code = regA.data.user.outletCode;
  cleanupTenantIds.push(tenantAId);

  // 2. Auth: PIN login without outletCode MUST fail (400)
  const pinNoCode = await req("POST", "/auth/pin-login", null, { pin: "7777" });
  assert("2a. PIN login rejects missing outletCode", pinNoCode.status === 400, `status=${pinNoCode.status}`);
  const pinWithCode = await req("POST", "/auth/pin-login", null, { pin: "7777", outletCode: outletA1Code });
  assert(
    "2b. PIN login succeeds with valid outletCode",
    pinWithCode.status === 200 && pinWithCode.data?.user?.tenantId === tenantAId,
    `status=${pinWithCode.status}, tenantId=${pinWithCode.data?.user?.tenantId}`,
  );

  // 3. FREE limits: 2nd outlet blocked, PRO features blocked, max 3 users
  const outFree = await req("POST", "/outlets", tokenA, { name: "Blocked Outlet" });
  assert("3a. FREE blocks 2nd outlet", outFree.status === 403, `status=${outFree.status}`);

  const [kdsF, stockF, repF] = await Promise.all([
    req("GET", "/kds/tickets", tokenA),
    req("GET", "/stock/ingredients", tokenA),
    req("GET", "/reports/dashboard", tokenA),
  ]);
  assert(
    "3b. FREE blocks KDS/Stock/Reports",
    kdsF.status === 403 && stockF.status === 403 && repF.status === 403,
    `kds=${kdsF.status}, stock=${stockF.status}, reports=${repF.status}`,
  );

  const rolesA = await req("GET", "/rbac/roles", tokenA);
  const cashierRole = (rolesA.data || []).find((r) => r.code === "CASHIER");
  const s1 = await req("POST", "/rbac/users", tokenA, {
    name: "Staf A1",
    email: `sa1-${ts}@test.local`,
    password: "password123",
    roleId: cashierRole.id,
  });
  const s2 = await req("POST", "/rbac/users", tokenA, {
    name: "Staf A2",
    email: `sa2-${ts}@test.local`,
    password: "password123",
    roleId: cashierRole.id,
  });
  const s3 = await req("POST", "/rbac/users", tokenA, {
    name: "Staf A3",
    email: `sa3-${ts}@test.local`,
    password: "password123",
    roleId: cashierRole.id,
  });
  assert(
    "3c. FREE enforces max 3 users (1 owner + 2 staff)",
    s1.status === 201 && s2.status === 201 && s3.status === 403,
    `s1=${s1.status}, s2=${s2.status}, s3=${s3.status}`,
  );
  const staffA1Id = s1.data.id;

  // 4. Upgrade Tenant A to PRO -> create multiple outlets & switch
  const upPro = await req("POST", "/outlets/plan", tokenA, { plan: "PRO" });
  assert(
    "4a. Upgrade Tenant A to PRO",
    upPro.status === 200 && upPro.data?.user?.plan === "PRO",
    `status=${upPro.status}, maxOutlets=${upPro.data?.user?.maxOutlets}`,
  );
  tokenA = upPro.data.accessToken;

  const outA2 = await req("POST", "/outlets", tokenA, { name: "Cabang Kemang A" });
  const outA3 = await req("POST", "/outlets", tokenA, { name: "Cabang BSD A" });
  const listA = await req("GET", "/outlets", tokenA);
  assert(
    "4b. PRO 1 Owner creates multiple outlets (3 total)",
    outA2.status === 201 && outA3.status === 201 && listA.data?.outlets?.length === 3,
    `out2=${outA2.status}, out3=${outA3.status}, count=${listA.data?.outlets?.length}`,
  );

  // Downgrade guard while >1 outlet active
  const downBlocked = await req("POST", "/outlets/plan", tokenA, { plan: "FREE" });
  assert("4c. Downgrade PRO->FREE blocked while >1 outlet active", downBlocked.status === 400, `status=${downBlocked.status}`);

  // Edit & deactivate outlet A3
  const editA3 = await req("PATCH", `/outlets/${outA3.data.id}`, tokenA, { name: "Cabang BSD Renamed", isActive: false });
  assert("4d. Owner can edit/deactivate own outlet", editA3.status === 200 && editA3.data?.isActive === false, `status=${editA3.status}`);

  // Switch active outlet to A2 and back to A1
  const swA2 = await req("POST", "/outlets/switch", tokenA, { outletId: outA2.data.id });
  assert("4e. Owner switches to Outlet A2", swA2.status === 200 && swA2.data?.user?.outletId === outA2.data.id, `outletId=${swA2.data?.user?.outletId}`);
  const swA1 = await req("POST", "/outlets/switch", swA2.data.accessToken, { outletId: outletA1Id });
  tokenA = swA1.data.accessToken;

  // PRO features unlocked
  const [kdsP, stockP, repP] = await Promise.all([
    req("GET", "/kds/tickets", tokenA),
    req("GET", "/stock/ingredients", tokenA),
    req("GET", "/reports/dashboard", tokenA),
  ]);
  assert(
    "4f. PRO unlocks KDS/Stock/Reports",
    kdsP.status === 200 && stockP.status === 200 && repP.status === 200,
    `kds=${kdsP.status}, stock=${stockP.status}, reports=${repP.status}`,
  );

  // Seed resources in Tenant A Outlet 1 for cross-tenant attack tests
  const catsA = await req("GET", "/menu/categories", tokenA);
  const catA1Id = catsA.data[0].id;
  const modA = await req("POST", "/menu/modifier-groups", tokenA, {
    name: "Gula A",
    isRequired: false,
    minSelect: 0,
    maxSelect: 1,
    modifiers: [{ name: "Less Sugar", price: 0 }],
  });
  const prodA = await req("POST", "/menu/products", tokenA, {
    categoryId: catA1Id,
    sku: `SKU-A-${ts}`,
    name: "Kopi Susu A",
    price: 25000,
    modifierGroupIds: [modA.data.id],
  });
  const ingA = await req("POST", "/stock/ingredients", tokenA, {
    sku: "SHARED-SKU-01",
    name: "Biji Kopi A",
    unit: "gram",
    purchaseUnit: "kg",
    conversion: 1000,
    unitCost: 200,
    currentStock: 5000,
    minStock: 500,
  });
  const roleA = await req("POST", "/rbac/roles", tokenA, {
    code: `SPV_A_${String(ts).slice(-4)}`,
    name: "Supervisor A",
    permissions: ["pos.access", "order.create"],
  });
  const orderA = await req("POST", "/orders", tokenA, {
    orderType: "TAKEAWAY",
    items: [{ productId: prodA.data.id, quantity: 1 }],
  });
  assert(
    "5. Tenant A creates ModifierGroup, Product, Ingredient, Custom Role, Order",
    modA.status === 201 && prodA.status === 201 && ingA.status === 201 && roleA.status === 201 && orderA.status === 201,
    `mod=${modA.status}, prod=${prodA.status}, ing=${ingA.status}, role=${roleA.status}, order=${orderA.status}`,
  );

  // 6. Register Tenant B (PRO) & run cross-tenant isolation attacks
  const regB = await req("POST", "/auth/register", null, {
    businessName: `Kopi Verif B ${ts}`,
    outletName: "Cabang Pusat B",
    ownerName: "Owner B",
    email: `owner-b-${ts}@test.local`,
    password: "password123",
    pin: "8888",
  });
  const tenantBId = regB.data.user.tenantId;
  cleanupTenantIds.push(tenantBId);
  const upB = await req("POST", "/outlets/plan", regB.data.accessToken, { plan: "PRO" });
  const tokenB = upB.data.accessToken;

  // 6a. Outlets isolation
  const swBtoA = await req("POST", "/outlets/switch", tokenB, { outletId: outletA1Id });
  const patchBtoA = await req("PATCH", `/outlets/${outletA1Id}`, tokenB, { name: "HACKED" });
  assert("6a. Tenant B cannot switch/edit Tenant A outlet", swBtoA.status === 404 && patchBtoA.status === 404, `sw=${swBtoA.status}, patch=${patchBtoA.status}`);

  // 6b. RBAC users & custom roles isolation
  const patchUserBtoA = await req("PATCH", `/rbac/users/${staffA1Id}`, tokenB, { name: "HACKED" });
  const delUserBtoA = await req("DELETE", `/rbac/users/${staffA1Id}`, tokenB);
  const rolesB = await req("GET", "/rbac/roles", tokenB);
  const patchRoleBtoA = await req("PATCH", `/rbac/roles/${roleA.data.id}`, tokenB, { name: "HACKED" });
  const delRoleBtoA = await req("DELETE", `/rbac/roles/${roleA.data.id}`, tokenB);
  assert(
    "6b. Tenant B blocked from Tenant A users & custom roles",
    patchUserBtoA.status === 404 &&
      delUserBtoA.status === 404 &&
      rolesB.data.every((r) => r.id !== roleA.data.id) &&
      patchRoleBtoA.status === 404 &&
      delRoleBtoA.status === 404,
    `patchU=${patchUserBtoA.status}, delU=${delUserBtoA.status}, patchR=${patchRoleBtoA.status}, delR=${delRoleBtoA.status}`,
  );

  // 6c. Menu & ModifierGroups isolation + FK injection
  const modsB = await req("GET", "/menu/modifier-groups", tokenB);
  const patchModBtoA = await req("PATCH", `/menu/modifier-groups/${modA.data.id}`, tokenB, {
    name: "HACKED",
    isRequired: false,
    minSelect: 0,
    maxSelect: 1,
    modifiers: [{ name: "X", price: 0 }],
  });
  const patchProdBtoA = await req("PATCH", `/menu/products/${prodA.data.id}`, tokenB, { name: "HACKED" });
  const fkProdB = await req("POST", "/menu/products", tokenB, {
    categoryId: catA1Id,
    sku: `FK-B-${ts}`,
    name: "Cross-tenant Cat",
    price: 10000,
  });
  assert(
    "6c. Tenant B ModifierGroups/Products/FK isolated",
    modsB.status === 200 &&
      modsB.data.length === 0 &&
      patchModBtoA.status === 404 &&
      patchProdBtoA.status === 404 &&
      fkProdB.status === 404,
    `modsB=${modsB.data?.length}, patchMod=${patchModBtoA.status}, patchProd=${patchProdBtoA.status}, fkCat=${fkProdB.status}`,
  );

  // 6d. Orders & Payments isolation + simultaneous receiptNo
  const getOrdBtoA = await req("GET", `/orders/${orderA.data.id}`, tokenB);
  const payOrdBtoA = await req("POST", `/orders/${orderA.data.id}/payments`, tokenB, {
    payments: [{ method: "CASH", amount: 50000, paidAmount: 50000 }],
  });
  const crossItemOrdB = await req("POST", "/orders", tokenB, {
    orderType: "TAKEAWAY",
    items: [{ productId: prodA.data.id, quantity: 1 }],
  });
  assert(
    "6d. Tenant B blocked from Tenant A orders/payments/products",
    getOrdBtoA.status === 404 && payOrdBtoA.status === 404 && crossItemOrdB.status === 404,
    `getOrd=${getOrdBtoA.status}, payOrd=${payOrdBtoA.status}, crossItem=${crossItemOrdB.status}`,
  );

  // 6e. Stock: Tenant B can create SAME SKU independently, cannot touch Tenant A ingredient
  const ingB = await req("POST", "/stock/ingredients", tokenB, {
    sku: "SHARED-SKU-01",
    name: "Biji Kopi B",
    unit: "gram",
    purchaseUnit: "kg",
    conversion: 1000,
    unitCost: 180,
    currentStock: 2000,
    minStock: 200,
  });
  const adjBtoA = await req("POST", "/stock/adjust", tokenB, {
    ingredientId: ingA.data.id,
    type: "WASTE",
    qtyChange: 100,
    reason: "HACK",
  });
  assert(
    "6e. Tenant B Stock SKU independent & adjust isolated",
    ingB.status === 201 && adjBtoA.status === 404,
    `ingB=${ingB.status}, adjBtoA=${adjBtoA.status}`,
  );

  // 6f. Simultaneous paid orders in Tenant A & Tenant B (no receiptNo collision!)
  const catsB = await req("GET", "/menu/categories", tokenB);
  const prodB = await req("POST", "/menu/products", tokenB, {
    categoryId: catsB.data[0].id,
    sku: `SKU-B-${ts}`,
    name: "Kopi Susu B",
    price: 20000,
  });
  const orderB = await req("POST", "/orders", tokenB, {
    orderType: "TAKEAWAY",
    items: [{ productId: prodB.data.id, quantity: 1 }],
  });
  const payA = await req("POST", `/orders/${orderA.data.id}/payments`, tokenA, {
    payments: [{ method: "CASH", amount: Number(orderA.data.grandTotal), paidAmount: Number(orderA.data.grandTotal) }],
  });
  const payB = await req("POST", `/orders/${orderB.data.id}/payments`, tokenB, {
    payments: [{ method: "CASH", amount: Number(orderB.data.grandTotal), paidAmount: Number(orderB.data.grandTotal) }],
  });
  assert(
    "6f. Tenant A & Tenant B checkout without receiptNo collision",
    payA.status === 201 && payB.status === 201,
    `payA=${payA.status} (${payA.data?.order?.receiptNo}), payB=${payB.status} (${payB.data?.order?.receiptNo})`,
  );

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
} finally {
  if (cleanupTenantIds.length > 0) {
    const outletIds = (
      await prisma.outlet.findMany({ where: { tenantId: { in: cleanupTenantIds } }, select: { id: true } })
    ).map((o) => o.id);
    await prisma.auditLog.deleteMany({ where: { outletId: { in: outletIds } } });
    await prisma.stockMovement.deleteMany({ where: { outletId: { in: outletIds } } });
    await prisma.payment.deleteMany({ where: { outletId: { in: outletIds } } });
    await prisma.order.deleteMany({ where: { outletId: { in: outletIds } } });
    await prisma.ingredient.deleteMany({ where: { outletId: { in: outletIds } } });
    await prisma.product.deleteMany({ where: { outletId: { in: outletIds } } });
    await prisma.modifierGroup.deleteMany({ where: { outletId: { in: outletIds } } });
    await prisma.category.deleteMany({ where: { outletId: { in: outletIds } } });
    await prisma.station.deleteMany({ where: { outletId: { in: outletIds } } });
    await prisma.user.deleteMany({ where: { tenantId: { in: cleanupTenantIds } } });
    await prisma.role.deleteMany({ where: { tenantId: { in: cleanupTenantIds } } });
    await prisma.outlet.deleteMany({ where: { tenantId: { in: cleanupTenantIds } } });
    await prisma.tenant.deleteMany({ where: { id: { in: cleanupTenantIds } } });
    console.log(`Cleaned up test tenants [${cleanupTenantIds.join(", ")}] and outlets [${outletIds.join(", ")}]`);
  }
  await prisma.$disconnect();
}
