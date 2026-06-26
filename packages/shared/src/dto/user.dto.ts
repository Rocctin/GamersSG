import type { Role, AccountStatus } from "../enums";
import type { GameWithRoleDto } from "./game.dto";

export interface UserProfileDto {
  id: string;
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  gamerProfile?: GamerProfileDto;
  organiserProfile?: OrganiserProfileDto;
}

export interface GamerProfileDto {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  visibility: string;
  isMember: boolean;
  pointsBalance: number;
  games?: GameWithRoleDto[];
}

export interface OrganiserProfileDto {
  id: string;
  organisationName: string;
  organisationType: string;
  website?: string;
  contactPerson: string;
  contactNumber?: string;
  description?: string;
}

export interface UpdateGamerProfileDto {
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  visibility?: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";
  gameIds?: { gameId: string; inGameRole?: string }[];
}

export interface CreateOrganiserProfileDto {
  organisationName: string;
  organisationType: string;
  website?: string;
  contactPerson: string;
  contactNumber?: string;
  description?: string;
}

export interface UpdateOrganiserProfileDto {
  organisationName?: string;
  organisationType?: string;
  website?: string;
  contactPerson?: string;
  contactNumber?: string;
  description?: string;
}
