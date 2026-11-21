export interface UnitOption {
  unit: string;
  label: string;
  toBaseFactor: number; // 1 [unit] = toBaseFactor * [baseUnit]
}

// Faktor konversi standar ke satuan kanonik masing-masing keluarga
const WEIGHT_TO_GRAM: Record<string, number> = {
  mg: 0.001,
  g: 1,
  gram: 1,
  gr: 1,
  ons: 100,
  kg: 1000,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  cl: 10,
  dl: 100,
  l: 1000,
  liter: 1000,
  sdt: 5, // sendok teh
  sdm: 15, // sendok makan
  oz: 29.5735, // fluid ounce
  shot: 30, // espresso / syrup shot
  cup: 240,
};

const COUNT_TO_PCS: Record<string, number> = {
  pcs: 1,
  buah: 1,
  butir: 1,
  slice: 1,
  lembar: 1,
  porsi: 1,
  lusin: 12,
  kodi: 20,
};

export interface IngredientUnitPreset {
  label: string;
  unit: string;
  purchaseUnit: string;
  conversion: number;
}

export const INGREDIENT_UNIT_PRESETS: IngredientUnitPreset[] = [
  { label: "Berat (kg → gram)", unit: "gram", purchaseUnit: "kg", conversion: 1000 },
  { label: "Volume (liter → ml)", unit: "ml", purchaseUnit: "liter", conversion: 1000 },
  { label: "Sirup (botol → ml)", unit: "ml", purchaseUnit: "botol", conversion: 750 },
  { label: "Kemasan (pack → gram)", unit: "gram", purchaseUnit: "pack", conversion: 500 },
  { label: "Bakery (box → pcs)", unit: "pcs", purchaseUnit: "box", conversion: 12 },
  { label: "Telur (tray → butir)", unit: "butir", purchaseUnit: "tray", conversion: 30 },
  { label: "Satuan (pcs → pcs)", unit: "pcs", purchaseUnit: "pcs", conversion: 1 },
];

function norm(u: string) {
  return u.trim().toLowerCase();
}

function findFamily(unit: string): Record<string, number> | null {
  const k = norm(unit);
  if (k in WEIGHT_TO_GRAM) return WEIGHT_TO_GRAM;
  if (k in VOLUME_TO_ML) return VOLUME_TO_ML;
  if (k in COUNT_TO_PCS) return COUNT_TO_PCS;
  return null;
}

/**
 * Mengembalikan semua satuan yang kompatibel dengan bahan baku tertentu:
 * 1. Satuan dasar bahan (faktor 1)
 * 2. Satuan beli bahan (faktor = conversion)
 * 3. Satuan standar lain dalam keluarga yang sama (mis. gram <-> kg/ons, ml <-> liter/sdm/sdt/oz/shot)
 */
export function getCompatibleUnits(
  baseUnit: string,
  purchaseUnit?: string | null,
  conversion = 1,
): UnitOption[] {
  const seen = new Set<string>();
  const out: UnitOption[] = [];

  const pushUnique = (unit: string, label: string, toBaseFactor: number) => {
    const key = norm(unit);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ unit, label, toBaseFactor });
  };

  pushUnique(baseUnit, `${baseUnit} (dasar)`, 1);

  if (purchaseUnit && norm(purchaseUnit) !== norm(baseUnit) && conversion > 0) {
    pushUnique(purchaseUnit, `${purchaseUnit} (1 = ${conversion} ${baseUnit})`, conversion);
  }

  const family = findFamily(baseUnit);
  if (family) {
    const baseCanonical = family[norm(baseUnit)];
    const preferredOrder =
      family === WEIGHT_TO_GRAM
        ? ["gram", "ons", "kg", "mg"]
        : family === VOLUME_TO_ML
          ? ["ml", "liter", "sdt", "sdm", "shot", "oz", "cup"]
          : ["pcs", "lusin", "kodi"];

    for (const u of preferredOrder) {
      const factor = Number((family[u] / baseCanonical).toFixed(6));
      pushUnique(u, u, factor);
    }
  }

  return out;
}

/**
 * Mengonversi kuantitas dari `fromUnit` ke `baseUnit` bahan baku.
 * Mendukung satuan dasar, satuan beli (custom conversion), maupun satuan satu keluarga (Berat/Volume/Hitungan).
 */
export function convertToBaseUnit(
  qty: number,
  fromUnit: string | undefined | null,
  baseUnit: string,
  purchaseUnit?: string | null,
  conversion = 1,
): number {
  if (!fromUnit || norm(fromUnit) === norm(baseUnit)) {
    return Number(qty.toFixed(4));
  }
  if (purchaseUnit && norm(fromUnit) === norm(purchaseUnit) && conversion > 0) {
    return Number((qty * conversion).toFixed(4));
  }
  const family = findFamily(baseUnit);
  if (family && norm(fromUnit) in family) {
    const factor = family[norm(fromUnit)] / family[norm(baseUnit)];
    return Number((qty * factor).toFixed(4));
  }
  // Fallback: jika satuan kustom tak dikenal, anggap 1:1
  return Number(qty.toFixed(4));
}
