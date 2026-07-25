import { AdminTeamsTable } from "@/components/admin/admin-teams-table";

export default function AdminTeamsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Teams Management</h1>
        <p className="text-slate-400 mt-1">
          View all teams, manage rosters, disband or permanently delete teams.
        </p>
      </div>
      <AdminTeamsTable />
    </div>
  );
}
