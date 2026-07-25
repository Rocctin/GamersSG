"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ExternalLink,
  RotateCcw,
  Skull,
} from "lucide-react";

interface GameRow {
  id: string;
  name: string;
  slug: string;
  category?: string;
  coverImage?: string;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = [
  "FPS",
  "MOBA",
  "Battle Royale",
  "Fighting",
  "RPG",
  "Sports",
  "Sandbox",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  FPS: "bg-red-500/10 text-red-400 border-red-500/20",
  MOBA: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Battle Royale": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Fighting: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  RPG: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Sports: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Sandbox: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Other: "bg-surface-700 text-slate-400 border-surface-600",
};

export function AdminGamesTable() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

  // New game form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newCoverImage, setNewCoverImage] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCoverImage, setEditCoverImage] = useState("");

  // Hard delete modal state
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const fetchGames = async (page = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        pageSize: 25,
      };
      if (search) params.search = search;
      const { data } = await apiClient.get("/games", { params });
      setGames(data.data ?? []);
      setMeta(data.meta ?? { total: 0, page: 1, totalPages: 1 });
    } catch {
      toast.error("Failed to load games");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGames(1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setActionLoading("__create__");
    try {
      await apiClient.post("/games", {
        name: newName.trim(),
        category: newCategory || undefined,
        coverImage: newCoverImage.trim() || undefined,
      });
      toast.success(`Game "${newName}" created`);
      setNewName("");
      setNewCategory("");
      setNewCoverImage("");
      setShowAddForm(false);
      fetchGames(meta.page);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Failed to create game",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (game: GameRow) => {
    setEditingId(game.id);
    setEditName(game.name);
    setEditCategory(game.category ?? "");
    setEditCoverImage(game.coverImage ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditCategory("");
    setEditCoverImage("");
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;

    setActionLoading(id);
    try {
      await apiClient.put(`/games/${id}`, {
        name: editName.trim(),
        category: editCategory || undefined,
        coverImage: editCoverImage.trim() || undefined,
      });
      toast.success(`Game "${editName}" updated`);
      setEditingId(null);
      fetchGames(meta.page);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Failed to update game",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (game: GameRow) => {
    if (!confirm(`Deactivate "${game.name}"? It will still appear on existing profiles.`)) {
      return;
    }

    setActionLoading(game.id);
    try {
      await apiClient.delete(`/games/${game.id}`);
      toast.success(`Game "${game.name}" deactivated`);
      fetchGames(meta.page);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Failed to deactivate game",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (game: GameRow) => {
    if (!confirm(`Reactivate "${game.name}"? It will be visible in the library again.`)) return;
    setActionLoading(game.id);
    try {
      await apiClient.put(`/games/${game.id}`, { isActive: true });
      toast.success(`Game "${game.name}" reactivated`);
      fetchGames(meta.page);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to reactivate game");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHardDelete = async () => {
    if (!deleteModal || !deleteReason.trim()) return;
    setActionLoading(deleteModal.id);
    try {
      await apiClient.delete(`/games/${deleteModal.id}/hard`, { data: { reason: deleteReason } });
      toast.success(`Game "${deleteModal.name}" permanently deleted`);
      setDeleteModal(null);
      setDeleteReason("");
      fetchGames(meta.page);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to delete game");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search games..."
            className="w-full pl-10 pr-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showAddForm
              ? "bg-surface-700 text-slate-300"
              : "bg-brand-500 hover:bg-brand-600 text-white"
          }`}
        >
          <Plus className="h-4 w-4" />
          Add Game
        </button>
      </form>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="mb-4 p-4 bg-surface-800/50 border border-surface-700 rounded-lg"
        >
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Game name *"
              required
              className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="">Category (optional)</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="url"
              value={newCoverImage}
              onChange={(e) => setNewCoverImage(e.target.value)}
              placeholder="Cover image URL (optional)"
              className="px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button
              type="submit"
              disabled={actionLoading === "__create__" || !newName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {actionLoading === "__create__" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-sm text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
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
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Slug
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-slate-400 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr
                    key={game.id}
                    className={`border-b border-surface-800/50 transition-colors ${
                      editingId === game.id
                        ? "bg-surface-800/50"
                        : "hover:bg-surface-800/30"
                    }`}
                  >
                    {editingId === game.id ? (
                      <>
                        {/* Edit mode */}
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1.5 bg-surface-800 border border-surface-700 rounded text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <span className="text-slate-500 text-xs font-mono">
                            {game.slug}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full px-2 py-1.5 bg-surface-800 border border-surface-700 rounded text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                          >
                            <option value="">None</option>
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-4" />
                        <td className="py-2 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdate(game.id)}
                              disabled={actionLoading === game.id}
                              className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 rounded-lg bg-surface-700 text-slate-400 hover:bg-surface-600 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* View mode */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {game.coverImage ? (
                              <img
                                src={game.coverImage}
                                alt=""
                                className="w-8 h-8 rounded object-cover bg-surface-800"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-surface-800 border border-surface-700 flex items-center justify-center">
                                <ExternalLink className="h-3.5 w-3.5 text-slate-600" />
                              </div>
                            )}
                            <p className="text-slate-200 font-medium">
                              {game.name}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-xs text-slate-500 font-mono">
                            {game.slug}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          {game.category ? (
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${
                                CATEGORY_COLORS[game.category] ||
                                CATEGORY_COLORS.Other
                              }`}
                            >
                              {game.category}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${
                              game.isActive
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {game.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(game)}
                              className="p-1.5 rounded-lg bg-surface-800 text-slate-400 hover:bg-surface-700 hover:text-slate-200 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {!game.isActive ? (
                              <button
                                onClick={() => handleReactivate(game)}
                                disabled={actionLoading === game.id}
                                className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                title="Reactivate"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDelete(game)}
                                disabled={actionLoading === game.id}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                title="Deactivate"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {!game.isActive && (
                              <button
                                onClick={() => setDeleteModal({ id: game.id, name: game.name })}
                                disabled={actionLoading === game.id}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                title="Hard Delete"
                              >
                                <Skull className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {games.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">
                {search
                  ? "No games match your search."
                  : "No games in the library yet. Add your first game above."}
              </p>
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-800">
              <p className="text-xs text-slate-500">
                Showing page {meta.page} of {meta.totalPages} ({meta.total}{" "}
                total games)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchGames(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-surface-800 text-sm text-slate-300 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchGames(meta.page + 1)}
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
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Permanently Delete Game</h3>
            <p className="text-sm text-slate-400 mb-1">This action is irreversible. The game will be removed from all profiles.</p>
            <p className="text-sm font-medium text-red-400 mb-4">Game: {deleteModal.name}</p>
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
