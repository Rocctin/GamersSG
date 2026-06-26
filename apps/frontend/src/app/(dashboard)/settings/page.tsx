"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Shield, Palette, Gamepad2 } from "lucide-react";
import { GameSelector } from "@/components/games/game-selector";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, refreshSession } = useAuth();
  const [savedGames, setSavedGames] = useState<
    { gameId: string; inGameRole?: string }[]
  >(user?.gamerProfile?.games?.map((g) => ({
    gameId: g.id,
    inGameRole: g.inGameRole,
  })) ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const handleGamesChange = useCallback(
    (games: { gameId: string; inGameRole?: string }[]) => {
      setSavedGames(games);
    },
    [],
  );

  const handleSaveGames = async () => {
    setIsSaving(true);
    try {
      await apiClient.put("/users/me/profile", {
        gameIds: savedGames,
      });
      toast.success("Games saved successfully");
      await refreshSession();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Failed to save games",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 mt-1">
          Manage your account preferences and notifications.
        </p>
      </div>

      {/* My Games */}
      {user?.gamerProfile && (
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-6 border-b border-surface-800">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Gamepad2 className="h-4 w-4 text-brand-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">My Games</h2>
          </div>
          <div className="p-6 space-y-4">
            <GameSelector
              selected={savedGames}
              onChange={handleGamesChange}
            />
            <button
              type="button"
              onClick={handleSaveGames}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 text-sm"
            >
              {isSaving ? "Saving..." : "Save Games"}
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-surface-800">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Bell className="h-4 w-4 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100">Notifications</h2>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Event reminders", desc: "Get notified about upcoming events you've registered for" },
            { label: "Achievement alerts", desc: "Receive notifications when you earn new achievements" },
            { label: "Tournament updates", desc: "Stay updated on tournament brackets and results" },
            { label: "Member store deals", desc: "Be the first to know about new store items and discounts" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-700 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-surface-800">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Shield className="h-4 w-4 text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100">Security</h2>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-400">
            Account security is managed via your authentication method.
            For magic link sign-in, each link is single-use and expires after 30 minutes.
          </p>
          <p className="text-sm text-slate-400">
            Future: SingPass-verified identity will provide additional security for Singapore residents.
          </p>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-surface-800">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Palette className="h-4 w-4 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100">Appearance</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-400">
            Gamers.SG currently uses a unified dark theme across the platform.
            Additional theme options will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
