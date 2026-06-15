"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Organiser {
  id: string;
  userId: string;
  email: string;
  organisationName: string;
  organisationType: string;
  website?: string;
  contactPerson: string;
  contactNumber?: string;
  description?: string;
  submittedAt: string;
}

export function OrganiserReviewTable() {
  const [organisers, setOrganisers] = useState<Organiser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrganisers = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/admin/organisers");
      setOrganisers(data.data ?? []);
    } catch {
      toast.error("Failed to load pending organisers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisers();
  }, []);

  const handleReview = async (
    userId: string,
    action: "APPROVE" | "REJECT",
    rejectionReason?: string,
  ) => {
    setActionLoading(userId);
    try {
      await apiClient.post(`/admin/organisers/${userId}/review`, {
        action,
        ...(rejectionReason && { rejectionReason }),
      });
      toast.success(
        action === "APPROVE" ? "Organiser approved" : "Organiser rejected",
      );
      // Remove from list
      setOrganisers((prev) => prev.filter((o) => o.userId !== userId));
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Failed to review organiser",
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (organisers.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No pending organiser applications.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-800">
            <th className="text-left py-3 px-4 text-slate-400 font-medium">
              Organisation
            </th>
            <th className="text-left py-3 px-4 text-slate-400 font-medium">
              Contact
            </th>
            <th className="text-left py-3 px-4 text-slate-400 font-medium">
              Type
            </th>
            <th className="text-left py-3 px-4 text-slate-400 font-medium">
              Submitted
            </th>
            <th className="text-right py-3 px-4 text-slate-400 font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {organisers.map((org) => (
            <tr
              key={org.id}
              className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors"
            >
              <td className="py-3 px-4">
                <p className="text-slate-200 font-medium">
                  {org.organisationName}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{org.email}</p>
              </td>
              <td className="py-3 px-4">
                <p className="text-slate-300">{org.contactPerson}</p>
                {org.contactNumber && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    {org.contactNumber}
                  </p>
                )}
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-surface-800 text-slate-400 border border-surface-700">
                  {org.organisationType}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-500">
                {new Date(org.submittedAt).toLocaleDateString("en-SG")}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleReview(org.userId, "APPROVE")}
                    disabled={actionLoading === org.userId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Rejection reason:");
                      if (!reason) {
                        toast.error("Rejection reason is required");
                        return;
                      }
                      handleReview(org.userId, "REJECT", reason);
                    }}
                    disabled={actionLoading === org.userId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
