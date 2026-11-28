import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import { requirePlatformAuth, requirePlatformRole } from "../../middleware/platform-auth.js";
import { validateBody } from "../../middleware/validate.js";

export const deploymentsRouter = Router();

// Seluruh endpoint deployment monitor hanya boleh diakses oleh SUPERADMIN
deploymentsRouter.use(requirePlatformAuth, requirePlatformRole("SUPERADMIN"));

function getAgentConfig() {
  const baseUrl = (env.DEPLOY_AGENT_URL || "").replace(/\/+$/, "");
  const token = env.DEPLOY_INTERNAL_TOKEN || "";
  if (!baseUrl || !token) {
    throw new AppError(
      503,
      "DEPLOY_AGENT_NOT_CONFIGURED",
      "Deploy Agent belum dikonfigurasi (set DEPLOY_AGENT_URL & DEPLOY_INTERNAL_TOKEN pada admin-api).",
    );
  }
  return { baseUrl, token };
}

async function callDeployAgent<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 8000,
): Promise<{ status: number; data: T }> {
  const { baseUrl, token } = getAgentConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> | undefined),
      },
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({}))) as T & {
      code?: string;
      message?: string;
    };

    if (!res.ok) {
      throw new AppError(
        res.status,
        data?.code || "DEPLOY_AGENT_ERROR",
        data?.message || `Deploy Agent mengembalikan status ${res.status}`,
        data,
      );
    }

    return { status: res.status, data };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      502,
      "DEPLOY_AGENT_UNREACHABLE",
      "Tidak dapat terhubung ke tumpu-webhook Deploy Agent di host VM.",
      err instanceof Error ? err.message : undefined,
    );
  } finally {
    clearTimeout(timer);
  }
}

// GET /api/v1/backoffice/deployments/status
deploymentsRouter.get("/status", async (_req, res, next) => {
  try {
    const { data } = await callDeployAgent("/internal/status", { method: "GET" }, 10_000);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/backoffice/deployments?limit=30
deploymentsRouter.get("/", async (req, res, next) => {
  try {
    const limitRaw = Number(req.query.limit ?? 30);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 30), 100);
    const { data } = await callDeployAgent(`/internal/deployments?limit=${limit}`, {
      method: "GET",
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/backoffice/deployments/:id/logs?offset=0
deploymentsRouter.get("/:id/logs", async (req, res, next) => {
  try {
    const runId = String(req.params.id || "");
    if (!/^[a-zA-Z0-9_-]+$/.test(runId)) {
      throw new AppError(400, "INVALID_RUN_ID", "Format Run ID tidak valid");
    }
    const offsetRaw = Number(req.query.offset ?? 0);
    const offset = Math.max(0, Number.isFinite(offsetRaw) ? Math.floor(offsetRaw) : 0);

    const { data } = await callDeployAgent(
      `/internal/deployments/${encodeURIComponent(runId)}/logs?offset=${offset}`,
      { method: "GET" },
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

const triggerDeploySchema = z.object({
  rebuildAll: z.boolean().default(false),
});

// POST /api/v1/backoffice/deployments/trigger
deploymentsRouter.post(
  "/trigger",
  validateBody(triggerDeploySchema),
  async (req, res, next) => {
    try {
      const { rebuildAll } = req.body as z.infer<typeof triggerDeploySchema>;
      const admin = req.platformAdmin!;

      const { status, data } = await callDeployAgent<{ runId: string; run?: unknown }>(
        "/internal/deploy",
        {
          method: "POST",
          body: JSON.stringify({
            rebuildAll,
            triggeredBy: admin.email,
          }),
        },
        10_000,
      );

      await prisma.platformAuditLog.create({
        data: {
          adminId: admin.id,
          action: "TRIGGER_DEPLOY",
          targetType: "DEPLOYMENT",
          targetId: data.runId,
          summary: rebuildAll
            ? `Memicu Force Rebuild All (5 service) — ${data.runId}`
            : `Memicu Deploy Latest (main) — ${data.runId}`,
          metadata: JSON.stringify({
            runId: data.runId,
            rebuildAll,
            triggeredBy: admin.email,
          }),
          ipAddress: req.ip ?? null,
        },
      });

      res.status(status).json(data);
    } catch (err) {
      next(err);
    }
  },
);
