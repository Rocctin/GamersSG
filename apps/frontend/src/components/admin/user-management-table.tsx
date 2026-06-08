"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Search, Ban, UserCheck } from "lucide-react";

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize: 20 };
      if (search) params.search = search;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          ? prompt("Reason for suspension:")
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

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-10 pr-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
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
                      <div className="flex items-center justify-end gap-2">
                        {user.status === "SUSPENDED" ? (
                          <button
                            onClick={() =>
                              handleStatusUpdate(user.id, "APPROVED")
                            }
                            disabled={actionLoading === user.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Reinstate
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleStatusUpdate(user.id, "SUSPENDED")
                            }
                            disabled={
                              actionLoading === user.id || user.role === "ADMIN"
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title={
                              user.role === "ADMIN"
                                ? "Cannot suspend admin accounts"
                                : "Suspend user"
                            }
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
    </div>
  );
}
