"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Building2, Send } from "lucide-react";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

const ORGANISATION_TYPES = [
  { value: "Company", label: "Company" },
  { value: "School", label: "School" },
  { value: "Association", label: "Association" },
  { value: "Individual", label: "Individual" },
] as const;

interface FormData {
  organisationName: string;
  organisationType: string;
  contactPerson: string;
  contactNumber: string;
  website: string;
  description: string;
}

interface FormErrors {
  organisationName?: string;
  organisationType?: string;
  contactPerson?: string;
}

export default function BecomeOrganiserPage() {
  const { user, refreshSession } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    organisationName: "",
    organisationType: "",
    contactPerson: "",
    contactNumber: "",
    website: "",
    description: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Redirect if not a GAMER or already has organiser profile
  const canApply = user?.role === "GAMER" && !user?.organiserProfile;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.organisationName.trim()) {
      newErrors.organisationName = "Organisation name is required";
    }
    if (!formData.organisationType) {
      newErrors.organisationType = "Select an organisation type";
    }
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    field: keyof FormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await apiClient.post("/users/me/apply-organiser", {
        organisationName: formData.organisationName.trim(),
        organisationType: formData.organisationType,
        contactPerson: formData.contactPerson.trim(),
        contactNumber: formData.contactNumber.trim() || undefined,
        website: formData.website.trim() || undefined,
        description: formData.description.trim() || undefined,
      });

      toast.success(
        "Your organiser application has been submitted for review!",
      );
      await refreshSession();
      router.push("/profile");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          "Failed to submit application. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guard: already an organiser or not a gamer
  if (!canApply && user) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Become an Organiser
          </h1>
          <p className="text-slate-400 mt-1">
            Apply to create and manage events, tournaments, and teams.
          </p>
        </div>
        <div className="p-8 rounded-xl bg-surface-900 border border-surface-800 text-center">
          <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-200 mb-2">
            {user.organiserProfile
              ? "You're already an organiser"
              : "Organiser applications are for Gamer accounts"}
          </h2>
          <p className="text-slate-400 mb-6">
            {user.organiserProfile
              ? "You already have an organiser profile. Check your profile page for details."
              : "Only users with a Gamer account can apply to become an organiser."}
          </p>
          <Link
            href={user.organiserProfile ? "/profile" : "/dashboard"}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            {user.organiserProfile ? "View Profile" : "Back to Dashboard"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-100">
          Become an Organiser
        </h1>
        <p className="text-slate-400 mt-1">
          Tell us about your organisation. Once submitted, our team will review
          your application — usually within 1-2 business days.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-6 border-b border-surface-800">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-brand-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">
              Organisation Details
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Organisation Name */}
            <div>
              <label
                htmlFor="organisationName"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Organisation Name <span className="text-red-400">*</span>
              </label>
              <input
                id="organisationName"
                type="text"
                value={formData.organisationName}
                onChange={(e) =>
                  handleChange("organisationName", e.target.value)
                }
                placeholder="e.g. Singapore Esports League"
                className={`w-full px-4 py-3 bg-surface-800 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors text-sm ${
                  errors.organisationName
                    ? "border-red-500/50"
                    : "border-surface-700"
                }`}
              />
              {errors.organisationName && (
                <p className="text-red-400 text-xs mt-1.5">
                  {errors.organisationName}
                </p>
              )}
            </div>

            {/* Organisation Type */}
            <div>
              <label
                htmlFor="organisationType"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Organisation Type <span className="text-red-400">*</span>
              </label>
              <select
                id="organisationType"
                value={formData.organisationType}
                onChange={(e) =>
                  handleChange("organisationType", e.target.value)
                }
                className={`w-full px-4 py-3 bg-surface-800 border rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors text-sm ${
                  errors.organisationType
                    ? "border-red-500/50"
                    : "border-surface-700"
                }`}
              >
                <option value="" className="bg-surface-800">
                  Select a type...
                </option>
                {ORGANISATION_TYPES.map((t) => (
                  <option
                    key={t.value}
                    value={t.value}
                    className="bg-surface-800"
                  >
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.organisationType && (
                <p className="text-red-400 text-xs mt-1.5">
                  {errors.organisationType}
                </p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label
                htmlFor="contactPerson"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Contact Person <span className="text-red-400">*</span>
              </label>
              <input
                id="contactPerson"
                type="text"
                value={formData.contactPerson}
                onChange={(e) =>
                  handleChange("contactPerson", e.target.value)
                }
                placeholder="Full name of the primary contact"
                className={`w-full px-4 py-3 bg-surface-800 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors text-sm ${
                  errors.contactPerson
                    ? "border-red-500/50"
                    : "border-surface-700"
                }`}
              />
              {errors.contactPerson && (
                <p className="text-red-400 text-xs mt-1.5">
                  {errors.contactPerson}
                </p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label
                htmlFor="contactNumber"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Contact Number{" "}
                <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="contactNumber"
                type="text"
                value={formData.contactNumber}
                onChange={(e) =>
                  handleChange("contactNumber", e.target.value)
                }
                placeholder="e.g. +65 9123 4567"
                className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors text-sm"
              />
            </div>

            {/* Website */}
            <div>
              <label
                htmlFor="website"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Website <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="website"
                type="text"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="e.g. https://youro rg.com"
                className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Description <span className="text-slate-500">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Tell us about your organisation, its mission, and what kind of events you plan to run..."
                className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors text-sm resize-vertical"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Your application will be reviewed by the SCOGA team.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 text-sm"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Application
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
