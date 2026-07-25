"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { InviteDialog } from "@/components/teams/invite-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Users,
  Gamepad2,
  Crown,
  Settings,
  UserPlus,
  LogOut,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import type { TeamWithMembersDto, TeamMemberDto } from "@gamers-sg/shared/dto";

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: teamId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamWithMembersDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get(`/teams/${teamId}`);
      setTeam(data.data ?? data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Team not found");
      } else {
        setError("Failed to load team");
      }
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const myMembership = team?.members?.find((m) => m.userId === user?.id);
  const isCaptain = myMembership?.role === "CAPTAIN";
  const isActiveMember = !!myMembership && !myMembership.leftAt;

  const handleLeaveOrRemove = async (memberUserId: string) => {
    const isSelf = memberUserId === user?.id;
    const label = isSelf ? "Leave Team" : "Remove Member";

    if (!confirm(isSelf ? "Are you sure you want to leave this team?" : "Remove this member from the team?")) return;

    setActionLoading(memberUserId);
    try {
      await apiClient.delete(`/teams/${teamId}/members/${memberUserId}`);
      toast.success(isSelf ? "You've left the team" : "Member removed");
      if (isSelf) router.push("/teams");
      else fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || `Failed to ${label.toLowerCase()}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePromoteOrDemote = async (memberUserId: string, newRole: string) => {
    const label = newRole === "CAPTAIN" ? "Promote to Captain" : "Demote to Member";
    setActionLoading(memberUserId);
    try {
      await apiClient.put(`/teams/${teamId}/members/${memberUserId}/role`, { role: newRole });
      toast.success(label);
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || `Failed to update role`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisband = async () => {
    if (!confirm("Are you sure you want to disband this team? This action cannot be undone.")) return;
    setActionLoading("disband");
    try {
      await apiClient.delete(`/teams/${teamId}`);
      toast.success("Team disbanded");
      router.push("/teams");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to disband team");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">
          {error === "Team not found" ? "Team Not Found" : "Something Went Wrong"}
        </h2>
        <p className="text-slate-400 text-sm max-w-md">
          {error === "Team not found"
            ? "This team doesn't exist or may have been disbanded."
            : "We encountered an error while loading this team."}
        </p>
        <Link
          href="/teams"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 border border-surface-700 text-slate-300 text-sm hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Teams
        </Link>
        <div className="flex items-center gap-2">
          {isCaptain && (
            <>
              <button
                onClick={() => setShowInvite(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Invite
              </button>
              <Link
                href={`/teams/${teamId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 border border-surface-700 text-slate-300 hover:text-slate-100 text-sm font-medium transition-colors"
              >
                <Settings className="h-4 w-4" />
                Edit
              </Link>
            </>
          )}
          {isActiveMember && !isCaptain && (
            <button
              onClick={() => handleLeaveOrRemove(user!.id)}
              disabled={actionLoading === user!.id}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
            >
              {actionLoading === user!.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Leave Team
            </button>
          )}
        </div>
      </div>

      {/* Team header */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
        <div className="relative h-40 sm:h-52 bg-gradient-to-r from-brand-500/30 via-purple-500/20 to-blue-500/30">
          {team.bannerUrl && (
            <img
              src={team.bannerUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 to-transparent" />
        </div>

        <div className="px-6 pb-6 -mt-12 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                className="w-24 h-24 rounded-2xl border-4 border-surface-900 object-cover shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl border-4 border-surface-900 bg-brand-500/10 flex items-center justify-center shrink-0">
                <Users className="h-10 w-10 text-brand-400" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-2 sm:pt-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-100">
                  {team.name}
                </h1>
                <span className="text-sm font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded">
                  [{team.tag}]
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                </span>
                {team.isRecruiting && (
                  <span className="inline-flex items-center gap-1 text-brand-400">
                    <Search className="h-3.5 w-3.5" />
                    Recruiting
                  </span>
                )}
                {isCaptain && (
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <Crown className="h-3.5 w-3.5" />
                    You're the captain
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {team.description && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                About
              </h2>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                {team.description}
              </p>
            </div>
          )}

          {/* Roster */}
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Roster
            </h2>
            {team.members && team.members.length > 0 ? (
              <div className="space-y-2">
                {team.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 p-3 rounded-lg bg-surface-800 border border-surface-700"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 text-brand-400 text-sm font-bold">
                      {(member.displayName || member.username || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {member.displayName || member.username}
                        </p>
                        {member.role === "CAPTAIN" && (
                          <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        @{member.username} · Joined{" "}
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Captain actions on members */}
                    {isCaptain && member.userId !== user?.id && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {member.role === "MEMBER" ? (
                          <button
                            onClick={() => handlePromoteOrDemote(member.userId, "CAPTAIN")}
                            disabled={actionLoading === member.userId}
                            className="px-2.5 py-1 rounded text-xs font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
                          >
                            {actionLoading === member.userId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Promote"
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromoteOrDemote(member.userId, "MEMBER")}
                            disabled={actionLoading === member.userId}
                            className="px-2.5 py-1 rounded text-xs font-medium text-slate-400 hover:bg-slate-500/10 transition-colors"
                          >
                            {actionLoading === member.userId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Demote"
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleLeaveOrRemove(member.userId)}
                          disabled={actionLoading === member.userId}
                          className="px-2.5 py-1 rounded text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          {actionLoading === member.userId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Remove"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                No members yet
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Games */}
          {team.games && team.games.length > 0 && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Games
              </h3>
              <div className="space-y-2">
                {team.games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-800 border border-surface-700"
                  >
                    {game.coverImage ? (
                      <img
                        src={game.coverImage}
                        alt={game.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                        <Gamepad2 className="h-4 w-4 text-brand-400" />
                      </div>
                    )}
                    <p className="text-sm font-medium text-slate-200">
                      {game.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disband (captain only) */}
          {isCaptain && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-red-400 mb-2">
                Danger Zone
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Disbanding will remove all members. This action cannot be undone.
              </p>
              <button
                onClick={handleDisband}
                disabled={actionLoading === "disband"}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors"
              >
                {actionLoading === "disband" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Disband Team
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invite dialog */}
      <InviteDialog
        teamId={teamId}
        open={showInvite}
        onClose={() => setShowInvite(false)}
        onInvited={fetchTeam}
      />
    </div>
  );
}
