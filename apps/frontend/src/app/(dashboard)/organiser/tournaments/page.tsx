"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Plus,
  Swords,
  Calendar,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import type { TournamentDto } from "@gamers-sg/shared/dto";

const STATUS_MAP: Record<string, string> = {
  DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  PENDING_REVIEW: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  ONGOING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function OrganiserTournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/tournaments/mine");
      setTournaments(data.data ?? []);
    } catch {
      toast.error("Failed to load tournaments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleSubmit = async (id: string) => {
    try {
      await apiClient.post(`/tournaments/${id}/submit`);
      toast.success("Tournament submitted for review");
      fetchTournaments();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to submit");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this tournament? This cannot be undone.")) return;
    try {
      await apiClient.post(`/tournaments/${id}/cancel`);
      toast.success("Tournament cancelled");
      fetchTournaments();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to cancel");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">My Tournaments</h1>
          <p className="text-slate-400 mt-1">
            Create and manage your tournaments here.
          </p>
        </div>
        <Link
          href="/organiser/tournaments/create"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          Create Tournament
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-12 text-center">
          <Swords className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            No tournaments yet
          </h3>
          <p className="text-slate-500 mb-4">
            Create your first tournament to get started.
          </p>
          <Link
            href="/organiser/tournaments/create"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Create Tournament
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-surface-900 border border-surface-800 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        STATUS_MAP[t.status] || STATUS_MAP.DRAFT,
                      )}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                    {t.game && (
                      <span className="text-xs text-brand-400">
                        {t.game.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 truncate">
                    {t.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(t.tournamentStart).toLocaleDateString("en-SG")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {t._count?.registrations ?? 0} registered
                    </span>
                  </div>
                  {t.status === "REJECTED" && t.rejectionReason && (
                    <div className="mt-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-400">
                      <span className="font-medium">Rejection reason:</span>{" "}
                      {t.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(t.status === "DRAFT" || t.status === "REJECTED") && (
                    <>
                      <Link
                        href={`/organiser/tournaments/${t.id}/edit`}
                        className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-surface-700 hover:border-surface-600 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleSubmit(t.id)}
                        className="text-xs font-medium text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded-lg border border-brand-500/20 hover:border-brand-500/40 transition-colors"
                      >
                        Submit
                      </button>
                    </>
                  )}
                  {!["CANCELLED", "COMPLETED"].includes(t.status) && (
                    <button
                      onClick={() => handleCancel(t.id)}
                      className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  {(t.status === "APPROVED" || t.status === "ONGOING") && (
                    <Link
                      href={`/organiser/tournaments/${t.id}/manage`}
                      className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-surface-700 hover:border-surface-600 transition-colors"
                    >
                      Manage
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
