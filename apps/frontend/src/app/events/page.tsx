"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiPublic } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Search,
  Calendar,
  Users,
  Globe,
  MapPin,
  Filter,
  Star,
} from "lucide-react";
import type { EventDto } from "@gamers-sg/shared/dto";

const EVENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "PHYSICAL", label: "Physical" },
  { value: "DIGITAL", label: "Digital" },
  { value: "HYBRID", label: "Hybrid" },
];

export default function EventsPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [isOnline, setIsOnline] = useState<string>("");

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (eventType) params.eventType = eventType;
      if (isOnline) params.isOnline = isOnline;

      const { data } = await apiPublic.get("/events", { params });
      setEvents(data.data ?? []);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const statusColors: Record<string, string> = {
    APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    ONGOING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    COMPLETED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  const typeColors: Record<string, string> = {
    PHYSICAL: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    DIGITAL: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    HYBRID: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero */}
      <div className="border-b border-surface-800 bg-surface-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-brand-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-100">Events</h1>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Discover community gaming events, meetups, and workshops across
            Singapore. Connect with fellow gamers in person or online.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
            />
          </div>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="px-3 py-2.5 bg-surface-900 border border-surface-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-surface-800">
                {t.label}
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
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Star className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No events found
            </h3>
            <p className="text-slate-500">
              Check back later for upcoming community events.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="group bg-surface-900 border border-surface-800 rounded-xl p-5 hover:border-brand-500/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        statusColors[e.status] || "bg-slate-500/10 text-slate-400 border-slate-500/20",
                      )}
                    >
                      {e.status.replace("_", " ")}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        typeColors[e.eventType] || "bg-slate-500/10 text-slate-400 border-slate-500/20",
                      )}
                    >
                      {e.eventType.charAt(0) + e.eventType.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {e.registrationFee != null && e.registrationFee > 0 && (
                    <span className="text-xs text-slate-400">
                      SGD ${e.registrationFee}
                    </span>
                  )}
                  {e.pointsAwarded > 0 && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <Star className="h-3 w-3" />+{e.pointsAwarded}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-100 group-hover:text-brand-500 transition-colors mb-1 line-clamp-2">
                  {e.name}
                </h3>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {e.description}
                </p>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(e.eventStart).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.isOnline ? (
                      <Globe className="h-3.5 w-3.5" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5" />
                    )}
                    <span>{e.isOnline ? "Online" : e.venue || "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {e._count?.registrations ?? 0}
                      {e.capacity ? ` / ${e.capacity}` : ""} registered
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
