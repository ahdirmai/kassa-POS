export type BusinessType =
  | "COFFEE_SHOP"
  | "RESTAURANT"
  | "BAKERY"
  | "FAST_FOOD"
  | "BEVERAGE_BAR";

export type FoodType =
  | "COFFEE"
  | "NON_COFFEE"
  | "BOBA_COLD"
  | "HEAVY_MEAL"
  | "GRILL_WESTERN"
  | "PASTRY_CAKE"
  | "SNACK";

export type ServiceMode = "DINE_IN_AND_TAKEAWAY" | "COUNTER_ONLY";

export interface BusinessTypeOption {
  code: BusinessType;
  label: string;
  description: string;
  defaultFoodTypes: FoodType[];
  defaultServiceMode: ServiceMode;
}

export interface FoodTypeOption {
  code: FoodType;
  label: string;
  description: string;
  stationCode: "BAR" | "KITCHEN";
  tone: string;
}

export const BUSINESS_TYPES: BusinessTypeOption[] = [
  {
    code: "COFFEE_SHOP",
    label: "Kedai Kopi & Kafe",
    description: "Coffee shop, roastery, atau kafe nongkrong dengan kopi, non-kopi, & pastry.",
    defaultFoodTypes: ["COFFEE", "NON_COFFEE", "PASTRY_CAKE", "SNACK"],
    defaultServiceMode: "DINE_IN_AND_TAKEAWAY",
  },
  {
    code: "RESTAURANT",
    label: "Restoran & Rumah Makan",
    description: "Resto keluarga, warung makan modern, atau bistro dengan meja dine-in.",
    defaultFoodTypes: ["HEAVY_MEAL", "SNACK", "NON_COFFEE"],
    defaultServiceMode: "DINE_IN_AND_TAKEAWAY",
  },
  {
    code: "BAKERY",
    label: "Bakery & Pastry",
    description: "Toko roti, cake shop, croissant, dan dessert dengan kopi pendamping.",
    defaultFoodTypes: ["PASTRY_CAKE", "COFFEE", "NON_COFFEE"],
    defaultServiceMode: "COUNTER_ONLY",
  },
  {
    code: "FAST_FOOD",
    label: "Cepat Saji & Street Food",
    description: "Ayam geprek, burger, rice bowl, atau booth cepat saji.",
    defaultFoodTypes: ["HEAVY_MEAL", "GRILL_WESTERN", "SNACK", "NON_COFFEE"],
    defaultServiceMode: "COUNTER_ONLY",
  },
  {
    code: "BEVERAGE_BAR",
    label: "Minuman Kekinian & Tea Bar",
    description: "Boba, es teh, matcha bar, jus, atau booth minuman take-away.",
    defaultFoodTypes: ["BOBA_COLD", "NON_COFFEE", "COFFEE"],
    defaultServiceMode: "COUNTER_ONLY",
  },
];

export const FOOD_TYPES: FoodTypeOption[] = [
  {
    code: "COFFEE",
    label: "Kopi & Espresso",
    description: "Kopi susu gula aren, latte, americano, cappuccino.",
    stationCode: "BAR",
    tone: "iris",
  },
  {
    code: "NON_COFFEE",
    label: "Teh, Matcha & Non-Kopi",
    description: "Matcha latte, cokelat, lemon tea, lychee tea.",
    stationCode: "BAR",
    tone: "sage",
  },
  {
    code: "BOBA_COLD",
    label: "Boba, Frappe & Minuman Dingin",
    description: "Brown sugar boba, taro milk, mango yakult.",
    stationCode: "BAR",
    tone: "amber",
  },
  {
    code: "HEAVY_MEAL",
    label: "Makanan Berat (Nasi & Mie)",
    description: "Nasi goreng, ayam geprek, rice bowl, mie goreng.",
    stationCode: "KITCHEN",
    tone: "coral",
  },
  {
    code: "GRILL_WESTERN",
    label: "Western, Burger & Pasta",
    description: "Beef burger, spaghetti aglio olio, chicken steak.",
    stationCode: "KITCHEN",
    tone: "coral",
  },
  {
    code: "PASTRY_CAKE",
    label: "Pastry, Roti & Cake",
    description: "Butter croissant, pain au chocolat, burnt cheesecake.",
    stationCode: "KITCHEN",
    tone: "amber",
  },
  {
    code: "SNACK",
    label: "Camilan & Gorengan",
    description: "Kentang goreng, tahu crispy, pisang goreng, mix platter.",
    stationCode: "KITCHEN",
    tone: "sage",
  },
];

export interface SeedModifierGroupSpec {
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  modifiers: Array<{ name: string; price: number }>;
}

export interface SeedProductSpec {
  categoryName: string;
  stationCode: "BAR" | "KITCHEN";
  sku: string;
  name: string;
  monogram: string;
  tone: string;
  price: number;
  cost: number;
  variants?: Array<{ name: string; priceDelta: number; isDefault?: boolean }>;
  modifierGroupNames?: string[];
}

export interface SeedAreaSpec {
  name: string;
  tables: Array<{ code: string; name: string; capacity: number }>;
}

export interface SeedIngredientSpec {
  sku: string;
  name: string;
  unit: string;
  purchaseUnit: string;
  conversion: number;
  unitCost: number;
  currentStock: number;
  minStock: number;
}

export interface OnboardingSeedBlueprint {
  categories: Array<{ name: string; tone: string; sortOrder: number }>;
  modifierGroups: SeedModifierGroupSpec[];
  products: SeedProductSpec[];
  areas: SeedAreaSpec[];
  ingredients: SeedIngredientSpec[];
}

const CATALOG_BY_FOOD: Record<
  FoodType,
  {
    categoryName: string;
    tone: string;
    products: Omit<SeedProductSpec, "categoryName">[];
    ingredients: SeedIngredientSpec[];
  }
> = {
  COFFEE: {
    categoryName: "Kopi & Espresso",
    tone: "iris",
    products: [
      {
        stationCode: "BAR",
        sku: "KOP-AREN",
        name: "Es Kopi Susu Gula Aren",
        monogram: "KA",
        tone: "iris",
        price: 24000,
        cost: 8500,
        variants: [
          { name: "Regular", priceDelta: 0, isDefault: true },
          { name: "Large", priceDelta: 5000 },
        ],
        modifierGroupNames: ["Level Gula", "Level Es", "Extra Minuman"],
      },
      {
        stationCode: "BAR",
        sku: "KOP-AMER",
        name: "Americano",
        monogram: "AM",
        tone: "iris",
        price: 20000,
        cost: 5500,
        variants: [
          { name: "Hot", priceDelta: 0, isDefault: true },
          { name: "Iced", priceDelta: 2000 },
        ],
        modifierGroupNames: ["Level Gula", "Extra Minuman"],
      },
      {
        stationCode: "BAR",
        sku: "KOP-LATT",
        name: "Caffe Latte",
        monogram: "CL",
        tone: "iris",
        price: 28000,
        cost: 9500,
        variants: [
          { name: "Hot", priceDelta: 0, isDefault: true },
          { name: "Iced", priceDelta: 2000 },
        ],
        modifierGroupNames: ["Level Gula", "Extra Minuman"],
      },
    ],
    ingredients: [
      { sku: "ING-BEANS", name: "Biji Kopi Espresso Blend", unit: "gram", purchaseUnit: "kg", conversion: 1000, unitCost: 220, currentStock: 2000, minStock: 500 },
      { sku: "ING-MILK", name: "Susu UHT Full Cream", unit: "ml", purchaseUnit: "liter", conversion: 1000, unitCost: 20, currentStock: 6000, minStock: 2000 },
      { sku: "ING-AREN", name: "Sirup Gula Aren", unit: "ml", purchaseUnit: "liter", conversion: 1000, unitCost: 45, currentStock: 1500, minStock: 400 },
    ],
  },
  NON_COFFEE: {
    categoryName: "Teh & Non-Kopi",
    tone: "sage",
    products: [
      {
        stationCode: "BAR",
        sku: "NON-MTCH",
        name: "Matcha Latte",
        monogram: "ML",
        tone: "sage",
        price: 28000,
        cost: 10000,
        variants: [
          { name: "Iced", priceDelta: 0, isDefault: true },
          { name: "Hot", priceDelta: 0 },
        ],
        modifierGroupNames: ["Level Gula", "Level Es"],
      },
      {
        stationCode: "BAR",
        sku: "NON-CHOC",
        name: "Signature Chocolate",
        monogram: "SC",
        tone: "sage",
        price: 26000,
        cost: 9000,
        variants: [
          { name: "Iced", priceDelta: 0, isDefault: true },
          { name: "Hot", priceDelta: 0 },
        ],
        modifierGroupNames: ["Level Gula", "Level Es"],
      },
      {
        stationCode: "BAR",
        sku: "NON-LYCH",
        name: "Iced Lychee Tea",
        monogram: "LT",
        tone: "sage",
        price: 22000,
        cost: 6500,
        modifierGroupNames: ["Level Gula", "Level Es"],
      },
    ],
    ingredients: [
      { sku: "ING-MATCHA", name: "Bubuk Matcha Ceremonial", unit: "gram", purchaseUnit: "pack", conversion: 500, unitCost: 450, currentStock: 500, minStock: 100 },
      { sku: "ING-TEA", name: "Daun Teh Hitam Premium", unit: "gram", purchaseUnit: "pack", conversion: 500, unitCost: 90, currentStock: 800, minStock: 200 },
    ],
  },
  BOBA_COLD: {
    categoryName: "Boba & Minuman Dingin",
    tone: "amber",
    products: [
      {
        stationCode: "BAR",
        sku: "BOB-BSUG",
        name: "Brown Sugar Boba Milk",
        monogram: "BS",
        tone: "amber",
        price: 27000,
        cost: 9500,
        variants: [
          { name: "Regular", priceDelta: 0, isDefault: true },
          { name: "Large", priceDelta: 5000 },
        ],
        modifierGroupNames: ["Level Gula", "Level Es", "Extra Minuman"],
      },
      {
        stationCode: "BAR",
        sku: "BOB-TARO",
        name: "Taro Milk Cream",
        monogram: "TM",
        tone: "amber",
        price: 25000,
        cost: 8500,
        modifierGroupNames: ["Level Gula", "Level Es", "Extra Minuman"],
      },
      {
        stationCode: "BAR",
        sku: "BOB-MANG",
        name: "Mango Yakult Fresh",
        monogram: "MY",
        tone: "amber",
        price: 24000,
        cost: 8000,
        modifierGroupNames: ["Level Gula", "Level Es"],
      },
    ],
    ingredients: [
      { sku: "ING-BOBA", name: "Tapioca Pearl Boba", unit: "gram", purchaseUnit: "kg", conversion: 1000, unitCost: 35, currentStock: 2000, minStock: 500 },
    ],
  },
  HEAVY_MEAL: {
    categoryName: "Makanan Berat",
    tone: "coral",
    products: [
      {
        stationCode: "KITCHEN",
        sku: "MKN-NSGR",
        name: "Nasi Goreng Spesial",
        monogram: "NG",
        tone: "coral",
        price: 34000,
        cost: 13500,
        modifierGroupNames: ["Level Pedas", "Tambahan Lauk"],
      },
      {
        stationCode: "KITCHEN",
        sku: "MKN-AYGP",
        name: "Rice Bowl Ayam Sambal Matah",
        monogram: "AM",
        tone: "coral",
        price: 32000,
        cost: 12500,
        modifierGroupNames: ["Level Pedas", "Tambahan Lauk"],
      },
      {
        stationCode: "KITCHEN",
        sku: "MKN-MIEG",
        name: "Mie Goreng Jawa",
        monogram: "MJ",
        tone: "coral",
        price: 30000,
        cost: 11000,
        modifierGroupNames: ["Level Pedas", "Tambahan Lauk"],
      },
    ],
    ingredients: [
      { sku: "ING-RICE", name: "Beras Pandan Wangi", unit: "gram", purchaseUnit: "kg", conversion: 1000, unitCost: 16, currentStock: 10000, minStock: 3000 },
      { sku: "ING-CHKN", name: "Dada Ayam Fillet", unit: "gram", purchaseUnit: "kg", conversion: 1000, unitCost: 58, currentStock: 4000, minStock: 1000 },
    ],
  },
  GRILL_WESTERN: {
    categoryName: "Western & Burger",
    tone: "coral",
    products: [
      {
        stationCode: "KITCHEN",
        sku: "WST-BRGR",
        name: "Classic Beef Cheese Burger",
        monogram: "BB",
        tone: "coral",
        price: 42000,
        cost: 17500,
        variants: [
          { name: "Single Patty", priceDelta: 0, isDefault: true },
          { name: "Double Patty", priceDelta: 15000 },
        ],
        modifierGroupNames: ["Tambahan Lauk"],
      },
      {
        stationCode: "KITCHEN",
        sku: "WST-AGLI",
        name: "Spaghetti Aglio Olio",
        monogram: "AO",
        tone: "coral",
        price: 38000,
        cost: 14000,
        modifierGroupNames: ["Level Pedas"],
      },
    ],
    ingredients: [
      { sku: "ING-BEEF", name: "Beef Patty Premium", unit: "pcs", purchaseUnit: "pack", conversion: 10, unitCost: 11000, currentStock: 30, minStock: 10 },
    ],
  },
  PASTRY_CAKE: {
    categoryName: "Pastry & Bakery",
    tone: "amber",
    products: [
      {
        stationCode: "KITCHEN",
        sku: "PST-CROI",
        name: "Butter Croissant",
        monogram: "BC",
        tone: "amber",
        price: 26000,
        cost: 10500,
      },
      {
        stationCode: "KITCHEN",
        sku: "PST-CHOC",
        name: "Pain au Chocolat",
        monogram: "PC",
        tone: "amber",
        price: 29000,
        cost: 11500,
      },
      {
        stationCode: "KITCHEN",
        sku: "PST-CHSC",
        name: "Basque Burnt Cheesecake",
        monogram: "CC",
        tone: "amber",
        price: 38000,
        cost: 15000,
      },
    ],
    ingredients: [
      { sku: "ING-CROI", name: "Adonan Croissant Butter", unit: "pcs", purchaseUnit: "box", conversion: 12, unitCost: 9000, currentStock: 24, minStock: 8 },
    ],
  },
  SNACK: {
    categoryName: "Camilan & Snack",
    tone: "sage",
    products: [
      {
        stationCode: "KITCHEN",
        sku: "SNK-FRIE",
        name: "French Fries Truffle",
        monogram: "FF",
        tone: "sage",
        price: 24000,
        cost: 8000,
        modifierGroupNames: ["Level Pedas"],
      },
      {
        stationCode: "KITCHEN",
        sku: "SNK-PLAT",
        name: "Snack Mix Platter",
        monogram: "MP",
        tone: "sage",
        price: 36000,
        cost: 14000,
        modifierGroupNames: ["Level Pedas"],
      },
    ],
    ingredients: [
      { sku: "ING-POTT", name: "Kentang Shoestring", unit: "gram", purchaseUnit: "kg", conversion: 1000, unitCost: 42, currentStock: 3000, minStock: 1000 },
    ],
  },
};

export function buildOnboardingSeedBlueprint(input: {
  businessType: BusinessType;
  foodTypes: FoodType[];
  serviceMode: ServiceMode;
}): OnboardingSeedBlueprint {
  const uniqueFoodTypes: FoodType[] =
    input.foodTypes.length > 0
      ? [...new Set(input.foodTypes)]
      : BUSINESS_TYPES.find((b) => b.code === input.businessType)?.defaultFoodTypes ?? ["COFFEE", "SNACK"];

  const hasBeverages = uniqueFoodTypes.some((f) => f === "COFFEE" || f === "NON_COFFEE" || f === "BOBA_COLD");
  const hasFood = uniqueFoodTypes.some((f) => f === "HEAVY_MEAL" || f === "GRILL_WESTERN" || f === "SNACK");

  const modifierGroups: SeedModifierGroupSpec[] = [];
  if (hasBeverages) {
    modifierGroups.push(
      {
        name: "Level Gula",
        isRequired: false,
        minSelect: 0,
        maxSelect: 1,
        modifiers: [
          { name: "Normal Sugar", price: 0 },
          { name: "Less Sugar (50%)", price: 0 },
          { name: "No Sugar", price: 0 },
        ],
      },
      {
        name: "Level Es",
        isRequired: false,
        minSelect: 0,
        maxSelect: 1,
        modifiers: [
          { name: "Normal Ice", price: 0 },
          { name: "Less Ice", price: 0 },
          { name: "No Ice", price: 0 },
        ],
      },
      {
        name: "Extra Minuman",
        isRequired: false,
        minSelect: 0,
        maxSelect: 3,
        modifiers: [
          { name: "Extra Espresso Shot", price: 6000 },
          { name: "Oat Milk", price: 8000 },
          { name: "Boba / Jelly Topping", price: 5000 },
        ],
      },
    );
  }
  if (hasFood) {
    modifierGroups.push(
      {
        name: "Level Pedas",
        isRequired: false,
        minSelect: 0,
        maxSelect: 1,
        modifiers: [
          { name: "Tidak Pedas", price: 0 },
          { name: "Sedang", price: 0 },
          { name: "Pedas", price: 0 },
          { name: "Extra Pedas", price: 2000 },
        ],
      },
      {
        name: "Tambahan Lauk",
        isRequired: false,
        minSelect: 0,
        maxSelect: 3,
        modifiers: [
          { name: "Telur Mata Sapi", price: 6000 },
          { name: "Extra Keju Slice", price: 6000 },
          { name: "Nasi Putih Extra", price: 7000 },
        ],
      },
    );
  }

  const categories: OnboardingSeedBlueprint["categories"] = [];
  const products: SeedProductSpec[] = [];
  const ingredientMap = new Map<string, SeedIngredientSpec>();

  uniqueFoodTypes.forEach((ft, idx) => {
    const bundle = CATALOG_BY_FOOD[ft];
    if (!bundle) return;
    categories.push({ name: bundle.categoryName, tone: bundle.tone, sortOrder: idx + 1 });
    for (const p of bundle.products) {
      products.push({ ...p, categoryName: bundle.categoryName });
    }
    for (const ing of bundle.ingredients) {
      ingredientMap.set(ing.sku, ing);
    }
  });

  let areas: SeedAreaSpec[] = [];
  if (input.serviceMode === "DINE_IN_AND_TAKEAWAY") {
    if (input.businessType === "RESTAURANT") {
      areas = [
        {
          name: "Ruang Utama",
          tables: [
            { code: "M01", name: "Meja 1", capacity: 4 },
            { code: "M02", name: "Meja 2", capacity: 4 },
            { code: "M03", name: "Meja 3", capacity: 6 },
            { code: "M04", name: "Meja 4", capacity: 6 },
          ],
        },
        {
          name: "Area Keluarga / VIP",
          tables: [
            { code: "V01", name: "VIP 1", capacity: 8 },
            { code: "V02", name: "VIP 2", capacity: 10 },
          ],
        },
      ];
    } else {
      areas = [
        {
          name: "Indoor",
          tables: [
            { code: "A01", name: "Meja A1", capacity: 2 },
            { code: "A02", name: "Meja A2", capacity: 4 },
            { code: "A03", name: "Meja A3", capacity: 4 },
            { code: "A04", name: "Meja A4", capacity: 2 },
          ],
        },
        {
          name: "Outdoor / Teras",
          tables: [
            { code: "B01", name: "Teras 1", capacity: 4 },
            { code: "B02", name: "Teras 2", capacity: 4 },
          ],
        },
      ];
    }
  }

  return {
    categories,
    modifierGroups,
    products,
    areas,
    ingredients: [...ingredientMap.values()],
  };
}
