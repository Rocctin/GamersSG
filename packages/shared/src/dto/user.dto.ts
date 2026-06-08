import type { Role, AccountStatus } from "../enums";

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
