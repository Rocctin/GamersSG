"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import apiClient from "@/lib/api-client";
import { ConnectButton } from "@/components/connections/connect-button";
import { Loader2, Users, UserPlus } from "lucide-react";
import type {
  PeopleYouMayKnowDto,
  ConnectionStatusInfo,
} from "@gamers-sg/shared/dto";

interface PeopleYouMayKnowWidgetProps {
  compact?: boolean; // true = dashboard widget (top 5), false = full list in discover page
  maxItems?: number;
}

export function PeopleYouMayKnowWidget({
  compact = true,
  maxItems = 5,
}: PeopleYouMayKnowWidgetProps) {
  const { user } = useAuth();
  const [people, setPeople] = useState<PeopleYouMayKnowDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "GAMER") {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    apiClient
      .get("/users/discover/people-you-may-know")
      .then(({ data }) => {
        if (!cancelled) {
          const items = Array.isArray(data) ? data : data.data ?? [];
          setPeople(items.slice(0, maxItems));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, maxItems]);

  const handleConnectionChange = (
    userId: string,
    status: ConnectionStatusInfo | undefined,
  ) => {
    if (status?.state === "ACCEPTED" || status?.state === "PENDING_SENT") {
      // Remove from list once action taken
      setPeople((prev) => prev.filter((p) => p.userId !== userId));
    }
  };

  if (!user || user.role !== "GAMER") return null;

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (people.length === 0) return null;

  return (
    <div>
      {!compact && (
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          People You May Know
        </h2>
      )}
      <div className="space-y-3">
        {people.map((person) => (
          <div
            key={person.userId}
            className="flex items-center gap-3 p-3 rounded-lg bg-surface-800 border border-surface-700"
          >
            <Link href={`/u/${person.username}`}>
              {person.avatarUrl ? (
                <img
                  src={person.avatarUrl}
                  alt={person.displayName || person.username}
                  className="w-10 h-10 rounded-full object-cover border border-surface-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-brand-400">
                    {(person.displayName || person.username)[0].toUpperCase()}
                  </span>
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/u/${person.username}`} className="hover:underline">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {person.displayName || person.username}
                </p>
              </Link>
              <p className="text-xs text-slate-500">{person.reason}</p>
            </div>
            {!compact && (
              <ConnectButton
                addresseeId={person.userId}
                addresseeUsername={person.username}
                onConnectionChange={(status) =>
                  handleConnectionChange(person.userId, status)
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
