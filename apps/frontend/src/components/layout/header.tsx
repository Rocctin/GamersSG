"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Gamepad2, Menu, LogOut, User, Settings, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-md border-b border-surface-800">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-800 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Right side */}
        <div className="flex-1 lg:flex-none" />

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <span className="text-sm font-bold text-brand-500">
                {user?.email?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
            <span className="hidden sm:block text-sm text-slate-300 truncate max-w-[160px]">
              {user?.email}
            </span>
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-900 border border-surface-800 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-surface-800">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">
                    {user?.role?.toLowerCase()}
                  </p>
                </div>
                <div className="p-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-surface-800 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Gamepad2 className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-surface-800 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-surface-800 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  {isAdmin(user) && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-brand-400 hover:bg-surface-800 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                </div>
                <div className="border-t border-surface-800 p-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-surface-800 transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
