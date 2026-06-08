import type { Role } from "../enums";

export interface JwtPayload {
  sub: string; // user.id
  email: string;
  role: Role;
}
