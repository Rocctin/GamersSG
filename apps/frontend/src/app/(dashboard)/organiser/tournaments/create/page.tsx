"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

interface GameOption {
  id: string;
  name: string;
  slug: string;
}

const FORMATS = [
  { value: "", label: "Select format..." },
  { value: "BEST_OF_ONE", label: "Best of One" },
  { value: "BEST_OF_THREE", label: "Best of Three" },
  { value: "OTHER", label: "Other" },
];

export default function CreateTournamentPage() {
  const router = useRouter();
  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    apiClient.get("/games").then(({ data }) => {
      setGames(data.data ?? []);
    }).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    name: "",
    description: "",
    format: "",
    platform: "",
    registrationStart: "",
    registrationEnd: "",
    tournamentStart: "",
    tournamentEnd: "",
    isOnline: false,
    venue: "",
    isTeamBased: false,
    maxParticipants: "",
    prizePool: "",
    registrationFee: "",
    rulesetUrl: "",
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!selectedGameId) e.game = "Select a game";
    if (!form.tournamentStart) e.tournamentStart = "Start date is required";
    if (!form.tournamentEnd) e.tournamentEnd = "End date is required";
    if (!form.registrationStart) e.registrationStart = "Registration start is required";
    if (!form.registrationEnd) e.registrationEnd = "Registration end is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        gameId: selectedGameId,
        format: form.format || undefined,
        platform: form.platform.trim() || undefined,
        registrationStart: new Date(form.registrationStart).toISOString(),
        registrationEnd: new Date(form.registrationEnd).toISOString(),
        tournamentStart: new Date(form.tournamentStart).toISOString(),
        tournamentEnd: new Date(form.tournamentEnd).toISOString(),
        isOnline: form.isOnline,
        venue: form.venue.trim() || undefined,
        isTeamBased: form.isTeamBased,
        maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
        prizePool: form.prizePool.trim() || undefined,
        registrationFee: form.registrationFee ? parseFloat(form.registrationFee) : undefined,
        rulesetUrl: form.rulesetUrl.trim() || undefined,
      };

      const { data } = await apiClient.post("/tournaments", payload);
      toast.success("Tournament created as draft");
      router.push(`/organiser/tournaments`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to create tournament");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/organiser/tournaments"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Tournaments
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-100">Create Tournament</h1>
        <p className="text-slate-400 mt-1">
          Fill in the details below. Your tournament will be saved as a draft
          — submit it for admin review when ready.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-slate-100">
              Basic Information
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Tournament Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Singapore Valorant Championship 2026"
                className={`w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm ${
                  errors.name ? "border-red-500/50" : "border-surface-700"
                }`}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe the tournament, rules, and what participants can expect..."
                className={`w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm resize-vertical ${
                  errors.description ? "border-red-500/50" : "border-surface-700"
                }`}
              />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Game <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
                className={`w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm ${
                  errors.game ? "border-red-500/50" : "border-surface-700"
                }`}
              >
                <option value="" className="bg-surface-800">Select a game...</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id} className="bg-surface-800">
                    {g.name}
                  </option>
                ))}
              </select>
              {errors.game && <p className="text-red-400 text-xs mt-1">{errors.game}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Format
              </label>
              <select
                value={form.format}
                onChange={(e) => updateField("format", e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value} className="bg-surface-800">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Platform
              </label>
              <input
                type="text"
                value={form.platform}
                onChange={(e) => updateField("platform", e.target.value)}
                placeholder="e.g. PC, Mobile, Console"
                className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-slate-100">Dates</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Registration Start <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.registrationStart}
                  onChange={(e) => updateField("registrationStart", e.target.value)}
                  className={`w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm ${
                    errors.registrationStart ? "border-red-500/50" : "border-surface-700"
                  }`}
                />
                {errors.registrationStart && <p className="text-red-400 text-xs mt-1">{errors.registrationStart}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Registration End <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.registrationEnd}
                  onChange={(e) => updateField("registrationEnd", e.target.value)}
                  className={`w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm ${
                    errors.registrationEnd ? "border-red-500/50" : "border-surface-700"
                  }`}
                />
                {errors.registrationEnd && <p className="text-red-400 text-xs mt-1">{errors.registrationEnd}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Tournament Start <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.tournamentStart}
                  onChange={(e) => updateField("tournamentStart", e.target.value)}
                  className={`w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm ${
                    errors.tournamentStart ? "border-red-500/50" : "border-surface-700"
                  }`}
                />
                {errors.tournamentStart && <p className="text-red-400 text-xs mt-1">{errors.tournamentStart}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Tournament End <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.tournamentEnd}
                  onChange={(e) => updateField("tournamentEnd", e.target.value)}
                  className={`w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm ${
                    errors.tournamentEnd ? "border-red-500/50" : "border-surface-700"
                  }`}
                />
                {errors.tournamentEnd && <p className="text-red-400 text-xs mt-1">{errors.tournamentEnd}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Location & Format */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-slate-100">
              Location & Setup
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isOnline}
                onChange={(e) => {
                  updateField("isOnline", e.target.checked);
                  if (e.target.checked) updateField("venue", "");
                }}
                className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-300">Online tournament</span>
            </label>
            {!form.isOnline && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Venue
                </label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => updateField("venue", e.target.value)}
                  placeholder="e.g. SCOGA Arena, 123 Orchard Road"
                  className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                />
              </div>
            )}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isTeamBased}
                onChange={(e) => updateField("isTeamBased", e.target.checked)}
                className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-300">Team-based tournament</span>
            </label>
          </div>
        </div>

        {/* Additional */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-slate-100">
              Additional Details
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Max Participants
                </label>
                <input
                  type="number"
                  value={form.maxParticipants}
                  onChange={(e) => updateField("maxParticipants", e.target.value)}
                  placeholder="Unlimited"
                  className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Registration Fee (SGD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.registrationFee}
                  onChange={(e) => updateField("registrationFee", e.target.value)}
                  placeholder="Free"
                  className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Prize Pool
              </label>
              <input
                type="text"
                value={form.prizePool}
                onChange={(e) => updateField("prizePool", e.target.value)}
                placeholder="e.g. SGD 5,000"
                className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Ruleset URL
              </label>
              <input
                type="url"
                value={form.rulesetUrl}
                onChange={(e) => updateField("rulesetUrl", e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? "Creating..." : "Create Tournament (Draft)"}
        </button>
      </form>
    </div>
  );
}
