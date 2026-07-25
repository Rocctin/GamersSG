"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import apiClient from "@/lib/api-client";
import { TeamCard } from "@/components/teams/team-card";
import Link from "next/link";
import { Plus, Loader2, Users, History, UserPlus, Clock } from "lucide-react";
import { toast } from "sonner";
import type { TeamDto, TeamInviteDto } from "@gamers-sg/shared/dto";

type Tab = "my-teams" | "invites" | "past";

export default function TeamsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("my-teams");
  const [currentTeams, setCurrentTeams] = useState<(TeamDto & { myRole?: string })[]>([]);
  const [pastTeams, setPastTeams] = useState<(TeamDto & { myRole?: string; leftAt?: string })[]>([]);
  const [invites, setInvites] = useState<TeamInviteDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ data: myTeams }, { data: myInvites }] = await Promise.all([
        apiClient.get("/teams/my/teams"),
        apiClient.get("/teams/my/invites"),
      ]);
      setCurrentTeams(myTeams.current || []);
      setPastTeams(myTeams.past || []);
      setInvites(Array.isArray(myInvites) ? myInvites : []);
    } catch {
      toast.error("Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAcceptInvite = async (inviteId: string, teamId: string) => {
    try {
      await apiClient.put(`/teams/${teamId}/invites/${inviteId}/accept`);
      toast.success("Invite accepted! You're now a team member.");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to accept invite");
    }
  };

  const handleRejectInvite = async (inviteId: string, teamId: string) => {
    try {
      await apiClient.put(`/teams/${teamId}/invites/${inviteId}/reject`);
      toast.success("Invite declined");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to decline invite");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Teams</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Your teams, invites, and history.
          </p>
        </div>
        <Link
          href="/teams/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-surface-800">
        {[
          { key: "my-teams" as Tab, label: "My Teams", icon: Users },
          { key: "invites" as Tab, label: "Invites", icon: UserPlus },
          { key: "past" as Tab, label: "Past Teams", icon: History },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          const badge =
            tab.key === "invites" && invites.length > 0 ? invites.length : null;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {badge && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : activeTab === "my-teams" ? (
        currentTeams.length === 0 ? (
          <EmptyState
            title="No teams yet"
            description="Create a team or accept an invite to get started."
            icon={Users}
          />
        ) : (
          <div className="space-y-3">
            {currentTeams.map((team) => (
              <TeamCard key={team.id} team={team} showRole />
            ))}
          </div>
        )
      ) : activeTab === "invites" ? (
        invites.length === 0 ? (
          <EmptyState
            title="No pending invites"
            description="When a team captain invites you, it will appear here."
            icon={UserPlus}
          />
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-4 p-5 rounded-xl bg-surface-900 border border-surface-800"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200">
                    {invite.teamName}{" "}
                    <span className="text-xs text-brand-500">
                      [{invite.teamTag}]
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Invited by @{invite.inviterUsername || "unknown"}{" "}
                    <Clock className="inline h-3 w-3 ml-1" />
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAcceptInvite(invite.id, invite.teamId)}
                    className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectInvite(invite.id, invite.teamId)}
                    className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : pastTeams.length === 0 ? (
        <EmptyState
          title="No past teams"
          description="Teams you've left will appear here."
          icon={History}
        />
      ) : (
        <div className="space-y-3">
          {pastTeams.map((team) => (
            <TeamCard key={team.id} team={team} showRole />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
