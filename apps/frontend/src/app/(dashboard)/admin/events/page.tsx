"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdminEventsTable } from "@/components/admin/admin-events-table";
import { PendingEventsReview } from "@/components/admin/pending-events-review";

type Tab = "pending" | "all";

export default function AdminEventsPage() {
  const [tab, setTab] = useState<Tab>("pending");

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: "Pending Review" },
    { key: "all", label: "All Events" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Events</h1>
        <p className="text-slate-400 mt-1">
          Review pending events and manage all event listings.
        </p>
      </div>

      <div className="flex gap-1 mb-6 bg-surface-900 rounded-lg p-1 border border-surface-800 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              tab === t.key
                ? "bg-brand-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pending" ? <PendingEventsReview /> : <AdminEventsTable />}
    </div>
  );
}
