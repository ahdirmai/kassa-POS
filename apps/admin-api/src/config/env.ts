import "dotenv/config";
import { z } from "zod";

const DEV_PLATFORM_DEFAULT = "tumpu-platform-backoffice-access-secret-min-32-chars";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    ADMIN_API_PORT: z.coerce.number().default(4001),
    ADMIN_CORS_ORIGIN: z.string().default("http://localhost:3005,http://localhost:3006"),
    PLATFORM_JWT_ACCESS_SECRET: z.string().min(16).default(DEV_PLATFORM_DEFAULT),
    PLATFORM_JWT_EXPIRES: z.string().default("8h"),
    DEPLOY_AGENT_URL: z.string().url().optional().or(z.literal("")),
    DEPLOY_INTERNAL_TOKEN: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (process.env.NODE_ENV === "production") {
      if (
        data.PLATFORM_JWT_ACCESS_SECRET === DEV_PLATFORM_DEFAULT ||
        data.PLATFORM_JWT_ACCESS_SECRET.length < 32
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["PLATFORM_JWT_ACCESS_SECRET"],
          message: "PLATFORM_JWT_ACCESS_SECRET wajib diisi (>= 32 karakter) di mode production",
        });
      }
    }
  });

export const env = envSchema.parse(process.env);
