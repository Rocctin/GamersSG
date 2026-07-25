import type { TeamMemberRole, TeamStatus, TeamInviteStatus } from "../enums";

// ── Create / Update ──

export interface CreateTeamDto {
  name: string;
  tag: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isRecruiting?: boolean;
  gameIds?: string[]; // optional: pre-select games
}

export interface UpdateTeamDto {
  name?: string;
  tag?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isRecruiting?: boolean;
}

// ── Team representation ──

export interface TeamDto {
  id: string;
  name: string;
  tag: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  isRecruiting: boolean;
  status: TeamStatus;
  createdBy: string;
  memberCount: number;
  games: TeamGameDto[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamWithMembersDto extends TeamDto {
  members: TeamMemberDto[];
}

export interface TeamGameDto {
  id: string;
  name: string;
  slug: string;
  coverImage?: string;
  category?: string;
}

// ── Members ──

export interface TeamMemberDto {
  userId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  role: TeamMemberRole;
  joinedAt: string;
  leftAt?: string;
}

// ── Invites ──

export interface TeamInviteDto {
  id: string;
  teamId: string;
  teamName: string;
  teamTag?: string;
  teamLogoUrl?: string;
  inviterId: string;
  inviterUsername?: string;
  inviteeId: string;
  inviteeUsername?: string;
  status: TeamInviteStatus;
  createdAt: string;
}

export interface InviteUserDto {
  inviteeId: string;
}

export interface UpdateMemberRoleDto {
  role: TeamMemberRole;
}
