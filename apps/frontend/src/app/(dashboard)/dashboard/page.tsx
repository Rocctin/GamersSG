"use client";

import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { ArrowRight, Gamepad2, Trophy, Users, Sword } from "lucide-react";

const QUICK_LINKS = [
  {
    label: "Browse Tournaments",
    description: "Find and register for upcoming tournaments",
    href: "#",
    icon: Trophy,
  },
  {
    label: "Find Teams",
    description: "Discover teams looking for players like you",
    href: "#",
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
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome & Stats Card */}
      <WelcomeCard />

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
