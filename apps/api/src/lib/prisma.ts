import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

/**
 * Mengonversi semua nilai BigInt menjadi Number secara rekursif
 * agar JSON.stringify di Express tidak error dan FE menerima angka rupiah rapi.
 */
export function serializeJson<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => (typeof value === "bigint" ? Number(value) : value)),
  );
}
