"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import type { TournamentRegistrationDto, TournamentDto } from "@gamers-sg/shared/dto";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CONFIRMED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  ATTENDED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function ManageTournamentPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<TournamentDto | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistrationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/tournaments/${id}`),
      apiClient.get(`/tournaments/${id}/registrations`),
    ]).then(([tRes, rRes]) => {
      setTournament(tRes.data.data);
      setRegistrations(rRes.data.data ?? []);
    }).catch(() => toast.error("Failed to load data")).finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/organiser/tournaments" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Tournaments
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Manage Registrations</h1>
        <p className="text-slate-400 mt-1">{tournament?.name}</p>
      </div>
      {registrations.length === 0 ? (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-12 text-center">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No registrations yet</h3>
          <p className="text-slate-500">Registrations will appear here once participants sign up.</p>
        </div>
      ) : (
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">User</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {registrations.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {r.user?.gamerProfile?.displayName || r.user?.gamerProfile?.username || r.user?.email || "Unknown"}
                        </p>
                        {r.user?.email && <p className="text-xs text-slate-500">{r.user.email}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", STATUS_COLORS[r.status] || STATUS_COLORS.PENDING)}>
                        {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(r.registeredAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
