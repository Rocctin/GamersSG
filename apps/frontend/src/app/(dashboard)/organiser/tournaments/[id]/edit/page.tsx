"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import type { TournamentDto } from "@gamers-sg/shared/dto";

interface GameOption {
  id: string;
  name: string;
  slug: string;
}

export default function EditTournamentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [games, setGames] = useState<GameOption[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");

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

  useEffect(() => {
    Promise.all([
      apiClient.get(`/tournaments/${id}`),
      apiClient.get("/games"),
    ]).then(([tRes, gRes]) => {
      const t: TournamentDto = tRes.data.data;
      setGames(gRes.data.data ?? []);
      setSelectedGameId(t.gameId ?? "");
      setForm({
        name: t.name,
        description: t.description,
        format: t.format ?? "",
        platform: t.platform ?? "",
        registrationStart: t.registrationStart ? t.registrationStart.slice(0, 16) : "",
        registrationEnd: t.registrationEnd ? t.registrationEnd.slice(0, 16) : "",
        tournamentStart: t.tournamentStart ? t.tournamentStart.slice(0, 16) : "",
        tournamentEnd: t.tournamentEnd ? t.tournamentEnd.slice(0, 16) : "",
        isOnline: t.isOnline,
        venue: t.venue ?? "",
        isTeamBased: t.isTeamBased,
        maxParticipants: t.maxParticipants?.toString() ?? "",
        prizePool: t.prizePool ?? "",
        registrationFee: t.registrationFee?.toString() ?? "",
        rulesetUrl: t.rulesetUrl ?? "",
      });
    }).catch(() => toast.error("Failed to load tournament")).finally(() => setIsLoading(false));
  }, [id]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      if (form.name.trim()) payload.name = form.name.trim();
      if (form.description.trim()) payload.description = form.description.trim();
      if (selectedGameId) payload.gameId = selectedGameId;
      if (form.format) payload.format = form.format;
      if (form.platform.trim()) payload.platform = form.platform.trim();
      if (form.tournamentStart) payload.tournamentStart = new Date(form.tournamentStart).toISOString();
      if (form.tournamentEnd) payload.tournamentEnd = new Date(form.tournamentEnd).toISOString();
      if (form.registrationStart) payload.registrationStart = new Date(form.registrationStart).toISOString();
      if (form.registrationEnd) payload.registrationEnd = new Date(form.registrationEnd).toISOString();
      payload.isOnline = form.isOnline;
      if (form.venue.trim()) payload.venue = form.venue.trim();
      payload.isTeamBased = form.isTeamBased;
      payload.maxParticipants = form.maxParticipants ? parseInt(form.maxParticipants) : undefined;
      if (form.prizePool.trim()) payload.prizePool = form.prizePool.trim();
      payload.registrationFee = form.registrationFee ? parseFloat(form.registrationFee) : undefined;
      if (form.rulesetUrl.trim()) payload.rulesetUrl = form.rulesetUrl.trim();

      await apiClient.put(`/tournaments/${id}`, payload);
      toast.success("Tournament updated");
      router.push("/organiser/tournaments");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm ${
      errors[field] ? "border-red-500/50" : "border-surface-700"
    }`;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/organiser/tournaments" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Tournaments
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Edit Tournament</h1>
        <p className="text-slate-400 mt-1">Update your tournament details.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800"><h2 className="text-lg font-semibold text-slate-100">Basic Information</h2></div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Name <span className="text-red-400">*</span></label>
              <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} className={inputClass("name")} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description <span className="text-red-400">*</span></label>
              <textarea rows={5} value={form.description} onChange={(e) => updateField("description", e.target.value)} className={inputClass("description")} />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Game</label>
              <select value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm">
                <option value="" className="bg-surface-800">Select a game...</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id} className="bg-surface-800">{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Format</label>
              <select
                value={form.format}
                onChange={(e) => updateField("format", e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
              >
                <option value="" className="bg-surface-800">Select format...</option>
                <option value="BEST_OF_ONE" className="bg-surface-800">Best of One</option>
                <option value="BEST_OF_THREE" className="bg-surface-800">Best of Three</option>
                <option value="OTHER" className="bg-surface-800">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Platform</label>
              <input
                type="text"
                value={form.platform}
                onChange={(e) => updateField("platform", e.target.value)}
                placeholder="e.g. PC, Mobile, Console"
                className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Registration Start</label>
                <input type="datetime-local" value={form.registrationStart} onChange={(e) => updateField("registrationStart", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Registration End</label>
                <input type="datetime-local" value={form.registrationEnd} onChange={(e) => updateField("registrationEnd", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tournament Start</label>
                <input type="datetime-local" value={form.tournamentStart} onChange={(e) => updateField("tournamentStart", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tournament End</label>
                <input type="datetime-local" value={form.tournamentEnd} onChange={(e) => updateField("tournamentEnd", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm" />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800"><h2 className="text-lg font-semibold text-slate-100">Location & Setup</h2></div>
          <div className="p-6 space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={form.isOnline} onChange={(e) => updateField("isOnline", e.target.checked)} className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500" />
              <span className="text-sm text-slate-300">Online tournament</span>
            </label>
            {!form.isOnline && <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Venue</label><input type="text" value={form.venue} onChange={(e) => updateField("venue", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>}
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={form.isTeamBased} onChange={(e) => updateField("isTeamBased", e.target.checked)} className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500" />
              <span className="text-sm text-slate-300">Team-based tournament</span>
            </label>
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
          <Save className="h-4 w-4" />{isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
