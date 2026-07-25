"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { ArrowLeft, Save, X, Plus } from "lucide-react";

interface GameOption {
  id: string;
  name: string;
  slug: string;
  coverImage?: string;
}

export default function CreateTeamPage() {
  const router = useRouter();
  const [games, setGames] = useState<GameOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    tag: "",
    description: "",
    isRecruiting: true,
  });
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);

  useEffect(() => {
    apiClient
      .get("/games")
      .then(({ data }) => {
        setGames(data.data ?? []);
      })
      .catch(() => {});
  }, []);

  const availableGames = games.filter((g) => !selectedGameIds.includes(g.id));

  const addGame = (gameId: string) => {
    if (selectedGameIds.length >= 10) return;
    setSelectedGameIds((prev) => [...prev, gameId]);
  };

  const removeGame = (gameId: string) => {
    setSelectedGameIds((prev) => prev.filter((id) => id !== gameId));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Team name is required";
    if (!form.tag.trim()) e.tag = "Team tag is required";
    else if (!/^[A-Za-z0-9]{2,6}$/.test(form.tag.trim()))
      e.tag = "Tag must be 2-6 alphanumeric characters";
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
        tag: form.tag.trim(),
        description: form.description.trim() || undefined,
        isRecruiting: form.isRecruiting,
        gameIds: selectedGameIds.length > 0 ? selectedGameIds : undefined,
      };

      const { data } = await apiClient.post("/teams", payload);
      toast.success("Team created!");
      router.push(`/teams/${data.id ?? data.data?.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to create team");
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
        href="/teams"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Teams
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-100">Create Team</h1>
        <p className="text-slate-400 mt-1">
          Create your team and invite members. You'll be the captain.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-slate-100">
              Team Information
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Team Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Singapore Sentinels"
                className={`w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm ${
                  errors.name ? "border-red-500/50" : "border-surface-700"
                }`}
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Team Tag <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.tag}
                onChange={(e) =>
                  updateField("tag", e.target.value.toUpperCase())
                }
                maxLength={6}
                placeholder="e.g. SG"
                className={`w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm uppercase ${
                  errors.tag ? "border-red-500/50" : "border-surface-700"
                }`}
              />
              <p className="text-xs text-slate-500 mt-1">
                2-6 alphanumeric characters. Must be unique.
              </p>
              {errors.tag && (
                <p className="text-red-400 text-xs mt-1">{errors.tag}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Tell others about your team..."
                className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm resize-vertical"
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isRecruiting}
                onChange={(e) => updateField("isRecruiting", e.target.checked)}
                className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-300">
                Open to recruitment — your team will appear in public searches
              </span>
            </label>
          </div>
        </div>

        {/* Games */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-slate-100">Games</h2>
            <p className="text-sm text-slate-400 mt-1">
              Select the games your team plays.
            </p>
          </div>
          <div className="p-6 space-y-4">
            {/* Selected games */}
            {selectedGameIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedGameIds.map((gameId) => {
                  const game = games.find((g) => g.id === gameId);
                  return (
                    <span
                      key={gameId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-sm text-brand-400"
                    >
                      {game?.name || gameId}
                      <button
                        type="button"
                        onClick={() => removeGame(gameId)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Add game dropdown */}
            {availableGames.length > 0 ? (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) addGame(e.target.value);
                  e.target.value = "";
                }}
                className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
              >
                <option value="" className="bg-surface-800">
                  {selectedGameIds.length === 0
                    ? "Select games..."
                    : "Add another game..."}
                </option>
                {availableGames.map((g) => (
                  <option key={g.id} value={g.id} className="bg-surface-800">
                    {g.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-500">
                {games.length === 0
                  ? "No games available"
                  : "All available games selected"}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          {isSubmitting ? "Creating..." : "Create Team"}
        </button>
      </form>
    </div>
  );
}
