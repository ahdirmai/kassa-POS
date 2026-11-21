"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import {
  calculateMarginPercent,
  calculateRecipeHpp,
  convertToBaseUnit,
  formatIDR,
  getCompatibleUnits,
  INGREDIENT_UNIT_PRESETS,
} from "@pos/shared";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";
import { useUiStore } from "@/stores/ui-store";

interface Ingredient {
  id: number;
  sku: string;
  name: string;
  unit: string;
  purchaseUnit: string;
  conversion: number;
  unitCost: number;
  currentStock: number;
  minStock: number;
}

interface RecipeRow {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  hpp: number;
  margin: number;
  marginPercent: number;
  notes?: string;
  recipeItems: Array<{ ingredientId: number; ingredientName: string; qty: number; unit: string; unitCost: number; lineCost: number }>;
}

export default function AdminStockPage() {
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [tab, setTab] = useState<"ingredients" | "recipes" | "movements">("ingredients");
  const [adj, setAdj] = useState({ ingredientId: "", type: "PURCHASE_IN", qtyChange: "1", inputUnit: "", reason: "Restock harian" });

  // CRUD Ingredient Modal state
  const [ingModal, setIngModal] = useState<{
    mode: "create" | "edit";
    id?: number;
    sku: string;
    name: string;
    unit: string;
    purchaseUnit: string;
    conversion: string;
    purchasePrice: string;
    unitCost: string;
    currentStock: string;
    minStock: string;
  } | null>(null);

  // CRUD Recipe / HPP Modal state
  const [recipeModal, setRecipeModal] = useState<{
    product: RecipeRow;
    notes: string;
    manualCost: string;
    items: Array<{ ingredientId: number; qty: number; unit: string }>;
  } | null>(null);

  const { data: ingredients = [] } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => apiFetch<Ingredient[]>("/stock/ingredients"),
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes"],
    queryFn: () => apiFetch<RecipeRow[]>("/stock/recipes"),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["movements"],
    queryFn: () =>
      apiFetch<Array<{ id: number; type: string; qtyChange: number; balanceAfter: number; reason: string; createdAt: string; ingredient: { name: string; unit: string } }>>(
        "/stock/movements",
      ),
  });

  const saveIngMut = useMutation({
    mutationFn: () => {
      if (!ingModal) throw new Error("No modal");
      if (ingModal.mode === "create") {
        return apiFetch("/stock/ingredients", {
          method: "POST",
          body: JSON.stringify({
            sku: ingModal.sku,
            name: ingModal.name,
            unit: ingModal.unit,
            purchaseUnit: ingModal.purchaseUnit,
            conversion: Number(ingModal.conversion) || 1,
            unitCost: Number(ingModal.unitCost) || 0,
            currentStock: Number(ingModal.currentStock) || 0,
            minStock: Number(ingModal.minStock) || 0,
          }),
        });
      }
      return apiFetch(`/stock/ingredients/${ingModal.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          sku: ingModal.sku,
          name: ingModal.name,
          unit: ingModal.unit,
          purchaseUnit: ingModal.purchaseUnit,
          conversion: Number(ingModal.conversion) || 1,
          unitCost: Number(ingModal.unitCost) || 0,
          minStock: Number(ingModal.minStock) || 0,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ingredients"] });
      qc.invalidateQueries({ queryKey: ["recipes"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      setIngModal(null);
      pushToast("Bahan baku disimpan (HPP resep ikut disinkronkan)", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const deleteIngMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/stock/ingredients/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ingredients"] });
      pushToast("Bahan baku dihapus", "warn");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const adjustMut = useMutation({
    mutationFn: () => {
      const targetId = Number(adj.ingredientId || ingredients[0]?.id);
      const ing = ingredients.find((i) => i.id === targetId);
      const effectiveUnit = adj.inputUnit || ing?.unit || undefined;
      return apiFetch("/stock/adjust", {
        method: "POST",
        body: JSON.stringify({
          ingredientId: targetId,
          type: adj.type,
          qtyChange: Number(adj.qtyChange),
          inputUnit: effectiveUnit,
          reason: adj.reason,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ingredients"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      pushToast("Mutasi stok tercatat di ledger", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const saveRecipeMut = useMutation({
    mutationFn: () => {
      if (!recipeModal) throw new Error("No modal");
      return apiFetch(`/stock/recipes/${recipeModal.product.id}`, {
        method: "PUT",
        body: JSON.stringify({
          notes: recipeModal.notes,
          manualCost: Number(recipeModal.manualCost) || 0,
          items: recipeModal.items.filter((it) => it.ingredientId > 0 && it.qty > 0),
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setRecipeModal(null);
      pushToast("Resep (BOM) & HPP menu berhasil diperbarui", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const ingById = new Map(ingredients.map((i) => [i.id, i]));
  const previewHpp = recipeModal
    ? recipeModal.items.length > 0
      ? calculateRecipeHpp(
          recipeModal.items.map((it) => {
            const ing = ingById.get(it.ingredientId);
            const baseQty = ing
              ? convertToBaseUnit(Number(it.qty) || 0, it.unit, ing.unit, ing.purchaseUnit, ing.conversion)
              : Number(it.qty) || 0;
            return { qty: baseQty, unitCost: ing?.unitCost ?? 0 };
          }),
        )
      : Number(recipeModal.manualCost) || 0
    : 0;

  return (
    <CadraShell
      title="Stok, Resep (BOM) & HPP"
      crumb="Inventaris & HPP"
      rightSlot={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setTab("ingredients")} className="chip" data-active={tab === "ingredients"}>Bahan Baku</button>
            <button onClick={() => setTab("recipes")} className="chip" data-active={tab === "recipes"}>Resep &amp; HPP</button>
            <button onClick={() => setTab("movements")} className="chip" data-active={tab === "movements"}>Ledger Mutasi</button>
          </div>
          {tab === "ingredients" && (
            <button
              onClick={() =>
                setIngModal({
                  mode: "create",
                  sku: "",
                  name: "",
                  unit: "gram",
                  purchaseUnit: "kg",
                  conversion: "1000",
                  purchasePrice: "100000",
                  unitCost: "100",
                  currentStock: "1000",
                  minStock: "500",
                })
              }
              className="btn-cadra btn-cadra--primary"
            >
              <Plus className="h-4 w-4" />
              Tambah Bahan
            </button>
          )}
        </div>
      }
    >
      {tab === "ingredients" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="cadra-card overflow-x-auto">
            <table className="cadra-table">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="py-2">SKU</th>
                  <th className="py-2">Bahan Baku</th>
                  <th className="py-2 text-right">Stok</th>
                  <th className="py-2 text-right">Min</th>
                  <th className="py-2 text-right">Biaya/Satuan</th>
                  <th className="py-2 text-right">Status</th>
                  <th className="py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {ingredients.map((i) => {
                  const low = i.currentStock <= i.minStock;
                  return (
                    <tr key={i.id}>
                      <td className="py-2.5 font-mono text-[var(--muted)] whitespace-nowrap">{i.sku}</td>
                      <td className="py-2.5 font-semibold">{i.name}</td>
                      <td className="py-2.5 text-right font-bold whitespace-nowrap">{i.currentStock.toLocaleString("id-ID")} {i.unit}</td>
                      <td className="py-2.5 text-right text-[var(--muted)] whitespace-nowrap">{i.minStock.toLocaleString("id-ID")} {i.unit}</td>
                      <td className="py-2.5 text-right whitespace-nowrap">{formatIDR(i.unitCost)}/{i.unit}</td>
                      <td className="py-2.5 text-right">
                        <span className={`spill ${low ? "spill--warn" : "spill--good"}`}>{low ? "Kritis" : "Aman"}</span>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() =>
                              setIngModal({
                                mode: "edit",
                                id: i.id,
                                sku: i.sku,
                                name: i.name,
                                unit: i.unit,
                                purchaseUnit: i.purchaseUnit,
                                conversion: String(i.conversion),
                                purchasePrice: String(Math.round(i.unitCost * i.conversion)),
                                unitCost: String(i.unitCost),
                                currentStock: String(i.currentStock),
                                minStock: String(i.minStock),
                              })
                            }
                            className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--well)]"
                            title="Edit Bahan"
                            aria-label="Edit Bahan"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus bahan "${i.name}"?`)) deleteIngMut.mutate(i.id);
                            }}
                            className="grid h-8 w-8 place-items-center rounded-full text-[var(--bad)] hover:bg-[var(--well)]"
                            title="Hapus Bahan"
                            aria-label="Hapus Bahan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="cadra-card space-y-3 h-fit">
            <h3 className="text-sm font-bold">Catat Masuk / Waste / Opname</h3>
            {(() => {
              const selectedIng = ingById.get(Number(adj.ingredientId || ingredients[0]?.id));
              const unitOpts = selectedIng
                ? getCompatibleUnits(selectedIng.unit, selectedIng.purchaseUnit, selectedIng.conversion)
                : [];
              const activeUnit =
                unitOpts.some((u) => u.unit === adj.inputUnit) ? adj.inputUnit : (selectedIng?.unit ?? "");
              const qtyNum = Number(adj.qtyChange) || 0;
              const convertedBase = selectedIng
                ? convertToBaseUnit(qtyNum, activeUnit, selectedIng.unit, selectedIng.purchaseUnit, selectedIng.conversion)
                : qtyNum;
              const opnameDiff = selectedIng ? Number((convertedBase - selectedIng.currentStock).toFixed(3)) : 0;
              return (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Bahan Baku</label>
                    <select
                      className="cadra-input"
                      value={adj.ingredientId || ingredients[0]?.id || ""}
                      onChange={(e) => {
                        const nextIng = ingById.get(Number(e.target.value));
                        setAdj({ ...adj, ingredientId: e.target.value, inputUnit: nextIng?.unit ?? "" });
                      }}
                    >
                      {ingredients.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.currentStock.toLocaleString("id-ID")} {i.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Jenis Mutasi</label>
                    <select className="cadra-input" value={adj.type} onChange={(e) => setAdj({ ...adj, type: e.target.value })}>
                      <option value="PURCHASE_IN">Pembelian Masuk (+)</option>
                      <option value="WASTE">Waste / Rusak (-)</option>
                      <option value="ADJUSTMENT">Penyesuaian (+/-)</option>
                      <option value="OPNAME">Stock Opname (Input Stok Fisik Aktual)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                        {adj.type === "OPNAME" ? "Stok Fisik Aktual" : "Jumlah"}
                      </label>
                      <input type="number" step="any" className="cadra-input" value={adj.qtyChange} onChange={(e) => setAdj({ ...adj, qtyChange: e.target.value })} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Satuan</label>
                      <select
                        className="cadra-input"
                        value={activeUnit}
                        onChange={(e) => setAdj({ ...adj, inputUnit: e.target.value })}
                      >
                        {unitOpts.map((u) => (
                          <option key={u.unit} value={u.unit}>{u.unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedIng && activeUnit !== selectedIng.unit && (
                    <p className="text-[11px] font-semibold text-[var(--primary-ink)]">
                      Konversi otomatis: {qtyNum} {activeUnit} = {convertedBase.toLocaleString("id-ID")} {selectedIng.unit}
                    </p>
                  )}
                  {selectedIng && adj.type === "OPNAME" && (
                    <p className="text-[11px] text-[var(--muted)]">
                      Saldo sistem: <b>{selectedIng.currentStock.toLocaleString("id-ID")} {selectedIng.unit}</b> · Selisih:{" "}
                      <b className={opnameDiff < 0 ? "text-[var(--bad)]" : "text-[var(--good)]"}>
                        {opnameDiff > 0 ? `+${opnameDiff}` : opnameDiff} {selectedIng.unit}
                      </b>
                    </p>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Alasan</label>
                    <input className="cadra-input" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} />
                  </div>
                  <button
                    disabled={ingredients.length === 0 || adjustMut.isPending}
                    onClick={() => adjustMut.mutate()}
                    className="btn-cadra btn-cadra--primary w-full"
                  >
                    Simpan Mutasi
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {tab === "recipes" && (
        <div className="cadra-card overflow-x-auto">
          <table className="cadra-table">
            <thead className="border-b border-[var(--line)] text-[var(--muted)]">
              <tr>
                <th className="py-2">Menu</th>
                <th className="py-2">Komposisi Resep (BOM)</th>
                <th className="py-2 text-right">Harga Jual</th>
                <th className="py-2 text-right">HPP</th>
                <th className="py-2 text-right">Margin</th>
                <th className="py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {recipes.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 font-semibold">{r.name}</td>
                  <td className="py-2.5 text-[var(--muted)]">
                    {r.recipeItems.length
                      ? r.recipeItems.map((ri) => `${ri.ingredientName} (${ri.qty}${ri.unit})`).join(", ")
                      : "HPP manual (belum ada BOM)"}
                  </td>
                  <td className="py-2.5 text-right font-bold whitespace-nowrap">{formatIDR(r.price)}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">{formatIDR(r.hpp)}</td>
                  <td className="py-2.5 text-right font-bold text-[var(--good)] whitespace-nowrap">
                    {formatIDR(r.margin)} ({r.marginPercent}%)
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() =>
                        setRecipeModal({
                          product: r,
                          notes: r.notes ?? "",
                          manualCost: String(r.hpp),
                          items: r.recipeItems.map((ri) => ({ ingredientId: ri.ingredientId, qty: ri.qty, unit: ri.unit })),
                        })
                      }
                      className="btn-cadra btn-cadra--ghost !min-h-8 !px-3 !text-xs"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Atur Resep / HPP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "movements" && (
        <div className="cadra-card overflow-x-auto">
          <table className="cadra-table">
            <thead className="border-b border-[var(--line)] text-[var(--muted)]">
              <tr>
                <th className="py-2">Waktu</th>
                <th className="py-2">Bahan</th>
                <th className="py-2">Tipe</th>
                <th className="py-2 text-right">Perubahan</th>
                <th className="py-2 text-right">Saldo Akhir</th>
                <th className="py-2">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 text-[var(--muted)] whitespace-nowrap">{new Date(m.createdAt).toLocaleString("id-ID")}</td>
                  <td className="py-2.5 font-semibold">{m.ingredient.name}</td>
                  <td className="py-2.5"><span className="spill spill--slate">{m.type}</span></td>
                  <td className={`py-2.5 text-right font-bold whitespace-nowrap ${m.qtyChange < 0 ? "text-[var(--bad)]" : "text-[var(--good)]"}`}>
                    {m.qtyChange > 0 ? `+${m.qtyChange}` : m.qtyChange} {m.ingredient.unit}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">{m.balanceAfter} {m.ingredient.unit}</td>
                  <td className="py-2.5 text-[var(--muted)]">{m.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Create / Edit Bahan Baku */}
      {ingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setIngModal(null)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">{ingModal.mode === "create" ? "Tambah Bahan Baku" : "Edit Bahan Baku"}</h3>
              <button onClick={() => setIngModal(null)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">SKU Bahan</label>
                <input className="cadra-input" placeholder="ING-SYRUP" value={ingModal.sku} onChange={(e) => setIngModal({ ...ingModal, sku: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Bahan</label>
                <input className="cadra-input" placeholder="Sirup Vanilla" value={ingModal.name} onChange={(e) => setIngModal({ ...ingModal, name: e.target.value })} />
              </div>
            </div>
            {/* Preset Satuan Fleksibel */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-[var(--muted)]">Preset Satuan Cepat (atau ketik bebas di bawah)</div>
              <div className="flex flex-wrap gap-1.5">
                {INGREDIENT_UNIT_PRESETS.map((pr) => (
                  <button
                    key={pr.label}
                    type="button"
                    onClick={() => {
                      const pPrice = Number(ingModal.purchasePrice) || 0;
                      setIngModal({
                        ...ingModal,
                        unit: pr.unit,
                        purchaseUnit: pr.purchaseUnit,
                        conversion: String(pr.conversion),
                        unitCost: pPrice > 0 ? String(Math.round(pPrice / pr.conversion)) : ingModal.unitCost,
                      });
                    }}
                    className="chip !min-h-7 !px-2.5 !text-[11px]"
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Satuan Dasar (Bebas)</label>
                <input className="cadra-input" placeholder="gram / ml / pcs / pump" value={ingModal.unit} onChange={(e) => setIngModal({ ...ingModal, unit: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Satuan Beli (Bebas)</label>
                <input className="cadra-input" placeholder="kg / liter / botol / tray" value={ingModal.purchaseUnit} onChange={(e) => setIngModal({ ...ingModal, purchaseUnit: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Isi per Beli</label>
                <input
                  type="number"
                  className="cadra-input"
                  value={ingModal.conversion}
                  onChange={(e) => {
                    const conv = Math.max(1, Number(e.target.value) || 1);
                    const pPrice = Number(ingModal.purchasePrice) || 0;
                    setIngModal({
                      ...ingModal,
                      conversion: e.target.value,
                      unitCost: pPrice > 0 ? String(Math.round(pPrice / conv)) : ingModal.unitCost,
                    });
                  }}
                />
              </div>
            </div>

            {/* Kalkulator Harga Beli -> Biaya per Satuan Dasar */}
            <div className="rounded-2xl bg-[var(--surface)] p-3 space-y-2">
              <div className="text-[11px] font-bold text-[var(--muted)]">
                Kalkulator HPP Bahan (1 {ingModal.purchaseUnit || "pack"} = {Number(ingModal.conversion || 1).toLocaleString("id-ID")} {ingModal.unit || "unit"})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                    Harga Beli / {ingModal.purchaseUnit || "pack"} (Rp)
                  </label>
                  <input
                    type="number"
                    className="cadra-input"
                    value={ingModal.purchasePrice}
                    onChange={(e) => {
                      const pPrice = Number(e.target.value) || 0;
                      const conv = Math.max(1, Number(ingModal.conversion) || 1);
                      setIngModal({
                        ...ingModal,
                        purchasePrice: e.target.value,
                        unitCost: String(Math.round(pPrice / conv)),
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                    Biaya / {ingModal.unit || "satuan"} (Rp)
                  </label>
                  <input
                    type="number"
                    className="cadra-input"
                    value={ingModal.unitCost}
                    onChange={(e) => setIngModal({ ...ingModal, unitCost: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ingModal.mode === "create" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Stok Awal ({ingModal.unit || "unit"})</label>
                  <input type="number" className="cadra-input" value={ingModal.currentStock} onChange={(e) => setIngModal({ ...ingModal, currentStock: e.target.value })} />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Stok Minimum ({ingModal.unit || "unit"})</label>
                <input type="number" className="cadra-input" value={ingModal.minStock} onChange={(e) => setIngModal({ ...ingModal, minStock: e.target.value })} />
              </div>
            </div>
            <button onClick={() => saveIngMut.mutate()} disabled={saveIngMut.isPending} className="btn-cadra btn-cadra--primary w-full">
              Simpan Bahan Baku
            </button>
          </div>
        </div>
      )}

      {/* Modal Editor Resep (BOM) & HPP */}
      {recipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setRecipeModal(null)}>
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold">Resep (BOM) &amp; HPP — {recipeModal.product.name}</h3>
                <p className="text-xs text-[var(--muted)]">Harga jual: {formatIDR(recipeModal.product.price)}</p>
              </div>
              <button onClick={() => setRecipeModal(null)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--muted)]">Daftar Bahan Resep</span>
                <button
                  type="button"
                  onClick={() => {
                    const usedIds = new Set(recipeModal.items.map((x) => x.ingredientId));
                    const nextIng = ingredients.find((i) => !usedIds.has(i.id)) ?? ingredients[0];
                    if (!nextIng) return;
                    setRecipeModal({
                      ...recipeModal,
                      items: [...recipeModal.items, { ingredientId: nextIng.id, qty: 10, unit: nextIng.unit }],
                    });
                  }}
                  className="chip"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Bahan
                </button>
              </div>

              {recipeModal.items.length === 0 ? (
                <div className="rounded-2xl bg-[var(--surface)] p-3 space-y-2">
                  <p className="text-xs text-[var(--muted)]">Belum ada bahan BOM. Anda bisa tambah bahan di atas atau isi HPP manual:</p>
                  <input
                    type="number"
                    className="cadra-input"
                    value={recipeModal.manualCost}
                    onChange={(e) => setRecipeModal({ ...recipeModal, manualCost: e.target.value })}
                    placeholder="HPP manual (Rp)"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {recipeModal.items.map((row, idx) => {
                    const ing = ingById.get(row.ingredientId);
                    const rowUnits = ing ? getCompatibleUnits(ing.unit, ing.purchaseUnit, ing.conversion) : [];
                    const activeUnit = rowUnits.some((u) => u.unit === row.unit) ? row.unit : (ing?.unit ?? "");
                    const baseQty = ing
                      ? convertToBaseUnit(Number(row.qty) || 0, activeUnit, ing.unit, ing.purchaseUnit, ing.conversion)
                      : Number(row.qty) || 0;
                    const lineCost = Math.round(baseQty * (ing?.unitCost ?? 0));
                    return (
                      <div key={idx} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2.5 space-y-1.5">
                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_84px_100px_auto] items-center gap-2">
                          <select
                            className="cadra-input"
                            value={row.ingredientId}
                            onChange={(e) => {
                              const nextIng = ingById.get(Number(e.target.value));
                              const next = [...recipeModal.items];
                              next[idx] = { ...row, ingredientId: Number(e.target.value), unit: nextIng?.unit ?? "" };
                              setRecipeModal({ ...recipeModal, items: next });
                            }}
                          >
                            {ingredients.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.name} ({formatIDR(i.unitCost)}/{i.unit})
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            step="any"
                            className="cadra-input"
                            value={row.qty}
                            onChange={(e) => {
                              const next = [...recipeModal.items];
                              next[idx] = { ...row, qty: Number(e.target.value) };
                              setRecipeModal({ ...recipeModal, items: next });
                            }}
                          />
                          <select
                            className="cadra-input"
                            value={activeUnit}
                            onChange={(e) => {
                              const next = [...recipeModal.items];
                              next[idx] = { ...row, unit: e.target.value };
                              setRecipeModal({ ...recipeModal, items: next });
                            }}
                          >
                            {rowUnits.map((u) => (
                              <option key={u.unit} value={u.unit}>{u.unit}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              setRecipeModal({
                                ...recipeModal,
                                items: recipeModal.items.filter((_, i) => i !== idx),
                              })
                            }
                            className="grid h-10 w-10 place-items-center rounded-full text-[var(--bad)] hover:bg-[var(--well)]"
                            aria-label="Hapus baris"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap justify-between gap-1 px-1 text-[11px] text-[var(--muted)]">
                          <span>
                            {row.qty || 0} {activeUnit}
                            {ing && activeUnit !== ing.unit ? ` (= ${baseQty} ${ing.unit})` : ""} × {formatIDR(ing?.unitCost ?? 0)}/{ing?.unit ?? ""}
                          </span>
                          <b className="text-[var(--text)]">{formatIDR(lineCost)}</b>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Preview HPP & Margin */}
            <div className="rounded-2xl bg-[var(--surface)] p-3.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Estimasi HPP Baru</span>
                <b className="text-sm">{formatIDR(previewHpp)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Margin Kotor</span>
                <b className="text-sm text-[var(--good)]">
                  {formatIDR(recipeModal.product.price - previewHpp)} ({calculateMarginPercent(recipeModal.product.price, previewHpp)}%)
                </b>
              </div>
            </div>

            <button onClick={() => saveRecipeMut.mutate()} disabled={saveRecipeMut.isPending} className="btn-cadra btn-cadra--primary w-full">
              Simpan Resep &amp; Perbarui HPP
            </button>
          </div>
        </div>
      )}
    </CadraShell>
  );
}
