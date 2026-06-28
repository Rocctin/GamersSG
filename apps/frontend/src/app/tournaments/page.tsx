"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiPublic } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Search,
  Swords,
  Users,
  Globe,
  Trophy,
  Calendar,
  MapPin,
  Filter,
} from "lucide-react";
import type { TournamentDto, TournamentFilterDto } from "@gamers-sg/shared/dto";

const FORMATS = [
  { value: "", label: "All Formats" },
  { value: "BEST_OF_ONE", label: "Best of One" },
  { value: "BEST_OF_THREE", label: "Best of Three" },
  { value: "OTHER", label: "Other" },
];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState("");
  const [isOnline, setIsOnline] = useState<string>("");
  const [isTeamBased, setIsTeamBased] = useState<string>("");

  const fetchTournaments = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (format) params.format = format;
      if (isOnline) params.isOnline = isOnline;
      if (isTeamBased) params.isTeamBased = isTeamBased;

      const { data } = await apiPublic.get("/tournaments", { params });
      setTournaments(data.data ?? []);
    } catch {
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTournaments();
  };

  const statusColors: Record<string, string> = {
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ONGOING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    COMPLETED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero */}
      <div className="border-b border-surface-800 bg-surface-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Swords className="h-5 w-5 text-brand-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-100">Tournaments</h1>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Discover competitive gaming tournaments across Singapore. Browse by
            game, format, or find team-based competitions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <form
          onSubmit={handleSearch}
          className="flex flex-wrap gap-3 mb-8"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tournaments..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
            />
          </div>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="px-3 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value} className="bg-surface-800">
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={isOnline}
            onChange={(e) => setIsOnline(e.target.value)}
            className="px-3 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="" className="bg-surface-800">All Venues</option>
            <option value="true" className="bg-surface-800">Online</option>
            <option value="false" className="bg-surface-800">In-Person</option>
          </select>
          <select
            value={isTeamBased}
            onChange={(e) => setIsTeamBased(e.target.value)}
            className="px-3 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="" className="bg-surface-800">All Types</option>
            <option value="true" className="bg-surface-800">Team Based</option>
            <option value="false" className="bg-surface-800">Individual</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </form>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No tournaments found
            </h3>
            <p className="text-slate-500">
              Check back later for upcoming tournaments.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="group bg-surface-900 border border-surface-800 rounded-xl p-5 hover:border-brand-500/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        statusColors[t.status] || "bg-slate-500/10 text-slate-400 border-slate-500/20",
                      )}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                    {t.isTeamBased && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20">
                        Team
                      </span>
                    )}
                  </div>
                  {t.registrationFee != null && t.registrationFee > 0 && (
                    <span className="text-xs text-slate-400">
                      SGD ${t.registrationFee}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-100 group-hover:text-brand-500 transition-colors mb-1 line-clamp-2">
                  {t.name}
                </h3>
                {t.game && (
                  <p className="text-sm text-brand-400 mb-2">{t.game.name}</p>
                )}
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {t.description}
                </p>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(t.tournamentStart).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.isOnline ? (
                      <Globe className="h-3.5 w-3.5" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5" />
                    )}
                    <span>{t.isOnline ? "Online" : t.venue || "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {t._count?.registrations ?? 0}
                      {t.maxParticipants ? ` / ${t.maxParticipants}` : ""}{" "}
                      registered
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
