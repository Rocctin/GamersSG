"use client";

import { useState } from "react";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { UserPlus, UserCheck, Clock, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ConnectionStatusInfo } from "@gamers-sg/shared/dto";

type ButtonState = "none" | "pending_sent" | "pending_received" | "accepted";

interface ConnectButtonProps {
  addresseeId: string;
  addresseeUsername?: string;
  /** Current connection state from the profile */
  connectionStatus?: ConnectionStatusInfo;
  /** Called after a successful action — parent can refresh */
  onConnectionChange?: (newStatus: ConnectionStatusInfo | undefined) => void;
  className?: string;
}

export function ConnectButton({
  addresseeId,
  addresseeUsername,
  connectionStatus,
  onConnectionChange,
  className,
}: ConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localState, setLocalState] = useState<{
    state: ButtonState;
    connectionId?: string;
  }>({
    state: mapToButtonState(connectionStatus),
    connectionId: connectionStatus?.connectionId,
  });

  const currentState = localState.state;

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post("/connections", { addresseeId });
      const newStatus: ConnectionStatusInfo = {
        state: "PENDING_SENT",
        connectionId: data.id,
      };
      setLocalState({ state: "pending_sent", connectionId: data.id });
      onConnectionChange?.(newStatus);
      toast.success(`Connection request sent to @${addresseeUsername || "user"}`);
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to send request";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!localState.connectionId) return;
    setIsLoading(true);
    try {
      await apiClient.put(`/connections/${localState.connectionId}/accept`);
      const newStatus: ConnectionStatusInfo = {
        state: "ACCEPTED",
        connectionId: localState.connectionId,
      };
      setLocalState({ state: "accepted", connectionId: localState.connectionId });
      onConnectionChange?.(newStatus);
      toast.success("Connection accepted");
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to accept";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!localState.connectionId) return;
    setIsLoading(true);
    try {
      await apiClient.put(`/connections/${localState.connectionId}/reject`);
      setLocalState({ state: "none" });
      onConnectionChange?.(undefined);
      toast.success("Request declined");
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to reject";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!localState.connectionId) return;
    setIsLoading(true);
    try {
      await apiClient.delete(`/connections/${localState.connectionId}`);
      setLocalState({ state: "none" });
      onConnectionChange?.(undefined);
      toast.success("Connection removed");
    } catch (err: any) {
      const message = err.response?.data?.error?.message || "Failed to remove";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-700 text-slate-400 text-sm font-medium cursor-wait",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </button>
    );
  }

  switch (currentState) {
    case "accepted":
      return (
        <button
          onClick={handleRemove}
          className={cn(
            "group inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-sm font-medium transition-all",
            className,
          )}
        >
          <UserCheck className="h-4 w-4 group-hover:hidden" />
          <X className="h-4 w-4 hidden group-hover:block" />
          <span className="group-hover:hidden">Connected</span>
          <span className="hidden group-hover:inline">Remove</span>
        </button>
      );

    case "pending_sent":
      return (
        <button
          onClick={handleRemove}
          className={cn(
            "group inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-sm font-medium transition-all",
            className,
          )}
        >
          <Clock className="h-4 w-4 group-hover:hidden" />
          <X className="h-4 w-4 hidden group-hover:block" />
          <span className="group-hover:hidden">Request Sent</span>
          <span className="hidden group-hover:inline">Cancel</span>
        </button>
      );

    case "pending_received":
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <button
            onClick={handleAccept}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
          >
            <Check className="h-4 w-4" />
            Accept
          </button>
          <button
            onClick={handleReject}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-slate-300 text-sm font-medium transition-colors"
          >
            <X className="h-4 w-4" />
            Decline
          </button>
        </div>
      );

    case "none":
    default:
      return (
        <button
          onClick={handleConnect}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors",
            className,
          )}
        >
          <UserPlus className="h-4 w-4" />
          Connect
        </button>
      );
  }
}

function mapToButtonState(cs?: ConnectionStatusInfo): ButtonState {
  if (!cs) return "none";
  switch (cs.state) {
    case "ACCEPTED":
      return "accepted";
    case "PENDING_SENT":
      return "pending_sent";
    case "PENDING_RECEIVED":
      return "pending_received";
    default:
      return "none";
  }
}
