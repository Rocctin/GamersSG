"use client";

import Link from "next/link";
import { Gamepad2, Users } from "lucide-react";
import { ConnectButton } from "@/components/connections/connect-button";
import type {
  UserSearchResultDto,
  ConnectionStatusInfo,
} from "@gamers-sg/shared/dto";

interface UserSearchCardProps {
  user: UserSearchResultDto;
  onConnectionChange?: (
    userId: string,
    status: ConnectionStatusInfo | undefined,
  ) => void;
}

export function UserSearchCard({ user, onConnectionChange }: UserSearchCardProps) {
  const initialStatus: ConnectionStatusInfo | undefined = user.connectionStatus;

  return (
    <div className="flex items-center gap-4 p-5 rounded-xl bg-surface-900 border border-surface-800">
      {/* Avatar */}
      <Link href={`/u/${user.username}`}>
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName || user.username}
            className="w-12 h-12 rounded-full object-cover border border-surface-700"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-brand-400">
              {(user.displayName || user.username)[0].toUpperCase()}
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/u/${user.username}`} className="hover:underline">
          <p className="text-sm font-semibold text-slate-200 truncate">
            {user.displayName || user.username}
          </p>
        </Link>
        <p className="text-xs text-slate-500">@{user.username}</p>
        {user.games && user.games.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {user.games.slice(0, 3).map((game) => (
              <span
                key={game.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-800 border border-surface-700 text-[10px] text-slate-400"
              >
                <Gamepad2 className="h-2.5 w-2.5" />
                {game.name}
              </span>
            ))}
            {user.games.length > 3 && (
              <span className="text-[10px] text-slate-500">
                +{user.games.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="shrink-0">
        {user.isConnected ? (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
            <Users className="h-3 w-3" />
            Connected
          </span>
        ) : (
          <ConnectButton
            addresseeId={user.userId}
            addresseeUsername={user.username}
            connectionStatus={initialStatus}
            onConnectionChange={(status) =>
              onConnectionChange?.(user.userId, status)
            }
          />
        )}
      </div>
    </div>
  );
}
