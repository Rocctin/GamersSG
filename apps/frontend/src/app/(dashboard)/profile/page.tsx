"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { CompletenessIndicator } from "@/components/profile/completeness-indicator";
import apiClient from "@/lib/api-client";
import { Mail, Calendar, ShieldCheck, Pencil, ExternalLink } from "lucide-react";
import type { Role } from "@gamers-sg/shared/enums";
import type { ProfileCompletenessDto } from "@gamers-sg/shared/dto";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profileCompleteness, setProfileCompleteness] =
    useState<ProfileCompletenessDto | null>(null);

  useEffect(() => {
    if (user?.role !== "GAMER" || !user?.gamerProfile?.username) return;
    let cancelled = false;
    async function fetchCompleteness() {
      try {
        const { data } = await apiClient.get(
          `/users/by-username/${user!.gamerProfile!.username}`,
        );
        if (!cancelled && data.success?.data?.profileCompleteness) {
          setProfileCompleteness(data.success.data.profileCompleteness);
        }
      } catch {
        // Non-critical
      }
    }
    fetchCompleteness();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Profile</h1>
          <p className="text-slate-400 mt-1">
            Your account information and public profile.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user.gamerProfile?.username && (
            <Link
              href={`/u/${user.gamerProfile.username}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-surface-800 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">View Public</span>
            </Link>
          )}
          {user.role === "GAMER" && (
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Profile</span>
            </Link>
          )}
        </div>
      </div>

      {/* Profile Completeness */}
      {profileCompleteness && (
        <CompletenessIndicator completeness={profileCompleteness} />
      )}

      {/* Account Info Card */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-surface-800">
          <h2 className="text-lg font-semibold text-slate-100">
            Account Information
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm text-slate-200">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Role</p>
              <div className="mt-0.5">
                <RoleBadge role={user.role as Role} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Member Since</p>
              <p className="text-sm text-slate-200">
                {new Date(user.createdAt).toLocaleDateString("en-SG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gamer Profile Card */}
      {user.gamerProfile && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-slate-100">
              Gamer Profile
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {user.gamerProfile.username && (
              <div>
                <p className="text-xs text-slate-500">Username</p>
                <p className="text-sm text-slate-200">
                  {user.gamerProfile.username}
                </p>
              </div>
            )}
            {user.gamerProfile.displayName && (
              <div>
                <p className="text-xs text-slate-500">Display Name</p>
                <p className="text-sm text-slate-200">
                  {user.gamerProfile.displayName}
                </p>
              </div>
            )}
            {user.gamerProfile.bio && (
              <div>
                <p className="text-xs text-slate-500">Bio</p>
                <p className="text-sm text-slate-200">
                  {user.gamerProfile.bio}
                </p>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-slate-500">Membership</p>
                <p className="text-sm text-slate-200">
                  {user.gamerProfile.isMember ? "Active Member" : "Basic"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Points</p>
                <p className="text-sm text-slate-200">
                  {user.gamerProfile.pointsBalance.toLocaleString()}
                </p>
              </div>
            </div>
            {user.gamerProfile.games &&
              user.gamerProfile.games.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Games Played</p>
                  <div className="flex flex-wrap gap-2">
                    {user.gamerProfile.games.map((game) => (
                      <span
                        key={game.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-700 text-sm text-slate-200"
                      >
                        {game.name}
                        {game.inGameRole && (
                          <span className="text-brand-400 text-xs">
                            ({game.inGameRole})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Organiser Profile Card */}
      {user.organiserProfile && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-slate-100">
              Organisation Profile
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500">Organisation Name</p>
              <p className="text-sm text-slate-200">
                {user.organiserProfile.organisationName}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Type</p>
              <p className="text-sm text-slate-200">
                {user.organiserProfile.organisationType}
              </p>
            </div>
            {user.organiserProfile.contactPerson && (
              <div>
                <p className="text-xs text-slate-500">Contact Person</p>
                <p className="text-sm text-slate-200">
                  {user.organiserProfile.contactPerson}
                </p>
              </div>
            )}
            {user.organiserProfile.description && (
              <div>
                <p className="text-xs text-slate-500">Description</p>
                <p className="text-sm text-slate-200">
                  {user.organiserProfile.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
