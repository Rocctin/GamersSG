"use client";

import { useState, useEffect } from "react";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { CompletenessIndicator } from "@/components/profile/completeness-indicator";
import { PeopleYouMayKnowWidget } from "@/components/discovery/people-you-may-know";
import { useAuth } from "@/hooks/use-auth";
import apiClient from "@/lib/api-client";
import Link from "next/link";
import { ArrowRight, Gamepad2, Trophy, Users, Sword, Info, Building2, UsersRound } from "lucide-react";
import type { ProfileCompletenessDto } from "@gamers-sg/shared/dto";

const QUICK_LINKS = [
  {
    label: "Browse Tournaments",
    description: "Find and register for upcoming tournaments",
    href: "/tournaments",
    icon: Trophy,
  },
    {
    label: "Browse Events",
    description: "Find and register for upcoming events",
    href: "/events",
    icon: UsersRound,
  },
  {
    label: "Find Teams",
    description: "Discover teams looking for players like you",
    href: "/teams",
    icon: Users,
  },
  {
    label: "View Achievements",
    description: "Track your gaming accomplishments",
    href: "#",
    icon: Sword,
  },
  {
    label: "Member Store",
    description: "Exclusive deals for members",
    href: "#",
    icon: Gamepad2,
  },
  {
    label: "About Gamers.SG",
    description: "Learn more about the platform and our mission",
    href: "/about",
    icon: Info,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [profileCompleteness, setProfileCompleteness] =
    useState<ProfileCompletenessDto | null>(null);

  // Fetch profile completeness for GAMER users
  useEffect(() => {
    if (user?.role !== "GAMER" || !user?.gamerProfile?.username) return;
    let cancelled = false;
    async function fetchCompleteness() {
      try {
        const { data } = await apiClient.get(
          `/users/by-username/${user!.gamerProfile!.username}`,
        );
        if (!cancelled && data.success?.data?.profileCompleteness) {
          setProfileCompleteness(data.success.data.profileCompleteness);
        }
      } catch {
        // Non-critical
      }
    }
    fetchCompleteness();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Welcome & Stats Card */}
      <WelcomeCard />

      {/* Profile Completeness — shown to GAMER users */}
      {user?.role === "GAMER" && profileCompleteness && (
        <div className="max-w-xl">
          <CompletenessIndicator completeness={profileCompleteness} />
        </div>
      )}

      {/* People You May Know */}
      {user?.role === "GAMER" && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              People You May Know
            </h2>
            <Link
              href="/discover"
              className="text-xs text-brand-500 hover:text-brand-400 transition-colors"
            >
              View all
            </Link>
          </div>
          <PeopleYouMayKnowWidget compact maxItems={5} />
        </div>
      )}

      {/* Become an Organiser CTA — shown to GAMER users without an organiser profile */}
      {user?.role === "GAMER" && !user?.organiserProfile && (
        <Link
          href="/become-organiser"
          className="group flex items-center gap-5 p-6 rounded-xl bg-brand-500/10 border border-brand-500/20 hover:border-brand-500/40 hover:bg-brand-500/[0.14] transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
            <Building2 className="h-6 w-6 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-100 group-hover:text-brand-300 transition-colors">
              Become an Organiser
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Create and manage tournaments, events, and teams. Submit your
              application and get verified by SCOGA.
            </p>
          </div>
          <div className="shrink-0 bg-brand-500 hover:bg-brand-400 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 text-sm group-hover:shadow-lg group-hover:shadow-brand-500/25">
            Get Started
          </div>
        </Link>
      )}

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Quick Links
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group flex items-start gap-4 p-5 rounded-xl bg-surface-900 border border-surface-800 hover:border-brand-500/30 hover:bg-surface-800/50 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <link.icon className="h-5 w-5 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-200 group-hover:text-brand-400 transition-colors">
                  {link.label}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-brand-500 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
