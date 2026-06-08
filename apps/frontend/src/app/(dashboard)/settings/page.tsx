"use client";

import { useAuth } from "@/hooks/use-auth";
import { Bell, Shield, Palette } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 mt-1">
          Manage your account preferences and notifications.
        </p>
      </div>

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
