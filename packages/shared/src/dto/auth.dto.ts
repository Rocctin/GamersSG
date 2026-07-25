import type { UserProfileDto } from "./user.dto";

export interface RequestMagicLinkDto {
  email: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  displayName?: string;
  phone?: string; // SG local 8-digit number (without +65 prefix)
}

export interface VerifyMagicLinkDto {
  token: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
  user: UserProfileDto;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
