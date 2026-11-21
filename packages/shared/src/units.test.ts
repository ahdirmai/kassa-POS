import { describe, expect, it } from "vitest";
import { convertToBaseUnit, getCompatibleUnits } from "./units.js";

describe("flexible measurement units", () => {
  it("mengonversi satuan beli custom (box -> pcs, botol -> ml, tray -> butir)", () => {
    expect(convertToBaseUnit(2, "box", "pcs", "box", 12)).toBe(24);
    expect(convertToBaseUnit(1.5, "botol", "ml", "botol", 750)).toBe(1125);
    expect(convertToBaseUnit(3, "tray", "butir", "tray", 30)).toBe(90);
  });

  it("mengonversi satuan lintas keluarga berat dan volume", () => {
    expect(convertToBaseUnit(2.5, "kg", "gram", "kg", 1000)).toBe(2500);
    expect(convertToBaseUnit(3, "ons", "gram", "kg", 1000)).toBe(300);
    expect(convertToBaseUnit(2, "sdm", "ml", "liter", 1000)).toBe(30);
    expect(convertToBaseUnit(1, "shot", "ml", "liter", 1000)).toBe(30);
    expect(convertToBaseUnit(150, "ml", "liter", "galon", 19)).toBe(0.15);
  });

  it("menghasilkan daftar satuan kompatibel untuk dropdown", () => {
    const opts = getCompatibleUnits("ml", "botol", 750);
    const names = opts.map((o) => o.unit);
    expect(names).toContain("ml");
    expect(names).toContain("botol");
    expect(names).toContain("liter");
    expect(names).toContain("sdm");
    expect(names).toContain("shot");
  });
});
