"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Search, Ban, UserCheck, ArrowUpDown, Trash2 } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  username?: string;
  organisationName?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-green-500/10 text-green-400 border-green-500/20",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const ROLE_COLORS: Record<string, string> = {
  GAMER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ORGANISER: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  ADMIN: "bg-brand-500/10 text-brand-500 border-brand-500/20",
};

export function UserManagementTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ id: string; email: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await apiClient.get("/admin/users", { params });
      setUsers(data.data ?? []);
      setMeta(data.meta ?? { total: 0, page: 1, totalPages: 1 });
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleStatusUpdate = async (
    userId: string,
    status: "SUSPENDED" | "APPROVED",
  ) => {
    setActionLoading(userId);
    try {
      const reason =
        status === "SUSPENDED"
          ? (prompt("Reason for suspension:") || undefined)
          : undefined;
      await apiClient.post(`/admin/users/${userId}/status`, { status, reason });
      toast.success(`User ${status === "SUSPENDED" ? "suspended" : "reinstated"}`);
      fetchUsers(meta.page);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Failed to update user status",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    setActionLoading(userId);
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role changed to ${newRole}`);
      fetchUsers(meta.page);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to change role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHardDelete = async () => {
    if (!deleteModal || !deleteReason.trim()) return;
    setActionLoading(deleteModal.id);
    try {
      await apiClient.delete(`/admin/users/${deleteModal.id}`, { data: { reason: deleteReason } });
      toast.success(`User "${deleteModal.email}" permanently deleted`);
      setDeleteModal(null);
      setDeleteReason("");
      fetchUsers(meta.page);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Search + Filters */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-10 pr-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); fetchUsers(1); }}
          className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Roles</option>
          <option value="GAMER">Gamer</option>
          <option value="ORGANISER">Organiser</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); fetchUsers(1); }}
          className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING">Pending</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
          Search
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Joined
                  </th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="text-slate-200">{user.email}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {user.username ||
                          user.organisationName ||
                          "No profile"}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${ROLE_COLORS[user.role] || "bg-surface-800 text-slate-400 border-surface-700"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${STATUS_COLORS[user.status] || "bg-surface-800 text-slate-400 border-surface-700"}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString("en-SG")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Role change (only for non-admin users) */}
                        {user.role !== "ADMIN" && (
                          <button
                            onClick={() =>
                              handleRoleChange(
                                user.id,
                                user.role === "GAMER" ? "ORGANISER" : "GAMER"
                              )
                            }
                            disabled={actionLoading === user.id}
                            className="p-1.5 rounded-lg bg-surface-800 text-slate-400 hover:bg-surface-700 hover:text-slate-200 transition-colors disabled:opacity-50"
                            title={`Change role to ${user.role === "GAMER" ? "ORGANISER" : "GAMER"}`}
                          >
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Suspend / Reinstate */}
                        {user.status === "SUSPENDED" ? (
                          <button
                            onClick={() =>
                              handleStatusUpdate(user.id, "APPROVED")
                            }
                            disabled={actionLoading === user.id}
                            className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                            title="Reinstate"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleStatusUpdate(user.id, "SUSPENDED")
                            }
                            disabled={
                              actionLoading === user.id || user.role === "ADMIN"
                            }
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title={
                              user.role === "ADMIN"
                                ? "Cannot suspend admin accounts"
                                : "Suspend user"
                            }
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Hard Delete (only for non-admin users) */}
                        {user.role !== "ADMIN" && (
                          <button
                            onClick={() => setDeleteModal({ id: user.id, email: user.email })}
                            disabled={actionLoading === user.id}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="Permanently delete user"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No users found.</p>
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-800">
              <p className="text-xs text-slate-500">
                Showing page {meta.page} of {meta.totalPages} ({meta.total}{" "}
                total users)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUsers(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-surface-800 text-sm text-slate-300 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchUsers(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1.5 rounded-lg bg-surface-800 text-sm text-slate-300 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setDeleteModal(null); setDeleteReason(""); }} />
          <div className="relative bg-surface-900 border border-surface-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Permanently Delete User</h3>
            <p className="text-sm text-slate-400 mb-1">This action is irreversible. All user data will be removed.</p>
            <p className="text-sm font-medium text-red-400 mb-4">User: {deleteModal.email}</p>
            <textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Reason for deletion..."
              rows={3}
              className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-vertical mb-4" />
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => { setDeleteModal(null); setDeleteReason(""); }} disabled={actionLoading === deleteModal.id}
                className="text-sm font-medium text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg border border-surface-700 hover:border-surface-600 transition-colors">Cancel</button>
              <button onClick={handleHardDelete} disabled={actionLoading === deleteModal.id || !deleteReason.trim()}
                className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors">
                {actionLoading === deleteModal.id ? <Loader2 className="h-4 w-4 animate-spin inline" /> : null} Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
