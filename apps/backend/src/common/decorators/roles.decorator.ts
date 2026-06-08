import { SetMetadata } from "@nestjs/common";
import { Role } from "@gamers-sg/database";

export const ROLES_KEY = "roles";

/** Require one or more roles to access a route. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
