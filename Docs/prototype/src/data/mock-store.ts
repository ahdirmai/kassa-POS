export interface ProtoProduct {
  id: number;
  sku: string;
  name: string;
  monogram: string;
  tone: string;
  category: string;
  station: "BAR" | "KITCHEN" | "PASTRY";
  price: number;
  hpp: number;
  imageUrl?: string;
  available: boolean;
  modifiers?: Array<{ name: string; price: number }>;
  recipe?: Array<{ ingredientId: number; qty: number }>;
}

export interface ProtoTable {
  id: number;
  code: string;
  name: string;
  area: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED";
}

export interface ProtoIngredient {
  id: number;
  sku: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  unitCost: number;
}

export interface ProtoKdsTicket {
  id: string;
  orderNo: string;
  tableName: string;
  station: "BAR" | "KITCHEN" | "PASTRY";
  status: "NEW" | "PREPARING" | "READY" | "BUMPED";
  createdAt: string;
  items: Array<{ name: string; qty: number; mods: string[]; note?: string }>;
}

export interface ProtoOrder {
  id: string;
  receiptNo: string;
  createdAt: string;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableName: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  service: number;
  tax: number;
  rounding: number;
  grandTotal: number;
  paidAmount: number;
  changeAmt: number;
  offline: boolean;
  items: Array<{ name: string; qty: number; lineTotal: number; mods: string[] }>;
}

export interface ProtoRole {
  code: string;
  name: string;
  permissions: string[];
}

export const PROTO_PERMISSIONS = [
  { code: "pos.access", label: "Kasir POS" },
  { code: "kds.view", label: "Layar Dapur (KDS)" },
  { code: "report.view", label: "Dashboard & Laporan" },
  { code: "table.manage", label: "Kelola Meja" },
  { code: "stock.view", label: "Stok & HPP" },
  { code: "approval.pin", label: "Approval PIN Void/Refund" },
  { code: "role.manage", label: "Kelola RBAC Dinamis" },
];

export interface ProtoState {
  products: ProtoProduct[];
  tables: ProtoTable[];
  ingredients: ProtoIngredient[];
  tickets: ProtoKdsTicket[];
  orders: ProtoOrder[];
  shift: { open: boolean; openingCash: number; cashier: string; openedAt: string };
  roles: ProtoRole[];
  activeRoleCode: string;
}

export const INITIAL_STATE: ProtoState = {
  products: [
    {
      id: 1, sku: "KP-001", name: "Es Kopi Susu Senja", monogram: "KS", tone: "iris",
      category: "Kopi & Espresso", station: "BAR", price: 28000, hpp: 8200, available: true,
      imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
      modifiers: [{ name: "Less Sugar", price: 0 }, { name: "Extra Shot", price: 8000 }, { name: "Oat Milk", price: 10000 }],
      recipe: [{ ingredientId: 1, qty: 18 }, { ingredientId: 2, qty: 140 }],
    },
    {
      id: 2, sku: "KP-002", name: "Americano House Blend", monogram: "AM", tone: "slate",
      category: "Kopi & Espresso", station: "BAR", price: 24000, hpp: 5200, available: true,
      imageUrl: "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=600&q=80",
      modifiers: [{ name: "Iced", price: 0 }, { name: "Hot", price: 0 }, { name: "Extra Shot", price: 8000 }],
      recipe: [{ ingredientId: 1, qty: 18 }],
    },
    {
      id: 3, sku: "NK-001", name: "Uji Matcha Latte", monogram: "ML", tone: "lime",
      category: "Non-Kopi & Teh", station: "BAR", price: 35000, hpp: 11200, available: true,
      imageUrl: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=600&q=80",
      modifiers: [{ name: "Less Sugar", price: 0 }, { name: "Oat Milk", price: 10000 }],
      recipe: [{ ingredientId: 2, qty: 160 }, { ingredientId: 3, qty: 15 }],
    },
    {
      id: 4, sku: "NK-002", name: "Lychee Iced Tea", monogram: "LT", tone: "teal",
      category: "Non-Kopi & Teh", station: "BAR", price: 25000, hpp: 6400, available: true,
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 5, sku: "MK-001", name: "Nasi Goreng Kampung Senja", monogram: "NG", tone: "coral",
      category: "Makanan Utama", station: "KITCHEN", price: 45000, hpp: 16500, available: true,
      imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
      modifiers: [{ name: "Pedas Mantap", price: 0 }, { name: "Telur Mata Sapi", price: 7000 }],
      recipe: [{ ingredientId: 4, qty: 220 }, { ingredientId: 5, qty: 100 }],
    },
    {
      id: 6, sku: "MK-002", name: "Rice Bowl Ayam Sambal Matah", monogram: "RB", tone: "rose",
      category: "Makanan Utama", station: "KITCHEN", price: 42000, hpp: 15200, available: true,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
      modifiers: [{ name: "Ekstra Sambal", price: 5000 }, { name: "Telur Mata Sapi", price: 7000 }],
      recipe: [{ ingredientId: 4, qty: 200 }, { ingredientId: 5, qty: 120 }],
    },
    {
      id: 7, sku: "CM-001", name: "Truffle French Fries", monogram: "TF", tone: "amber",
      category: "Camilan & Share", station: "KITCHEN", price: 32000, hpp: 9800, available: true,
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: 8, sku: "PS-001", name: "Butter Croissant", monogram: "BC", tone: "plum",
      category: "Pastry & Dessert", station: "PASTRY", price: 29000, hpp: 9200, available: true,
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
      recipe: [{ ingredientId: 6, qty: 1 }],
    },
    {
      id: 9, sku: "PS-002", name: "Burnt Basque Cheesecake", monogram: "CC", tone: "sky",
      category: "Pastry & Dessert", station: "PASTRY", price: 44000, hpp: 14800, available: true,
      imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
    },
  ],
  tables: [
    { id: 1, code: "T01", name: "Meja T01", area: "Indoor Utama", capacity: 4, status: "AVAILABLE" },
    { id: 2, code: "T02", name: "Meja T02", area: "Indoor Utama", capacity: 4, status: "OCCUPIED" },
    { id: 3, code: "T03", name: "Meja T03", area: "Indoor Utama", capacity: 4, status: "AVAILABLE" },
    { id: 4, code: "T04", name: "Meja T04", area: "Indoor Utama", capacity: 2, status: "AVAILABLE" },
    { id: 5, code: "O01", name: "Meja O01", area: "Teras & Taman", capacity: 4, status: "AVAILABLE" },
    { id: 6, code: "O02", name: "Meja O02", area: "Teras & Taman", capacity: 4, status: "AVAILABLE" },
    { id: 7, code: "V01", name: "Meja V01", area: "VIP & Meeting", capacity: 8, status: "AVAILABLE" },
  ],
  ingredients: [
    { id: 1, sku: "ING-BEAN", name: "Biji Kopi House Blend", unit: "gram", stock: 4200, minStock: 1000, unitCost: 260 },
    { id: 2, sku: "ING-MILK", name: "Susu UHT Full Cream", unit: "ml", stock: 14500, minStock: 4000, unitCost: 22 },
    { id: 3, sku: "ING-MATCHA", name: "Bubuk Uji Matcha", unit: "gram", stock: 240, minStock: 300, unitCost: 420 },
    { id: 4, sku: "ING-RICE", name: "Beras Pandan Wangi", unit: "gram", stock: 18000, minStock: 5000, unitCost: 18 },
    { id: 5, sku: "ING-CHICK", name: "Fillet Dada Ayam", unit: "gram", stock: 6200, minStock: 2000, unitCost: 62 },
    { id: 6, sku: "ING-CROIS", name: "Adonan Croissant Butter", unit: "pcs", stock: 9, minStock: 10, unitCost: 9200 },
  ],
  tickets: [
    {
      id: "TKT-01",
      orderNo: "ORD-DEMO-001",
      tableName: "Meja T02",
      station: "BAR",
      status: "PREPARING",
      createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
      items: [
        { name: "Es Kopi Susu Senja", qty: 2, mods: ["Less Sugar", "Oat Milk"] },
        { name: "Uji Matcha Latte", qty: 1, mods: [] },
      ],
    },
    {
      id: "TKT-02",
      orderNo: "ORD-DEMO-001",
      tableName: "Meja T02",
      station: "KITCHEN",
      status: "NEW",
      createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
      items: [{ name: "Nasi Goreng Kampung Senja", qty: 1, mods: ["Pedas Mantap"], note: "Tanpa acar" }],
    },
  ],
  orders: [
    {
      id: "ORD-000",
      receiptNo: "RCP-20261119-0001",
      createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
      orderType: "DINE_IN",
      tableName: "Meja T01",
      paymentMethod: "TUNAI",
      subtotal: 101000,
      discount: 0,
      service: 5050,
      tax: 10605,
      rounding: 45,
      grandTotal: 116700,
      paidAmount: 150000,
      changeAmt: 33300,
      offline: false,
      items: [
        { name: "Es Kopi Susu Senja", qty: 2, lineTotal: 56000, mods: [] },
        { name: "Nasi Goreng Kampung Senja", qty: 1, lineTotal: 45000, mods: [] },
      ],
    },
  ],
  shift: {
    open: true,
    openingCash: 500000,
    cashier: "Dina Kartika",
    openedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  roles: [
    {
      code: "OWNER",
      name: "Owner",
      permissions: ["pos.access", "kds.view", "report.view", "table.manage", "stock.view", "approval.pin", "role.manage"],
    },
    {
      code: "MANAGER",
      name: "Manager",
      permissions: ["pos.access", "kds.view", "report.view", "table.manage", "stock.view", "approval.pin"],
    },
    {
      code: "CASHIER",
      name: "Kasir",
      permissions: ["pos.access", "table.manage"],
    },
    {
      code: "KITCHEN",
      name: "Dapur / Bar",
      permissions: ["kds.view"],
    },
  ],
  activeRoleCode: "OWNER",
};

export function calcTotals(subtotal: number, discountPct: number) {
  const discount = Math.round((subtotal * discountPct) / 100);
  const net = Math.max(0, subtotal - discount);
  const service = Math.round(net * 0.05);
  const tax = Math.round((net + service) * 0.1);
  const pre = net + service + tax;
  const grandTotal = Math.round(pre / 100) * 100;
  const rounding = grandTotal - pre;
  return { subtotal, discount, service, tax, rounding, grandTotal };
}

export function formatIDR(n: number) {
  const r = Math.round(n);
  return (r < 0 ? "-Rp" : "Rp") + Math.abs(r).toLocaleString("id-ID");
}
