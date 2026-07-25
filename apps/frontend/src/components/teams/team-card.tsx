"use client";

import Link from "next/link";
import { Users, Search, Crown } from "lucide-react";
import type { TeamDto } from "@gamers-sg/shared/dto";

interface TeamCardProps {
  team: TeamDto & { myRole?: string; leftAt?: string };
  showRole?: boolean;
}

export function TeamCard({ team, showRole = false }: TeamCardProps) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="block p-5 rounded-xl bg-surface-900 border border-surface-800 hover:border-surface-600 transition-all group"
    >
      <div className="flex items-center gap-4">
        {/* Logo */}
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={team.name}
            className="w-14 h-14 rounded-xl object-cover border border-surface-700"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
            <Users className="h-6 w-6 text-brand-400" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-brand-400 transition-colors truncate">
              {team.name}
            </h3>
            <span className="text-xs font-bold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded">
              [{team.tag}]
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
            </span>
            {team.isRecruiting && (
              <span className="inline-flex items-center gap-1">
                <Search className="h-3 w-3" />
                Recruiting
              </span>
            )}
            {showRole && team.myRole && (
              <span className="inline-flex items-center gap-1 text-brand-400">
                <Crown className="h-3 w-3" />
                {team.myRole === "CAPTAIN" ? "Captain" : "Member"}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
