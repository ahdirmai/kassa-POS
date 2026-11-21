"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  Minus,
  Moon,
  Package,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  Shield,
  ShoppingCart,
  Store,
  Sun,
  UtensilsCrossed,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import {
  calcTotals,
  formatIDR,
  INITIAL_STATE,
  PROTO_PERMISSIONS,
  type ProtoOrder,
  type ProtoProduct,
  type ProtoState,
} from "@/data/mock-store";

type TabId = "pos" | "kds" | "dashboard" | "stock" | "tables" | "rbac";
const STORAGE_KEY = "cadra_pos_prototype_v1";

const TONES: Record<string, string> = {
  iris: "var(--iris)",
  coral: "var(--coral)",
  amber: "var(--amber)",
  teal: "var(--teal)",
  sky: "var(--sky)",
  rose: "var(--rose)",
  lime: "var(--lime)",
  slate: "var(--slate)",
  plum: "var(--plum)",
};

export default function PrototypeApp() {
  const [state, setState] = useState<ProtoState>(INITIAL_STATE);
  const [tab, setTab] = useState<TabId>("pos");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [accent, setAccent] = useState<"ocean" | "sage" | "coral" | "amber">("ocean");
  const [offlineSim, setOfflineSim] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // POS Cart state
  const [cat, setCat] = useState("Semua");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DINE_IN");
  const [tableName, setTableName] = useState("Meja T01");
  const [discountPct, setDiscountPct] = useState(0);
  const [cart, setCart] = useState<Array<{ key: string; product: ProtoProduct; qty: number; mods: Array<{ name: string; price: number }> }>>([]);
  const [modModal, setModModal] = useState<ProtoProduct | null>(null);
  const [chosenMods, setChosenMods] = useState<string[]>([]);
  const [payModal, setPayModal] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<"TUNAI" | "QRIS (Manual)" | "EDC">("TUNAI");
  const [cashGiven, setCashGiven] = useState("");
  const [receipt, setReceipt] = useState<ProtoOrder | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.accent = accent;
  }, [theme, accent]);

  const categories = useMemo(() => ["Semua", ...new Set(state.products.map((p) => p.category))], [state.products]);
  const subtotal = useMemo(
    () => cart.reduce((s, c) => s + (c.product.price + c.mods.reduce((ms, m) => ms + m.price, 0)) * c.qty, 0),
    [cart],
  );
  const totals = useMemo(() => calcTotals(subtotal, discountPct), [subtotal, discountPct]);

  const addToCart = (product: ProtoProduct, mods: Array<{ name: string; price: number }> = []) => {
    const key = `${product.id}:${mods.map((m) => m.name).sort().join(",")}`;
    setCart((prev) => {
      const ex = prev.find((i) => i.key === key);
      if (ex) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { key, product, qty: 1, mods }];
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const paid = payMethod === "TUNAI" ? Number(cashGiven) || totals.grandTotal : totals.grandTotal;
    if (payMethod === "TUNAI" && paid < totals.grandTotal) {
      notify("Uang tunai kurang dari total tagihan");
      return;
    }
    const nowIso = new Date().toISOString();
    const receiptNo = offlineSim
      ? `OFF-${Date.now().toString().slice(-6)}`
      : `RCP-20261119-${String(state.orders.length + 1).padStart(4, "0")}`;

    const newOrder: ProtoOrder = {
      id: `ORD-${Date.now()}`,
      receiptNo,
      createdAt: nowIso,
      orderType,
      tableName: orderType === "DINE_IN" ? tableName : orderType,
      paymentMethod: offlineSim ? "TUNAI (OFFLINE)" : payMethod,
      subtotal: totals.subtotal,
      discount: totals.discount,
      service: totals.service,
      tax: totals.tax,
      rounding: totals.rounding,
      grandTotal: totals.grandTotal,
      paidAmount: paid,
      changeAmt: Math.max(0, paid - totals.grandTotal),
      offline: offlineSim,
      items: cart.map((c) => ({
        name: c.product.name,
        qty: c.qty,
        lineTotal: (c.product.price + c.mods.reduce((ms, m) => ms + m.price, 0)) * c.qty,
        mods: c.mods.map((m) => m.name),
      })),
    };

    // Group KDS tickets by station + deduct recipe ingredients
    const stations = [...new Set(cart.map((c) => c.product.station))];
    const newTickets = stations.map((st) => ({
      id: `TKT-${Date.now().toString().slice(-4)}-${st}`,
      orderNo: receiptNo,
      tableName: newOrder.tableName,
      station: st,
      status: "NEW" as const,
      createdAt: nowIso,
      items: cart
        .filter((c) => c.product.station === st)
        .map((c) => ({ name: c.product.name, qty: c.qty, mods: c.mods.map((m) => m.name) })),
    }));

    const nextIngredients = state.ingredients.map((ing) => {
      let deduct = 0;
      for (const c of cart) {
        const r = c.product.recipe?.find((x) => x.ingredientId === ing.id);
        if (r) deduct += r.qty * c.qty;
      }
      return deduct ? { ...ing, stock: ing.stock - deduct } : ing;
    });

    setState((s) => ({
      ...s,
      orders: [newOrder, ...s.orders],
      tickets: [...newTickets, ...s.tickets],
      ingredients: nextIngredients,
    }));

    setReceipt(newOrder);
    setCart([]);
    setDiscountPct(0);
    setPayModal(false);
    setCashGiven("");
    notify(offlineSim ? `Disimpan Offline (${receiptNo})` : `Lunas! Tiket KDS terkirim & stok terpotong`);
  };

  const resetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_STATE);
    setCart([]);
    notify("Data prototype di-reset ke kondisi awal");
  };

  const todaySales = state.orders.reduce((s, o) => s + o.grandTotal, 0);
  const lowStockCount = state.ingredients.filter((i) => i.stock <= i.minStock).length;
  const roles = state.roles ?? INITIAL_STATE.roles;
  const activeRoleCode = state.activeRoleCode ?? "OWNER";
  const activeRole = roles.find((r) => r.code === activeRoleCode) ?? roles[0];
  const can = (perm: string) => activeRole.permissions.includes(perm);

  const toggleRolePerm = (roleCode: string, perm: string) => {
    setState((s) => ({
      ...s,
      roles: (s.roles ?? INITIAL_STATE.roles).map((r) => {
        if (r.code !== roleCode) return r;
        const has = r.permissions.includes(perm);
        return { ...r, permissions: has ? r.permissions.filter((p) => p !== perm) : [...r.permissions, perm] };
      }),
    }));
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-7 pb-20">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--on-ink)] font-bold">CS</div>
          <div>
            <div className="flex items-center gap-2">
              <b className="text-lg tracking-tight">Cadra POS</b>
              <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--on-accent)]">
                PROTOTYPE (NO BE)
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">Kopi &amp; Dapur Senja · localStorage Mode</p>
          </div>
        </div>

        <nav className="ttabs-track">
          {([
            ["pos", "Kasir POS", Store, "pos.access"],
            ["kds", `KDS (${state.tickets.filter((t) => t.status !== "BUMPED").length})`, ChefHat, "kds.view"],
            ["dashboard", "Dashboard", LayoutDashboard, "report.view"],
            ["tables", "Meja", UtensilsCrossed, "table.manage"],
            ["stock", "Stok & HPP", Package, "stock.view"],
            ["rbac", "RBAC Dinamis", Shield, "role.manage"],
          ] as const)
            .filter(([, , , perm]) => can(perm))
            .map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)} className="ttab inline-flex items-center gap-1.5" data-active={tab === id}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Simulasi Role"
            value={activeRoleCode}
            onChange={(e) => {
              const code = e.target.value;
              setState((s) => ({ ...s, activeRoleCode: code }));
              const nextRole = roles.find((r) => r.code === code);
              if (nextRole?.permissions.includes("pos.access")) setTab("pos");
              else if (nextRole?.permissions.includes("kds.view")) setTab("kds");
              notify(`Simulasi role aktif: ${nextRole?.name ?? code}`);
            }}
            className="btn-cadra btn-cadra--accent !px-3"
          >
            {roles.map((r) => (
              <option key={r.code} value={r.code}>Role: {r.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setOfflineSim((v) => !v);
              notify(!offlineSim ? "Simulasi OFFLINE aktif (hanya Tunai)" : "Simulasi ONLINE aktif");
            }}
            className={`spill cursor-pointer ${offlineSim ? "spill--bad" : "spill--good"}`}
          >
            {offlineSim ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            {offlineSim ? "Simulasi Offline" : "Online"}
          </button>
          <button onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} className="btn-cadra btn-cadra--ghost !px-3">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <select
            aria-label="Accent"
            value={accent}
            onChange={(e) => setAccent(e.target.value as typeof accent)}
            className="btn-cadra btn-cadra--ghost !px-3 capitalize"
          >
            <option value="ocean">Ocean</option>
            <option value="sage">Sage</option>
            <option value="coral">Coral</option>
            <option value="amber">Amber</option>
          </select>
          <button onClick={resetDemo} className="btn-cadra btn-cadra--ghost" title="Reset Data Prototype">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </header>

      {/* TAB 1: POS KASIR */}
      {tab === "pos" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_370px] items-start">
          <section className="cadra-card space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button key={c} onClick={() => setCat(c)} className="chip" data-active={cat === c}>
                  {c}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {state.products
                .filter((p) => cat === "Semua" || p.category === cat)
                .map((p) => (
                  <button
                    key={p.id}
                    disabled={!p.available}
                    onClick={() => {
                      if (p.modifiers?.length) {
                        setModModal(p);
                        setChosenMods([]);
                      } else {
                        addToCart(p);
                      }
                    }}
                    className="pos-tile"
                    style={{ ["--c" as string]: TONES[p.tone] ?? "var(--iris)" }}
                  >
                    <div className="pos-tile__mono group overflow-hidden">
                      {p.imageUrl ? (
                        <>
                          <img src={p.imageUrl} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15" />
                        </>
                      ) : (
                        <b>{p.monogram}</b>
                      )}
                      {p.modifiers?.length ? (
                        <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-[var(--ink)]/85 px-2 py-0.5 text-[9px] font-bold text-[var(--on-ink)]">
                          Custom
                        </span>
                      ) : null}
                      <span className="absolute bottom-1.5 right-1.5 z-10 rounded-full bg-[var(--raised)]/95 px-2 py-0.5 text-[10px] font-bold text-[var(--text)]">
                        {p.available ? p.sku : "Habis"}
                      </span>
                    </div>
                    <div className="text-[13px] font-semibold leading-snug">{p.name}</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--muted)]">{p.station}</span>
                      <b>{formatIDR(p.price)}</b>
                    </div>
                  </button>
                ))}
            </div>
          </section>

          {cartOpen && (
            <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm lg:hidden" onClick={() => setCartOpen(false)} />
          )}
          <aside
            className={`cadra-card flex flex-col gap-3.5 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] ${
              cartOpen
                ? "fixed inset-x-0 bottom-0 z-50 max-h-[86dvh] rounded-b-none rounded-t-3xl !bg-[var(--raised)] shadow-2xl pb-[calc(16px+env(safe-area-inset-bottom))] lg:static lg:z-auto lg:rounded-3xl lg:!bg-[var(--glass)]"
                : "hidden lg:flex"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <ShoppingCart className="h-4 w-4" />
                Pesanan
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--muted)]">{cart.reduce((s, i) => s + i.qty, 0)} item</span>
                <button onClick={() => setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)] lg:hidden" aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-full bg-[var(--well)] p-1">
              {(["DINE_IN", "TAKEAWAY", "DELIVERY"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`rounded-full py-1.5 text-xs font-bold ${
                    orderType === t ? "bg-[var(--ink)] text-[var(--on-ink)]" : "text-[var(--muted)]"
                  }`}
                >
                  {t === "DINE_IN" ? "Dine-in" : t === "TAKEAWAY" ? "Takeaway" : "Delivery"}
                </button>
              ))}
            </div>

            {orderType === "DINE_IN" && (
              <select value={tableName} onChange={(e) => setTableName(e.target.value)} className="cadra-input text-xs">
                {state.tables.map((t) => (
                  <option key={t.id} value={t.name}>{t.name} ({t.area})</option>
                ))}
              </select>
            )}

            <div className="max-h-60 overflow-y-auto divide-y divide-[var(--line)]">
              {cart.length === 0 ? (
                <p className="py-8 text-center text-xs text-[var(--muted)]">Pilih menu di sebelah kiri</p>
              ) : (
                cart.map((c) => {
                  const unit = c.product.price + c.mods.reduce((s, m) => s + m.price, 0);
                  return (
                    <div key={c.key} className="flex items-center justify-between py-2 gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{c.product.name}</div>
                        {c.mods.length > 0 && <div className="text-[10px] text-[var(--primary-ink)]">+ {c.mods.map((m) => m.name).join(", ")}</div>}
                        <div className="text-xs text-[var(--muted)]">{formatIDR(unit * c.qty)}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCart((p) => p.map((x) => (x.key === c.key ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0))}
                          className="grid h-7 w-7 place-items-center rounded-full bg-[var(--well)]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold">{c.qty}</span>
                        <button
                          onClick={() => setCart((p) => p.map((x) => (x.key === c.key ? { ...x, qty: x.qty + 1 } : x)))}
                          className="grid h-7 w-7 place-items-center rounded-full bg-[var(--well)]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted)] font-semibold">Diskon</span>
              <div className="flex gap-1">
                {[0, 5, 10, 15].map((d) => (
                  <button key={d} onClick={() => setDiscountPct(d)} className="chip !min-h-7 !px-2.5" data-active={discountPct === d}>
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--surface)] p-3 text-xs space-y-1">
              <div className="flex justify-between text-[var(--muted)]"><span>Subtotal</span><span>{formatIDR(totals.subtotal)}</span></div>
              {totals.discount > 0 && <div className="flex justify-between text-[var(--good)]"><span>Diskon</span><span>-{formatIDR(totals.discount)}</span></div>}
              <div className="flex justify-between text-[var(--muted)]"><span>Service (5%)</span><span>{formatIDR(totals.service)}</span></div>
              <div className="flex justify-between text-[var(--muted)]"><span>PB1 (10%)</span><span>{formatIDR(totals.tax)}</span></div>
              {totals.rounding !== 0 && <div className="flex justify-between text-[var(--muted)]"><span>Pembulatan</span><span>{formatIDR(totals.rounding)}</span></div>}
              <div className="flex justify-between border-t border-[var(--line)] pt-2 text-base font-bold">
                <span>Total</span><span>{formatIDR(totals.grandTotal)}</span>
              </div>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => {
                setCartOpen(false);
                setCashGiven(String(totals.grandTotal));
                setPayModal(true);
              }}
              className="btn-cadra btn-cadra--primary w-full"
            >
              Bayar · {formatIDR(totals.grandTotal)}
            </button>
          </aside>

          {!cartOpen && (
            <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
              <button
                onClick={() => setCartOpen(true)}
                className="flex w-full items-center justify-between rounded-2xl bg-[var(--ink)] px-4 py-3 text-[var(--on-ink)] shadow-2xl"
              >
                <div className="text-left leading-tight">
                  <div className="text-[11px] opacity-75">{cart.reduce((s, i) => s + i.qty, 0)} item · {orderType === "DINE_IN" ? tableName : orderType}</div>
                  <div className="text-base font-bold">{formatIDR(totals.grandTotal)}</div>
                </div>
                <span className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--on-accent)]">
                  Lihat Pesanan
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KDS */}
      {tab === "kds" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {state.tickets.map((t) => (
            <div key={t.id} className="cadra-card flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">{t.tableName}</div>
                    <div className="text-xs text-[var(--muted)]">{t.orderNo} · {t.station}</div>
                  </div>
                  <span className={`spill ${t.status === "READY" ? "spill--good" : t.status === "PREPARING" ? "spill--warn" : "spill--bad"}`}>
                    {t.status}
                  </span>
                </div>
                <div className="rounded-2xl bg-[var(--surface)] p-2.5 text-xs space-y-1.5">
                  {t.items.map((it, i) => (
                    <div key={i}>
                      <b>{it.qty}× {it.name}</b>
                      {it.mods.length > 0 && <div className="text-[var(--primary-ink)]">+ {it.mods.join(", ")}</div>}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  const next = t.status === "NEW" ? "PREPARING" : t.status === "PREPARING" ? "READY" : t.status === "READY" ? "BUMPED" : "NEW";
                  setState((s) => ({ ...s, tickets: s.tickets.map((x) => (x.id === t.id ? { ...x, status: next } : x)) }));
                }}
                className="btn-cadra btn-cadra--accent w-full"
              >
                {t.status === "NEW" ? "Mulai Proses" : t.status === "PREPARING" ? "Tandai Siap" : t.status === "READY" ? "Bump Selesai" : "Recall"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: DASHBOARD */}
      {tab === "dashboard" && (
        <div className="space-y-4">
          <dl className="cadra-kpis">
            <div className="cadra-stat">
              <dt className="text-xs font-semibold opacity-80">Penjualan Hari Ini</dt>
              <dd className="text-2xl font-bold">{formatIDR(todaySales)}</dd>
              <span className="text-xs opacity-75">{state.orders.length} transaksi selesai</span>
            </div>
            <div className="cadra-stat">
              <dt className="text-xs font-semibold opacity-80">Rata-rata Bill</dt>
              <dd className="text-2xl font-bold">{formatIDR(state.orders.length ? todaySales / state.orders.length : 0)}</dd>
              <span className="text-xs opacity-80">PB1 10% + Service 5%</span>
            </div>
            <div className="cadra-stat">
              <dt className="text-xs font-semibold text-[var(--muted)]">Shift Kasir</dt>
              <dd className="text-2xl font-bold">{state.shift.cashier}</dd>
              <span className="text-xs text-[var(--muted)]">Modal {formatIDR(state.shift.openingCash)}</span>
            </div>
            <div className="cadra-stat">
              <dt className="text-xs font-semibold text-[var(--muted)]">Stok Kritis</dt>
              <dd className="text-2xl font-bold">{lowStockCount} bahan</dd>
              <span className="text-xs text-[var(--muted)]">Di bawah batas minimum</span>
            </div>
          </dl>

          <section className="cadra-card overflow-x-auto">
            <h3 className="mb-3 text-sm font-bold">Riwayat Transaksi Terbaru</h3>
            <table className="w-full min-w-[540px] text-left text-xs">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr>
                  <th className="py-2">No. Struk</th>
                  <th className="py-2">Meja / Tipe</th>
                  <th className="py-2">Metode</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {state.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5 font-bold">{o.receiptNo}</td>
                    <td className="py-2.5">{o.tableName}</td>
                    <td className="py-2.5"><span className={`spill ${o.offline ? "spill--warn" : "spill--good"}`}>{o.paymentMethod}</span></td>
                    <td className="py-2.5 text-right font-bold">{formatIDR(o.grandTotal)}</td>
                    <td className="py-2.5 text-right">
                      <button onClick={() => setReceipt(o)} className="text-[var(--primary-ink)] font-bold hover:underline">Lihat Struk</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {/* TAB 4: TABLES */}
      {tab === "tables" && (
        <div className="cadra-card grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {state.tables.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setState((s) => ({
                  ...s,
                  tables: s.tables.map((x) => (x.id === t.id ? { ...x, status: x.status === "AVAILABLE" ? "OCCUPIED" : "AVAILABLE" } : x)),
                }));
              }}
              className={`rounded-2xl border p-4 text-left ${
                t.status === "AVAILABLE" ? "border-[var(--line)] bg-[var(--surface)]" : "border-amber-500/50 bg-amber-500/10"
              }`}
            >
              <div className="flex justify-between items-center">
                <b className="text-sm">{t.name}</b>
                <span className={`spill ${t.status === "AVAILABLE" ? "spill--good" : "spill--warn"}`}>
                  {t.status === "AVAILABLE" ? "Kosong" : "Terisi"}
                </span>
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">{t.area} · {t.capacity} kursi</div>
              <div className="mt-2 text-[10px] text-[var(--muted)]">Klik untuk toggle status</div>
            </button>
          ))}
        </div>
      )}

      {/* TAB 5: STOCK & HPP */}
      {tab === "stock" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="cadra-card overflow-x-auto">
            <h3 className="mb-3 text-sm font-bold">Stok Bahan Baku (Otomatis Berkurang saat Transaksi)</h3>
            <table className="w-full min-w-[540px] text-left text-xs">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr><th className="py-2">Bahan</th><th className="py-2 text-right">Stok</th><th className="py-2 text-right">Min</th><th className="py-2 text-right">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {state.ingredients.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2.5 font-semibold">{i.name}</td>
                    <td className="py-2.5 text-right font-bold">{i.stock} {i.unit}</td>
                    <td className="py-2.5 text-right text-[var(--muted)]">{i.minStock} {i.unit}</td>
                    <td className="py-2.5 text-right">
                      <span className={`spill ${i.stock <= i.minStock ? "spill--warn" : "spill--good"}`}>
                        {i.stock <= i.minStock ? "Kritis" : "Aman"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="cadra-card overflow-x-auto">
            <h3 className="mb-3 text-sm font-bold">HPP &amp; Margin per Menu</h3>
            <table className="w-full min-w-[540px] text-left text-xs">
              <thead className="border-b border-[var(--line)] text-[var(--muted)]">
                <tr><th className="py-2">Menu</th><th className="py-2 text-right">Harga</th><th className="py-2 text-right">HPP</th><th className="py-2 text-right">Margin</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {state.products.map((p) => {
                  const pct = (((p.price - p.hpp) / p.price) * 100).toFixed(1);
                  return (
                    <tr key={p.id}>
                      <td className="py-2.5 font-semibold">{p.name}</td>
                      <td className="py-2.5 text-right font-bold">{formatIDR(p.price)}</td>
                      <td className="py-2.5 text-right text-[var(--muted)]">{formatIDR(p.hpp)}</td>
                      <td className="py-2.5 text-right font-bold text-[var(--good)]">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {/* TAB 6: RBAC DINAMIS */}
      {tab === "rbac" && (
        <section className="cadra-card overflow-x-auto space-y-3">
          <div>
            <h3 className="text-sm font-bold">Matriks RBAC Dinamis (Coba Toggle &amp; Ganti Role di Pojok Kanan Atas)</h3>
            <p className="text-xs text-[var(--muted)]">Setiap perubahan langsung memengaruhi tab &amp; akses role tersebut secara realtime.</p>
          </div>
          <table className="w-full min-w-[540px] text-left text-xs">
            <thead className="border-b border-[var(--line)] text-[var(--muted)]">
              <tr>
                <th className="py-2">Permission</th>
                {roles.map((r) => (
                  <th key={r.code} className="py-2 text-center">{r.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {PROTO_PERMISSIONS.map((p) => (
                <tr key={p.code}>
                  <td className="py-2.5">
                    <div className="font-semibold">{p.label}</div>
                    <div className="font-mono text-[10px] text-[var(--muted)]">{p.code}</div>
                  </td>
                  {roles.map((r) => {
                    const checked = r.permissions.includes(p.code);
                    const locked = r.code === "OWNER" && p.code === "role.manage";
                    return (
                      <td key={r.code} className="py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={() => toggleRolePerm(r.code, p.code)}
                          className="h-4 w-4 cursor-pointer accent-[var(--ink)]"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Modifier Modal */}
      {modModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setModModal(null)}>
          <div className="w-full max-w-sm rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">{modModal.name} — Pilih Modifier</h3>
              <button onClick={() => setModModal(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {modModal.modifiers?.map((m) => {
                const active = chosenMods.includes(m.name);
                return (
                  <button
                    key={m.name}
                    onClick={() => setChosenMods((prev) => (active ? prev.filter((x) => x !== m.name) : [...prev, m.name]))}
                    className="chip"
                    data-active={active}
                  >
                    {m.name} {m.price > 0 ? `+${formatIDR(m.price)}` : ""}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                const mods = (modModal.modifiers ?? []).filter((m) => chosenMods.includes(m.name));
                addToCart(modModal, mods);
                setModModal(null);
              }}
              className="btn-cadra btn-cadra--primary w-full"
            >
              Tambah ke Keranjang
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setPayModal(false)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">Pembayaran · {formatIDR(totals.grandTotal)}</h3>
              <button onClick={() => setPayModal(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {([
                ["TUNAI", Banknote],
                ["QRIS (Manual)", QrCode],
                ["EDC", CreditCard],
              ] as const).map(([m, Icon]) => (
                <button
                  key={m}
                  disabled={offlineSim && m !== "TUNAI"}
                  onClick={() => setPayMethod(m)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-xs font-bold ${
                    payMethod === m ? "bg-[var(--ink)] text-[var(--on-ink)]" : "bg-[var(--surface)] border-[var(--line)]"
                  } disabled:opacity-40`}
                >
                  <Icon className="h-4 w-4" />
                  {m}
                </button>
              ))}
            </div>
            {payMethod === "TUNAI" && (
              <div className="space-y-2">
                <input type="number" className="cadra-input text-base font-bold" value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} />
                <div className="flex justify-between rounded-2xl bg-emerald-500/10 px-3.5 py-2.5 text-xs">
                  <span>Kembalian</span>
                  <b className="text-base text-[var(--good)]">{formatIDR(Math.max(0, (Number(cashGiven) || 0) - totals.grandTotal))}</b>
                </div>
              </div>
            )}
            <button onClick={handleCheckout} className="btn-cadra btn-cadra--primary w-full">
              Selesaikan &amp; Cetak Struk
            </button>
          </div>
        </div>
      )}

      {/* Serrated Thermal Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setReceipt(null)}>
          <div className="flex max-h-[92dvh] w-full max-w-md flex-col rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex justify-between items-center">
              <h3 className="font-bold text-sm">Struk Thermal ({receipt.receiptNo})</h3>
              <button onClick={() => setReceipt(null)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup"><X className="h-4 w-4" /></button>
            </div>
            <div className="pr-slot" />
            <div className="pr-paper printable-receipt max-h-[60vh] overflow-y-auto">
              <div className="text-center font-bold tracking-widest">KOPI &amp; DAPUR SENJA</div>
              <div className="text-center text-[11px] text-[var(--muted)]">Prototype Thermal Receipt 80mm</div>
              <hr />
              <div className="flex justify-between"><span>Struk</span><b>{receipt.receiptNo}</b></div>
              <div className="flex justify-between"><span>Meja</span><span>{receipt.tableName}</span></div>
              <hr />
              {receipt.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.qty}× {it.name} {it.mods.length ? `(${it.mods.join(", ")})` : ""}</span>
                  <b>{formatIDR(it.lineTotal)}</b>
                </div>
              ))}
              <hr />
              <div className="flex justify-between"><span>Subtotal</span><span>{formatIDR(receipt.subtotal)}</span></div>
              <div className="flex justify-between"><span>Service 5%</span><span>{formatIDR(receipt.service)}</span></div>
              <div className="flex justify-between"><span>PB1 10%</span><span>{formatIDR(receipt.tax)}</span></div>
              <div className="flex justify-between text-sm font-bold mt-1"><span>TOTAL</span><span>{formatIDR(receipt.grandTotal)}</span></div>
              <div className="flex justify-between text-[11px]"><span>{receipt.paymentMethod}</span><span>{formatIDR(receipt.paidAmount)}</span></div>
              {receipt.changeAmt > 0 && <div className="flex justify-between text-[11px]"><span>Kembalian</span><span>{formatIDR(receipt.changeAmt)}</span></div>}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setReceipt(null)} className="btn-cadra btn-cadra--ghost">Tutup</button>
              <button onClick={() => window.print()} className="btn-cadra btn-cadra--primary"><Printer className="h-4 w-4" /> Cetak</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:top-auto sm:left-auto sm:bottom-5 sm:right-5 z-50 mx-auto sm:mx-0 max-w-sm rounded-2xl sm:rounded-full bg-[var(--ink)] px-4 py-2.5 text-center text-xs font-bold text-[var(--on-ink)] shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
