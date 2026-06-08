"use client";

import { UserManagementTable } from "@/components/admin/user-management-table";

export default function AdminUsersPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Manage Users</h1>
        <p className="text-slate-400 mt-1">
          View all platform users, search by email, and manage account statuses.
        </p>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-surface-800">
          <h2 className="text-lg font-semibold text-slate-100">All Users</h2>
        </div>
        <div className="p-6">
          <UserManagementTable />
        </div>
      </div>
    </div>
  );
}
