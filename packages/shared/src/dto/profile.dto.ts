import type { GameWithRoleDto } from "./game.dto";

// ── Public Profile (extended for showcase) ──

export interface PublicProfileDto {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  gamerProfile?: EnhancedGamerProfileDto;
  organiserProfile?: {
    id: string;
    organisationName: string;
    organisationType: string;
    website?: string;
    contactPerson: string;
    contactNumber?: string;
    description?: string;
  };
}

export interface EnhancedGamerProfileDto {
  id: string;
  userId: string; // Backing user account ID — needed for connection requests
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  visibility: string;
  isMember: boolean;
  pointsBalance: number;
  // Social
  connectionsCount: number;
  mutualConnectionsCount?: number; // only when viewer is authenticated
  connectionStatus?: ConnectionStatusInfo; // viewer's connection to this user
  // Gaming identity
  games: GameWithRoleDto[];
  tournamentHistory: TournamentHistoryEntryDto[];
  eventHistory: EventHistoryEntryDto[];
  // Teams (populated once teams module exists; empty array until then)
  currentTeams: TeamMembershipDto[];
  pastTeams: TeamMembershipDto[];
  // Computed
  profileCompleteness: ProfileCompletenessDto;
}

// ── History Entries ──

export interface TournamentHistoryEntryDto {
  tournamentId: string;
  tournamentName: string;
  gameId: string;
  gameName: string;
  gameSlug: string;
  gameCoverImage?: string;
  status: string;
  placement?: string; // set by organiser/admin later (achievements)
  registeredAt: string;
}

export interface EventHistoryEntryDto {
  eventId: string;
  eventName: string;
  eventType: string;
  status: string;
  registeredAt: string;
}

// ── Profile Completeness ──

export interface ProfileCompletenessDto {
  score: number; // 0-100
  maxScore: number; // 100
  missingFields: string[]; // e.g. ["avatar", "bio", "games"]
  label: string; // "Beginner" | "Intermediate" | "All-Star"
}

// ── Team Membership (stub for Phase 3) ──

export interface TeamMembershipDto {
  teamId: string;
  teamName: string;
  teamTag?: string;
  teamLogoUrl?: string;
  role: string; // CAPTAIN | MEMBER
  joinedAt: string;
  leftAt?: string;
}

// ── Connection Status (for profile display) ──

export interface ConnectionStatusInfo {
  state: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "ACCEPTED";
  connectionId?: string; // set when a connection exists, for accept/reject/remove actions
}
