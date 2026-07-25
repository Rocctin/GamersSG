import type { GameWithRoleDto } from "./game.dto";
import type { ConnectionStatusInfo } from "./profile.dto";

// ── Search ──

export interface UserSearchDto {
  query: string;
  gameId?: string;
  page?: number;
  pageSize?: number;
}

export interface UserSearchResultDto {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  games: GameWithRoleDto[];
  connectionStatus?: ConnectionStatusInfo;
  isConnected: boolean;
}

// ── People You May Know ──

export interface PeopleYouMayKnowDto {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  mutualConnectionCount: number;
  sharedGamesCount: number;
  reason: string; // e.g. "Played in the same tournament", "3 shared games", "Connected to 2 of your connections"
}

// ── Game Players ──

export interface GamePlayerDto {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  inGameRole?: string;
  connectionStatus?: ConnectionStatusInfo;
  isConnected: boolean;
}

// ── Discovery Response ──

export interface DiscoveryResponse {
  searchResults?: UserSearchResultDto[];
  peopleYouMayKnow?: PeopleYouMayKnowDto[];
  gamePlayers?: GamePlayerDto[];
  total?: number;
  page?: number;
  pageSize?: number;
}
