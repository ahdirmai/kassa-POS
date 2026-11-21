import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { adminPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.adminPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.adminPrisma = prisma;
}
