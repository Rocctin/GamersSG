"use client";

import { OrganiserReviewTable } from "@/components/admin/organiser-review-table";

export default function AdminOrganisersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">
          Review Organisers
        </h1>
        <p className="text-slate-400 mt-1">
          Approve or reject pending organiser applications. All review decisions
          are logged for audit.
        </p>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-surface-800">
          <h2 className="text-lg font-semibold text-slate-100">
            Pending Applications
          </h2>
        </div>
        <div className="p-6">
          <OrganiserReviewTable />
        </div>
      </div>
    </div>
  );
}
