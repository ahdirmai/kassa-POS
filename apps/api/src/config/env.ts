import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  API_PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:3005,http://localhost:3006"),
  JWT_ACCESS_SECRET: z.string().min(16).default("kassa-pos-dev-access-secret-key-min-32-chars"),
  JWT_REFRESH_SECRET: z.string().min(16).default("kassa-pos-dev-refresh-secret-key-min-32-chars"),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().default(7),
  PLATFORM_JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default("kassa-platform-backoffice-access-secret-min-32-chars"),
  PLATFORM_JWT_EXPIRES: z.string().default("8h"),
  PLATFORM_ADMIN_EMAIL: z.string().email().default("superadmin@kassa.biz.id"),
  PLATFORM_ADMIN_PASSWORD: z.string().min(8).default("kassa-superadmin-2026"),
  PAYMENT_PROVIDER: z.string().default("midtrans"),
  MIDTRANS_MODE: z.enum(["mock", "sandbox", "production"]).default("mock"),
  MIDTRANS_SERVER_KEY: z.string().default("SB-Mid-server-mock-key"),
  MIDTRANS_API_URL: z.string().default("https://api.sandbox.midtrans.com"),
});

export const env = envSchema.parse(process.env);
