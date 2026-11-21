import { describe, expect, it } from "vitest";
import { buildOnboardingSeedBlueprint } from "./onboarding.js";

describe("buildOnboardingSeedBlueprint", () => {
  it("builds coffee shop catalog with beverage modifiers and tables for dine-in", () => {
    const bp = buildOnboardingSeedBlueprint({
      businessType: "COFFEE_SHOP",
      foodTypes: ["COFFEE", "PASTRY_CAKE"],
      serviceMode: "DINE_IN_AND_TAKEAWAY",
    });

    expect(bp.categories.map((c) => c.name)).toEqual(["Kopi & Espresso", "Pastry & Bakery"]);
    expect(bp.products.length).toBeGreaterThanOrEqual(5);
    expect(bp.modifierGroups.some((m) => m.name === "Level Gula")).toBe(true);
    expect(bp.modifierGroups.some((m) => m.name === "Level Pedas")).toBe(false);
    expect(bp.areas.length).toBe(2);
    expect(bp.ingredients.length).toBeGreaterThan(0);
  });

  it("builds restaurant catalog with food modifiers and omits tables for counter-only", () => {
    const bp = buildOnboardingSeedBlueprint({
      businessType: "FAST_FOOD",
      foodTypes: ["HEAVY_MEAL", "SNACK"],
      serviceMode: "COUNTER_ONLY",
    });

    expect(bp.categories.map((c) => c.name)).toEqual(["Makanan Berat", "Camilan & Snack"]);
    expect(bp.modifierGroups.some((m) => m.name === "Level Pedas")).toBe(true);
    expect(bp.modifierGroups.some((m) => m.name === "Level Gula")).toBe(false);
    expect(bp.areas).toEqual([]);
  });
});
