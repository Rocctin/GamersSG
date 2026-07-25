"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import apiClient, { apiPublic } from "@/lib/api-client";
import { UserSearchCard } from "@/components/discovery/user-search-card";
import { PeopleYouMayKnowWidget } from "@/components/discovery/people-you-may-know";
import { ConnectButton } from "@/components/connections/connect-button";
import {
  Loader2,
  Search,
  Users,
  Gamepad2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import type {
  UserSearchResultDto,
  GamePlayerDto,
  ConnectionStatusInfo,
} from "@gamers-sg/shared/dto";

type Tab = "search" | "people" | "games";

export default function DiscoverPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("search");

  // Search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResultDto[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // By Game
  const [games, setGames] = useState<{ slug: string; name: string; coverImage?: string }[]>([]);
  const [selectedGameSlug, setSelectedGameSlug] = useState("");
  const [gamePlayers, setGamePlayers] = useState<GamePlayerDto[]>([]);
  const [gamePlayersTotal, setGamePlayersTotal] = useState(0);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  // Load games list on mount
  useEffect(() => {
    apiPublic.get("/games").then(({ data }) => {
      const items = data.data ?? [];
      setGames(items);
    }).catch(() => {});
  }, []);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      toast.error("Enter at least 2 characters to search");
      return;
    }

    setIsSearching(true);
    try {
      const client = isAuthenticated ? apiClient : apiPublic;
      const { data } = await client.get("/users/search", {
        params: { query: trimmed },
      });
      setSearchResults(data.results ?? []);
      setSearchTotal(data.total ?? 0);
    } catch {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadPlayers = async (slug: string) => {
    setSelectedGameSlug(slug);
    if (!slug) { setGamePlayers([]); return; }

    setIsLoadingPlayers(true);
    try {
      const client = isAuthenticated ? apiClient : apiPublic;
      const { data } = await client.get(`/games/${slug}/players`);
      setGamePlayers(data.players ?? []);
      setGamePlayersTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to load players");
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const handleSearchConnectionChange = (
    userId: string,
    status: ConnectionStatusInfo | undefined,
  ) => {
    setSearchResults((prev) =>
      prev.map((r) =>
        r.userId === userId
          ? { ...r, isConnected: status?.state === "ACCEPTED", connectionStatus: status }
          : r,
      ),
    );
  };

  const handlePlayerConnectionChange = (
    userId: string,
    status: ConnectionStatusInfo | undefined,
  ) => {
    setGamePlayers((prev) =>
      prev.map((p) =>
        p.userId === userId
          ? { ...p, isConnected: status?.state === "ACCEPTED", connectionStatus: status }
          : p,
      ),
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Discover</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Find fellow gamers, make connections, and grow your network.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-800">
        {[
          { key: "search" as Tab, label: "Search", icon: Search },
          { key: "people" as Tab, label: "People You May Know", icon: UserPlus },
          { key: "games" as Tab, label: "By Game", icon: Gamepad2 },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
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
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "search" ? (
        <div className="space-y-4">
          {/* Search input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by username or display name..."
              className="flex-1 px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 text-white text-sm font-medium transition-colors"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </button>
          </div>

          {/* Results */}
          {isSearching ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
            </div>
          ) : searchResults.length === 0 && query.trim().length >= 2 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-1">
                No results found
              </h3>
              <p className="text-sm text-slate-500">
                Try a different search term.
              </p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                {searchTotal} result{searchTotal !== 1 ? "s" : ""}
              </p>
              {searchResults.map((result) => (
                <UserSearchCard
                  key={result.userId}
                  user={result}
                  onConnectionChange={handleSearchConnectionChange}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mx-auto mb-3">
                <Search className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-1">
                Search for gamers
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Search by username or display name to find and connect with fellow
                gamers.
              </p>
            </div>
          )}
        </div>
      ) : activeTab === "people" ? (
        isAuthenticated ? (
          <PeopleYouMayKnowWidget compact={false} maxItems={20} />
        ) : (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-1">
              Sign in to see suggestions
            </h3>
            <p className="text-sm text-slate-500">
              We'll show you people you might know based on your games, connections,
              and more.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {/* Game selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Select a game
            </label>
            <select
              value={selectedGameSlug}
              onChange={(e) => handleLoadPlayers(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
            >
              <option value="" className="bg-surface-900">
                Choose a game...
              </option>
              {games.map((g) => (
                <option key={g.slug} value={g.slug} className="bg-surface-900">
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Players list */}
          {isLoadingPlayers ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
            </div>
          ) : selectedGameSlug && gamePlayers.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mx-auto mb-3">
                <Gamepad2 className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-1">
                No players found
              </h3>
              <p className="text-sm text-slate-500">
                No players found for this game.
              </p>
            </div>
          ) : gamePlayers.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                {gamePlayersTotal} player{gamePlayersTotal !== 1 ? "s" : ""}
              </p>
              {gamePlayers.map((player) => (
                <div
                  key={player.userId}
                  className="flex items-center gap-4 p-5 rounded-xl bg-surface-900 border border-surface-800"
                >
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.displayName || player.username}
                      className="w-12 h-12 rounded-full object-cover border border-surface-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-brand-400">
                        {(player.displayName || player.username)[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {player.displayName || player.username}
                    </p>
                    <p className="text-xs text-slate-500">
                      @{player.username}
                      {player.inGameRole && ` · ${player.inGameRole}`}
                    </p>
                  </div>
                  {isAuthenticated && !player.isConnected && (
                    <ConnectButton
                      addresseeId={player.userId}
                      addresseeUsername={player.username}
                      connectionStatus={player.connectionStatus}
                      onConnectionChange={(status) =>
                        handlePlayerConnectionChange(player.userId, status)
                      }
                    />
                  )}
                  {player.isConnected && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                      <Users className="h-3 w-3" />
                      Connected
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mx-auto mb-3">
                <Gamepad2 className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-1">
                Find players by game
              </h3>
              <p className="text-sm text-slate-500">
                Select a game to see players you might want to connect with.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
