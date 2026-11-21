"use client";

import { useQuery } from "@tanstack/react-query";
import { formatIDR } from "@pos/shared";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";

interface ShiftRow {
  id: number;
  status: string;
  openingCash: number;
  expectedCash: number;
  actualCash: number | null;
  difference: number | null;
  openedAt: string;
  closedAt: string | null;
  user: { name: string };
  _count: { orders: number };
}

export default function AdminShiftsPage() {
  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts"],
    queryFn: () => apiFetch<ShiftRow[]>("/shifts"),
  });

  return (
    <CadraShell title="Riwayat Shift & Z-Report" crumb="Shift & Kas">
      <div className="cadra-card overflow-x-auto">
        <table className="cadra-table">
          <thead className="border-b border-[var(--line)] text-[var(--muted)]">
            <tr>
              <th className="py-2.5">Shift</th>
              <th className="py-2.5">Kasir</th>
              <th className="py-2.5">Status</th>
              <th className="py-2.5 text-right">Order</th>
              <th className="py-2.5 text-right">Modal Awal</th>
              <th className="py-2.5 text-right">Expected Cash</th>
              <th className="py-2.5 text-right">Aktual</th>
              <th className="py-2.5 text-right">Selisih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {shifts.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-[var(--muted)]">Belum ada riwayat shift.</td></tr>
            ) : (
              shifts.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 font-semibold">#{s.id} · {new Date(s.openedAt).toLocaleString("id-ID")}</td>
                  <td className="py-3">{s.user.name}</td>
                  <td className="py-3">
                    <span className={`spill ${s.status === "OPEN" ? "spill--good" : "spill--slate"}`}>{s.status}</span>
                  </td>
                  <td className="py-3 text-right">{s._count.orders}</td>
                  <td className="py-3 text-right">{formatIDR(s.openingCash)}</td>
                  <td className="py-3 text-right">{formatIDR(s.expectedCash)}</td>
                  <td className="py-3 text-right">{s.actualCash !== null ? formatIDR(s.actualCash) : "-"}</td>
                  <td className={`py-3 text-right font-bold whitespace-nowrap ${(s.difference ?? 0) < 0 ? "text-[var(--bad)]" : "text-[var(--good)]"}`}>
                    {s.difference !== null ? formatIDR(s.difference) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </CadraShell>
  );
}
