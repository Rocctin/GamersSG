"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Search, Trash2, Ban } from "lucide-react";

interface TournamentRow {
  id: string;
  name: string;
  description?: string;
  status: string;
  tournamentStart: string;
  tournamentEnd?: string;
  game?: { id: string; name: string };
  organiser?: { id: string; email: string; organiserProfile?: { organisationName?: string } };
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  APPROVED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  ONGOING: "bg-green-500/10 text-green-400 border-green-500/20",
  COMPLETED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CANCELLED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export function AdminTournamentsTable() {
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const fetchTournaments = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await apiClient.get("/admin/tournaments", { params });
      setTournaments(data.data ?? []);
      setMeta(data.meta ?? { total: 0, page: 1, totalPages: 1 });
    } catch {
      toast.error("Failed to load tournaments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTournaments(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchTournaments(1); };

  const handleCancel = async (tournament: TournamentRow) => {
    if (!confirm(`Cancel tournament "${tournament.name}"?`)) return;
    setActionLoading(tournament.id);
    try {
      await apiClient.post(`/admin/tournaments/${tournament.id}/status`, { status: "CANCELLED" });
      toast.success(`Tournament "${tournament.name}" cancelled`);
      fetchTournaments(meta.page);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to cancel");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHardDelete = async () => {
    if (!deleteModal || !deleteReason.trim()) return;
    setActionLoading(deleteModal.id);
    try {
      await apiClient.delete(`/admin/tournaments/${deleteModal.id}`, { data: { reason: deleteReason } });
      toast.success(`Tournament "${deleteModal.name}" permanently deleted`);
      setDeleteModal(null);
      setDeleteReason("");
      fetchTournaments(meta.page);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to delete tournament");
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
            placeholder="Search tournaments by name..."
            className="w-full pl-10 pr-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchTournaments(1); }}
          className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
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
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Organiser</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Game</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Start Date</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr key={t.id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-slate-200 font-medium">{t.name}</span>
                      {t.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-sm">{t.organiser?.organiserProfile?.organisationName || t.organiser?.email || "—"}</td>
                    <td className="py-3 px-4 text-slate-400 text-sm">{t.game?.name || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${STATUS_COLORS[t.status] || "bg-surface-800 text-slate-400 border-surface-700"}`}>
                        {t.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{new Date(t.tournamentStart).toLocaleDateString("en-SG")}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {(t.status === "APPROVED" || t.status === "ONGOING") && (
                          <button onClick={() => handleCancel(t)} disabled={actionLoading === t.id}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50" title="Cancel">
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => setDeleteModal({ id: t.id, name: t.name })} disabled={actionLoading === t.id}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50" title="Hard Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tournaments.length === 0 && (
            <div className="text-center py-12"><p className="text-slate-500 text-sm">No tournaments found.</p></div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-800">
              <p className="text-xs text-slate-500">Showing page {meta.page} of {meta.totalPages} ({meta.total} total tournaments)</p>
              <div className="flex gap-2">
                <button onClick={() => fetchTournaments(meta.page - 1)} disabled={meta.page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-surface-800 text-sm text-slate-300 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                <button onClick={() => fetchTournaments(meta.page + 1)} disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1.5 rounded-lg bg-surface-800 text-sm text-slate-300 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
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
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Permanently Delete Tournament</h3>
            <p className="text-sm text-slate-400 mb-1">This action is irreversible.</p>
            <p className="text-sm font-medium text-red-400 mb-4">Tournament: {deleteModal.name}</p>
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
