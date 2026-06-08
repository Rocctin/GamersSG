"use client";

import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { Mail, Calendar, ShieldCheck } from "lucide-react";
import type { Role } from "@gamers-sg/database";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Profile</h1>
        <p className="text-slate-400 mt-1">
          Your account information and public profile.
        </p>
      </div>

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
