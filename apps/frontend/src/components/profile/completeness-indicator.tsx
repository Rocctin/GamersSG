"use client";

import { cn } from "@/lib/utils";
import type { ProfileCompletenessDto } from "@gamers-sg/shared/dto";
import { Trophy, Star, Sparkles } from "lucide-react";

const LABEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "All-Star": Sparkles,
  Intermediate: Star,
  Beginner: Trophy,
};

const LABEL_COLORS: Record<string, string> = {
  "All-Star": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Beginner: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const PROGRESS_COLORS: Record<string, string> = {
  "All-Star": "bg-gradient-to-r from-amber-500 to-amber-400",
  Intermediate: "bg-gradient-to-r from-blue-500 to-blue-400",
  Beginner: "bg-gradient-to-r from-brand-500 to-brand-400",
};

interface CompletenessIndicatorProps {
  completeness: ProfileCompletenessDto;
  compact?: boolean;
}

export function CompletenessIndicator({
  completeness,
  compact = false,
}: CompletenessIndicatorProps) {
  const { score, maxScore, missingFields, label } = completeness;
  const percentage = Math.round((score / maxScore) * 100);
  const Icon = LABEL_ICONS[label] || Trophy;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">Profile Strength</span>
            <span className="text-xs font-medium text-slate-400">
              {label}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-800 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", PROGRESS_COLORS[label])}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-surface-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-100">
            Profile Completeness
          </h3>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border",
              LABEL_COLORS[label],
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-end gap-2 mb-2">
          <span className="text-3xl font-bold text-slate-100">{score}</span>
          <span className="text-sm text-slate-500 mb-1">/ {maxScore}</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              PROGRESS_COLORS[label],
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Missing fields */}
      {missingFields.length > 0 && (
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-3">
            Complete these to strengthen your profile:
          </p>
          <ul className="space-y-2">
            {missingFields.map((field) => (
              <li
                key={field}
                className="flex items-center gap-2.5 text-sm text-slate-400"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                {FIELD_LABELS[field] || field}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  avatar: "Add a profile picture",
  displayName: "Set your display name",
  bio: "Write a short bio about yourself",
  games: "Add at least one game you play",
  banner: "Upload a profile banner image",
  moreGames: "Add 3 or more games to your profile",
  connections: "Connect with other gamers",
};
