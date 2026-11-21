"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Search, Sliders, Trash2, X } from "lucide-react";
import { formatIDR } from "@pos/shared";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";
import { useUiStore } from "@/stores/ui-store";

interface ModifierGroup {
  id: number;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  _count?: { products: number };
  modifiers: Array<{ id: number; name: string; price: number; isAvailable: boolean }>;
}

interface AddonGroupFormState {
  mode: "create" | "edit";
  id?: number;
  name: string;
  isRequired: boolean;
  minSelect: string;
  maxSelect: string;
  modifiers: Array<{ id?: number; name: string; price: string; isAvailable: boolean }>;
}

interface ProductRow {
  id: number;
  sku: string;
  name: string;
  monogram: string;
  tone: string;
  price: number;
  cost: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  category: { id: number; name: string };
  station?: { id: number; name: string } | null;
  variants: Array<{ id: number; name: string; priceDelta: number; isDefault: boolean }>;
  modifierGroups: Array<{ modifierGroup: { id: number; name: string } }>;
}

interface MenuFormState {
  mode: "create" | "edit";
  id?: number;
  sku: string;
  name: string;
  monogram: string;
  tone: string;
  price: string;
  cost: string;
  imageUrl: string;
  categoryId: string;
  stationId: string;
  variants: Array<{ name: string; priceDelta: string }>;
  modifierGroupIds: number[];
}

const TONES = ["iris", "coral", "amber", "teal", "sky", "rose", "lime", "plum", "slate"];

export default function AdminMenuPage() {
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [activeTab, setActiveTab] = useState<"menu" | "addons">("menu");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("ALL");
  const [modal, setModal] = useState<MenuFormState | null>(null);
  const [addonModal, setAddonModal] = useState<AddonGroupFormState | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<ProductRow[]>("/menu/products"),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<Array<{ id: number; name: string }>>("/menu/categories"),
  });

  const { data: stations = [] } = useQuery({
    queryKey: ["stations"],
    queryFn: () => apiFetch<Array<{ id: number; name: string }>>("/menu/stations"),
  });

  const { data: modifierGroups = [] } = useQuery({
    queryKey: ["modifier-groups"],
    queryFn: () => apiFetch<ModifierGroup[]>("/menu/modifier-groups"),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = catFilter === "ALL" || String(p.category.id) === catFilter;
      const qOk = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [products, search, catFilter]);

  const toggleMut = useMutation({
    mutationFn: ({ id, isAvailable }: { id: number; isAvailable: boolean }) =>
      apiFetch(`/menu/products/${id}/availability`, { method: "PATCH", body: JSON.stringify({ isAvailable }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      pushToast("Status ketersediaan diperbarui", "good");
    },
  });

  const saveMut = useMutation({
    mutationFn: () => {
      if (!modal) throw new Error("No modal");
      const payload = {
        sku: modal.sku.trim(),
        name: modal.name.trim(),
        monogram: modal.monogram.trim() || undefined,
        tone: modal.tone,
        price: Number(modal.price) || 0,
        cost: Number(modal.cost) || 0,
        imageUrl: modal.imageUrl.trim() || null,
        categoryId: Number(modal.categoryId),
        stationId: modal.stationId ? Number(modal.stationId) : null,
        variants: modal.variants
          .filter((v) => v.name.trim().length > 0)
          .map((v, idx) => ({
            name: v.name.trim(),
            priceDelta: Number(v.priceDelta) || 0,
            isDefault: idx === 0,
          })),
        modifierGroupIds: modal.modifierGroupIds,
      };
      if (modal.mode === "create") {
        return apiFetch("/menu/products", { method: "POST", body: JSON.stringify(payload) });
      }
      return apiFetch(`/menu/products/${modal.id}`, { method: "PATCH", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["recipes"] });
      setModal(null);
      pushToast("Menu, varian & modifier berhasil disimpan", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/menu/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      pushToast("Menu dihapus", "warn");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const saveAddonMut = useMutation({
    mutationFn: () => {
      if (!addonModal) throw new Error("No modal");
      const payload = {
        name: addonModal.name.trim(),
        isRequired: addonModal.isRequired,
        minSelect: Number(addonModal.minSelect) || 0,
        maxSelect: Math.max(1, Number(addonModal.maxSelect) || 1),
        modifiers: addonModal.modifiers
          .filter((m) => m.name.trim().length > 0)
          .map((m) => ({
            ...(m.id ? { id: m.id } : {}),
            name: m.name.trim(),
            price: Number(m.price) || 0,
            isAvailable: m.isAvailable,
          })),
      };
      if (addonModal.mode === "create") {
        return apiFetch("/menu/modifier-groups", { method: "POST", body: JSON.stringify(payload) });
      }
      return apiFetch(`/menu/modifier-groups/${addonModal.id}`, { method: "PATCH", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modifier-groups"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setAddonModal(null);
      pushToast("Grup Add-On & daftar opsi disimpan", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const deleteAddonMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/menu/modifier-groups/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modifier-groups"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      pushToast("Grup Add-On dihapus", "warn");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const openCreate = () => {
    setModal({
      mode: "create",
      sku: "",
      name: "",
      monogram: "",
      tone: "iris",
      price: "30000",
      cost: "10000",
      imageUrl: "",
      categoryId: String(categories[0]?.id ?? "1"),
      stationId: String(stations[0]?.id ?? "1"),
      variants: [],
      modifierGroupIds: [],
    });
  };

  const openEdit = (p: ProductRow) => {
    setModal({
      mode: "edit",
      id: p.id,
      sku: p.sku,
      name: p.name,
      monogram: p.monogram,
      tone: p.tone || "iris",
      price: String(p.price),
      cost: String(p.cost),
      imageUrl: p.imageUrl ?? "",
      categoryId: String(p.category.id),
      stationId: p.station ? String(p.station.id) : "",
      variants: p.variants.map((v) => ({ name: v.name, priceDelta: String(v.priceDelta) })),
      modifierGroupIds: p.modifierGroups.map((mg) => mg.modifierGroup.id),
    });
  };

  return (
    <CadraShell
      title="Manajemen Menu & Add-On"
      crumb="Menu, Varian & Add-On"
      rightSlot={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setActiveTab("menu")} className="chip" data-active={activeTab === "menu"}>
              Daftar Menu ({products.length})
            </button>
            <button onClick={() => setActiveTab("addons")} className="chip" data-active={activeTab === "addons"}>
              <Sliders className="h-3.5 w-3.5" />
              Grup Add-On ({modifierGroups.length})
            </button>
          </div>
          {activeTab === "menu" ? (
            <button onClick={openCreate} className="btn-cadra btn-cadra--primary">
              <Plus className="h-4 w-4" />
              Tambah Menu
            </button>
          ) : (
            <button
              onClick={() =>
                setAddonModal({
                  mode: "create",
                  name: "",
                  isRequired: false,
                  minSelect: "0",
                  maxSelect: "2",
                  modifiers: [{ name: "", price: "0", isAvailable: true }],
                })
              }
              className="btn-cadra btn-cadra--primary"
            >
              <Plus className="h-4 w-4" />
              Tambah Grup Add-On
            </button>
          )}
        </div>
      }
    >
      {activeTab === "menu" ? (
      <div className="cadra-card space-y-4">
        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setCatFilter("ALL")} className="chip" data-active={catFilter === "ALL"}>
              Semua ({products.length})
            </button>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setCatFilter(String(c.id))} className="chip" data-active={catFilter === String(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama menu atau SKU..."
              className="cadra-input cadra-input--search"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="cadra-table">
            <thead className="border-b border-[var(--line)] text-[var(--muted)]">
              <tr>
                <th className="py-2.5">SKU</th>
                <th className="py-2.5">Nama Menu</th>
                <th className="py-2.5">Stasiun</th>
                <th className="py-2.5">Custom (Varian &amp; Modifier)</th>
                <th className="py-2.5 text-right">Harga</th>
                <th className="py-2.5 text-right">HPP</th>
                <th className="py-2.5 text-right">Status</th>
                <th className="py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {filtered.map((p) => {
                const isCustom = p.variants.length > 1 || p.modifierGroups.length > 0;
                const modNames = p.modifierGroups.map((m) => m.modifierGroup.name);
                return (
                  <tr key={p.id}>
                    <td className="py-3 font-mono text-[var(--muted)] whitespace-nowrap">{p.sku}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            loading="lazy"
                            className="h-10 w-10 shrink-0 rounded-xl object-cover border border-[var(--line)]"
                          />
                        ) : (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--well)] text-xs font-bold text-[var(--muted)]">
                            {p.monogram}
                          </span>
                        )}
                        <div>
                          <div className="font-semibold text-sm">{p.name}</div>
                          <div className="text-[11px] text-[var(--muted)]">{p.category.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 whitespace-nowrap">{p.station?.name ?? "-"}</td>
                    <td className="py-3">
                      {isCustom ? (
                        <div className="space-y-1">
                          <span className="spill spill--iris">
                            <Sliders className="h-3 w-3" />
                            Custom
                          </span>
                          <div className="text-[11px] text-[var(--muted)] leading-snug">
                            {p.variants.length > 1 ? `${p.variants.length} varian (${p.variants.map((v) => v.name).join("/")})` : ""}
                            {p.variants.length > 1 && modNames.length > 0 ? " · " : ""}
                            {modNames.length > 0 ? modNames.join(", ") : ""}
                          </div>
                        </div>
                      ) : (
                        <span className="spill spill--slate">1-Tap Langsung</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-bold whitespace-nowrap">{formatIDR(p.price)}</td>
                    <td className="py-3 text-right text-[var(--muted)] whitespace-nowrap">{formatIDR(p.cost)}</td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => toggleMut.mutate({ id: p.id, isAvailable: !p.isAvailable })}
                        className={`spill ${p.isAvailable ? "spill--good" : "spill--bad"}`}
                      >
                        <i />
                        {p.isAvailable ? "Tersedia" : "Habis"}
                      </button>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--well)]"
                          title="Edit Menu, Varian & Modifier"
                          aria-label="Edit Menu"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus menu "${p.name}"?`)) deleteMut.mutate(p.id);
                          }}
                          className="grid h-8 w-8 place-items-center rounded-full text-[var(--bad)] hover:bg-[var(--well)]"
                          title="Hapus Menu"
                          aria-label="Hapus Menu"
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
      </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modifierGroups.map((g) => (
            <section key={g.id} className="cadra-card flex flex-col justify-between gap-3">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="text-sm font-bold">{g.name}</h2>
                      <span className={`spill ${g.isRequired ? "spill--warn" : "spill--slate"}`}>
                        {g.isRequired ? "Wajib" : "Opsional"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                      Pilih {g.minSelect}–{g.maxSelect} opsi · Dipakai di {g._count?.products ?? 0} menu
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setAddonModal({
                          mode: "edit",
                          id: g.id,
                          name: g.name,
                          isRequired: g.isRequired,
                          minSelect: String(g.minSelect),
                          maxSelect: String(g.maxSelect),
                          modifiers: g.modifiers.map((m) => ({
                            id: m.id,
                            name: m.name,
                            price: String(m.price),
                            isAvailable: m.isAvailable,
                          })),
                        })
                      }
                      className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--well)]"
                      title="Edit Grup Add-On"
                      aria-label="Edit Grup Add-On"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus grup add-on "${g.name}"?`)) deleteAddonMut.mutate(g.id);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-full text-[var(--bad)] hover:bg-[var(--well)]"
                      title="Hapus Grup Add-On"
                      aria-label="Hapus Grup Add-On"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-[var(--line)] rounded-2xl bg-[var(--surface)] px-3 py-1">
                  {g.modifiers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 text-xs">
                      <span className={m.isAvailable ? "font-semibold" : "line-through text-[var(--muted)]"}>
                        {m.name}
                      </span>
                      <b className="whitespace-nowrap">
                        {m.price > 0 ? `+${formatIDR(m.price)}` : "Gratis"}
                      </b>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal Create / Edit Grup Add-On Dinamis */}
      {addonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setAddonModal(null)}>
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {addonModal.mode === "create" ? "Tambah Grup Add-On Baru" : `Edit Grup — ${addonModal.name}`}
                </h3>
                <p className="text-[11px] text-[var(--muted)]">
                  Setelah dibuat, grup ini bisa dipasang ke menu mana saja di tab Daftar Menu.
                </p>
              </div>
              <button onClick={() => setAddonModal(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Grup Add-On</label>
              <input
                className="cadra-input"
                placeholder="Contoh: Topping Dessert / Extra Saus"
                value={addonModal.name}
                onChange={(e) => setAddonModal({ ...addonModal, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
              <label className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-[var(--line-2)] bg-[var(--surface)] px-3 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={addonModal.isRequired}
                  onChange={(e) =>
                    setAddonModal({
                      ...addonModal,
                      isRequired: e.target.checked,
                      minSelect: e.target.checked ? String(Math.max(1, Number(addonModal.minSelect) || 1)) : "0",
                    })
                  }
                  className="h-4 w-4 accent-[var(--ink)]"
                />
                Wajib Dipilih
              </label>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Min Pilih</label>
                <input
                  type="number"
                  min={0}
                  className="cadra-input"
                  value={addonModal.minSelect}
                  onChange={(e) => setAddonModal({ ...addonModal, minSelect: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Maks Pilih</label>
                <input
                  type="number"
                  min={1}
                  className="cadra-input"
                  value={addonModal.maxSelect}
                  onChange={(e) => setAddonModal({ ...addonModal, maxSelect: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-[var(--line)] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--muted)]">Daftar Opsi Add-On &amp; Harga</span>
                <button
                  type="button"
                  onClick={() =>
                    setAddonModal({
                      ...addonModal,
                      modifiers: [...addonModal.modifiers, { name: "", price: "0", isAvailable: true }],
                    })
                  }
                  className="chip"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Opsi
                </button>
              </div>
              <div className="space-y-2">
                {addonModal.modifiers.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-[minmax(0,1fr)_110px_auto] items-center gap-2">
                    <input
                      className="cadra-input"
                      placeholder="Nama opsi (mis. Extra Cheese)"
                      value={m.name}
                      onChange={(e) => {
                        const next = [...addonModal.modifiers];
                        next[idx] = { ...m, name: e.target.value };
                        setAddonModal({ ...addonModal, modifiers: next });
                      }}
                    />
                    <input
                      type="number"
                      min={0}
                      className="cadra-input"
                      placeholder="Harga (Rp)"
                      value={m.price}
                      onChange={(e) => {
                        const next = [...addonModal.modifiers];
                        next[idx] = { ...m, price: e.target.value };
                        setAddonModal({ ...addonModal, modifiers: next });
                      }}
                    />
                    <button
                      type="button"
                      disabled={addonModal.modifiers.length <= 1}
                      onClick={() =>
                        setAddonModal({
                          ...addonModal,
                          modifiers: addonModal.modifiers.filter((_, i) => i !== idx),
                        })
                      }
                      className="grid h-10 w-10 place-items-center rounded-full text-[var(--bad)] hover:bg-[var(--well)] disabled:opacity-30"
                      aria-label="Hapus opsi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => saveAddonMut.mutate()} disabled={saveAddonMut.isPending} className="btn-cadra btn-cadra--primary w-full">
              Simpan Grup Add-On
            </button>
          </div>
        </div>
      )}

      {/* Modal Create / Edit Menu + Varian + Modifier */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{modal.mode === "create" ? "Tambah Menu Baru" : `Edit Menu — ${modal.name}`}</h3>
                <p className="text-[11px] text-[var(--muted)]">
                  Menu dengan &gt;1 varian atau ≥1 modifier group otomatis tampil sebagai menu <b>Custom</b> di Kasir POS.
                </p>
              </div>
              <button onClick={() => setModal(null)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">SKU</label>
                <input className="cadra-input" placeholder="KP-009" value={modal.sku} onChange={(e) => setModal({ ...modal, sku: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Monogram (2 huruf)</label>
                <input className="cadra-input" maxLength={4} placeholder="KS" value={modal.monogram} onChange={(e) => setModal({ ...modal, monogram: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Warna Kartu</label>
                <select className="cadra-input capitalize" value={modal.tone} onChange={(e) => setModal({ ...modal, tone: e.target.value })}>
                  {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Menu</label>
              <input className="cadra-input" placeholder="V60 Single Origin" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">URL Foto Menu (Opsional)</label>
              <div className="flex items-center gap-2.5">
                <input
                  className="cadra-input"
                  placeholder="https://images.unsplash.com/..."
                  value={modal.imageUrl}
                  onChange={(e) => setModal({ ...modal, imageUrl: e.target.value })}
                />
                {modal.imageUrl.trim() && (
                  <img
                    src={modal.imageUrl.trim()}
                    alt="Preview"
                    className="h-11 w-11 shrink-0 rounded-xl object-cover border border-[var(--line)]"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Kategori</label>
                <select className="cadra-input" value={modal.categoryId} onChange={(e) => setModal({ ...modal, categoryId: e.target.value })}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Stasiun KDS</label>
                <select className="cadra-input" value={modal.stationId} onChange={(e) => setModal({ ...modal, stationId: e.target.value })}>
                  <option value="">Tanpa Stasiun</option>
                  {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Harga Dasar (Rp)</label>
                <input type="number" className="cadra-input" value={modal.price} onChange={(e) => setModal({ ...modal, price: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">HPP Estimasi (Rp)</label>
                <input type="number" className="cadra-input" value={modal.cost} onChange={(e) => setModal({ ...modal, cost: e.target.value })} />
              </div>
            </div>

            {/* Varian Section */}
            <div className="space-y-2 border-t border-[var(--line)] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--muted)]">Varian Ukuran / Penyajian (Opsional)</span>
                <button
                  type="button"
                  onClick={() => setModal({ ...modal, variants: [...modal.variants, { name: "", priceDelta: "0" }] })}
                  className="chip"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Varian
                </button>
              </div>
              {modal.variants.length === 0 ? (
                <p className="text-[11px] text-[var(--muted)]">Belum ada varian (menu memakai 1 harga standar).</p>
              ) : (
                <div className="space-y-2">
                  {modal.variants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-[minmax(0,1fr)_110px_auto] items-center gap-2">
                      <input
                        className="cadra-input"
                        placeholder="Contoh: Large (16oz)"
                        value={v.name}
                        onChange={(e) => {
                          const next = [...modal.variants];
                          next[idx] = { ...v, name: e.target.value };
                          setModal({ ...modal, variants: next });
                        }}
                      />
                      <input
                        type="number"
                        className="cadra-input"
                        placeholder="+Rp"
                        value={v.priceDelta}
                        onChange={(e) => {
                          const next = [...modal.variants];
                          next[idx] = { ...v, priceDelta: e.target.value };
                          setModal({ ...modal, variants: next });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setModal({ ...modal, variants: modal.variants.filter((_, i) => i !== idx) })}
                        className="grid h-10 w-10 place-items-center rounded-full text-[var(--bad)] hover:bg-[var(--well)]"
                        aria-label="Hapus varian"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modifier Groups Section */}
            <div className="space-y-2 border-t border-[var(--line)] pt-3">
              <div className="text-xs font-bold text-[var(--muted)]">Modifier Group (Customisasi Kasir)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {modifierGroups.map((g) => {
                  const checked = modal.modifierGroupIds.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() =>
                        setModal({
                          ...modal,
                          modifierGroupIds: checked
                            ? modal.modifierGroupIds.filter((id) => id !== g.id)
                            : [...modal.modifierGroupIds, g.id],
                        })
                      }
                      className={`flex items-start gap-2.5 rounded-2xl border p-2.5 text-left transition ${
                        checked ? "border-[var(--iris)] bg-[var(--accent)]/25" : "border-[var(--line)] bg-[var(--surface)]"
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${
                          checked ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]" : "border-[var(--line-2)]"
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold">{g.name}</div>
                        <div className="truncate text-[10px] text-[var(--muted)]">
                          {g.modifiers.map((m) => m.name).join(", ")}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="btn-cadra btn-cadra--primary w-full">
              Simpan Menu
            </button>
          </div>
        </div>
      )}
    </CadraShell>
  );
}
