"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ConnectionCard } from "@/components/connections/connection-card";
import { ConnectButton } from "@/components/connections/connect-button";
import { Loader2, Users, UserPlus, UserCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import type { ConnectionDto, ConnectionListResponse } from "@gamers-sg/shared/dto";

type Tab = "connected" | "received" | "sent";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "connected", label: "Connected", icon: UserCheck },
  { key: "received", label: "Requests", icon: UserPlus },
  { key: "sent", label: "Sent", icon: Clock },
];

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("connected");
  const [connections, setConnections] = useState<ConnectionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCounts, setPendingCounts] = useState({ received: 0, sent: 0 });

  const viewerId = user?.id || "";

  const fetchConnections = useCallback(
    async (tab: Tab) => {
      setIsLoading(true);
      try {
        let status: string | undefined;
        if (tab === "connected") {
          status = "ACCEPTED";
        } else if (tab === "received" || tab === "sent") {
          status = "PENDING";
        }

        const { data } = await apiClient.get<ConnectionListResponse>(
          "/connections",
          { params: { status, pageSize: 100 } },
        );

        const all = data.connections || [];

        if (tab === "received") {
          // Only where viewer is the addressee
          setConnections(all.filter((c) => c.addresseeId === viewerId));
        } else if (tab === "sent") {
          // Only where viewer is the requester
          setConnections(all.filter((c) => c.requesterId === viewerId));
        } else {
          setConnections(all);
        }
      } catch {
        toast.error("Failed to load connections");
      } finally {
        setIsLoading(false);
      }
    },
    [viewerId],
  );

  // Fetch counts for tab badges
  const fetchCounts = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/connections/pending-count");
      setPendingCounts((prev) => ({ ...prev, received: data.count || 0 }));

      // For sent count, fetch all pending and filter
      const res = await apiClient.get<ConnectionListResponse>("/connections", {
        params: { status: "PENDING", pageSize: 200 },
      });
      const sent = (res.data.connections || []).filter(
        (c) => c.requesterId === viewerId,
      );
      setPendingCounts((prev) => ({ ...prev, sent: sent.length }));
    } catch {
      // Non-critical
    }
  }, [viewerId]);

  useEffect(() => {
    fetchConnections(activeTab);
  }, [activeTab, fetchConnections]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const getBadge = (tab: Tab) => {
    if (tab === "received" && pendingCounts.received > 0)
      return pendingCounts.received;
    return null;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Connections</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Manage your network of gamers and teammates.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-surface-800">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badge = getBadge(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-slate-400 hover:text-slate-200",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {badge && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
          </div>
        ) : connections.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div key={conn.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <ConnectionCard
                    connection={conn}
                    viewerId={viewerId}
                    variant={
                      activeTab === "sent"
                        ? "sent"
                        : activeTab === "received"
                          ? "received"
                          : "connected"
                    }
                  />
                </div>
                {/* Action buttons for pending received */}
                {activeTab === "received" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        try {
                          await apiClient.put(`/connections/${conn.id}/accept`);
                          toast.success("Connection accepted");
                          fetchConnections("received");
                          fetchCounts();
                        } catch {
                          toast.error("Failed to accept");
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await apiClient.put(`/connections/${conn.id}/reject`);
                          toast.success("Request declined");
                          fetchConnections("received");
                          fetchCounts();
                        } catch {
                          toast.error("Failed to decline");
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-slate-300 text-xs font-medium transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}
                {/* Cancel button for sent pending */}
                {activeTab === "sent" && (
                  <button
                    onClick={async () => {
                      try {
                        await apiClient.delete(`/connections/${conn.id}`);
                        toast.success("Request cancelled");
                        fetchConnections("sent");
                        fetchCounts();
                      } catch {
                        toast.error("Failed to cancel");
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 text-xs font-medium transition-colors shrink-0"
                  >
                    Cancel
                  </button>
                )}
                {/* Remove for connected */}
                {activeTab === "connected" && (
                  <button
                    onClick={async () => {
                      try {
                        await apiClient.delete(`/connections/${conn.id}`);
                        toast.success("Connection removed");
                        fetchConnections("connected");
                        fetchCounts();
                      } catch {
                        toast.error("Failed to remove");
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 text-xs font-medium transition-colors shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
    connected: {
      title: "No connections yet",
      description:
        "Discover other gamers on the platform and send them connection requests to build your network.",
      icon: Users,
    },
    received: {
      title: "No pending requests",
      description:
        "When someone sends you a connection request, it will appear here.",
      icon: UserPlus,
    },
    sent: {
      title: "No sent requests",
      description:
        "Connection requests you've sent will appear here until they're accepted.",
      icon: Clock,
    },
  };

  const { title, description, icon: Icon } = messages[tab];

  return (
    <div className="py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
