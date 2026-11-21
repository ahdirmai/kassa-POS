"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Flame, GripVertical, RotateCcw } from "lucide-react";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useUiStore } from "@/stores/ui-store";

type KdsStatus = "NEW" | "PREPARING" | "READY" | "BUMPED";

interface KdsTicket {
  id: number;
  status: KdsStatus;
  createdAt: string;
  station: { id: number; code: string; name: string; slaMins: number; tone: string };
  order: { id: number; orderNo: string; orderType: string; customerName?: string; table?: { code: string; name: string } };
  round: { roundNo: number };
  items: Array<{
    id: number;
    productName: string;
    variantName?: string;
    quantity: number;
    notes?: string;
    modifiers: Array<{ modifierName: string }>;
  }>;
}

const COLUMNS: Array<{ status: KdsStatus; label: string; color: string; emptyText: string }> = [
  { status: "NEW", label: "Antrean Baru", color: "var(--coral)", emptyText: "Belum ada pesanan baru" },
  { status: "PREPARING", label: "Sedang Diproses", color: "var(--amber)", emptyText: "Tarik tiket ke sini untuk mulai memasak" },
  { status: "READY", label: "Siap Saji", color: "var(--good)", emptyText: "Pesanan siap saji tampil di sini" },
  { status: "BUMPED", label: "Selesai (Recall)", color: "var(--slate)", emptyText: "Riwayat tiket selesai" },
];

export default function KdsPage() {
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [station, setStation] = useState("ALL");
  const [showBumped, setShowBumped] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<KdsStatus | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["kds", station, showBumped],
    queryFn: () => apiFetch<KdsTicket[]>(`/kds/tickets?station=${station}&includeBumped=${showBumped}`),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000);
    const sock = getSocket(station);
    const onUpdate = () => {
      qc.invalidateQueries({ queryKey: ["kds"] });
    };
    sock.on("kds:updated", onUpdate);
    return () => {
      clearInterval(timer);
      sock.off("kds:updated", onUpdate);
    };
  }, [station, qc]);

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: KdsStatus }) =>
      apiFetch(`/kds/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["kds"] });
      const label = COLUMNS.find((c) => c.status === vars.status)?.label ?? vars.status;
      pushToast(`Tiket #${vars.id} dipindah ke ${label}`, "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const visibleCols = useMemo(
    () => (showBumped ? COLUMNS : COLUMNS.filter((c) => c.status !== "BUMPED")),
    [showBumped],
  );

  const grouped = useMemo(() => {
    const map: Record<KdsStatus, KdsTicket[]> = { NEW: [], PREPARING: [], READY: [], BUMPED: [] };
    for (const t of tickets) {
      if (map[t.status]) map[t.status].push(t);
    }
    return map;
  }, [tickets]);

  const handleDrop = (targetStatus: KdsStatus) => {
    setOverCol(null);
    if (draggingId === null) return;
    const ticket = tickets.find((t) => t.id === draggingId);
    setDraggingId(null);
    if (!ticket || ticket.status === targetStatus) return;
    statusMut.mutate({ id: ticket.id, status: targetStatus });
  };

  return (
    <CadraShell
      title="Kitchen Display Kanban"
      crumb="KDS Realtime"
      mode="kds"
      rightSlot={
        <div className="flex flex-wrap items-center gap-2">
          {[
            ["ALL", "Semua Stasiun"],
            ["BAR", "Bar & Kopi"],
            ["KITCHEN", "Dapur Panas"],
            ["PASTRY", "Pastry"],
          ].map(([code, label]) => (
            <button key={code} onClick={() => setStation(code)} className="chip" data-active={station === code}>
              {label}
            </button>
          ))}
          <button onClick={() => setShowBumped((v) => !v)} className="chip" data-active={showBumped}>
            <RotateCcw className="h-3.5 w-3.5" />
            {showBumped ? "Tutup Kolom Selesai" : "Tampilkan Selesai"}
          </button>
        </div>
      }
    >
      <div className="cadra-card space-y-3">
        {/* Cadra Kanban Stage Distribution Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <span className="font-semibold">
            Seret kartu antar kolom atau klik tombol aksi cepat · Total{" "}
            <b className="text-[var(--text)]">{tickets.length} tiket</b>
          </span>
          <span className="hidden sm:inline font-semibold">Realtime Socket.IO Aktif</span>
        </div>

        <div className="kds-ribbon" aria-hidden="true">
          {visibleCols.map((col) => {
            const count = grouped[col.status].length;
            return (
              <span
                key={col.status}
                className="kds-rib"
                style={{ ["--c" as string]: col.color, flexGrow: Math.max(0.25, count) }}
              />
            );
          })}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-[var(--muted)]">Memuat papan Kanban dapur...</div>
        ) : (
          <div className="kds-scroll">
            <div className="kds-board" style={{ ["--cols" as string]: visibleCols.length }}>
              {visibleCols.map((col) => {
                const list = grouped[col.status];
                const isOver = overCol === col.status;
                return (
                  <section
                    key={col.status}
                    className={`kds-col ${isOver ? "is-over" : ""}`}
                    style={{ ["--c" as string]: col.color }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (overCol !== col.status) setOverCol(col.status);
                    }}
                    onDragLeave={() => {
                      if (overCol === col.status) setOverCol(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(col.status);
                    }}
                  >
                    <header className="kds-col__head">
                      <span className="kds-col__title">
                        <i className="kds-col__dot" />
                        {col.label}
                      </span>
                      <span className="kds-col__n">{list.length}</span>
                    </header>

                    {list.length === 0 ? (
                      <div className="kds-col__empty">{col.emptyText}</div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {list.map((t) => {
                          const elapsedMins = Math.max(0, Math.floor((now - new Date(t.createdAt).getTime()) / 60000));
                          const overdue = elapsedMins >= t.station.slaMins && t.status !== "BUMPED" && t.status !== "READY";
                          return (
                            <article
                              key={t.id}
                              draggable
                              onDragStart={() => setDraggingId(t.id)}
                              onDragEnd={() => {
                                setDraggingId(null);
                                setOverCol(null);
                              }}
                              className={`kds-ticket ${draggingId === t.id ? "is-dragging" : ""} ${overdue ? "is-overdue" : ""}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-1.5 min-w-0">
                                  <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)] opacity-60" />
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="truncate text-sm font-bold">
                                        {t.order.table ? t.order.table.name : t.order.orderType}
                                      </span>
                                      <span className="shrink-0 rounded-full bg-[var(--well)] px-2 py-0.5 text-[10px] font-bold">
                                        R{t.round.roundNo}
                                      </span>
                                    </div>
                                    <div className="truncate text-[11px] text-[var(--muted)]">
                                      {t.order.orderNo} · {t.station.name}
                                    </div>
                                  </div>
                                </div>
                                <span className={`spill shrink-0 ${overdue ? "spill--bad" : "spill--iris"}`}>
                                  <Clock className="h-3 w-3" />
                                  {elapsedMins}m
                                </span>
                              </div>

                              <div className="divide-y divide-[var(--line)] rounded-xl bg-[var(--surface)] px-2.5 py-1">
                                {t.items.map((it) => (
                                  <div key={it.id} className="py-1.5">
                                    <div className="flex items-baseline justify-between gap-2">
                                      <span className="text-xs font-bold">
                                        {it.quantity}× {it.productName}
                                      </span>
                                      {it.variantName && <span className="text-[10px] text-[var(--muted)]">{it.variantName}</span>}
                                    </div>
                                    {it.modifiers.length > 0 && (
                                      <div className="text-[11px] text-[var(--primary-ink)]">
                                        + {it.modifiers.map((m) => m.modifierName).join(", ")}
                                      </div>
                                    )}
                                    {it.notes && (
                                      <div className="mt-0.5 text-[11px] italic text-[var(--warn)]">“{it.notes}”</div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center gap-2">
                                {t.status === "NEW" && (
                                  <button
                                    onClick={() => statusMut.mutate({ id: t.id, status: "PREPARING" })}
                                    className="btn-cadra btn-cadra--accent w-full !min-h-9 !text-xs"
                                  >
                                    <Flame className="h-3.5 w-3.5" />
                                    Mulai Proses
                                  </button>
                                )}
                                {t.status === "PREPARING" && (
                                  <button
                                    onClick={() => statusMut.mutate({ id: t.id, status: "READY" })}
                                    className="btn-cadra btn-cadra--primary w-full !min-h-9 !text-xs"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Tandai Siap
                                  </button>
                                )}
                                {t.status === "READY" && (
                                  <button
                                    onClick={() => statusMut.mutate({ id: t.id, status: "BUMPED" })}
                                    className="btn-cadra btn-cadra--ghost w-full !min-h-9 !text-xs"
                                  >
                                    Bump Selesai
                                  </button>
                                )}
                                {t.status === "BUMPED" && (
                                  <button
                                    onClick={() => statusMut.mutate({ id: t.id, status: "NEW" })}
                                    className="btn-cadra btn-cadra--ghost w-full !min-h-9 !text-xs"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Recall ke Antrean
                                  </button>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </CadraShell>
  );
}
