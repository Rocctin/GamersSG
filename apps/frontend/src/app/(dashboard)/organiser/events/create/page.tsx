"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

const EVENT_TYPES = [
  { value: "", label: "Select type..." },
  { value: "PHYSICAL", label: "Physical" },
  { value: "DIGITAL", label: "Digital" },
  { value: "HYBRID", label: "Hybrid" },
];

const ACCESS_TYPES = [
  { value: "PUBLIC", label: "Public" },
  { value: "MEMBERS_ONLY", label: "Members Only" },
  { value: "INVITE_ONLY", label: "Invite Only" },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "", description: "", eventType: "", accessType: "PUBLIC",
    capacity: "", registrationStart: "", registrationEnd: "",
    eventStart: "", eventEnd: "", isOnline: false, venue: "",
    ageRestrictions: "", registrationFee: "", pointsAwarded: "",
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.eventStart) e.eventStart = "Event start is required";
    if (!form.eventEnd) e.eventEnd = "Event end is required";
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
      await apiClient.post("/events", {
        name: form.name.trim(),
        description: form.description.trim(),
        eventType: form.eventType || undefined,
        accessType: form.accessType,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        registrationStart: new Date(form.registrationStart).toISOString(),
        registrationEnd: new Date(form.registrationEnd).toISOString(),
        eventStart: new Date(form.eventStart).toISOString(),
        eventEnd: new Date(form.eventEnd).toISOString(),
        isOnline: form.isOnline,
        venue: form.venue.trim() || undefined,
        ageRestrictions: form.ageRestrictions.trim() || undefined,
        registrationFee: form.registrationFee ? parseFloat(form.registrationFee) : undefined,
        pointsAwarded: form.pointsAwarded ? parseInt(form.pointsAwarded) : undefined,
      });
      toast.success("Event created as draft");
      router.push("/organiser/events");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to create event");
    } finally { setIsSubmitting(false); }
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 bg-surface-800 border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm ${
      errors[field] ? "border-red-500/50" : "border-surface-700"}`;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/organiser/events" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Create Event</h1>
        <p className="text-slate-400 mt-1">Fill in the details below. Save as draft, submit for review when ready.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800"><h2 className="text-lg font-semibold text-slate-100">Basic Information</h2></div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Event Name <span className="text-red-400">*</span></label>
              <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Singapore Gaming Meetup 2026" className={inputClass("name")} />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description <span className="text-red-400">*</span></label>
              <textarea rows={5} value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Describe the event..." className={inputClass("description")} />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Event Type</label>
                <select value={form.eventType} onChange={(e) => updateField("eventType", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm">
                  {EVENT_TYPES.map((t) => <option key={t.value} value={t.value} className="bg-surface-800">{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Access</label>
                <select value={form.accessType} onChange={(e) => updateField("accessType", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm">
                  {ACCESS_TYPES.map((a) => <option key={a.value} value={a.value} className="bg-surface-800">{a.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800"><h2 className="text-lg font-semibold text-slate-100">Dates</h2></div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Registration Start <span className="text-red-400">*</span></label><input type="datetime-local" value={form.registrationStart} onChange={(e) => updateField("registrationStart", e.target.value)} className={inputClass("registrationStart")} />{errors.registrationStart && <p className="text-red-400 text-xs mt-1">{errors.registrationStart}</p>}</div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Registration End <span className="text-red-400">*</span></label><input type="datetime-local" value={form.registrationEnd} onChange={(e) => updateField("registrationEnd", e.target.value)} className={inputClass("registrationEnd")} />{errors.registrationEnd && <p className="text-red-400 text-xs mt-1">{errors.registrationEnd}</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Event Start <span className="text-red-400">*</span></label><input type="datetime-local" value={form.eventStart} onChange={(e) => updateField("eventStart", e.target.value)} className={inputClass("eventStart")} />{errors.eventStart && <p className="text-red-400 text-xs mt-1">{errors.eventStart}</p>}</div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Event End <span className="text-red-400">*</span></label><input type="datetime-local" value={form.eventEnd} onChange={(e) => updateField("eventEnd", e.target.value)} className={inputClass("eventEnd")} />{errors.eventEnd && <p className="text-red-400 text-xs mt-1">{errors.eventEnd}</p>}</div>
            </div>
          </div>
        </div>
        <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-surface-800"><h2 className="text-lg font-semibold text-slate-100">Details</h2></div>
          <div className="p-6 space-y-4">
            <label className="flex items-center gap-3"><input type="checkbox" checked={form.isOnline} onChange={(e) => updateField("isOnline", e.target.checked)} className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500" /><span className="text-sm text-slate-300">Online event</span></label>
            {!form.isOnline && <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Venue</label><input type="text" value={form.venue} onChange={(e) => updateField("venue", e.target.value)} placeholder="e.g. SCOGA Arena" className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>}
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Capacity</label><input type="number" value={form.capacity} onChange={(e) => updateField("capacity", e.target.value)} placeholder="Unlimited" className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Registration Fee (SGD)</label><input type="number" step="0.01" value={form.registrationFee} onChange={(e) => updateField("registrationFee", e.target.value)} placeholder="Free" className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Points Awarded</label><input type="number" value={form.pointsAwarded} onChange={(e) => updateField("pointsAwarded", e.target.value)} placeholder="0" className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Age Restrictions</label><input type="text" value={form.ageRestrictions} onChange={(e) => updateField("ageRestrictions", e.target.value)} placeholder="e.g. 18+" className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>
            </div>
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
          <Save className="h-4 w-4" />{isSubmitting ? "Creating..." : "Create Event (Draft)"}
        </button>
      </form>
    </div>
  );
}
