export interface ReviewOrganiserDto {
  action: "APPROVE" | "REJECT";
  rejectionReason?: string; // required if REJECT
}

export interface UpdateUserStatusDto {
  status: "SUSPENDED" | "APPROVED";
  reason?: string;
}

export interface UpdateUserRoleDto {
  role: "GAMER" | "ORGANISER";
}

export interface HardDeleteUserDto {
  reason: string;
}

export interface HardDeleteTeamDto {
  reason: string;
}

export interface HardDeleteGameDto {
  reason: string;
  force?: boolean;
}

export interface HardDeleteTournamentDto {
  reason: string;
}

export interface AdminTournamentStatusDto {
  status: string;
  reason?: string;
}

export interface AdminRemoveConnectionDto {
  reason: string;
}

export interface AdminUpdateUserProfileDto {
  username?: string;
  displayName?: string;
  bio?: string;
  visibility?: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";
}
