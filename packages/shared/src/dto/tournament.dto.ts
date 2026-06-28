import type { TournamentFormat, TournamentStatus, RegistrationStatus } from "../enums";

// ── Tournament ──

export interface TournamentDto {
  id: string;
  name: string;
  description: string;
  gameId: string;
  game?: { id: string; name: string; slug: string; coverImage?: string };
  format: TournamentFormat;
  platform?: string;
  registrationStart: string;
  registrationEnd: string;
  tournamentStart: string;
  tournamentEnd: string;
  isOnline: boolean;
  venue?: string;
  isTeamBased: boolean;
  maxParticipants?: number;
  prizePool?: string;
  registrationFee?: number;
  rulesetUrl?: string;
  organiserId: string;
  organiser?: {
    id: string;
    email: string;
    organiserProfile?: { organisationName: string };
  };
  status: TournamentStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;

  // Computed / joined
  _count?: {
    registrations: number;
  };
  userRegistration?: TournamentRegistrationDto;
}

export interface CreateTournamentDto {
  name: string;
  description: string;
  gameId: string;
  format?: TournamentFormat;
  platform?: string;
  registrationStart: string; // ISO 8601
  registrationEnd: string; // ISO 8601
  tournamentStart: string; // ISO 8601
  tournamentEnd: string; // ISO 8601
  isOnline?: boolean;
  venue?: string;
  isTeamBased?: boolean;
  maxParticipants?: number;
  prizePool?: string;
  registrationFee?: number;
  rulesetUrl?: string;
}

export interface UpdateTournamentDto {
  name?: string;
  description?: string;
  gameId?: string;
  format?: TournamentFormat;
  platform?: string;
  registrationStart?: string;
  registrationEnd?: string;
  tournamentStart?: string;
  tournamentEnd?: string;
  isOnline?: boolean;
  venue?: string;
  isTeamBased?: boolean;
  maxParticipants?: number;
  prizePool?: string;
  registrationFee?: number;
  rulesetUrl?: string;
}

// ── Tournament Registration ──

export interface TournamentRegistrationDto {
  id: string;
  tournamentId: string;
  userId: string;
  teamId?: string;
  status: RegistrationStatus;
  registeredAt: string;
  checkedInAt?: string;
  user?: {
    id: string;
    email: string;
    gamerProfile?: {
      username: string;
      displayName?: string;
    };
  };
}

export interface CreateTournamentRegistrationDto {
  tournamentId: string;
}

// ── Filters ──

export interface TournamentFilterDto {
  search?: string;
  gameId?: string;
  format?: TournamentFormat;
  status?: TournamentStatus;
  isTeamBased?: boolean;
  isOnline?: boolean;
  page?: number;
  pageSize?: number;
}
