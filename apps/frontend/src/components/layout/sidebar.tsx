"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { isAdmin, isOrganiser } from "@/lib/auth";
import apiClient from "@/lib/api-client";
import {
  Gamepad2,
  X,
  LayoutDashboard,
  User,
  Users,
  Settings,
  Info,
  Shield,
  Building2,
  ClipboardList,
  Swords,
  Calendar,
  Trophy,
  UserPlus,
  Compass,
  UsersRound,
  UserRoundCheck,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Connections", href: "/connections", icon: Users },
  { label: "Teams", href: "/teams", icon: UserPlus },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "About", href: "/about", icon: Info },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Admin Panel", href: "/admin", icon: Shield, adminOnly: true },
  { label: "Users", href: "/admin/users", icon: Users, adminOnly: true },
  { label: "Organisers", href: "/admin/organisers", icon: Building2, adminOnly: true },
  { label: "Teams", href: "/admin/teams", icon: UsersRound, adminOnly: true },
  { label: "Tournaments", href: "/admin/tournaments", icon: Trophy, adminOnly: true },
  { label: "Events", href: "/admin/events", icon: Calendar, adminOnly: true },
  { label: "Games", href: "/admin/games", icon: Swords, adminOnly: true },
  { label: "Connections", href: "/admin/connections", icon: UserRoundCheck, adminOnly: true },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ClipboardList, adminOnly: true },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function Sidebar({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const showAdmin = isAdmin(user);
  const showOrganiser = isOrganiser(user);
  const [pendingConnectionsCount, setPendingConnectionsCount] = useState(0);

  // Fetch pending connection request count
  useEffect(() => {
    if (user?.role !== "GAMER") return;
    let cancelled = false;
    async function fetchCount() {
      try {
        const { data } = await apiClient.get("/connections/pending-count");
        if (!cancelled) {
          setPendingConnectionsCount(data.count || 0);
        }
      } catch {
        // Non-critical
      }
    }
    fetchCount();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <nav className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-surface-800">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <Gamepad2 className="h-7 w-7 text-brand-500" />
          <span className="text-lg font-bold text-slate-100">
            Gamers<span className="text-brand-500">.SG</span>
          </span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-800 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {/* Main navigation */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, pathname);
            const showBadge =
              item.href === "/connections" && pendingConnectionsCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                    : "text-slate-300 hover:text-slate-100 hover:bg-surface-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                    {pendingConnectionsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Become Organiser — shown to gamers who haven't applied yet */}
        {user?.role === "GAMER" && !user?.organiserProfile && (
          <div className="mt-6">
            <Link
              href="/become-organiser"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive("/become-organiser", pathname)
                  ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                  : "text-slate-300 hover:text-slate-100 hover:bg-surface-800"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Become an Organiser
            </Link>
          </div>
        )}

        {/* Organiser section */}
        {showOrganiser && (
          <>
            <div className="mt-6 mb-2 px-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Organiser Portal
              </span>
            </div>
            <div className="space-y-1">
              <Link
                href="/organiser"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/organiser", pathname)
                    ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                    : "text-slate-300 hover:text-slate-100 hover:bg-surface-800"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Organiser Portal
              </Link>
              <Link
                href="/organiser/tournaments"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/organiser/tournaments", pathname)
                    ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                    : "text-slate-300 hover:text-slate-100 hover:bg-surface-800"
                }`}
              >
                <Swords className="h-4 w-4" />
                Tournaments
              </Link>
              <Link
                href="/organiser/events"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/organiser/events", pathname)
                    ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                    : "text-slate-300 hover:text-slate-100 hover:bg-surface-800"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Events
              </Link>
            </div>
          </>
        )}

        {/* Admin section */}
        {showAdmin && (
          <>
            <div className="mt-6 mb-2 px-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Administration
              </span>
            </div>
            <div className="space-y-1">
              {ADMIN_ITEMS.map((item) => {
                const active = isActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                        : "text-slate-300 hover:text-slate-100 hover:bg-surface-800"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-surface-800 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-500">
              {user?.email?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 truncate">{user?.email}</p>
            <p className="text-xs text-slate-500 capitalize">
              {user?.role?.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
}
