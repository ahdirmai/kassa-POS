"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, FolderPlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatIDR } from "@pos/shared";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";
import { useUiStore } from "@/stores/ui-store";

interface TableItem {
  id: number;
  areaId: number;
  code: string;
  name: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "WAITING_PAYMENT";
  orders: Array<{ id: number; orderNo: string; grandTotal: number; customerName?: string }>;
}

interface Area {
  id: number;
  name: string;
  sortOrder: number;
  tables: TableItem[];
}

export default function AdminTablesPage() {
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [areaModal, setAreaModal] = useState<{ mode: "create" | "edit"; id?: number; name: string } | null>(null);
  const [tableModal, setTableModal] = useState<{
    mode: "create" | "edit";
    id?: number;
    areaId: string;
    code: string;
    name: string;
    capacity: string;
  } | null>(null);
  const [moveModal, setMoveModal] = useState<{ sourceTable: TableItem; targetTableId: string } | null>(null);

  const { data: areas = [] } = useQuery({
    queryKey: ["tables"],
    queryFn: () => apiFetch<Area[]>("/tables"),
  });

  const availableTables = areas.flatMap((a) => a.tables).filter((t) => t.status === "AVAILABLE");

  const saveAreaMut = useMutation({
    mutationFn: () => {
      if (!areaModal) throw new Error("No modal");
      if (areaModal.mode === "create") {
        return apiFetch("/tables/areas", { method: "POST", body: JSON.stringify({ name: areaModal.name }) });
      }
      return apiFetch(`/tables/areas/${areaModal.id}`, { method: "PATCH", body: JSON.stringify({ name: areaModal.name }) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      setAreaModal(null);
      pushToast("Area berhasil disimpan", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const deleteAreaMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/tables/areas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      pushToast("Area dihapus", "warn");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const saveTableMut = useMutation({
    mutationFn: () => {
      if (!tableModal) throw new Error("No modal");
      const payload = {
        areaId: Number(tableModal.areaId),
        code: tableModal.code,
        name: tableModal.name,
        capacity: Number(tableModal.capacity) || 4,
      };
      if (tableModal.mode === "create") {
        return apiFetch("/tables", { method: "POST", body: JSON.stringify(payload) });
      }
      return apiFetch(`/tables/${tableModal.id}`, { method: "PATCH", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      setTableModal(null);
      pushToast("Data meja berhasil disimpan", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const deleteTableMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/tables/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      pushToast("Meja dihapus", "warn");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const moveTableMut = useMutation({
    mutationFn: () => {
      if (!moveModal) throw new Error("No modal");
      return apiFetch(`/tables/${moveModal.sourceTable.id}/move`, {
        method: "POST",
        body: JSON.stringify({ targetTableId: Number(moveModal.targetTableId) }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      setMoveModal(null);
      pushToast("Order berhasil dipindahkan ke meja tujuan", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  return (
    <CadraShell
      title="Denah Meja & Area"
      crumb="CRUD Meja"
      rightSlot={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAreaModal({ mode: "create", name: "" })}
            className="btn-cadra btn-cadra--ghost"
          >
            <FolderPlus className="h-4 w-4" />
            Tambah Area
          </button>
          <button
            disabled={areas.length === 0}
            onClick={() =>
              setTableModal({
                mode: "create",
                areaId: String(areas[0]?.id ?? ""),
                code: "",
                name: "",
                capacity: "4",
              })
            }
            className="btn-cadra btn-cadra--primary"
          >
            <Plus className="h-4 w-4" />
            Tambah Meja
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {areas.map((area) => (
          <section key={area.id} className="cadra-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">{area.name}</h2>
                <span className="rounded-full bg-[var(--well)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                  {area.tables.length} meja
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setTableModal({
                      mode: "create",
                      areaId: String(area.id),
                      code: "",
                      name: "",
                      capacity: "4",
                    })
                  }
                  className="chip"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Meja
                </button>
                <button
                  onClick={() => setAreaModal({ mode: "edit", id: area.id, name: area.name })}
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--well)]"
                  title="Edit Area"
                  aria-label="Edit Area"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus area "${area.name}"?`)) deleteAreaMut.mutate(area.id);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full text-[var(--bad)] hover:bg-[var(--well)]"
                  title="Hapus Area"
                  aria-label="Hapus Area"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {area.tables.length === 0 ? (
              <p className="py-4 text-xs text-[var(--muted)]">Belum ada meja di area ini.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                {area.tables.map((t) => {
                  const active = t.orders[0];
                  return (
                    <div
                      key={t.id}
                      className={`flex flex-col justify-between gap-2 rounded-2xl border p-3.5 ${
                        t.status === "AVAILABLE"
                          ? "border-[var(--line)] bg-[var(--surface)]"
                          : "border-amber-500/50 bg-amber-500/10"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <b className="text-sm">{t.name}</b>
                          <span className={`spill ${t.status === "AVAILABLE" ? "spill--good" : "spill--warn"}`}>
                            {t.status === "AVAILABLE" ? "Kosong" : "Terisi"}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--muted)]">
                          {t.code} · {t.capacity} kursi
                        </div>
                        {active && (
                          <div className="pt-1 text-xs font-bold">
                            {active.orderNo} · {formatIDR(active.grandTotal)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-1 border-t border-[var(--line)] pt-2">
                        {t.status !== "AVAILABLE" && availableTables.length > 0 && (
                          <button
                            onClick={() =>
                              setMoveModal({ sourceTable: t, targetTableId: String(availableTables[0].id) })
                            }
                            className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--well)]"
                            title="Pindah Meja"
                            aria-label="Pindah Meja"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setTableModal({
                              mode: "edit",
                              id: t.id,
                              areaId: String(t.areaId),
                              code: t.code,
                              name: t.name,
                              capacity: String(t.capacity),
                            })
                          }
                          className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--well)]"
                          title="Edit Meja"
                          aria-label="Edit Meja"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={t.status !== "AVAILABLE"}
                          onClick={() => {
                            if (confirm(`Hapus ${t.name}?`)) deleteTableMut.mutate(t.id);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-full text-[var(--bad)] hover:bg-[var(--well)] disabled:opacity-35"
                          title="Hapus Meja"
                          aria-label="Hapus Meja"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Modal Area Create/Edit */}
      {areaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setAreaModal(null)}>
          <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">{areaModal.mode === "create" ? "Tambah Area Baru" : "Edit Nama Area"}</h3>
              <button onClick={() => setAreaModal(null)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Area / Lantai</label>
              <input
                className="cadra-input"
                placeholder="Contoh: Rooftop Lantai 2"
                value={areaModal.name}
                onChange={(e) => setAreaModal({ ...areaModal, name: e.target.value })}
              />
            </div>
            <button onClick={() => saveAreaMut.mutate()} disabled={saveAreaMut.isPending} className="btn-cadra btn-cadra--primary w-full">
              Simpan Area
            </button>
          </div>
        </div>
      )}

      {/* Modal Table Create/Edit */}
      {tableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setTableModal(null)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">{tableModal.mode === "create" ? "Tambah Meja Baru" : "Edit Meja"}</h3>
              <button onClick={() => setTableModal(null)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Area</label>
              <select
                className="cadra-input"
                value={tableModal.areaId}
                onChange={(e) => setTableModal({ ...tableModal, areaId: e.target.value })}
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Kode Meja</label>
                <input
                  className="cadra-input"
                  placeholder="T07"
                  value={tableModal.code}
                  onChange={(e) => setTableModal({ ...tableModal, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Kapasitas (Kursi)</label>
                <input
                  type="number"
                  min={1}
                  className="cadra-input"
                  value={tableModal.capacity}
                  onChange={(e) => setTableModal({ ...tableModal, capacity: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Tampilan Meja</label>
              <input
                className="cadra-input"
                placeholder="Meja T07"
                value={tableModal.name}
                onChange={(e) => setTableModal({ ...tableModal, name: e.target.value })}
              />
            </div>
            <button onClick={() => saveTableMut.mutate()} disabled={saveTableMut.isPending} className="btn-cadra btn-cadra--primary w-full">
              Simpan Meja
            </button>
          </div>
        </div>
      )}

      {/* Modal Pindah Meja */}
      {moveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setMoveModal(null)}>
          <div className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Pindah {moveModal.sourceTable.name}</h3>
              <button onClick={() => setMoveModal(null)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Pilih Meja Tujuan (Kosong)</label>
              <select
                className="cadra-input"
                value={moveModal.targetTableId}
                onChange={(e) => setMoveModal({ ...moveModal, targetTableId: e.target.value })}
              >
                {availableTables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.capacity} kursi)
                  </option>
                ))}
              </select>
            </div>
            <button onClick={() => moveTableMut.mutate()} disabled={moveTableMut.isPending} className="btn-cadra btn-cadra--primary w-full">
              Pindahkan Order
            </button>
          </div>
        </div>
      )}
    </CadraShell>
  );
}
