import type { UserProfileDto } from "./user.dto";

export interface RequestMagicLinkDto {
  email: string;
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
