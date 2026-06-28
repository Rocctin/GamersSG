"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", eventType: "", accessType: "PUBLIC",
    capacity: "", registrationStart: "", registrationEnd: "",
    eventStart: "", eventEnd: "", isOnline: false, venue: "",
    ageRestrictions: "", registrationFee: "", pointsAwarded: "",
  });

  useEffect(() => {
    apiClient.get(`/events/${id}`).then(({ data }) => {
      const e = data.data;
      setForm({
        name: e.name, description: e.description, eventType: e.eventType ?? "",
        accessType: e.accessType, capacity: e.capacity?.toString() ?? "",
        registrationStart: e.registrationStart?.slice(0, 16) ?? "",
        registrationEnd: e.registrationEnd?.slice(0, 16) ?? "",
        eventStart: e.eventStart?.slice(0, 16) ?? "",
        eventEnd: e.eventEnd?.slice(0, 16) ?? "",
        isOnline: e.isOnline, venue: e.venue ?? "",
        ageRestrictions: e.ageRestrictions ?? "",
        registrationFee: e.registrationFee?.toString() ?? "",
        pointsAwarded: e.pointsAwarded?.toString() ?? "",
      });
    }).catch(() => toast.error("Failed to load event")).finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      if (form.name.trim()) payload.name = form.name.trim();
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.eventType) payload.eventType = form.eventType;
      payload.accessType = form.accessType;
      payload.capacity = form.capacity ? parseInt(form.capacity) : undefined;
      if (form.registrationStart) payload.registrationStart = new Date(form.registrationStart).toISOString();
      if (form.registrationEnd) payload.registrationEnd = new Date(form.registrationEnd).toISOString();
      if (form.eventStart) payload.eventStart = new Date(form.eventStart).toISOString();
      if (form.eventEnd) payload.eventEnd = new Date(form.eventEnd).toISOString();
      payload.isOnline = form.isOnline;
      if (form.venue.trim()) payload.venue = form.venue.trim();
      if (form.ageRestrictions.trim()) payload.ageRestrictions = form.ageRestrictions.trim();
      payload.registrationFee = form.registrationFee ? parseFloat(form.registrationFee) : undefined;
      payload.pointsAwarded = form.pointsAwarded ? parseInt(form.pointsAwarded) : undefined;
      await apiClient.put(`/events/${id}`, payload);
      toast.success("Event updated");
      router.push("/organiser/events");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to update");
    } finally { setIsSubmitting(false); }
  };

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-brand-500 animate-spin" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/organiser/events" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"><ArrowLeft className="h-4 w-4" /> Back to Events</Link>
      <div><h1 className="text-2xl font-bold text-slate-100">Edit Event</h1></div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label><input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label><textarea rows={5} value={form.description} onChange={(e) => updateField("description", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Event Type</label>
              <select value={form.eventType} onChange={(e) => updateField("eventType", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm">
                <option value="" className="bg-surface-800">Select type...</option>
                <option value="PHYSICAL" className="bg-surface-800">Physical</option>
                <option value="DIGITAL" className="bg-surface-800">Digital</option>
                <option value="HYBRID" className="bg-surface-800">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Access</label>
              <select value={form.accessType} onChange={(e) => updateField("accessType", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm">
                <option value="PUBLIC" className="bg-surface-800">Public</option>
                <option value="MEMBERS_ONLY" className="bg-surface-800">Members Only</option>
                <option value="INVITE_ONLY" className="bg-surface-800">Invite Only</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Event Start</label><input type="datetime-local" value={form.eventStart} onChange={(e) => updateField("eventStart", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Event End</label><input type="datetime-local" value={form.eventEnd} onChange={(e) => updateField("eventEnd", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Registration Start</label><input type="datetime-local" value={form.registrationStart} onChange={(e) => updateField("registrationStart", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Registration End</label><input type="datetime-local" value={form.registrationEnd} onChange={(e) => updateField("registrationEnd", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>
          </div>
          <label className="flex items-center gap-3"><input type="checkbox" checked={form.isOnline} onChange={(e) => updateField("isOnline", e.target.checked)} className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500" /><span className="text-sm text-slate-300">Online event</span></label>
          {!form.isOnline && <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Venue</label><input type="text" value={form.venue} onChange={(e) => updateField("venue", e.target.value)} className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-slate-200 text-sm" /></div>}
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-surface-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm"><Save className="h-4 w-4" />{isSubmitting ? "Saving..." : "Save Changes"}</button>
      </form>
    </div>
  );
}
