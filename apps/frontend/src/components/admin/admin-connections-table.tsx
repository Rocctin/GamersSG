"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Search, Trash2, UserX } from "lucide-react";

interface ConnectionUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

interface ConnectionRow {
  id: string;
  status: string;
  requester: ConnectionUser;
  addressee: ConnectionUser;
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACCEPTED: "bg-green-500/10 text-green-400 border-green-500/20",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function AdminConnectionsTable() {
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchConnections = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await apiClient.get("/admin/connections", { params });
      setConnections(data.data ?? []);
      setMeta(data.meta ?? { total: 0, page: 1, totalPages: 1 });
    } catch {
      toast.error("Failed to load connections");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchConnections(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchConnections(1); };

  const handleRemove = async (connection: ConnectionRow) => {
    if (!confirm(`Remove connection between ${connection.requester.displayName || connection.requester.username} and ${connection.addressee.displayName || connection.addressee.username}?`)) return;
    setActionLoading(connection.id);
    try {
      await apiClient.delete(`/admin/connections/${connection.id}`);
      toast.success("Connection removed");
      fetchConnections(meta.page);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to remove connection");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username..."
            className="w-full pl-10 pr-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchConnections(1); }}
          className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">
          Search
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-slate-400 animate-spin" /></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Requester</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Addressee</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Created</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((conn) => (
                  <tr key={conn.id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-slate-200">{conn.requester.displayName || conn.requester.username}</span>
                      <span className="text-slate-500 text-xs ml-1.5">@{conn.requester.username}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-200">{conn.addressee.displayName || conn.addressee.username}</span>
                      <span className="text-slate-500 text-xs ml-1.5">@{conn.addressee.username}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${STATUS_COLORS[conn.status] || "bg-surface-800 text-slate-400 border-surface-700"}`}>
                        {conn.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{new Date(conn.createdAt).toLocaleDateString("en-SG")}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleRemove(conn)} disabled={actionLoading === conn.id}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50" title="Remove Connection">
                          {actionLoading === conn.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {connections.length === 0 && (
            <div className="text-center py-12"><p className="text-slate-500 text-sm">No connections found.</p></div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-800">
              <p className="text-xs text-slate-500">Showing page {meta.page} of {meta.totalPages} ({meta.total} total connections)</p>
              <div className="flex gap-2">
                <button onClick={() => fetchConnections(meta.page - 1)} disabled={meta.page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-surface-800 text-sm text-slate-300 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                <button onClick={() => fetchConnections(meta.page + 1)} disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1.5 rounded-lg bg-surface-800 text-sm text-slate-300 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
