#!/usr/bin/env node
/**
 * Tumpu Host Deployment & Webhook Agent (tumpu-webhook)
 * Runs on host VM `tumpu` (default port 9000).
 *
 * Public endpoints (via https://deploy.tumpu.biz.id):
 *   - GET  /health
 *   - POST /webhook (GitHub HMAC-SHA256 verified)
 *
 * Internal endpoints (loopback & Docker bridge 172.16.0.0/12 + Bearer token ONLY):
 *   - GET  /internal/status
 *   - GET  /internal/deployments?limit=30
 *   - GET  /internal/deployments/:id/logs?offset=0
 *   - POST /internal/deploy
 */

import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load local .env if present (zero external dependencies)
function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadDotEnv(path.join(__dirname, ".env"));

const PORT = Number(process.env.WEBHOOK_PORT || process.env.PORT || 9000);
const BIND_HOST = process.env.WEBHOOK_HOST || "0.0.0.0";
const REPO_DIR = process.env.REPO_DIR || "/home/boxd/tumpu-POS";
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || path.join(REPO_DIR, "docker/deploy.sh");
const COMPOSE_FILE = process.env.COMPOSE_FILE || "docker/docker-compose.prod.yml";
const DATA_DIR = process.env.WEBHOOK_DATA_DIR || __dirname;
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const LOGS_DIR = path.join(DATA_DIR, "logs");
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";
const DEPLOY_INTERNAL_TOKEN = process.env.DEPLOY_INTERNAL_TOKEN || "";
const GITHUB_REPO_URL = process.env.GITHUB_REPO_URL || "https://github.com/ahdirmai/tumpu-POS";
const HEALTH_BASE_URL = process.env.HEALTH_BASE_URL || "http://127.0.0.1:80";
const MAX_LOG_FILES = 50;
const MAX_HISTORY_ITEMS = 100;
const USE_SUDO_DOCKER = process.env.USE_SUDO_DOCKER !== "false";

fs.mkdirSync(LOGS_DIR, { recursive: true });

let activeRun = null;

// ============================================================================
// Helpers: Persistence & Log Retention
// ============================================================================

function readHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(items) {
  const trimmed = items.slice(0, MAX_HISTORY_ITEMS);
  const tmp = `${HISTORY_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(trimmed, null, 2), "utf8");
  fs.renameSync(tmp, HISTORY_FILE);
}

function upsertHistory(run) {
  const items = readHistory();
  const idx = items.findIndex((r) => r.id === run.id);
  if (idx >= 0) items[idx] = run;
  else items.unshift(run);
  writeHistory(items);
}

function pruneOldLogs() {
  try {
    const files = fs
      .readdirSync(LOGS_DIR)
      .filter((f) => f.endsWith(".log"))
      .map((f) => {
        const full = path.join(LOGS_DIR, f);
        return { full, mtime: fs.statSync(full).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);

    for (const stale of files.slice(MAX_LOG_FILES)) {
      fs.unlinkSync(stale.full);
    }
  } catch {
    // non-fatal
  }
}

function generateRunId(shortSha) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    "_",
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds()),
  ].join("");
  const suffix = (shortSha || crypto.randomBytes(4).toString("hex")).slice(0, 7);
  return `dep_${stamp}_${suffix}`;
}

// ============================================================================
// Helpers: Security (IP Allowlist + Constant-Time Token & HMAC)
// ============================================================================

function timingSafeEqualStr(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAllowedInternalIp(remoteAddress) {
  if (!remoteAddress) return false;
  const ip = remoteAddress.startsWith("::ffff:") ? remoteAddress.slice(7) : remoteAddress;
  if (ip === "127.0.0.1" || ip === "::1") return true;
  // Docker bridge network 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  const parts = ip.split(".");
  if (parts.length === 4) {
    const first = Number(parts[0]);
    const second = Number(parts[1]);
    if (first === 172 && second >= 16 && second <= 31) return true;
  }
  return false;
}

function authorizeInternal(req, res) {
  // Reject any request forwarded from public reverse proxy (e.g. deploy.tumpu.biz.id)
  if (req.headers["x-forwarded-for"] || req.headers["x-real-ip"]) {
    sendJson(res, 403, {
      code: "FORBIDDEN_PROXY",
      message: "Internal deployment endpoints cannot be accessed via public proxy",
    });
    return false;
  }

  if (!isAllowedInternalIp(req.socket?.remoteAddress)) {
    sendJson(res, 403, {
      code: "FORBIDDEN_IP",
      message: "Source IP is not allowed for internal deployment endpoints",
    });
    return false;
  }

  if (!DEPLOY_INTERNAL_TOKEN) {
    sendJson(res, 503, {
      code: "INTERNAL_TOKEN_NOT_CONFIGURED",
      message: "DEPLOY_INTERNAL_TOKEN is not configured on tumpu-webhook",
    });
    return false;
  }

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!timingSafeEqualStr(token, DEPLOY_INTERNAL_TOKEN)) {
    sendJson(res, 401, {
      code: "UNAUTHORIZED",
      message: "Invalid internal deployment token",
    });
    return false;
  }

  return true;
}

function verifyGithubSignature(rawBody, signatureHeader) {
  if (!GITHUB_WEBHOOK_SECRET || !signatureHeader) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET).update(rawBody).digest("hex");
  return timingSafeEqualStr(expected, signatureHeader);
}

// ============================================================================
// Helpers: Git, Service Health & Docker Status
// ============================================================================

async function getCurrentCommit() {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["log", "-1", "--format=%H%n%h%n%s%n%an%n%cI"],
      { cwd: REPO_DIR, timeout: 5000 },
    );
    const [sha = "", shortSha = "", message = "", author = "", committedAt = ""] =
      stdout.trim().split("\n");
    return {
      sha,
      shortSha,
      message,
      author,
      committedAt,
      repoUrl: GITHUB_REPO_URL,
    };
  } catch {
    return null;
  }
}

const SERVICE_TARGETS = [
  { key: "landing", name: "Landing Page", url: "https://tumpu.biz.id", host: "tumpu.biz.id", path: "/" },
  { key: "web", name: "POS Web", url: "https://pos.tumpu.biz.id", host: "pos.tumpu.biz.id", path: "/" },
  { key: "api", name: "POS API", url: "https://app-api.tumpu.biz.id/health", host: "app-api.tumpu.biz.id", path: "/health" },
  { key: "backoffice", name: "Back Office", url: "https://admin.tumpu.biz.id", host: "admin.tumpu.biz.id", path: "/" },
  { key: "admin-api", name: "Admin API", url: "https://admin-api.tumpu.biz.id/health", host: "admin-api.tumpu.biz.id", path: "/health" },
];

function checkServiceHealth(target) {
  const start = Date.now();
  return new Promise((resolve) => {
    let baseUrl;
    try {
      baseUrl = new URL(HEALTH_BASE_URL);
    } catch {
      baseUrl = new URL("http://127.0.0.1:80");
    }

    const req = http.request(
      {
        hostname: baseUrl.hostname,
        port: baseUrl.port || 80,
        path: target.path,
        method: "GET",
        headers: { Host: target.host },
        timeout: 3500,
      },
      (res) => {
        res.resume();
        const status = res.statusCode || 0;
        resolve({
          key: target.key,
          name: target.name,
          url: target.url,
          httpStatus: status,
          ok: status >= 200 && status < 400,
          latencyMs: Date.now() - start,
        });
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error("Health check timeout"));
    });

    req.on("error", (err) => {
      resolve({
        key: target.key,
        name: target.name,
        url: target.url,
        httpStatus: 0,
        ok: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : "Connection failed",
      });
    });

    req.end();
  });
}

async function getDockerContainers() {
  const cmd = USE_SUDO_DOCKER ? "sudo" : "docker";
  const args = USE_SUDO_DOCKER
    ? ["docker", "compose", "-f", COMPOSE_FILE, "--env-file", ".env", "ps", "-a", "--format", "json"]
    : ["compose", "-f", COMPOSE_FILE, "--env-file", ".env", "ps", "-a", "--format", "json"];

  try {
    const { stdout } = await execFileAsync(cmd, args, { cwd: REPO_DIR, timeout: 6000 });
    const raw = stdout.trim();
    if (!raw) return [];

    let list = [];
    if (raw.startsWith("[")) {
      list = JSON.parse(raw);
    } else {
      list = raw
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    }

    return list.map((c) => ({
      service: c.Service || c.Name || "unknown",
      name: c.Name || c.Service || "unknown",
      state: String(c.State || "unknown").toLowerCase(),
      status: c.Status || c.State || "unknown",
      health: c.Health || "",
    }));
  } catch {
    return [];
  }
}

// ============================================================================
// Deployment Runner
// ============================================================================

async function startDeployment({ trigger, triggeredBy, rebuildAll, fromSha, toSha, commitMessage }) {
  if (activeRun) {
    return { conflict: true, activeRun };
  }

  const head = await getCurrentCommit();
  const initialFromSha = (fromSha || head?.shortSha || "unknown").slice(0, 7);
  const initialToSha = (toSha || head?.shortSha || "main").slice(0, 7);
  const runId = generateRunId(initialToSha);
  const logPath = path.join(LOGS_DIR, `${runId}.log`);

  pruneOldLogs();

  const run = {
    id: runId,
    trigger,
    triggeredBy: triggeredBy || "system",
    branch: "main",
    fromSha: initialFromSha,
    toSha: initialToSha,
    commitMessage: commitMessage || head?.message || (rebuildAll ? "Force rebuild all services" : "Manual deploy latest main"),
    servicesRebuilt: rebuildAll ? ["api", "admin-api", "web", "landing", "backoffice"] : [],
    rebuildAll: Boolean(rebuildAll),
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    durationSec: null,
    exitCode: null,
  };

  activeRun = run;
  upsertHistory(run);

  const logStream = fs.createWriteStream(logPath, { flags: "a" });
  logStream.write(
    `[${run.startedAt}] Starting deployment ${run.id}\n` +
      `Trigger: ${run.trigger} | By: ${run.triggeredBy} | Rebuild All: ${run.rebuildAll}\n` +
      `============================================================\n`,
  );

  const args = [DEPLOY_SCRIPT, rebuildAll ? "true" : "false"];
  if (fromSha) args.push(fromSha);

  const child = spawn("bash", args, {
    cwd: REPO_DIR,
    env: {
      ...process.env,
      CI: "true",
    },
  });

  let stdoutBuffer = "";
  const parseMarkers = (chunk) => {
    stdoutBuffer += chunk.toString("utf8");
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() || "";
    let dirty = false;
    for (const line of lines) {
      if (line.startsWith("TUMPU_DEPLOY_FROM_SHA=")) {
        run.fromSha = line.slice("TUMPU_DEPLOY_FROM_SHA=".length).trim().slice(0, 7);
        dirty = true;
      } else if (line.startsWith("TUMPU_DEPLOY_TO_SHA=")) {
        run.toSha = line.slice("TUMPU_DEPLOY_TO_SHA=".length).trim().slice(0, 7);
        dirty = true;
      } else if (line.startsWith("TUMPU_DEPLOY_SERVICES=")) {
        const val = line.slice("TUMPU_DEPLOY_SERVICES=".length).trim();
        run.servicesRebuilt = val === "none" || !val ? [] : val.split(",").filter(Boolean);
        dirty = true;
      }
    }
    if (dirty) upsertHistory({ ...run });
  };

  child.stdout.on("data", (chunk) => {
    logStream.write(chunk);
    parseMarkers(chunk);
  });

  child.stderr.on("data", (chunk) => {
    logStream.write(chunk);
  });

  child.on("close", async (code) => {
    const finishedAt = new Date().toISOString();
    const durationSec = Math.max(
      1,
      Math.round((new Date(finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000),
    );

    const latestHead = await getCurrentCommit();
    if (latestHead) {
      run.toSha = latestHead.shortSha;
      if (!commitMessage || trigger === "manual-backoffice") {
        run.commitMessage = latestHead.message;
      }
    }

    run.status = code === 0 ? "success" : "failed";
    run.finishedAt = finishedAt;
    run.durationSec = durationSec;
    run.exitCode = code ?? 1;

    logStream.write(
      `\n============================================================\n` +
        `[${finishedAt}] Finished with exit code ${run.exitCode} (${run.status}) in ${durationSec}s\n`,
    );
    logStream.end();

    upsertHistory({ ...run });
    activeRun = null;
  });

  child.on("error", (err) => {
    const finishedAt = new Date().toISOString();
    run.status = "failed";
    run.finishedAt = finishedAt;
    run.durationSec = Math.max(
      1,
      Math.round((new Date(finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000),
    );
    run.exitCode = 1;
    logStream.write(`\n[ERROR] Failed to spawn deploy.sh: ${err.message}\n`);
    logStream.end();
    upsertHistory({ ...run });
    activeRun = null;
  });

  return { conflict: false, run };
}

// ============================================================================
// HTTP Server Utilities
// ============================================================================

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ============================================================================
// Router
// ============================================================================

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;
    const method = req.method || "GET";

    // Public: GET /health
    if (method === "GET" && pathname === "/health") {
      return sendJson(res, 200, {
        status: "ok",
        service: "tumpu-webhook",
        deploying: Boolean(activeRun),
        timestamp: new Date().toISOString(),
      });
    }

    // Public: POST /webhook (GitHub Push HMAC-SHA256)
    if (method === "POST" && pathname === "/webhook") {
      const raw = await readBody(req);
      const sig = req.headers["x-hub-signature-256"];
      if (!verifyGithubSignature(raw, typeof sig === "string" ? sig : "")) {
        return sendJson(res, 401, { code: "INVALID_SIGNATURE", message: "Invalid webhook signature" });
      }

      const event = req.headers["x-github-event"];
      if (event === "ping") {
        return sendJson(res, 200, { ok: true, message: "pong" });
      }
      if (event !== "push") {
        return sendJson(res, 200, { ok: true, ignored: true, reason: `Ignored event ${event}` });
      }

      const payload = JSON.parse(raw.toString("utf8"));
      if (payload.ref !== "refs/heads/main") {
        return sendJson(res, 200, { ok: true, ignored: true, reason: `Ignored ref ${payload.ref}` });
      }

      const result = await startDeployment({
        trigger: "github-push",
        triggeredBy: payload.pusher?.name || payload.sender?.login || "github",
        rebuildAll: false,
        fromSha: payload.before,
        toSha: payload.after,
        commitMessage: payload.head_commit?.message?.split("\n")[0] || "GitHub push to main",
      });

      if (result.conflict) {
        return sendJson(res, 409, {
          code: "DEPLOY_IN_PROGRESS",
          message: "Deployment is already running",
          activeRunId: result.activeRun.id,
        });
      }

      return sendJson(res, 202, { ok: true, runId: result.run.id, run: result.run });
    }

    // Internal endpoints — strict IP allowlist + Bearer token
    if (pathname.startsWith("/internal/")) {
      if (!authorizeInternal(req, res)) return;

      // GET /internal/status
      if (method === "GET" && pathname === "/internal/status") {
        const [currentCommit, services, containers] = await Promise.all([
          getCurrentCommit(),
          Promise.all(SERVICE_TARGETS.map(checkServiceHealth)),
          getDockerContainers(),
        ]);

        const history = readHistory();
        const lastRun = history[0] || null;
        const deployState = activeRun
          ? "DEPLOYING"
          : lastRun?.status === "success"
            ? "SUCCESS"
            : lastRun?.status === "failed"
              ? "FAILED"
              : "IDLE";

        return sendJson(res, 200, {
          deployState,
          activeRun,
          lastRun,
          currentCommit,
          services,
          containers,
          checkedAt: new Date().toISOString(),
        });
      }

      // GET /internal/deployments?limit=30
      if (method === "GET" && pathname === "/internal/deployments") {
        const limitRaw = Number(url.searchParams.get("limit") || 30);
        const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 30), 100);
        const history = readHistory();
        return sendJson(res, 200, {
          items: history.slice(0, limit),
          total: history.length,
        });
      }

      // GET /internal/deployments/:id/logs?offset=0
      const logMatch = pathname.match(/^\/internal\/deployments\/([a-zA-Z0-9_-]+)\/logs$/);
      if (method === "GET" && logMatch) {
        const runId = logMatch[1];
        const logPath = path.join(LOGS_DIR, `${runId}.log`);
        const history = readHistory();
        const run = (activeRun && activeRun.id === runId ? activeRun : history.find((r) => r.id === runId)) || null;

        if (!fs.existsSync(logPath)) {
          return sendJson(res, 404, { code: "LOG_NOT_FOUND", message: "Log file tidak ditemukan" });
        }

        const stat = fs.statSync(logPath);
        const offsetRaw = Number(url.searchParams.get("offset") || 0);
        const offset = Math.min(Math.max(0, Number.isFinite(offsetRaw) ? offsetRaw : 0), stat.size);
        const bytesToRead = stat.size - offset;

        let content = "";
        if (bytesToRead > 0) {
          const fd = fs.openSync(logPath, "r");
          try {
            const buf = Buffer.alloc(bytesToRead);
            fs.readSync(fd, buf, 0, bytesToRead, offset);
            content = buf.toString("utf8");
          } finally {
            fs.closeSync(fd);
          }
        }

        const status = run?.status || "unknown";
        return sendJson(res, 200, {
          runId,
          status,
          content,
          offset,
          nextOffset: stat.size,
          size: stat.size,
          done: status !== "running",
        });
      }

      // POST /internal/deploy
      if (method === "POST" && pathname === "/internal/deploy") {
        const raw = await readBody(req);
        const body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
        const rebuildAll = Boolean(body.rebuildAll);
        const triggeredBy =
          typeof body.triggeredBy === "string" && body.triggeredBy.trim()
            ? body.triggeredBy.trim()
            : "superadmin";

        const result = await startDeployment({
          trigger: "manual-backoffice",
          triggeredBy,
          rebuildAll,
        });

        if (result.conflict) {
          return sendJson(res, 409, {
            code: "DEPLOY_IN_PROGRESS",
            message: "Deployment lain sedang berjalan. Tunggu hingga selesai.",
            activeRunId: result.activeRun.id,
          });
        }

        return sendJson(res, 202, {
          runId: result.run.id,
          run: result.run,
        });
      }

      return sendJson(res, 404, { code: "NOT_FOUND", message: "Internal endpoint not found" });
    }

    return sendJson(res, 404, { code: "NOT_FOUND", message: "Not found" });
  } catch (err) {
    console.error("[tumpu-webhook] Unhandled error:", err);
    return sendJson(res, 500, {
      code: "INTERNAL_ERROR",
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

server.listen(PORT, BIND_HOST, () => {
  console.log(`[tumpu-webhook] Listening on http://${BIND_HOST}:${PORT} (repo: ${REPO_DIR})`);
});
