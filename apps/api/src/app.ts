import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { menuRouter } from "./modules/menu/menu.routes.js";
import { tablesRouter } from "./modules/tables/tables.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { paymentsRouter } from "./modules/payments/payments.routes.js";
import { shiftsRouter } from "./modules/shifts/shifts.routes.js";
import { kdsRouter } from "./modules/kds/kds.routes.js";
import { stockRouter } from "./modules/stock/stock.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { syncRouter } from "./modules/sync/sync.routes.js";
import { rbacRouter } from "./modules/rbac/rbac.routes.js";
import { outletsRouter } from "./modules/outlets/outlets.routes.js";
import { onboardingRouter } from "./modules/onboarding/onboarding.routes.js";
import { digitalMenuRouter, publicDigitalMenuRouter } from "./modules/digital-menu/digital-menu.routes.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
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

  // Rate limit untuk endpoint auth
  const authLimiter = rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "kassa-pos-api", timestamp: new Date().toISOString() });
  });

  app.use("/api/v1/auth", authLimiter, authRouter);
  app.use("/api/v1/public/digital-menu", publicDigitalMenuRouter);
  app.use("/api/v1/menu", menuRouter);
  app.use("/api/v1/tables", tablesRouter);
  app.use("/api/v1/orders", ordersRouter);
  app.use("/api/v1", paymentsRouter);
  app.use("/api/v1/shifts", shiftsRouter);
  app.use("/api/v1/kds", kdsRouter);
  app.use("/api/v1/stock", stockRouter);
  app.use("/api/v1/reports", reportsRouter);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/v1/sync", syncRouter);
  app.use("/api/v1/rbac", rbacRouter);
  app.use("/api/v1/outlets", outletsRouter);
  app.use("/api/v1/onboarding", onboardingRouter);
  app.use("/api/v1/digital-menu", digitalMenuRouter);

  app.use(errorHandler);
  return app;
}
