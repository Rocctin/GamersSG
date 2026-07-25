"use client";

import { use } from "react";
import { PublicProfile } from "@/components/profile/public-profile";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { ArrowLeft, Gamepad2 } from "lucide-react";

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user } = useAuth();
  const isOwnProfile = user?.gamerProfile?.username === username;

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Top nav bar — minimal, not the full dashboard header */}
      <header className="sticky top-0 z-40 bg-surface-950/80 backdrop-blur-md border-b border-surface-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Back</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-brand-500" />
              <span className="text-sm font-bold text-slate-300">
                Gamers<span className="text-brand-500">.SG</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {!user && (
              <Link
                href="/login"
                className="text-sm font-medium text-brand-500 hover:text-brand-400 transition-colors"
              >
                Sign In
              </Link>
            )}
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="px-4 py-8">
        <PublicProfile
          username={username}
          isOwnProfile={isOwnProfile}
        />
      </main>
    </div>
  );
}
