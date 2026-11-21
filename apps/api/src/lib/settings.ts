import { DEFAULT_TAX_CONFIG, type TaxConfig } from "@pos/shared";
import { prisma } from "./prisma.js";

export async function getOutletSettingsMap(outletId = 1): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { outletId } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getOutletTaxConfig(outletId = 1): Promise<TaxConfig> {
  const map = await getOutletSettingsMap(outletId);
  return {
    taxRatePercent: map.taxRatePercent !== undefined ? Number(map.taxRatePercent) : DEFAULT_TAX_CONFIG.taxRatePercent,
    serviceChargePercent:
      map.serviceChargePercent !== undefined ? Number(map.serviceChargePercent) : DEFAULT_TAX_CONFIG.serviceChargePercent,
    taxInclusive: map.taxInclusive !== undefined ? map.taxInclusive === "true" : DEFAULT_TAX_CONFIG.taxInclusive,
    taxAfterService:
      map.taxAfterService !== undefined ? map.taxAfterService === "true" : DEFAULT_TAX_CONFIG.taxAfterService,
    roundingUnit: map.roundingUnit !== undefined ? Number(map.roundingUnit) : DEFAULT_TAX_CONFIG.roundingUnit,
  };
}
