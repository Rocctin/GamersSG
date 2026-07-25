"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { GameSelector } from "@/components/games/game-selector";
import { CompletenessIndicator } from "@/components/profile/completeness-indicator";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Save,
  Eye,
  Users,
  Globe,
  Lock,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import type { EnhancedGamerProfileDto, ProfileCompletenessDto } from "@gamers-sg/shared/dto";

const VISIBILITY_OPTIONS = [
  {
    value: "PUBLIC",
    label: "Public",
    description: "Anyone can view your profile",
    icon: Globe,
  },
  {
    value: "MEMBERS_ONLY",
    label: "Members Only",
    description: "Only signed-in members can view",
    icon: Users,
  },
  {
    value: "PRIVATE",
    label: "Private",
    description: "Only you can see your profile",
    icon: Lock,
  },
] as const;

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCompleteness, setProfileCompleteness] =
    useState<ProfileCompletenessDto | null>(null);

  // Form state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "MEMBERS_ONLY" | "PRIVATE">("PUBLIC");
  const [gameIds, setGameIds] = useState<{ gameId: string; inGameRole?: string }[]>([]);

  // Populate form from current user data
  useEffect(() => {
    if (!user?.gamerProfile) {
      setIsLoading(false);
      return;
    }
    const gp = user.gamerProfile;
    setUsername(gp.username || "");
    setDisplayName(gp.displayName || "");
    setBio(gp.bio || "");
    setAvatarUrl(gp.avatarUrl || "");
    setBannerUrl(gp.bannerUrl || "");
    setVisibility((gp.visibility as any) || "PUBLIC");
    setGameIds(
      gp.games?.map((g) => ({ gameId: g.id, inGameRole: g.inGameRole })) || [],
    );

    // Fetch completeness from public profile endpoint
    async function fetchCompleteness() {
      try {
        const { data } = await apiClient.get(
          `/users/by-username/${gp!.username}`,
        );
        if (data.success?.data?.profileCompleteness) {
          setProfileCompleteness(data.success.data.profileCompleteness);
        }
      } catch {
        // Completeness fetch is non-critical
      }
    }
    fetchCompleteness();
    setIsLoading(false);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await apiClient.put("/users/me/profile", {
        username: username || undefined,
        displayName: displayName || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        bannerUrl: bannerUrl || undefined,
        visibility,
        gameIds: gameIds.length > 0 ? gameIds : undefined,
      });

      // Refresh session to update user context
      await refreshSession();
      toast.success("Profile updated successfully");

      // Re-fetch completeness
      if (username) {
        try {
          const { data } = await apiClient.get(`/users/by-username/${username}`);
          if (data.success?.data?.profileCompleteness) {
            setProfileCompleteness(data.success.data.profileCompleteness);
          }
        } catch {
          // non-critical
        }
      }
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message || "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!user?.gamerProfile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-slate-400">
          You need a gamer profile to edit it. Your profile should be created automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">Edit Profile</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Customise how your gamer profile appears to others.
          </p>
        </div>
        <Link
          href={`/u/${username}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-sm text-slate-300 hover:text-slate-100 hover:border-surface-600 transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Preview</span>
        </Link>
      </div>

      {/* Completeness indicator */}
      {profileCompleteness && (
        <CompletenessIndicator completeness={profileCompleteness} />
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Profile Identity
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-unique-username"
                className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-colors"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                This is your public URL: gamers.sg/u/{username || "..."}.
                Can only be changed once every 90 days.
              </p>
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you want to be known"
                className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other gamers about yourself..."
                className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-colors resize-none"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                A short bio helps other gamers connect with you. Max 500 characters recommended.
              </p>
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Media</h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="avatarUrl"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Avatar URL
              </label>
              <input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="bannerUrl"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Banner URL
              </label>
              <input
                id="bannerUrl"
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Profile Visibility
          </h2>

          <div className="grid gap-3">
            {VISIBILITY_OPTIONS.map((option) => {
              const isSelected = visibility === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                    isSelected
                      ? "bg-brand-500/10 border-brand-500/30"
                      : "bg-surface-800 border-surface-700 hover:border-surface-600",
                  )}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setVisibility(option.value)}
                    className="mt-0.5 w-4 h-4 text-brand-500 focus:ring-brand-500/50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-200">
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {option.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Games */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Games You Play
          </h2>
          <GameSelector selected={gameIds} onChange={setGameIds} />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/profile"
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
