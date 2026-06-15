"use client";

import { useAuth } from "@/hooks/use-auth";
import { RoleBadge } from "./role-badge";
import { Trophy, Users, Calendar, Star } from "lucide-react";
import type { Role } from "@gamers-sg/shared/enums";

const STATS: Record<
  Role,
  { label: string; value: string; icon: React.ComponentType<{ className?: string }> }[]
> = {
  GAMER: [
    { label: "Achievements", value: "0", icon: Trophy },
    { label: "Teams", value: "0", icon: Users },
    { label: "Events Joined", value: "0", icon: Calendar },
    { label: "Points", value: "0", icon: Star },
  ],
  ORGANISER: [
    { label: "Active Events", value: "0", icon: Calendar },
    { label: "Total Events", value: "0", icon: Trophy },
    { label: "Registrations", value: "0", icon: Users },
    { label: "Achievements Issued", value: "0", icon: Star },
  ],
  ADMIN: [
    { label: "Total Users", value: "—", icon: Users },
    { label: "Pending Reviews", value: "—", icon: Calendar },
    { label: "Active Events", value: "—", icon: Trophy },
    { label: "Audit Actions", value: "—", icon: Star },
  ],
};

export function WelcomeCard() {
  const { user } = useAuth();

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-brand-500/20 to-brand-600/5 border-b border-surface-800 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
                Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
              </h1>
              {user?.role && <RoleBadge role={user.role as Role} />}
            </div>
            <p className="text-slate-400">
              {user?.role === "ADMIN"
                ? "Manage the platform, review organisers, and monitor activity."
                : user?.role === "ORGANISER"
                  ? "Manage your events, track registrations, and award achievements."
                  : "Track your progress, join events, and connect with the community."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-surface-800">
        {STATS[user?.role as Role]?.map((stat) => (
          <div
            key={stat.label}
            className="p-4 sm:p-6 flex flex-col items-center text-center hover:bg-surface-800/50 transition-colors"
          >
            <stat.icon className="h-5 w-5 text-slate-500 mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-slate-100 mb-0.5">
              {stat.value}
            </div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
