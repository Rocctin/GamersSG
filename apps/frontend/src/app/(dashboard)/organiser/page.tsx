"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Swords, Calendar, Plus } from "lucide-react";

export default function OrganiserDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Organiser Portal</h1>
        <p className="text-slate-400 mt-1">
          Manage your tournaments, events, and registrations.
        </p>
        {user?.organiserProfile && (
          <p className="text-sm text-brand-400 mt-2">
            {user.organiserProfile.organisationName}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/organiser/tournaments"
          className="bg-surface-900 border border-surface-800 rounded-xl p-6 hover:border-brand-500/30 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3">
                <Swords className="h-5 w-5 text-brand-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-100 group-hover:text-brand-500 transition-colors mb-1">
                Tournaments
              </h2>
              <p className="text-sm text-slate-400">
                Create and manage competitive gaming tournaments.
              </p>
            </div>
            <Plus className="h-5 w-5 text-slate-600 group-hover:text-brand-500 transition-colors" />
          </div>
        </Link>

        <Link
          href="/organiser/events"
          className="bg-surface-900 border border-surface-800 rounded-xl p-6 hover:border-brand-500/30 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3">
                <Calendar className="h-5 w-5 text-brand-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-100 group-hover:text-brand-500 transition-colors mb-1">
                Events
              </h2>
              <p className="text-sm text-slate-400">
                Organise community events, meetups, and workshops.
              </p>
            </div>
            <Plus className="h-5 w-5 text-slate-600 group-hover:text-brand-500 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
