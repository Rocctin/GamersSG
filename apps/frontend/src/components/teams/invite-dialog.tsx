"use client";

import { useState } from "react";
import { X, Search, Loader2, UserPlus } from "lucide-react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

interface UserResult {
  id: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface InviteDialogProps {
  teamId: string;
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}

export function InviteDialog({ teamId, open, onClose, onInvited }: InviteDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState<string | null>(null);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    setIsSearching(true);
    try {
      const { data } = await apiClient.get("/users/search", {
        params: { query: trimmed },
      });
      setResults(data.data ?? []);
    } catch {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (userId: string) => {
    setIsInviting(userId);
    try {
      await apiClient.post(`/teams/${teamId}/invites`, { inviteeId: userId });
      toast.success("Invite sent!");
      setResults((prev) => prev.filter((r) => r.id !== userId));
      onInvited();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to send invite");
    } finally {
      setIsInviting(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Invite Member</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by username..."
            className="flex-1 px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || query.trim().length < 2}
            className="p-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 text-white transition-colors"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {results.length === 0 && !isSearching && (
            <p className="text-sm text-slate-500 text-center py-4">
              {query.trim().length >= 2
                ? "No users found"
                : "Type a username to search"}
            </p>
          )}

          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-surface-800 border border-surface-700"
            >
              <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 text-brand-400 text-sm font-bold">
                {(user.displayName || user.username || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {user.displayName || user.username}
                </p>
                {user.username && (
                  <p className="text-xs text-slate-500">@{user.username}</p>
                )}
              </div>
              <button
                onClick={() => handleInvite(user.id)}
                disabled={isInviting === user.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 text-white text-xs font-medium transition-colors shrink-0"
              >
                {isInviting === user.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                Invite
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
