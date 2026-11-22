"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Shield, Trash2, UserPlus, Users, X } from "lucide-react";
import { CadraShell } from "@/components/cadra-shell";
import { apiFetch } from "@/lib/api";
import { useUiStore } from "@/stores/ui-store";

interface PermissionItem {
  id: number;
  code: string;
  group: string;
  label: string;
  description: string;
}

interface RoleItem {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
}

interface StaffItem {
  id: number;
  name: string;
  email: string;
  hasPin: boolean;
  isActive: boolean;
  roleId: number;
  roleCode: string;
  roleName: string;
}

export default function AdminRbacPage() {
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [tab, setTab] = useState<"roles" | "users">("roles");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);

  const [newRole, setNewRole] = useState({ code: "", name: "", description: "" });
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", pin: "", roleId: "" });
  const [editUser, setEditUser] = useState<{
    id: number;
    name: string;
    email: string;
    password: string;
    pin: string;
    roleId: string;
  } | null>(null);

  const { data: permissions = [] } = useQuery({
    queryKey: ["rbac-permissions"],
    queryFn: () => apiFetch<PermissionItem[]>("/rbac/permissions"),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["rbac-roles"],
    queryFn: () => apiFetch<RoleItem[]>("/rbac/roles"),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["rbac-users"],
    queryFn: () => apiFetch<StaffItem[]>("/rbac/users"),
  });

  const activeRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? roles[0] ?? null,
    [roles, selectedRoleId],
  );

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    for (const p of permissions) {
      const list = map.get(p.group) ?? [];
      list.push(p);
      map.set(p.group, list);
    }
    return [...map.entries()];
  }, [permissions]);

  const updateRolePermsMut = useMutation({
    mutationFn: ({ id, permissions: nextPerms }: { id: number; permissions: string[] }) =>
      apiFetch(`/rbac/roles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: nextPerms }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rbac-roles"] });
      pushToast("Hak akses role diperbarui secara langsung (live)", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const createRoleMut = useMutation({
    mutationFn: () =>
      apiFetch("/rbac/roles", {
        method: "POST",
        body: JSON.stringify({
          code: newRole.code.trim().toUpperCase().replace(/\s+/g, "_"),
          name: newRole.name.trim(),
          description: newRole.description.trim() || undefined,
          permissions: ["pos.access"],
        }),
      }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["rbac-roles"] });
      setRoleModalOpen(false);
      setNewRole({ code: "", name: "", description: "" });
      setSelectedRoleId((created as RoleItem).id);
      pushToast("Role kustom berhasil dibuat", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const deleteRoleMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/rbac/roles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rbac-roles"] });
      setSelectedRoleId(null);
      pushToast("Role kustom dihapus", "warn");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const createUserMut = useMutation({
    mutationFn: () =>
      apiFetch("/rbac/users", {
        method: "POST",
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          pin: newUser.pin.trim() || undefined,
          roleId: Number(newUser.roleId || roles[0]?.id),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rbac-users"] });
      qc.invalidateQueries({ queryKey: ["rbac-roles"] });
      setUserModalOpen(false);
      setNewUser({ name: "", email: "", password: "", pin: "", roleId: "" });
      pushToast("Staf baru berhasil ditambahkan", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const updateUserMut = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { name?: string; email?: string; password?: string; pin?: string | null; roleId?: number; isActive?: boolean };
    }) => apiFetch(`/rbac/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rbac-users"] });
      qc.invalidateQueries({ queryKey: ["rbac-roles"] });
      setEditUser(null);
      pushToast("Data akun berhasil diperbarui", "good");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const deleteUserMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/rbac/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rbac-users"] });
      qc.invalidateQueries({ queryKey: ["rbac-roles"] });
      pushToast("Akun berhasil dihapus", "warn");
    },
    onError: (e: Error) => pushToast(e.message, "bad"),
  });

  const togglePermission = (code: string) => {
    if (!activeRole) return;
    const has = activeRole.permissions.includes(code);
    const next = has
      ? activeRole.permissions.filter((p) => p !== code)
      : [...activeRole.permissions, code];
    updateRolePermsMut.mutate({ id: activeRole.id, permissions: next });
  };

  return (
    <CadraShell
      title="RBAC Dinamis & Staf"
      crumb="Hak Akses & Peran"
      rightSlot={
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setTab("roles")} className="chip" data-active={tab === "roles"}>
            <Shield className="h-3.5 w-3.5" />
            Role &amp; Matriks Permission
          </button>
          <button onClick={() => setTab("users")} className="chip" data-active={tab === "users"}>
            <Users className="h-3.5 w-3.5" />
            Daftar Staf ({users.length})
          </button>
          {tab === "roles" ? (
            <button onClick={() => setRoleModalOpen(true)} className="btn-cadra btn-cadra--primary">
              <Plus className="h-4 w-4" />
              Role Baru
            </button>
          ) : (
            <button onClick={() => setUserModalOpen(true)} className="btn-cadra btn-cadra--primary">
              <UserPlus className="h-4 w-4" />
              Tambah Staf
            </button>
          )}
        </div>
      }
    >
      {tab === "roles" ? (
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
          {/* Left: Roles List */}
          <aside className="cadra-card space-y-2">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Daftar Role ({roles.length})
            </div>
            {roles.map((r) => {
              const selected = activeRole?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    selected
                      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]"
                      : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--iris)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-sm">{r.name}</b>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selected ? "bg-[var(--on-ink)]/15" : "bg-[var(--well)] text-[var(--muted)]"}`}>
                      {r.permissions.length} izin
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[11px] opacity-75">
                    <span>{r.code}</span>
                    <span>{r.userCount} staf</span>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Right: Dynamic Permission Matrix */}
          <section className="cadra-card space-y-5">
            {activeRole ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">{activeRole.name}</h2>
                      <span className="spill spill--iris">{activeRole.code}</span>
                      {activeRole.isSystem && <span className="spill spill--slate">Role Bawaan</span>}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {activeRole.description ?? "Perubahan permission langsung berlaku tanpa perlu restart server."}
                    </p>
                  </div>
                  {!activeRole.isSystem && (
                    <button
                      onClick={() => deleteRoleMut.mutate(activeRole.id)}
                      className="btn-cadra btn-cadra--danger !min-h-8 !px-3 !text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus Role
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  {groupedPermissions.map(([groupName, items]) => (
                    <div key={groupName} className="space-y-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{groupName}</h3>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {items.map((p) => {
                          const checked = activeRole.permissions.includes(p.code);
                          const locked =
                            activeRole.code === "OWNER" &&
                            ["role.manage", "user.manage", "settings.manage"].includes(p.code);
                          return (
                            <button
                              key={p.code}
                              type="button"
                              disabled={locked || updateRolePermsMut.isPending}
                              onClick={() => togglePermission(p.code)}
                              className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition ${
                                checked
                                  ? "border-[var(--iris)] bg-[var(--accent)]/25"
                                  : "border-[var(--line)] bg-[var(--surface)] opacity-75 hover:opacity-100"
                              } disabled:opacity-60`}
                            >
                              <span
                                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                                  checked
                                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--on-ink)]"
                                    : "border-[var(--line-2)] bg-transparent"
                                }`}
                              >
                                {checked && <Check className="h-3.5 w-3.5" />}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold leading-tight">{p.label}</div>
                                <div className="mt-0.5 text-[11px] text-[var(--muted)]">{p.description}</div>
                                <div className="mt-1 font-mono text-[10px] text-[var(--primary-ink)]">{p.code}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-xs text-[var(--muted)]">Memuat daftar role...</p>
            )}
          </section>
        </div>
      ) : (
        <section className="cadra-card overflow-x-auto">
          <table className="cadra-table">
            <thead className="border-b border-[var(--line)] text-[var(--muted)]">
              <tr>
                <th className="py-2.5">Nama Staf</th>
                <th className="py-2.5">Email</th>
                <th className="py-2.5">Role Dinamis</th>
                <th className="py-2.5">PIN Kasir</th>
                <th className="py-2.5 text-right">Status</th>
                <th className="py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 font-semibold text-sm">{u.name}</td>
                  <td className="py-3 text-[var(--muted)]">{u.email}</td>
                  <td className="py-3">
                    <select
                      className="cadra-input !min-h-8 !w-auto !py-1 text-xs font-semibold"
                      value={u.roleId}
                      onChange={(e) =>
                        updateUserMut.mutate({ id: u.id, payload: { roleId: Number(e.target.value) } })
                      }
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3">
                    <span className={`spill ${u.hasPin ? "spill--good" : "spill--slate"}`}>
                      {u.hasPin ? "PIN Aktif" : "Belum diset"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => updateUserMut.mutate({ id: u.id, payload: { isActive: !u.isActive } })}
                      className={`spill ${u.isActive ? "spill--good" : "spill--bad"}`}
                    >
                      <i />
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() =>
                          setEditUser({
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            password: "",
                            pin: "",
                            roleId: String(u.roleId),
                          })
                        }
                        className="grid h-8 w-8 place-items-center rounded-full hover:bg-[var(--well)]"
                        title="Edit Akun / Reset Password & PIN"
                        aria-label="Edit Akun"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus akun "${u.name}"?`)) deleteUserMut.mutate(u.id);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-full text-[var(--bad)] hover:bg-[var(--well)]"
                        title="Hapus Akun"
                        aria-label="Hapus Akun"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Modal Tambah Role Kustom */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setRoleModalOpen(false)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Buat Role Kustom Baru</h3>
              <button onClick={() => setRoleModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Kode Role (Kapital)</label>
              <input className="cadra-input" placeholder="SUPERVISOR_SHIFT" value={newRole.code} onChange={(e) => setNewRole({ ...newRole, code: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Role</label>
              <input className="cadra-input" placeholder="Supervisor Shift" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Deskripsi</label>
              <input className="cadra-input" placeholder="Bisa void & approval PIN tapi tidak ubah pengaturan" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
            </div>
            <button onClick={() => createRoleMut.mutate()} className="btn-cadra btn-cadra--primary w-full">Simpan Role Baru</button>
          </div>
        </div>
      )}

      {/* Modal Tambah Staf */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setUserModalOpen(false)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Tambah Staf Baru</h3>
              <button onClick={() => setUserModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Lengkap</label>
              <input className="cadra-input" placeholder="Sinta Dewi" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Email</label>
              <input type="email" className="cadra-input" placeholder="sinta@senja.id" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Password</label>
              <input type="password" className="cadra-input" placeholder="Minimal 6 karakter" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">PIN 6 Digit</label>
                <input className="cadra-input" maxLength={6} placeholder="345678" value={newUser.pin} onChange={(e) => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g, "") })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Role</label>
                <select className="cadra-input" value={newUser.roleId || roles[0]?.id || ""} onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })}>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => createUserMut.mutate()} className="btn-cadra btn-cadra--primary w-full">Simpan Staf</button>
          </div>
        </div>
      )}

      {/* Modal Edit Akun / Reset Password & PIN */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={() => setEditUser(null)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--rim)] bg-[var(--raised)] p-5 shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Edit Akun Staf</h3>
              <button onClick={() => setEditUser(null)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[var(--well)]" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Nama Lengkap</label>
              <input className="cadra-input" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Email</label>
              <input type="email" className="cadra-input" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Role</label>
              <select className="cadra-input" value={editUser.roleId} onChange={(e) => setEditUser({ ...editUser, roleId: e.target.value })}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">Password Baru (opsional)</label>
                <input type="password" className="cadra-input" placeholder="Kosongkan jika tetap" value={editUser.password} onChange={(e) => setEditUser({ ...editUser, password: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--muted)]">PIN Baru 6 Digit (opsional)</label>
                <input className="cadra-input" maxLength={6} placeholder="Kosongkan jika tetap" value={editUser.pin} onChange={(e) => setEditUser({ ...editUser, pin: e.target.value.replace(/\D/g, "") })} />
              </div>
            </div>
            <button
              onClick={() =>
                updateUserMut.mutate({
                  id: editUser.id,
                  payload: {
                    name: editUser.name.trim(),
                    email: editUser.email.trim(),
                    roleId: Number(editUser.roleId),
                    ...(editUser.password.trim() ? { password: editUser.password.trim() } : {}),
                    ...(editUser.pin.trim() ? { pin: editUser.pin.trim() } : {}),
                  },
                })
              }
              disabled={updateUserMut.isPending}
              className="btn-cadra btn-cadra--primary w-full"
            >
              Simpan Perubahan Akun
            </button>
          </div>
        </div>
      )}
    </CadraShell>
  );
}
