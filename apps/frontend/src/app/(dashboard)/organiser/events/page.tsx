"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import type { EventDto } from "@gamers-sg/shared/dto";

const STATUS_MAP: Record<string, string> = {
  DRAFT: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  PENDING_REVIEW: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  ONGOING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function OrganiserEventsPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/events/mine");
      setEvents(data.data ?? []);
    } catch { toast.error("Failed to load events"); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSubmit = async (id: string) => {
    try { await apiClient.post(`/events/${id}/submit`); toast.success("Event submitted"); fetchEvents(); }
    catch (err: any) { toast.error(err.response?.data?.error?.message || "Failed to submit"); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this event?")) return;
    try { await apiClient.post(`/events/${id}/cancel`); toast.success("Event cancelled"); fetchEvents(); }
    catch (err: any) { toast.error(err.response?.data?.error?.message || "Failed to cancel"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">My Events</h1>
          <p className="text-slate-400 mt-1">Create and manage community events.</p>
        </div>
        <Link href="/organiser/events/create" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm">
          <Plus className="h-4 w-4" />Create Event
        </Link>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>
      ) : events.length === 0 ? (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-12 text-center">
          <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No events yet</h3>
          <p className="text-slate-500 mb-4">Create your first event to get started.</p>
          <Link href="/organiser/events/create" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"><Plus className="h-4 w-4" />Create Event</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="bg-surface-900 border border-surface-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", STATUS_MAP[e.status] || STATUS_MAP.DRAFT)}>{e.status.replace("_", " ")}</span>
                    <span className="text-xs text-slate-500">{e.eventType.charAt(0) + e.eventType.slice(1).toLowerCase()}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 truncate">{e.name}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(e.eventStart).toLocaleDateString("en-SG")}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e._count?.registrations ?? 0} registered</span>
                  </div>
                  {e.status === "REJECTED" && e.rejectionReason && (
                    <div className="mt-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-400">
                      <span className="font-medium">Rejection reason:</span>{" "}
                      {e.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(e.status === "DRAFT" || e.status === "REJECTED") && (
                    <>
                      <Link href={`/organiser/events/${e.id}/edit`} className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-surface-700 hover:border-surface-600 transition-colors">Edit</Link>
                      <button onClick={() => handleSubmit(e.id)} className="text-xs font-medium text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded-lg border border-brand-500/20 hover:border-brand-500/40 transition-colors">Submit</button>
                    </>
                  )}
                  {!["CANCELLED", "COMPLETED"].includes(e.status) && (
                    <button onClick={() => handleCancel(e.id)} className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors">Cancel</button>
                  )}
                  {(e.status === "APPROVED" || e.status === "ONGOING") && (
                    <Link href={`/organiser/events/${e.id}/manage`} className="text-xs font-medium text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-surface-700 hover:border-surface-600 transition-colors">Manage</Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
