"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, X, Gamepad2 } from "lucide-react";
import apiClient from "@/lib/api-client";

interface GameOption {
  id: string;
  name: string;
  slug: string;
  category?: string;
  coverImage?: string;
}

interface SelectedGame {
  gameId: string;
  inGameRole?: string;
}

interface GameSelectorProps {
  selected: SelectedGame[];
  onChange: (games: SelectedGame[]) => void;
}

export function GameSelector({ selected, onChange }: GameSelectorProps) {
  const [allGames, setAllGames] = useState<GameOption[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch game library
  useEffect(() => {
    let cancelled = false;
    async function fetchGames() {
      try {
        const { data } = await apiClient.get("/games", {
          params: { pageSize: 100 },
        });
        if (!cancelled) {
          setAllGames(data.data ?? []);
        }
      } catch {
        // Silently handle — games unavailable
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchGames();
    return () => {
      cancelled = true;
    };
  }, []);

  // Click outside → close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredGames = allGames.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedMap = new Map(
    selected.map((s) => [s.gameId, s.inGameRole]),
  );

  const toggleGame = useCallback(
    (gameId: string) => {
      if (selectedMap.has(gameId)) {
        onChange(selected.filter((s) => s.gameId !== gameId));
      } else {
        onChange([...selected, { gameId }]);
      }
    },
    [selected, onChange],
  );

  const updateRole = useCallback(
    (gameId: string, role: string) => {
      onChange(
        selected.map((s) =>
          s.gameId === gameId ? { ...s, inGameRole: role || undefined } : s,
        ),
      );
    },
    [selected, onChange],
  );

  const removeGame = useCallback(
    (gameId: string) => {
      onChange(selected.filter((s) => s.gameId !== gameId));
    },
    [selected, onChange],
  );

  const getGameName = (gameId: string) =>
    allGames.find((g) => g.id === gameId)?.name ?? "Unknown Game";

  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      FPS: "bg-red-500/10 text-red-400 border-red-500/20",
      MOBA: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      "Battle Royale": "bg-orange-500/10 text-orange-400 border-orange-500/20",
      Fighting: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      RPG: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      Sports: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      Sandbox: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    };
    return colors[category ?? ""] || "bg-surface-700 text-slate-400 border-surface-600";
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected games tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selected.map((s) => (
          <span
            key={s.gameId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-sm text-slate-200"
          >
            <Gamepad2 className="h-3.5 w-3.5 text-brand-400" />
            {getGameName(s.gameId)}
            {s.inGameRole && (
              <span className="text-brand-400 text-xs">
                ({s.inGameRole})
              </span>
            )}
            <button
              type="button"
              onClick={() => removeGame(s.gameId)}
              className="ml-1 p-0.5 rounded hover:bg-brand-500/20 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 hover:border-brand-500/50 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-colors"
      >
        <span className={selected.length === 0 ? "text-slate-500" : ""}>
          {selected.length === 0
            ? "Search and select games..."
            : `${selected.length} game${selected.length > 1 ? "s" : ""} selected`}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-surface-900 border border-surface-700 rounded-lg shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-surface-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search games..."
                autoFocus
                className="w-full pl-10 pr-4 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Game list */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Loading games...
              </div>
            ) : filteredGames.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                {search
                  ? "No games found. Ask an admin to add it to the library."
                  : "No games in the library yet."}
              </div>
            ) : (
              filteredGames.map((game) => {
                const isSelected = selectedMap.has(game.id);
                return (
                  <label
                    key={game.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleGame(game.id)}
                      className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500/50 focus:ring-offset-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-200 truncate">
                          {game.name}
                        </span>
                        {game.category && (
                          <span
                            className={`inline-flex rounded-full px-1.5 py-0.5 text-xs border ${getCategoryColor(game.category)}`}
                          >
                            {game.category}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <input
                        type="text"
                        value={selectedMap.get(game.id) ?? ""}
                        onChange={(e) => updateRole(game.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Role (e.g. IGL, ADC)"
                        className="w-32 px-2 py-1 bg-surface-800 border border-surface-700 rounded text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
