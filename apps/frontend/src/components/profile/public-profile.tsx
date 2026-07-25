"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import apiClient, { apiPublic } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { CompletenessIndicator } from "./completeness-indicator";
import { ConnectButton } from "@/components/connections/connect-button";
import type { EnhancedGamerProfileDto, ConnectionStatusInfo } from "@gamers-sg/shared/dto";
import {
  Loader2,
  User,
  MapPin,
  Trophy,
  Calendar,
  Users,
  Gamepad2,
  ShieldAlert,
  Globe,
} from "lucide-react";

interface PublicProfileProps {
  username: string;
  isOwnProfile?: boolean;
}

export function PublicProfile({ username, isOwnProfile = false }: PublicProfileProps) {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<EnhancedGamerProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use apiClient if authenticated (sends cookies so backend returns connection status),
      // otherwise use apiPublic
      const client = isAuthenticated ? apiClient : apiPublic;
      const { data } = await client.get(`/users/by-username/${username}`);
      if (data.success?.data) {
        setProfile(data.success.data);
      } else if (data.data) {
        setProfile(data.data);
      } else {
        setError("Profile not found");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Profile not found");
      } else {
        setError("Failed to load profile");
      }
    } finally {
      setIsLoading(false);
    }
  }, [username, isAuthenticated]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleConnectionChange = useCallback(
    (newStatus: ConnectionStatusInfo | undefined) => {
      if (profile) {
        setProfile({ ...profile, connectionStatus: newStatus });
      }
    },
    [profile],
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">
          {error === "Profile not found" ? "Profile Not Found" : "Something Went Wrong"}
        </h2>
        <p className="text-slate-400 text-sm max-w-md">
          {error === "Profile not found"
            ? `We couldn't find a gamer profile for "@${username}". The user may have set their profile to private or the username doesn't exist.`
            : "We encountered an error while loading this profile. Please try again later."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner + Avatar Section */}
      <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="relative h-40 sm:h-52 bg-gradient-to-r from-brand-500/30 via-purple-500/20 to-blue-500/30">
          {profile.bannerUrl && (
            <img
              src={profile.bannerUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 to-transparent" />
        </div>

        {/* Avatar + Name row */}
        <div className="px-6 pb-6 -mt-12 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-4 border-surface-900 bg-surface-800 overflow-hidden shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName || profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-500/10">
                  <User className="h-10 w-10 text-brand-400" />
                </div>
              )}
            </div>

            {/* Name & Username */}
            <div className="flex-1 min-w-0 pt-2 sm:pt-0">
              <h1 className="text-2xl font-bold text-slate-100">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-slate-400">@{profile.username}</p>
            </div>

            {/* Connect button (not shown on own profile) */}
            {!isOwnProfile && isAuthenticated && (
              <ConnectButton
                addresseeId={profile.userId}
                addresseeUsername={profile.username}
                connectionStatus={profile.connectionStatus}
                onConnectionChange={handleConnectionChange}
              />
            )}

            {/* Membership badge */}
            {profile.isMember && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium shrink-0 self-start sm:self-center">
                <Trophy className="h-3.5 w-3.5" />
                Member
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          {profile.bio && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                About
              </h2>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Games */}
          {profile.games && profile.games.length > 0 && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Games
              </h2>
              <div className="flex flex-wrap gap-3">
                {profile.games.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 hover:border-surface-600 transition-colors"
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
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {game.name}
                      </p>
                      {game.inGameRole && (
                        <p className="text-xs text-slate-500">{game.inGameRole}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tournament History */}
          {profile.tournamentHistory && profile.tournamentHistory.length > 0 && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Tournament History
              </h2>
              <div className="space-y-3">
                {profile.tournamentHistory.map((entry) => (
                  <div
                    key={`${entry.tournamentId}-${entry.registeredAt}`}
                    className="flex items-center gap-4 p-3 rounded-lg bg-surface-800 border border-surface-700"
                  >
                    {entry.gameCoverImage ? (
                      <img
                        src={entry.gameCoverImage}
                        alt={entry.gameName}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                        <Trophy className="h-5 w-5 text-brand-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {entry.tournamentName}
                      </p>
                      <p className="text-xs text-slate-500">{entry.gameName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                          STATUS_STYLES[entry.status] || "bg-slate-500/10 text-slate-400 border-slate-500/20",
                        )}
                      >
                        {entry.status}
                      </span>
                      {entry.placement && (
                        <p className="text-xs text-amber-400 mt-1 font-medium">
                          #{entry.placement}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event History */}
          {profile.eventHistory && profile.eventHistory.length > 0 && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Event History
              </h2>
              <div className="space-y-3">
                {profile.eventHistory.map((entry) => (
                  <div
                    key={`${entry.eventId}-${entry.registeredAt}`}
                    className="flex items-center gap-4 p-3 rounded-lg bg-surface-800 border border-surface-700"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {entry.eventName}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {entry.eventType?.toLowerCase() || "Event"}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                          STATUS_STYLES[entry.status] || "bg-slate-500/10 text-slate-400 border-slate-500/20",
                        )}
                      >
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no history */}
          {(!profile.tournamentHistory || profile.tournamentHistory.length === 0) &&
            (!profile.eventHistory || profile.eventHistory.length === 0) && (
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mx-auto mb-3">
                  <Trophy className="h-6 w-6 text-slate-600" />
                </div>
                <p className="text-slate-400 text-sm">
                  No competitive history yet.
                </p>
              </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Completeness — only show for own profile */}
          {isOwnProfile && profile.profileCompleteness && (
            <CompletenessIndicator completeness={profile.profileCompleteness} />
          )}

          {/* Connections */}
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-300">Connections</h3>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {profile.connectionsCount}
            </p>
            {profile.mutualConnectionsCount !== undefined &&
              profile.mutualConnectionsCount > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {profile.mutualConnectionsCount} mutual
                </p>
              )}
          </div>

          {/* Points */}
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-300">Points</h3>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {profile.pointsBalance.toLocaleString()}
            </p>
          </div>

          {/* Current Teams */}
          {profile.currentTeams && profile.currentTeams.length > 0 && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Current Teams
              </h3>
              <div className="space-y-2">
                {profile.currentTeams.map((team) => (
                  <Link
                    href={`/teams/${team.teamId}`}
                    key={team.teamId}
                    className="flex items-center gap-3 p-2 rounded-lg bg-surface-800 border border-surface-700 hover:border-surface-600 transition-colors"
                  >
                    {team.teamLogoUrl ? (
                      <img
                        src={team.teamLogoUrl}
                        alt={team.teamName}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-brand-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {team.teamName}
                      </p>
                      {team.teamTag && (
                        <p className="text-xs text-slate-500">[{team.teamTag}]</p>
                      )}
                    </div>
                    <span className="ml-auto text-xs capitalize text-slate-500">
                      {team.role.toLowerCase()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Past Teams */}
          {profile.pastTeams && profile.pastTeams.length > 0 && (
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Past Teams
              </h3>
              <div className="space-y-2">
                {profile.pastTeams.map((team) => (
                  <Link
                    href={`/teams/${team.teamId}`}
                    key={team.teamId}
                    className="flex items-center gap-3 p-2 rounded-lg bg-surface-800 border border-surface-700 hover:border-surface-600 transition-colors"
                  >
                    {team.teamLogoUrl ? (
                      <img
                        src={team.teamLogoUrl}
                        alt={team.teamName}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-brand-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {team.teamName}
                      </p>
                      {team.teamTag && (
                        <p className="text-xs text-slate-500">[{team.teamTag}]</p>
                      )}
                    </div>
                    <span className="ml-auto text-xs capitalize text-slate-500">
                      {team.role.toLowerCase()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  UPCOMING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ONGOING: "bg-green-500/10 text-green-400 border-green-500/20",
  REGISTERED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  PENDING: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};
