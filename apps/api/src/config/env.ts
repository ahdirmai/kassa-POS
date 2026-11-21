import "dotenv/config";
import { z } from "zod";

const DEV_ACCESS_DEFAULT = "kassa-pos-dev-access-secret-key-min-32-chars";
const DEV_REFRESH_DEFAULT = "kassa-pos-dev-refresh-secret-key-min-32-chars";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().optional(),
    API_PORT: z.coerce.number().default(4000),
    CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:3005,http://localhost:3006"),
    JWT_ACCESS_SECRET: z.string().min(16).default(DEV_ACCESS_DEFAULT),
    JWT_REFRESH_SECRET: z.string().min(16).default(DEV_REFRESH_DEFAULT),
    JWT_ACCESS_EXPIRES: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().default(7),
    PAYMENT_PROVIDER: z.string().default("midtrans"),
    MIDTRANS_MODE: z.enum(["mock", "sandbox", "production"]).default("mock"),
    MIDTRANS_SERVER_KEY: z.string().default("SB-Mid-server-mock-key"),
    MIDTRANS_API_URL: z.string().default("https://api.sandbox.midtrans.com"),
    PUBLIC_LANDING_URL: z.string().default("https://kassa.biz.id"),
  })
  .superRefine((data, ctx) => {
    if (process.env.NODE_ENV === "production") {
      if (data.JWT_ACCESS_SECRET === DEV_ACCESS_DEFAULT || data.JWT_ACCESS_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_ACCESS_SECRET"],
          message: "JWT_ACCESS_SECRET wajib diisi (>= 32 karakter) di mode production",
        });
      }
      if (data.JWT_REFRESH_SECRET === DEV_REFRESH_DEFAULT || data.JWT_REFRESH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_REFRESH_SECRET"],
          message: "JWT_REFRESH_SECRET wajib diisi (>= 32 karakter) di mode production",
        });
      }
    }
  });

export const env = envSchema.parse(process.env);
