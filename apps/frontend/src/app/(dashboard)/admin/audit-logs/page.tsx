"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AuditLogEntry {
  id: string;
  actorEmail: string;
  targetEmail: string | null;
  action: string;
  targetType: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get("/admin/audit-logs", {
        params: { page, pageSize: 25 },
      });
      setLogs(data.data ?? []);
      setMeta(data.meta ?? { total: 0, page: 1, totalPages: 1 });
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Audit Logs</h1>
        <p className="text-slate-400 mt-1">
          Immutable record of all admin actions for PDPA compliance and
          accountability.
        </p>
      </div>

      <div className="bg-surface-900 border border-surface-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-surface-800">
          <h2 className="text-lg font-semibold text-slate-100">
            Action History
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {meta.total} total entries recorded
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-800">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      Admin
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      Action
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      Target
                    </th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">
                      Details
                    </th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="text-slate-300">{log.actorEmail}</p>
                        {log.ipAddress && (
                          <p className="text-slate-500 text-xs mt-0.5 font-mono">
                            {log.ipAddress}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-surface-800 text-slate-300 border border-surface-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-300">
                          {log.targetEmail ?? "N/A"}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {log.targetType}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        {log.metadata ? (
                          <pre className="text-xs text-slate-500 font-mono max-w-xs truncate">
                            {JSON.stringify(log.metadata, null, 0)}
                          </pre>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {new Date(log.createdAt).toLocaleString("en-SG", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between p-6 border-t border-surface-800">
                <p className="text-xs text-slate-500">
                  Page {meta.page} of {meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchLogs(meta.page - 1)}
                    disabled={meta.page <= 1}
                    className="px-3 py-1.5 rounded-lg bg-surface-800 text-sm text-slate-300 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchLogs(meta.page + 1)}
                    disabled={meta.page >= meta.totalPages}
                    className="px-3 py-1.5 rounded-lg bg-surface-800 text-sm text-slate-300 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
