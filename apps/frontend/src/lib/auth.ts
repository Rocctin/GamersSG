import type { UserProfileDto } from "@gamers-sg/shared/dto";
import type { Role } from "@gamers-sg/database";

export function hasRole(user: UserProfileDto | null, role: Role): boolean {
  return user?.role === role;
}

export function isAdmin(user: UserProfileDto | null): boolean {
  return hasRole(user, "ADMIN" as Role);
}
