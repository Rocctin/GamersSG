"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { EventDto } from "@gamers-sg/shared/dto";

function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason.trim());
    setReason("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface-900 border border-surface-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-100 mb-1">Reject Event</h3>
        <p className="text-sm text-slate-400 mb-4">
          Please provide a reason for rejection. The organiser will see this.
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Insufficient details, duplicate listing, inappropriate content..."
            rows={3}
            className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm resize-vertical mb-4"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-sm font-medium text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg border border-surface-700 hover:border-surface-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
            >
              {isLoading ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchPending = async () => {
    setIsLoading(true);
    try { const { data } = await apiClient.get("/admin/events/pending"); setEvents(data.data ?? []); }
    catch { toast.error("Failed to load pending events"); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleReview = async (id: string, action: "APPROVE" | "REJECT", rejectionReason?: string) => {
    setActionLoading(id);
    try {
      await apiClient.post(`/admin/events/${id}/review`, { action, ...(rejectionReason && { rejectionReason }) });
      toast.success(action === "APPROVE" ? "Event approved" : "Event rejected");
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) { toast.error(err.response?.data?.error?.message || "Failed to review"); }
    finally { setActionLoading(null); setRejectingId(null); }
  };

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-slate-100">Review Events</h1><p className="text-slate-400 mt-1">Approve or reject event listings submitted by organisers.</p></div>
      <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-surface-800"><h2 className="text-lg font-semibold text-slate-100">Pending Review</h2></div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 text-brand-500 animate-spin" /></div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center"><p className="text-slate-500">No pending events to review.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-surface-800"><th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Name</th><th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Organiser</th><th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Type</th><th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Date</th><th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Actions</th></tr></thead>
              <tbody className="divide-y divide-surface-800">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-800/50 transition-colors">
                    <td className="px-6 py-4"><p className="text-sm font-medium text-slate-200">{e.name}</p><p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{e.description}</p></td>
                    <td className="px-6 py-4 text-sm text-slate-300">{e.organiser?.organiserProfile?.organisationName || e.organiser?.email || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{e.eventType.charAt(0) + e.eventType.slice(1).toLowerCase()}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{new Date(e.eventStart).toLocaleDateString("en-SG")}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleReview(e.id, "APPROVE")} disabled={actionLoading === e.id} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 disabled:opacity-50 transition-colors"><CheckCircle2 className="h-3.5 w-3.5" />Approve</button>
                        <button onClick={() => setRejectingId(e.id)} disabled={actionLoading === e.id} className="inline-flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 disabled:opacity-50 transition-colors"><XCircle className="h-3.5 w-3.5" />Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RejectionModal
        isOpen={rejectingId !== null}
        onClose={() => setRejectingId(null)}
        onConfirm={(reason) => {
          if (rejectingId) handleReview(rejectingId, "REJECT", reason);
        }}
        isLoading={actionLoading === rejectingId}
      />
    </div>
  );
}
