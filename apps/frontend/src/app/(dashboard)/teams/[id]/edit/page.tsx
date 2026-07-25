"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import type { TeamDto } from "@gamers-sg/shared/dto";

export default function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: teamId } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    tag: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    isRecruiting: true,
  });

  useEffect(() => {
    apiClient
      .get(`/teams/${teamId}`)
      .then(({ data }) => {
        const team = data.data ?? data;
        setForm({
          name: team.name || "",
          tag: team.tag || "",
          description: team.description || "",
          logoUrl: team.logoUrl || "",
          bannerUrl: team.bannerUrl || "",
          isRecruiting: team.isRecruiting ?? true,
        });
      })
      .catch(() => toast.error("Failed to load team"))
      .finally(() => setIsLoading(false));
  }, [teamId]);

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
      await apiClient.put(`/teams/${teamId}`, {
        name: form.name.trim(),
        tag: form.tag.trim(),
        description: form.description.trim() || undefined,
        logoUrl: form.logoUrl.trim() || undefined,
        bannerUrl: form.bannerUrl.trim() || undefined,
        isRecruiting: form.isRecruiting,
      });
      toast.success("Team updated");
      router.push(`/teams/${teamId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to update team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href={`/teams/${teamId}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Team
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-100">Edit Team</h1>
        <p className="text-slate-400 mt-1">Update your team's information.</p>
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
                className={`w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm uppercase ${
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
                Open to recruitment
              </span>
            </label>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-slate-100">Branding</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Logo URL
              </label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => updateField("logoUrl", e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Banner URL
              </label>
              <input
                type="url"
                value={form.bannerUrl}
                onChange={(e) => updateField("bannerUrl", e.target.value)}
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
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
