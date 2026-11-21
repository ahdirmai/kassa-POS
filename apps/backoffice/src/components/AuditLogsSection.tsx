"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { boFetch, formatDateTime, type AuditLogItem } from "@/lib/api";

export default function AuditLogsSection({
  onNotify,
}: {
  onNotify: (msg: string, tone?: "ok" | "err") => void;
}) {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await boFetch<{ items: AuditLogItem[] }>("/audit-logs");
      setItems(res.items);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal memuat audit log", "err");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between card p-4">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <ShieldCheck className="h-4 w-4 text-[#0f5257]" />
          Jejak Audit Aksi Platform Admin (100 terbaru)
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--well)]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden card">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[var(--line)] bg-[var(--bg)] font-mono-num text-[10.5px] uppercase tracking-wider text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Ringkasan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {items.map((log) => (
              <tr key={log.id} className="hover:bg-[var(--bg)]/60">
                <td className="whitespace-nowrap px-4 py-3 font-mono-num text-[11px] text-[var(--muted)]">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{log.admin?.name || "System"}</div>
                  <div className="font-mono-num text-[10.5px] text-[var(--muted)]">
                    {log.admin?.role || "—"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-[#0f5257]/10 px-2 py-0.5 font-mono-num text-[10.5px] font-semibold text-[#0f5257]">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--ink)]">{log.summary}</td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[var(--muted)]">
                  Belum ada catatan audit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
