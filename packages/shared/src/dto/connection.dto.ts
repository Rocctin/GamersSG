import type {
  ConnectionStatus,
} from "../enums";

// ── Send a connection request ──
export interface SendConnectionRequestDto {
  addresseeId: string;
}

// ── Connection representation ──
export interface ConnectionDto {
  id: string;
  requesterId: string;
  requesterDisplayName?: string;
  requesterUsername?: string;
  requesterAvatarUrl?: string;
  addresseeId: string;
  addresseeDisplayName?: string;
  addresseeUsername?: string;
  addresseeAvatarUrl?: string;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Paginated connection list ──
export interface ConnectionListResponse {
  connections: ConnectionDto[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Pending request count badge ──
export interface PendingRequestCountDto {
  count: number;
}
