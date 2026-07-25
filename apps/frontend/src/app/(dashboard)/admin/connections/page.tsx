import { AdminConnectionsTable } from "@/components/admin/admin-connections-table";

export default function AdminConnectionsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Connections Oversight</h1>
        <p className="text-slate-400 mt-1">
          Oversee user connections — search, filter, and remove connections.
        </p>
      </div>
      <AdminConnectionsTable />
    </div>
  );
}
