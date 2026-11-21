"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  GitCommit,
  HardDrive,
  Loader2,
  Play,
  RefreshCw,
  Rocket,
  RotateCcw,
  Server,
  Terminal,
  X,
  XCircle,
} from "lucide-react";
import { ApiError, boFetch, formatDateTime } from "@/lib/api";

export interface DeploymentRun {
  id: string;
  trigger: "github-push" | "manual-backoffice" | string;
  triggeredBy: string;
  branch: string;
  fromSha: string;
  toSha: string;
  commitMessage: string;
  servicesRebuilt: string[];
  rebuildAll?: boolean;
  status: "running" | "success" | "failed" | string;
  startedAt: string;
  finishedAt: string | null;
  durationSec: number | null;
  exitCode: number | null;
}

interface ServiceHealthItem {
  key: string;
  name: string;
  url: string;
  httpStatus: number;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

interface ContainerStatusItem {
  service: string;
  name: string;
  state: string;
  status: string;
  health: string;
}

interface DeploymentStatusResponse {
  deployState: "IDLE" | "DEPLOYING" | "SUCCESS" | "FAILED";
  activeRun: DeploymentRun | null;
  lastRun: DeploymentRun | null;
  currentCommit: {
    sha: string;
    shortSha: string;
    message: string;
    author: string;
    committedAt: string;
    repoUrl: string;
  } | null;
  services: ServiceHealthItem[];
  containers: ContainerStatusItem[];
  checkedAt: string;
}

interface DeploymentLogsResponse {
  runId: string;
  status: string;
  content: string;
  offset: number;
  nextOffset: number;
  size: number;
  done: boolean;
}

function formatDuration(sec: number | null | undefined): string {
  if (sec === null || sec === undefined) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

const INFRA_SERVICES = [
  { key: "mysql", label: "MySQL 8" },
  { key: "redis", label: "Redis 7" },
  { key: "nginx", label: "Nginx" },
];

export default function DeploymentsSection({
  onNotify,
}: {
  onNotify: (msg: string, tone?: "ok" | "err") => void;
}) {
  const [statusData, setStatusData] = useState<DeploymentStatusResponse | null>(null);
  const [history, setHistory] = useState<DeploymentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentError, setAgentError] = useState<{ code?: string; message: string } | null>(null);

  // Confirm modal state
  const [confirmMode, setConfirmMode] = useState<null | "smart" | "all">(null);
  const [triggering, setTriggering] = useState(false);

  // Live Log Viewer state
  const [selectedRun, setSelectedRun] = useState<DeploymentRun | null>(null);
  const [logText, setLogText] = useState("");
  const [logStatus, setLogStatus] = useState<string>("");
  const [loadingLogs, setLoadingLogs] = useState(false);
  const logOffsetRef = useRef(0);
  const logContainerRef = useRef<HTMLPreElement | null>(null);

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [statusRes, listRes] = await Promise.all([
        boFetch<DeploymentStatusResponse>("/backoffice/deployments/status"),
        boFetch<{ items: DeploymentRun[]; total: number }>("/backoffice/deployments?limit=30"),
      ]);
      setStatusData(statusRes);
      setHistory(listRes.items ?? []);
      setAgentError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setAgentError({ code: err.code, message: err.message });
      } else {
        setAgentError({
          message: err instanceof Error ? err.message : "Gagal memuat status deployment",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll(false);
  }, [loadAll]);

  // Auto-refresh status & history (5s when deploying, 30s when idle)
  useEffect(() => {
    const intervalMs = statusData?.deployState === "DEPLOYING" ? 5000 : 30_000;
    const timer = setInterval(() => {
      loadAll(true);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [statusData?.deployState, loadAll]);

  // Incremental log fetching
  const fetchLogsChunk = useCallback(async (runId: string, reset: boolean) => {
    if (reset) {
      setLoadingLogs(true);
      logOffsetRef.current = 0;
      setLogText("");
    }
    try {
      const offset = reset ? 0 : logOffsetRef.current;
      const res = await boFetch<DeploymentLogsResponse>(
        `/backoffice/deployments/${encodeURIComponent(runId)}/logs?offset=${offset}`,
      );
      logOffsetRef.current = res.nextOffset;
      setLogStatus(res.status);
      if (reset) {
        setLogText(res.content || "(Belum ada output log)");
      } else if (res.content) {
        setLogText((prev) => (prev === "(Belum ada output log)" ? res.content : prev + res.content));
      }
      return res;
    } catch (err) {
      if (reset) {
        setLogText(
          `[ERROR] ${err instanceof Error ? err.message : "Gagal mengambil log deployment"}`,
        );
      }
      return null;
    } finally {
      if (reset) setLoadingLogs(false);
    }
  }, []);

  // Open log drawer
  const openLogViewer = useCallback(
    (run: DeploymentRun) => {
      setSelectedRun(run);
      setLogStatus(run.status);
      fetchLogsChunk(run.id, true);
    },
    [fetchLogsChunk],
  );

  // Auto-scroll log viewer to bottom when content grows
  useEffect(() => {
    const el = logContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logText]);

  // Poll logs every 2s while selected run is running
  useEffect(() => {
    if (!selectedRun || logStatus !== "running") return;
    const timer = setInterval(async () => {
      const res = await fetchLogsChunk(selectedRun.id, false);
      if (res && res.done) {
        loadAll(true);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [selectedRun, logStatus, fetchLogsChunk, loadAll]);

  async function handleTriggerDeploy() {
    if (!confirmMode) return;
    const rebuildAll = confirmMode === "all";
    setTriggering(true);
    try {
      const res = await boFetch<{ runId: string; run?: DeploymentRun }>(
        "/backoffice/deployments/trigger",
        {
          method: "POST",
          body: JSON.stringify({ rebuildAll }),
        },
      );
      setConfirmMode(null);
      onNotify(
        rebuildAll
          ? `Force Rebuild All dimulai (${res.runId}).`
          : `Deploy Latest (main) dimulai (${res.runId}).`,
      );
      await loadAll(true);
      if (res.run) {
        openLogViewer(res.run);
      } else {
        openLogViewer({
          id: res.runId,
          trigger: "manual-backoffice",
          triggeredBy: "superadmin",
          branch: "main",
          fromSha: statusData?.currentCommit?.shortSha || "HEAD",
          toSha: "main",
          commitMessage: rebuildAll ? "Force rebuild all services" : "Manual deploy latest main",
          servicesRebuilt: rebuildAll ? ["api", "admin-api", "web", "landing", "backoffice"] : [],
          status: "running",
          startedAt: new Date().toISOString(),
          finishedAt: null,
          durationSec: null,
          exitCode: null,
        });
      }
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal memicu deployment",
        "err",
      );
    } finally {
      setTriggering(false);
    }
  }

  async function handleCopyLog() {
    try {
      await navigator.clipboard.writeText(logText);
      onNotify("Log deployment disalin ke clipboard.");
    } catch {
      onNotify("Gagal menyalin log", "err");
    }
  }

  const deployState = statusData?.deployState ?? "IDLE";
  const isDeploying = deployState === "DEPLOYING";
  const repoUrl = statusData?.currentCommit?.repoUrl || "https://github.com/ahdirmai/kassa-POS";
  const containersByService = new Map<string, ContainerStatusItem>();
  for (const c of statusData?.containers ?? []) {
    containersByService.set(c.service, c);
  }

  const stateBadge =
    deployState === "DEPLOYING"
      ? {
          cls: "border-[var(--sky)]/40 bg-[var(--sky)]/15 text-[var(--sky)]",
          dot: "bg-[var(--sky)] animate-ping",
          label: "DEPLOYING",
        }
      : deployState === "SUCCESS"
        ? {
            cls: "border-[var(--good)]/40 bg-[var(--good)]/15 text-[var(--good)]",
            dot: "bg-[var(--good)]",
            label: "SUCCESS",
          }
        : deployState === "FAILED"
          ? {
              cls: "border-[var(--bad)]/40 bg-[var(--bad)]/15 text-[var(--bad)]",
              dot: "bg-[var(--bad)]",
              label: "FAILED",
            }
          : {
              cls: "border-[var(--line-2)] bg-[var(--well)] text-[var(--muted)]",
              dot: "bg-[var(--muted)]",
              label: "IDLE",
            };

  return (
    <div className="space-y-5">
      {/* Agent Warning Banner (if unconfigured or unreachable in local dev) */}
      {agentError && (
        <div className="card border-[var(--amber)]/40 bg-[var(--amber)]/10 p-4 text-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warn)]" />
              <div>
                <div className="font-bold text-[var(--warn)]">
                  Deploy Agent Tidak Terhubung ({agentError.code || "OFFLINE"})
                </div>
                <p className="mt-0.5 text-[var(--text)]">{agentError.message}</p>
                <p className="mt-1 font-mono-num text-[11px] text-[var(--muted)]">
                  Pastikan <code>kassa-webhook</code> berjalan di host VM (:9000) serta{" "}
                  <code>DEPLOY_AGENT_URL</code> &amp; <code>DEPLOY_INTERNAL_TOKEN</code> sudah
                  diset pada <code>admin-api</code>.
                </p>
              </div>
            </div>
            <button
              onClick={() => loadAll(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-2)] bg-[var(--glass-2)] px-3 py-1.5 font-semibold hover:bg-[var(--well)]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* 3.1 Current Status & Quick Actions (Header) */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono-num text-[11px] font-bold ${stateBadge.cls}`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${stateBadge.dot}`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      deployState === "DEPLOYING"
                        ? "bg-[var(--sky)]"
                        : deployState === "SUCCESS"
                          ? "bg-[var(--good)]"
                          : deployState === "FAILED"
                            ? "bg-[var(--bad)]"
                            : "bg-[var(--muted)]"
                    }`}
                  />
                </span>
                {stateBadge.label}
              </span>
              <span className="font-mono-num text-[11px] text-[var(--muted)]">
                branch: <strong className="text-[var(--text)]">main</strong>
              </span>
              {statusData?.lastRun && (
                <span className="font-mono-num text-[11px] text-[var(--muted)]">
                  · terakhir {formatDateTime(statusData.lastRun.startedAt)} (
                  {formatDuration(statusData.lastRun.durationSec)})
                </span>
              )}
            </div>

            {statusData?.currentCommit ? (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[var(--text)]">
                  <GitCommit className="h-4 w-4 text-[var(--teal)]" />
                  <a
                    href={`${repoUrl}/commit/${statusData.currentCommit.sha}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-[var(--well)] px-2 py-0.5 font-mono-num text-xs text-[var(--primary-ink)] hover:underline"
                  >
                    {statusData.currentCommit.shortSha}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="truncate">{statusData.currentCommit.message}</span>
                </div>
                <div className="font-mono-num text-[11px] text-[var(--muted)]">
                  Author: <strong className="text-[var(--text)]">{statusData.currentCommit.author}</strong>{" "}
                  · Committed {formatDateTime(statusData.currentCommit.committedAt)}
                </div>
              </div>
            ) : (
              <div className="text-xs text-[var(--muted)]">
                {loading ? "Memuat commit produksi aktif..." : "Metadata commit belum tersedia."}
              </div>
            )}
          </div>

          {/* Manual Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadAll(false)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-2)] bg-[var(--glass-2)] px-3.5 py-2 text-xs font-semibold hover:bg-[var(--well)] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setConfirmMode("smart")}
              disabled={isDeploying || Boolean(agentError) || triggering}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-[var(--on-ink)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              Deploy Latest (main)
            </button>
            <button
              onClick={() => setConfirmMode("all")}
              disabled={isDeploying || Boolean(agentError) || triggering}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--amber)]/50 bg-[var(--amber)]/15 px-4 py-2 text-xs font-semibold text-[var(--warn)] transition hover:bg-[var(--amber)]/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Force Rebuild All
            </button>
          </div>
        </div>

        {/* Active running deploy quick banner */}
        {statusData?.activeRun && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--sky)]/35 bg-[var(--sky)]/10 px-4 py-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--sky)]" />
              <div>
                <span className="font-bold text-[var(--text)]">
                  Deployment sedang berjalan: {statusData.activeRun.id}
                </span>
                <span className="ml-2 font-mono-num text-[11px] text-[var(--muted)]">
                  oleh {statusData.activeRun.triggeredBy} ({statusData.activeRun.trigger})
                </span>
              </div>
            </div>
            <button
              onClick={() => openLogViewer(statusData.activeRun!)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sky)] px-3.5 py-1.5 text-[11px] font-bold text-white hover:opacity-90"
            >
              <Terminal className="h-3.5 w-3.5" />
              Lihat Live Log
            </button>
          </div>
        )}
      </div>

      {/* 3.2 Service Health & Container Status Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            <Activity className="h-3.5 w-3.5 text-[var(--teal)]" />
            Kesehatan 5 Layanan Produksi &amp; Infra Container
          </h3>
          {statusData?.checkedAt && (
            <span className="font-mono-num text-[11px] text-[var(--muted)]">
              Dicek: {formatDateTime(statusData.checkedAt)}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(statusData?.services ?? [
            { key: "landing", name: "Landing Page", url: "https://kassa.biz.id", httpStatus: 0, ok: false, latencyMs: 0 },
            { key: "web", name: "POS Web", url: "https://app.kassa.biz.id", httpStatus: 0, ok: false, latencyMs: 0 },
            { key: "api", name: "POS API", url: "https://app-api.kassa.biz.id/health", httpStatus: 0, ok: false, latencyMs: 0 },
            { key: "backoffice", name: "Back Office", url: "https://admin.kassa.biz.id", httpStatus: 0, ok: false, latencyMs: 0 },
            { key: "admin-api", name: "Admin API", url: "https://admin-api.kassa.biz.id/health", httpStatus: 0, ok: false, latencyMs: 0 },
          ]).map((svc) => {
            const container = containersByService.get(svc.key);
            return (
              <div key={svc.key} className="card space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--text)]">{svc.name}</span>
                  {statusData ? (
                    svc.ok ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--good)]/15 px-2 py-0.5 font-mono-num text-[10px] font-bold text-[var(--good)]">
                        <CheckCircle2 className="h-3 w-3" /> {svc.httpStatus} OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bad)]/15 px-2 py-0.5 font-mono-num text-[10px] font-bold text-[var(--bad)]">
                        <XCircle className="h-3 w-3" /> {svc.httpStatus || "ERR"}
                      </span>
                    )
                  ) : (
                    <span className="rounded-full bg-[var(--well)] px-2 py-0.5 font-mono-num text-[10px] text-[var(--muted)]">
                      —
                    </span>
                  )}
                </div>

                <a
                  href={svc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate font-mono-num text-[10.5px] text-[var(--muted)] hover:underline"
                >
                  {svc.url.replace(/^https?:\/\//, "")}
                </a>

                <div className="flex items-center justify-between border-t border-[var(--line)] pt-2 font-mono-num text-[10.5px] text-[var(--muted)]">
                  <span className="truncate" title={container?.status || "unknown"}>
                    <Server className="mr-1 inline h-3 w-3" />
                    {container?.status || "—"}
                  </span>
                  {svc.latencyMs > 0 && <span>{svc.latencyMs}ms</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Infra strip: mysql, redis, nginx */}
        <div className="grid gap-3 sm:grid-cols-3">
          {INFRA_SERVICES.map((infra) => {
            const c = containersByService.get(infra.key);
            const isUp = c?.state === "running";
            return (
              <div
                key={infra.key}
                className="card flex items-center justify-between gap-3 px-4 py-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <HardDrive className="h-4 w-4 text-[var(--muted)]" />
                  <div>
                    <div className="font-bold text-[var(--text)]">{infra.label}</div>
                    <div className="font-mono-num text-[10.5px] text-[var(--muted)]">
                      {c?.name || `kassa_${infra.key}_prod`}
                    </div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono-num text-[10.5px] font-semibold ${
                    !c
                      ? "bg-[var(--well)] text-[var(--muted)]"
                      : isUp
                        ? "bg-[var(--good)]/15 text-[var(--good)]"
                        : "bg-[var(--bad)]/15 text-[var(--bad)]"
                  }`}
                >
                  {c?.status || "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.3 Deployment History Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3.5">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <Rocket className="h-4 w-4 text-[var(--primary-ink)]" />
              Riwayat Deployment (30 Terakhir)
            </h3>
            <p className="text-[11px] text-[var(--muted)]">
              Klik baris mana saja untuk membuka terminal log build &amp; health check
            </p>
          </div>
          <span className="font-mono-num text-[11px] text-[var(--muted)]">
            {history.length} run
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--line)] bg-[var(--bg)] font-mono-num text-[10.5px] uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Run ID &amp; Waktu</th>
                <th className="px-4 py-3">Trigger</th>
                <th className="px-4 py-3">Commit</th>
                <th className="px-4 py-3">Services Rebuilt</th>
                <th className="px-4 py-3">Durasi</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {history.map((run) => {
                const isSelected = selectedRun?.id === run.id;
                return (
                  <tr
                    key={run.id}
                    onClick={() => openLogViewer(run)}
                    className={`cursor-pointer transition hover:bg-[var(--well)] ${
                      isSelected ? "bg-[var(--well)]" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono-num font-bold text-[var(--text)]">{run.id}</div>
                      <div className="font-mono-num text-[10.5px] text-[var(--muted)]">
                        {formatDateTime(run.startedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 font-mono-num text-[10.5px] font-semibold ${
                          run.trigger === "github-push"
                            ? "bg-[var(--ink)] text-[var(--on-ink)]"
                            : "bg-[var(--accent)] text-[var(--on-accent)]"
                        }`}
                      >
                        {run.trigger}
                      </span>
                      <div className="mt-0.5 font-mono-num text-[10.5px] text-[var(--muted)]">
                        {run.triggeredBy}
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`${repoUrl}/commit/${run.toSha}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded bg-[var(--well)] px-1.5 py-0.5 font-mono-num text-[10.5px] font-bold text-[var(--primary-ink)] hover:underline"
                        >
                          {run.toSha}
                        </a>
                        {run.fromSha && run.fromSha !== run.toSha && (
                          <span className="font-mono-num text-[10px] text-[var(--muted)]">
                            ← {run.fromSha}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-[var(--text)]">
                        {run.commitMessage}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {run.servicesRebuilt && run.servicesRebuilt.length > 0 ? (
                          run.servicesRebuilt.map((svc) => (
                            <span
                              key={svc}
                              className="rounded-md border border-[var(--line-2)] bg-[var(--glass-2)] px-2 py-0.5 font-mono-num text-[10px] font-semibold text-[var(--text)]"
                            >
                              {svc}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-md bg-[var(--well)] px-2 py-0.5 font-mono-num text-[10px] text-[var(--muted)]">
                            none
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono-num text-[11px]">
                      <span className="inline-flex items-center gap-1 text-[var(--muted)]">
                        <Clock className="h-3 w-3" />
                        {run.status === "running" ? "running..." : formatDuration(run.durationSec)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {run.status === "running" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--sky)]/15 px-2.5 py-0.5 font-mono-num text-[10.5px] font-bold text-[var(--sky)]">
                          <Loader2 className="h-3 w-3 animate-spin" /> running
                        </span>
                      ) : run.status === "success" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--good)]/15 px-2.5 py-0.5 font-mono-num text-[10.5px] font-bold text-[var(--good)]">
                          <CheckCircle2 className="h-3 w-3" /> success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bad)]/15 px-2.5 py-0.5 font-mono-num text-[10.5px] font-bold text-[var(--bad)]">
                          <XCircle className="h-3 w-3" /> failed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[var(--muted)]">
                    Belum ada riwayat deployment tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3.4 Live Log Viewer Drawer / Modal */}
      {selectedRun && (
        <div
          onClick={() => setSelectedRun(null)}
          className="fixed inset-0 z-[60] flex items-end justify-end bg-black/55 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-[#0d1117] text-[#e6edf3] shadow-2xl sm:rounded-3xl"
          >
            {/* Drawer Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#161b22] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <div>
                  <div className="flex items-center gap-2 font-mono-num text-xs font-bold">
                    <span>{selectedRun.id}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        logStatus === "running"
                          ? "bg-sky-500/20 text-sky-300"
                          : logStatus === "success"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {logStatus || selectedRun.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {selectedRun.commitMessage} · {selectedRun.trigger} ({selectedRun.triggeredBy})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLogsChunk(selectedRun.id, true)}
                  disabled={loadingLogs}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  onClick={handleCopyLog}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Log
                </button>
                <button
                  onClick={() => setSelectedRun(null)}
                  className="rounded-lg border border-white/15 p-1.5 text-slate-300 hover:bg-white/10"
                  aria-label="Tutup log"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Monospace Log Body */}
            <pre
              ref={logContainerRef}
              className="flex-1 overflow-auto p-5 font-mono text-[12px] leading-relaxed text-slate-200 whitespace-pre-wrap break-words"
            >
              {loadingLogs && !logText ? "Memuat log deployment..." : logText}
            </pre>

            {/* Footer Status */}
            <div className="flex items-center justify-between border-t border-white/10 bg-[#161b22] px-5 py-2.5 font-mono-num text-[11px] text-slate-400">
              <span>
                {logStatus === "running"
                  ? "Live streaming (polling incremental setiap 2 detik)..."
                  : "Deployment selesai."}
              </span>
              <span>{logOffsetRef.current.toLocaleString("id-ID")} bytes</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Manual Trigger */}
      {confirmMode && (
        <div
          onClick={() => !triggering && setConfirmMode(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-md space-y-4 border-[var(--line-2)] bg-[var(--raised)] p-6 text-xs text-[var(--text)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-[var(--primary-ink)]" />
                <h3 className="text-sm font-bold">
                  {confirmMode === "all"
                    ? "Konfirmasi Force Rebuild All"
                    : "Konfirmasi Deploy Latest (main)"}
                </h3>
              </div>
              <button
                onClick={() => !triggering && setConfirmMode(null)}
                className="rounded-lg border border-[var(--line)] p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="leading-relaxed text-[var(--muted)]">
              {confirmMode === "all" ? (
                <>
                  Tindakan ini akan menarik commit terbaru dari branch{" "}
                  <strong className="text-[var(--text)]">main</strong> dan membangun ulang{" "}
                  <strong className="text-[var(--warn)]">seluruh 5 service produksi</strong> (
                  <code>api</code>, <code>admin-api</code>, <code>web</code>, <code>landing</code>,{" "}
                  <code>backoffice</code>) secara berurutan. Proses ini membutuhkan waktu lebih lama
                  dan akan tercatat di Audit Log.
                </>
              ) : (
                <>
                  Tindakan ini akan menjalankan <code>git pull origin main</code> di server produksi
                  dan hanya me-rebuild service yang file-nya berubah. Tindakan ini akan tercatat di
                  Audit Log.
                </>
              )}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={triggering}
                onClick={() => setConfirmMode(null)}
                className="rounded-full border border-[var(--line-2)] px-4 py-2 font-semibold hover:bg-[var(--well)]"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={triggering}
                onClick={handleTriggerDeploy}
                className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 font-semibold text-white disabled:opacity-60 ${
                  confirmMode === "all" ? "bg-[var(--amber)]" : "bg-[var(--ink)] text-[var(--on-ink)]"
                }`}
              >
                {triggering && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {triggering
                  ? "Memulai..."
                  : confirmMode === "all"
                    ? "Ya, Force Rebuild All"
                    : "Ya, Deploy Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
