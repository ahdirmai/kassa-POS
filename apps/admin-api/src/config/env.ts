import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_API_PORT: z.coerce.number().default(4001),
  ADMIN_CORS_ORIGIN: z.string().default("http://localhost:3005,http://localhost:3006"),
  PLATFORM_JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default("kassa-platform-backoffice-access-secret-min-32-chars"),
  PLATFORM_JWT_EXPIRES: z.string().default("8h"),
});

export const env = envSchema.parse(process.env);
