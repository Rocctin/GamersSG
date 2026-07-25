"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Search, Trash2, Users, Shield, UserMinus } from "lucide-react";

interface TeamMember {
  userId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  role: string;
  joinedAt: string;
  leftAt?: string;
}

interface TeamRow {
  id: string;
  name: string;
  tag: string;
  description?: string;
  status: string;
  memberCount: number;
  members?: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  DISBANDED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function AdminTeamsTable() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const fetchTeams = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await apiClient.get("/admin/teams", { params });
      setTeams(data.data ?? []);
      setMeta(data.meta ?? { total: 0, page: 1, totalPages: 1 });
    } catch {
      toast.error("Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchTeams(1); };

  const handleHardDelete = async () => {
    if (!deleteModal || !deleteReason.trim()) return;
    setActionLoading(deleteModal.id);
    try {
      await apiClient.delete(`/admin/teams/${deleteModal.id}`, { data: { reason: deleteReason } });
      toast.success(`Team "${deleteModal.name}" permanently deleted`);
      setDeleteModal(null);
      setDeleteReason("");
      fetchTeams(meta.page);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to delete team");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisband = async (team: TeamRow) => {
    if (!confirm(`Disband team "${team.name}"? Members will be removed and the team will be marked as disbanded.`)) return;
    setActionLoading(team.id);
    try {
      await apiClient.delete(`/teams/${team.id}`);
      toast.success(`Team "${team.name}" disbanded`);
      fetchTeams(meta.page);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to disband team");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (teamId: string, memberUserId: string, username: string) => {
    if (!confirm(`Remove ${username || memberUserId} from the team?`)) return;
    setActionLoading(memberUserId);
    try {
      await apiClient.delete(`/admin/teams/${teamId}/members/${memberUserId}`);
      toast.success("Member removed");
      fetchTeams(meta.page);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to remove member");
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
            placeholder="Search teams by name..."
            className="w-full pl-10 pr-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchTeams(1); }}
          className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DISBANDED">Disbanded</option>
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
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Team</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Tag</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Members</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Created</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <>
                    <tr key={team.id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <button onClick={() => setExpandedId(expandedId === team.id ? null : team.id)} className="text-slate-200 hover:text-brand-400 font-medium text-left">
                          {team.name}
                        </button>
                      </td>
                      <td className="py-3 px-4"><code className="text-xs text-slate-400 font-mono">{team.tag}</code></td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${STATUS_COLORS[team.status] || "bg-surface-800 text-slate-400 border-surface-700"}`}>
                          {team.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{team.memberCount}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{new Date(team.createdAt).toLocaleDateString("en-SG")}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {team.status === "ACTIVE" && (
                            <button onClick={() => handleDisband(team)} disabled={actionLoading === team.id}
                              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50" title="Disband">
                              <Users className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => setDeleteModal({ id: team.id, name: team.name })} disabled={actionLoading === team.id}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50" title="Hard Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded members row */}
                    {expandedId === team.id && team.members && (
                      <tr key={`${team.id}-members`} className="bg-surface-800/30">
                        <td colSpan={6} className="px-6 py-3">
                          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Roster</p>
                          {team.members.map((m) => (
                            <div key={m.userId} className="flex items-center justify-between py-1.5 border-b border-surface-800/50 last:border-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-200">{m.displayName || m.username || "Unknown"}</span>
                                <span className={`inline-flex rounded-full px-1.5 py-0 text-xs border ${m.role === "CAPTAIN" ? "bg-brand-500/10 text-brand-400 border-brand-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                                  {m.role}
                                </span>
                              </div>
                              <button onClick={() => handleRemoveMember(team.id, m.userId, m.displayName || m.username || "")}
                                disabled={actionLoading === m.userId}
                                className="p-1 rounded text-slate-400 hover:text-red-400 disabled:opacity-50 transition-colors" title="Remove member">
                                <UserMinus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          {(!team.members || team.members.length === 0) && (
                            <p className="text-sm text-slate-500">No active members.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {teams.length === 0 && (
            <div className="text-center py-12"><p className="text-slate-500 text-sm">No teams found.</p></div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-800">
              <p className="text-xs text-slate-500">Showing page {meta.page} of {meta.totalPages} ({meta.total} total teams)</p>
              <div className="flex gap-2">
                <button onClick={() => fetchTeams(meta.page - 1)} disabled={meta.page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-surface-800 text-sm text-slate-300 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                <button onClick={() => fetchTeams(meta.page + 1)} disabled={meta.page >= meta.totalPages}
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
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Permanently Delete Team</h3>
            <p className="text-sm text-slate-400 mb-1">This action is irreversible.</p>
            <p className="text-sm font-medium text-red-400 mb-4">Team: {deleteModal.name}</p>
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
