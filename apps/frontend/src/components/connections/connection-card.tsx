"use client";

import Link from "next/link";
import { User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionDto } from "@gamers-sg/shared/dto";

interface ConnectionCardProps {
  connection: ConnectionDto;
  viewerId: string;
  /** "connected" = ACCEPTED, "received" = PENDING where viewer is addressee, "sent" = PENDING where viewer is requester */
  variant: "connected" | "received" | "sent";
}

export function ConnectionCard({ connection, viewerId, variant }: ConnectionCardProps) {
  // Determine which side to show (the "other" person)
  const isViewerRequester = connection.requesterId === viewerId;
  const otherDisplayName = isViewerRequester
    ? connection.addresseeDisplayName
    : connection.requesterDisplayName;
  const otherUsername = isViewerRequester
    ? connection.addresseeUsername
    : connection.requesterUsername;
  const otherAvatarUrl = isViewerRequester
    ? connection.addresseeAvatarUrl
    : connection.requesterAvatarUrl;
  const otherId = isViewerRequester
    ? connection.addresseeId
    : connection.requesterId;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl bg-surface-900 border border-surface-800 hover:border-surface-700 transition-colors",
      )}
    >
      {/* Avatar */}
      <Link href={`/u/${otherUsername}`} className="shrink-0">
        {otherAvatarUrl ? (
          <img
            src={otherAvatarUrl}
            alt={otherDisplayName || otherUsername || ""}
            className="w-12 h-12 rounded-full object-cover border border-surface-700"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <User className="h-6 w-6 text-brand-400" />
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/u/${otherUsername}`}
          className="text-sm font-semibold text-slate-200 hover:text-brand-400 transition-colors"
        >
          {otherDisplayName || otherUsername || "Unknown"}
        </Link>
        {otherUsername && (
          <p className="text-xs text-slate-500">@{otherUsername}</p>
        )}
      </div>

      {/* Status badge */}
      {variant === "sent" && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      )}
    </div>
  );
}
