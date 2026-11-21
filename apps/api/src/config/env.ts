import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  API_PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z.string().min(16).default("cadra-pos-dev-access-secret-key-min-32-chars"),
  JWT_REFRESH_SECRET: z.string().min(16).default("cadra-pos-dev-refresh-secret-key-min-32-chars"),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().default(7),
  PAYMENT_PROVIDER: z.string().default("midtrans"),
  MIDTRANS_MODE: z.enum(["mock", "sandbox", "production"]).default("mock"),
  MIDTRANS_SERVER_KEY: z.string().default("SB-Mid-server-mock-key"),
  MIDTRANS_API_URL: z.string().default("https://api.sandbox.midtrans.com"),
});

export const env = envSchema.parse(process.env);
