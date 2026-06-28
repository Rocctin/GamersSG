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
  Calendar,
  MapPin,
  Globe,
  Users,
  Banknote,
  Star,
  Shield,
  UserPlus,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import type { EventDto } from "@gamers-sg/shared/dto";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  PENDING_REVIEW: { label: "Pending Review", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  APPROVED: { label: "Approved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  REJECTED: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  ONGOING: { label: "Ongoing", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  COMPLETED: { label: "Completed", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<EventDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchEvent = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiPublic.get(`/events/${id}`);
      setEvent(data.data);
    } catch {
      toast.error("Failed to load event");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/events/${id}`);
      return;
    }
    setIsRegistering(true);
    try {
      await apiClient.post(`/events/${id}/register`);
      toast.success("Successfully registered!");
      await fetchEvent();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to register");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    setIsCancelling(true);
    try {
      await apiClient.delete(`/events/${id}/registrations/me`);
      toast.success("Registration cancelled");
      await fetchEvent();
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

  if (!event) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-200">Event not found</h2>
          <Link href="/events" className="text-brand-500 hover:underline text-sm mt-2 inline-block">
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_MAP[event.status] ?? STATUS_MAP.DRAFT;
  const registration = event.userRegistration;
  const isRegistered = registration && registration.status !== "CANCELLED";
  const canRegister =
    event.status === "APPROVED" || event.status === "ONGOING";
  const registrationOpen =
    new Date(event.registrationStart) <= new Date() &&
    new Date() <= new Date(event.registrationEnd);

  return (
    <div className="min-h-screen bg-surface-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Events
        </Link>

        {/* Header */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full border",
                    status.color,
                  )}
                >
                  {status.label}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20">
                  {event.eventType.charAt(0) + event.eventType.slice(1).toLowerCase()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-100 mb-1">
                {event.name}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {!isAuthenticated && canRegister && registrationOpen && (
                <Link
                  href={`/login?redirect=/events/${id}`}
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
                  Registration {new Date() < new Date(event.registrationStart) ? "Not Yet Open" : "Closed"}
                </span>
              )}
              {!canRegister && (
                <span className="text-sm text-slate-500 bg-surface-800 px-4 py-2.5 rounded-lg border border-surface-700">
                  Registration Unavailable
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>
                {new Date(event.eventStart).toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              {event.isOnline ? (
                <Globe className="h-4 w-4 text-slate-500" />
              ) : (
                <MapPin className="h-4 w-4 text-slate-500" />
              )}
              <span>{event.isOnline ? "Online" : event.venue || "TBD"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Users className="h-4 w-4 text-slate-500" />
              <span>
                {event._count?.registrations ?? 0}
                {event.capacity ? ` / ${event.capacity}` : ""}
              </span>
            </div>
            {event.registrationFee != null && event.registrationFee > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Banknote className="h-4 w-4 text-slate-500" />
                <span>SGD ${event.registrationFee}</span>
              </div>
            )}
            {event.pointsAwarded > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <Star className="h-4 w-4" />
                <span>+{event.pointsAwarded} points</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-3">
                About This Event
              </h2>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap">
                {event.description}
              </div>
            </div>
          </div>

          <div className="space-y-4">
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
                    {event.organiser?.organiserProfile?.organisationName
                      || event.organiser?.email
                      || "Unknown"}
                  </p>
                  {event.organiser?.email && (
                    <p className="text-xs text-slate-500">
                      {event.organiser.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Key Dates
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Registration</span>
                  <span className="text-slate-300">
                    {new Date(event.registrationStart).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    –{" "}
                    {new Date(event.registrationEnd).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Event</span>
                  <span className="text-slate-300">
                    {new Date(event.eventStart).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    –{" "}
                    {new Date(event.eventEnd).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {event.ageRestrictions && (
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">
                  Age Restrictions
                </h3>
                <p className="text-sm text-slate-400">{event.ageRestrictions}</p>
              </div>
            )}

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
