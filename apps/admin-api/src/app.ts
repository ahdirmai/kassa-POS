import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { backofficeRouter } from "./modules/backoffice/backoffice.routes.js";
import { adminLandingRouter, publicLandingRouter } from "./modules/landing/landing.routes.js";

export function createAdminApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.ADMIN_CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      level: process.env.NODE_ENV === "production" ? "info" : "warn",
    }),
  );

  const authLimiter = rateLimit({
    windowMs: 60_000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const publicLimiter = rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "kassa-admin-api", timestamp: new Date().toISOString() });
  });

  app.use("/api/v1/public/landing", publicLimiter, publicLandingRouter);
  app.use("/api/v1/auth", authLimiter);
  app.use("/api/v1/landing", adminLandingRouter);
  app.use("/api/v1", backofficeRouter);

  app.use(errorHandler);
  return app;
}
