"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { apiPublic } from "@/lib/api-client";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  Loader2,
  ArrowLeft,
  Swords,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Trophy,
  Users,
  Banknote,
  ExternalLink,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import type { TournamentDto } from "@gamers-sg/shared/dto";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  PENDING_REVIEW: { label: "Pending Review", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  APPROVED: { label: "Approved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  REJECTED: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  ONGOING: { label: "Ongoing", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  COMPLETED: { label: "Completed", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [tournament, setTournament] = useState<TournamentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchTournament = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiPublic.get(`/tournaments/${id}`);
      setTournament(data.data);
    } catch {
      toast.error("Failed to load tournament");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/tournaments/${id}`);
      return;
    }
    setIsRegistering(true);
    try {
      await apiClient.post(`/tournaments/${id}/register`);
      toast.success("Successfully registered!");
      await fetchTournament(); // refresh to show updated status
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Failed to register",
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    setIsCancelling(true);
    try {
      await apiClient.delete(`/tournaments/${id}/registrations/me`);
      toast.success("Registration cancelled");
      await fetchTournament();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Failed to cancel registration",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-200">Tournament not found</h2>
          <Link href="/tournaments" className="text-brand-500 hover:underline text-sm mt-2 inline-block">
            Back to tournaments
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_MAP[tournament.status] ?? STATUS_MAP.DRAFT;
  const registration = tournament.userRegistration;
  const isRegistered = registration && registration.status !== "CANCELLED";
  const canRegister =
    tournament.status === "APPROVED" || tournament.status === "ONGOING";
  const registrationOpen =
    new Date(tournament.registrationStart) <= new Date() &&
    new Date() <= new Date(tournament.registrationEnd);

  return (
    <div className="min-h-screen bg-surface-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tournaments
        </Link>

        {/* Header */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <span
                className={cn(
                  "inline-block text-xs font-medium px-2.5 py-1 rounded-full border mb-3",
                  status.color,
                )}
              >
                {status.label}
              </span>
              <h1 className="text-2xl font-bold text-slate-100 mb-1">
                {tournament.name}
              </h1>
              {tournament.game && (
                <p className="text-brand-400 font-medium">{tournament.game.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isAuthenticated && canRegister && registrationOpen && (
                <Link
                  href={`/login?redirect=/tournaments/${id}`}
                  className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  Log in to Register
                </Link>
              )}
              {isAuthenticated && isRegistered && (
                <button
                  onClick={handleCancelRegistration}
                  disabled={isCancelling}
                  className="inline-flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium px-4 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <UserX className="h-4 w-4" />
                  {isCancelling ? "Cancelling..." : "Cancel Registration"}
                </button>
              )}
              {isAuthenticated && !isRegistered && canRegister && registrationOpen && (
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  {isRegistering ? "Registering..." : "Register Now"}
                </button>
              )}
              {isAuthenticated && !isRegistered && canRegister && !registrationOpen && (
                <span className="text-sm text-slate-500 bg-surface-800 px-4 py-2.5 rounded-lg border border-surface-700">
                  Registration {new Date() < new Date(tournament.registrationStart) ? "Not Yet Open" : "Closed"}
                </span>
              )}
              {!canRegister && (
                <span className="text-sm text-slate-500 bg-surface-800 px-4 py-2.5 rounded-lg border border-surface-700">
                  Registration Unavailable
                </span>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Trophy className="h-4 w-4 text-slate-500" />
              <span>{tournament.format?.replace("_", " ") ?? "TBD"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>
                {new Date(tournament.tournamentStart).toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              {tournament.isOnline ? (
                <Globe className="h-4 w-4 text-slate-500" />
              ) : (
                <MapPin className="h-4 w-4 text-slate-500" />
              )}
              <span>{tournament.isOnline ? "Online" : tournament.venue || "TBD"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Users className="h-4 w-4 text-slate-500" />
              <span>
                {tournament._count?.registrations ?? 0}
                {tournament.maxParticipants ? ` / ${tournament.maxParticipants}` : ""}
              </span>
            </div>
            {tournament.prizePool && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Banknote className="h-4 w-4 text-slate-500" />
                <span>{tournament.prizePool}</span>
              </div>
            )}
            {tournament.registrationFee != null && tournament.registrationFee > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Banknote className="h-4 w-4 text-slate-500" />
                <span>SGD ${tournament.registrationFee} entry</span>
              </div>
            )}
            {tournament.isTeamBased && (
              <div className="flex items-center gap-2 text-sm text-purple-400">
                <Users className="h-4 w-4" />
                <span>Team-based</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-3">
                About This Tournament
              </h2>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap">
                {tournament.description}
              </div>
            </div>

            {tournament.rulesetUrl && (
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
                <a
                  href={tournament.rulesetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-400 text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Full Ruleset
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Organiser */}
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Organiser
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-brand-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-200 font-medium">
                    {tournament.organiser?.organiserProfile?.organisationName
                      || tournament.organiser?.email
                      || "Unknown"}
                  </p>
                  {tournament.organiser?.email && (
                    <p className="text-xs text-slate-500">
                      {tournament.organiser.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Key Dates
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Registration</span>
                  <span className="text-slate-300">
                    {new Date(tournament.registrationStart).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    –{" "}
                    {new Date(tournament.registrationEnd).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tournament</span>
                  <span className="text-slate-300">
                    {new Date(tournament.tournamentStart).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    –{" "}
                    {new Date(tournament.tournamentEnd).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Registration status for logged-in user */}
            {isAuthenticated && isRegistered && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-emerald-400">
                    You're Registered!
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Status:{" "}
                  <span className="text-slate-300 capitalize">
                    {registration.status.toLowerCase()}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
